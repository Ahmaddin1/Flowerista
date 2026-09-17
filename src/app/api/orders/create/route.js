import { NextResponse } from "next/server";
import mongoose from "mongoose";
import dbConnect from "@/lib/db";
import { MAX_TIP, MIN_TIP, SHIPPING_COST, ORDER_ID_PREFIX } from "@/lib/constants";
import Order from "@/models/Order";
import Product from "@/models/Product";
import {
  isValidName,
  isValidEmail,
  isValidPhone,
  isValidPostalCode,
  normalizeEmail,
  canonicalizePhone,
  VALIDATION_MESSAGES,
  NAME_MAX_LENGTH,
  EMAIL_MAX_LENGTH,
  PHONE_MAX_LENGTH,
  POSTAL_CODE_MAX_LENGTH,
} from "@/lib/checkoutValidation";

// ---------------------------------------------------------------------------
// Order creation (spec 7.1) — rebuilt for Flowerista, hardened at the trust
// boundary. This route assumes EVERY request body is hostile and that the
// checkout UI was never involved: a client can POST anything here directly.
//
// Defense layers, in order:
//   1. Rate-limit by IP (blunt scripted-submission abuse).
//   2. Strip dangerous keys ($-prefixed, dotted, prototype) from the whole body
//      before it is read — blocks NoSQL-operator / prototype-pollution payloads.
//   3. Strict type-guards: any expected-string field that arrives as an object
//      or array is rejected outright (stops `{"$gt":""}`-style injection).
//   4. Re-run the SAME format checks the browser runs, from the shared
//      @/lib/checkoutValidation module (phone / name / postal / email).
//   5. Whitelist: only known fields are copied into the object handed to
//      Mongoose — the raw body is NEVER passed to create()/find().
//   6. Queries are built field-by-field from validated primitives only.
//   7. Normalize before storing (lowercase email, canonical phone).
//   8. Generic 500s: raw Mongoose/Mongo errors and stack traces never reach
//      the client.
//
// No variants, no quantity-based stock. Price/availability are re-validated
// server-side against the DB. Shipping is the flat SHIPPING_COST on every order.
// ---------------------------------------------------------------------------

const VALID_PAYMENT_METHODS = new Set(["cod", "bank_deposit"]);

// Address sub-field caps (defense-in-depth; mirrors the Order schema). The
// four format-validated fields use the shared length constants instead.
const STREET_MAX_LENGTH = 300;
const CITY_MAX_LENGTH = 100;
const PROVINCE_MAX_LENGTH = 100;
const COUNTRY_MAX_LENGTH = 100;

// Rate-limit config for this endpoint: max submissions per IP per window.
const ORDER_RATE_LIMIT = { limit: 8, windowMs: 60_000 };

// Recursively remove keys that could carry a Mongo operator ("$..."), a dotted
// path ("a.b"), or a prototype-pollution vector. Runs on the ENTIRE parsed body
// before any field is read. Returns a cleaned copy; primitives pass through.
const FORBIDDEN_KEYS = new Set(["__proto__", "prototype", "constructor"]);

function stripDangerousKeys(value) {
  if (Array.isArray(value)) {
    return value.map((entry) => stripDangerousKeys(entry));
  }

  if (value && typeof value === "object") {
    const cleaned = {};

    for (const [key, entry] of Object.entries(value)) {
      if (key.startsWith("$") || key.includes(".") || FORBIDDEN_KEYS.has(key)) {
        continue; // drop the key entirely — do not store, do not process
      }

      cleaned[key] = stripDangerousKeys(entry);
    }

    return cleaned;
  }

  return value;
}

// True only for an actual string primitive. Objects/arrays/numbers where a
// string is expected must be rejected — this is what stops an attacker from
// smuggling a query object (e.g. `{"$gt":""}`) in place of a scalar field.
function isPlainString(value) {
  return typeof value === "string";
}

function badRequest(message, extra = {}) {
  return NextResponse.json(
    {
      success: false,
      message,
      ...extra,
    },
    { status: 400 },
  );
}

function getTrimmedString(value) {
  return typeof value === "string" ? value.trim() : "";
}

function getNonNegativeNumber(value) {
  const parsedValue = Number(value);

  if (!Number.isFinite(parsedValue) || parsedValue < 0) {
    return null;
  }

  return parsedValue;
}

function getPositiveInteger(value) {
  const parsedValue = Number(value);

  if (!Number.isInteger(parsedValue) || parsedValue < 1) {
    return null;
  }

  return parsedValue;
}

function clampTip(value) {
  const parsedValue = Number.parseInt(value ?? 0, 10);

  if (Number.isNaN(parsedValue)) {
    return MIN_TIP;
  }

  return Math.max(MIN_TIP, Math.min(parsedValue, MAX_TIP));
}

function generateOrderId() {
  return `${ORDER_ID_PREFIX}-${Date.now().toString().slice(-6)}${Math.floor(
    Math.random() * 1000,
  )
    .toString()
    .padStart(3, "0")}`;
}

function getPrimaryImageUrl(images) {
  const primaryImage = Array.isArray(images) ? images[0] : null;

  if (typeof primaryImage === "string") {
    return primaryImage;
  }

  return primaryImage?.url ?? "";
}

// Validates + whitelists the customer block. Assumes the body has already been
// run through stripDangerousKeys(). Returns { value } — a NEW object containing
// ONLY known fields (this is the whitelist) — or { error, field? } carrying a
// user-facing message. The four format rules match the checkout UI exactly via
// the shared @/lib/checkoutValidation module.
function validateCustomer(customer) {
  if (!customer || typeof customer !== "object" || Array.isArray(customer)) {
    return { error: "Customer details are required." };
  }

  // Type-guard: every expected-string field must be an actual string. Reject
  // objects/arrays outright (blocks `{"$gt":""}`-style NoSQL injection).
  if (
    !isPlainString(customer.firstName) ||
    !isPlainString(customer.lastName) ||
    !isPlainString(customer.email) ||
    !isPlainString(customer.phone)
  ) {
    return { error: "Invalid input." };
  }

  const address = customer.address;

  if (!address || typeof address !== "object" || Array.isArray(address)) {
    return { error: "Customer address is required." };
  }

  if (
    !isPlainString(address.street) ||
    !isPlainString(address.city) ||
    !isPlainString(address.province)
  ) {
    return { error: "Invalid input." };
  }

  // postalCode + country are optional; when present they must be strings.
  if (address.postalCode != null && !isPlainString(address.postalCode)) {
    return { error: "Invalid input." };
  }

  if (address.country != null && !isPlainString(address.country)) {
    return { error: "Invalid input." };
  }

  const firstName = customer.firstName.trim();
  const lastName = customer.lastName.trim();
  const rawEmail = customer.email.trim();
  const rawPhone = customer.phone.trim();
  const street = address.street.trim();
  const city = address.city.trim();
  const province = address.province.trim();
  const postalCode = (address.postalCode ?? "").trim();
  const country = (address.country ?? "").trim() || "Pakistan";

  // Format checks — identical rules to the checkout UI, each returning the same
  // field-specific message the client shows. (isValid* also enforce max length.)
  if (!isValidName(firstName)) {
    return { error: VALIDATION_MESSAGES.name, field: "firstName" };
  }

  if (!isValidName(lastName)) {
    return { error: VALIDATION_MESSAGES.name, field: "lastName" };
  }

  if (!isValidEmail(rawEmail)) {
    return { error: VALIDATION_MESSAGES.email, field: "email" };
  }

  if (!isValidPhone(rawPhone)) {
    return { error: VALIDATION_MESSAGES.phone, field: "phone" };
  }

  // Optional; when provided it must be exactly 5 digits.
  if (!isValidPostalCode(postalCode)) {
    return { error: VALIDATION_MESSAGES.postalCode, field: "postalCode" };
  }

  // Presence-only required fields (no format constraint, matching the UI).
  if (!street) {
    return { error: "Customer street address is required." };
  }

  if (!city) {
    return { error: "Customer city is required." };
  }

  if (!province) {
    return { error: "Customer province is required." };
  }

  // Length caps for the free-text address fields (the format validators above
  // already cap name/email/phone/postal). Defense-in-depth vs. huge payloads.
  if (
    street.length > STREET_MAX_LENGTH ||
    city.length > CITY_MAX_LENGTH ||
    province.length > PROVINCE_MAX_LENGTH ||
    country.length > COUNTRY_MAX_LENGTH
  ) {
    return { error: "Invalid input." };
  }

  // Normalize before returning (lowercase email, canonical 03XXXXXXXXX phone).
  // Only these known fields survive — nothing else from the request is kept.
  return {
    value: {
      firstName,
      lastName,
      email: normalizeEmail(rawEmail),
      phone: canonicalizePhone(rawPhone),
      address: {
        street,
        city,
        province,
        postalCode,
        country,
      },
    },
  };
}

// Validates the client cart payload. Only structural fields are validated
// here; price and availability are re-validated server-side against the DB.
function validateItems(items) {
  if (!Array.isArray(items) || items.length === 0) {
    return { error: "At least one order item is required." };
  }

  const normalizedItems = [];

  for (const [index, item] of items.entries()) {
    if (!item || typeof item !== "object") {
      return { error: `Item ${index + 1} is invalid.` };
    }

    // Type-guard each expected-string field. The body was already run through
    // stripDangerousKeys() upstream, so no operator keys survive; here we only
    // need to reject non-string types. Required: productId, productName, image.
    // Optional: sku, slug.
    if (
      !isPlainString(item.productId) ||
      !isPlainString(item.productName) ||
      (item.sku != null && !isPlainString(item.sku)) ||
      (item.slug != null && !isPlainString(item.slug)) ||
      !isPlainString(item.image)
    ) {
      return { error: `Item ${index + 1} has invalid input types.` };
    }

    const productId = getTrimmedString(item.productId);
    const productName = getTrimmedString(item.productName);
    const sku = getTrimmedString(item.sku);
    const slug = getTrimmedString(item.slug);
    const image = getTrimmedString(item.image);
    const price = getNonNegativeNumber(item.price);
    const originalPrice =
      item.originalPrice == null
        ? null
        : getNonNegativeNumber(item.originalPrice);
    const quantity = getPositiveInteger(item.quantity);

    if (
      productName.length > 200 ||
      sku.length > 100 ||
      slug.length > 200 ||
      image.length > 500
    ) {
      return { error: `Item ${index + 1} input exceeds allowed length.` };
    }

    if (!productId || !mongoose.Types.ObjectId.isValid(productId)) {
      return { error: `Item ${index + 1} has an invalid productId.` };
    }

    if (!productName) {
      return { error: `Item ${index + 1} productName is required.` };
    }

    if (!image) {
      return { error: `Item ${index + 1} image is required.` };
    }

    if (price == null) {
      return { error: `Item ${index + 1} price is invalid.` };
    }

    if (item.originalPrice != null && originalPrice == null) {
      return { error: `Item ${index + 1} originalPrice is invalid.` };
    }

    if (quantity == null) {
      return { error: `Item ${index + 1} quantity is invalid.` };
    }

    normalizedItems.push({
      productId,
      productName,
      sku,
      slug,
      image,
      price,
      ...(originalPrice != null ? { originalPrice } : {}),
      quantity,
    });
  }

  return { value: normalizedItems };
}

async function createOrderWithUniqueId(orderPayload) {
  for (let attempt = 0; attempt < 5; attempt += 1) {
    try {
      // eslint-disable-next-line no-await-in-loop
      return await Order.create({
        ...orderPayload,
        orderId: generateOrderId(),
      });
    } catch (error) {
      if (error?.code === 11000 && error?.keyPattern?.orderId) {
        continue;
      }

      throw error;
    }
  }

  throw new Error("Could not generate a unique order ID.");
}

export async function POST(request) {
  try {
    // (1) Rate-limit by IP first — throttled requests never touch the DB.
    const clientIp = getClientIp(request);
    const limit = rateLimit(clientIp, ORDER_RATE_LIMIT);

    if (!limit.allowed) {
      return NextResponse.json(
        {
          success: false,
          message: "Too many requests. Please try again shortly.",
        },
        {
          status: 429,
          headers: { "Retry-After": String(limit.retryAfterSeconds) },
        },
      );
    }

    await dbConnect();

    let body;

    try {
      body = await request.json();
    } catch {
      return badRequest("Invalid request body.");
    }

    // (2) Strip $-prefixed / dotted / prototype keys from the ENTIRE body before
    // any field is read — neutralizes NoSQL-operator and prototype-pollution
    // payloads no matter how deeply nested. Everything downstream reads safeBody.
    const safeBody = stripDangerousKeys(body);

    const customerValidation = validateCustomer(safeBody?.customer);

    if (customerValidation.error) {
      return badRequest(
        customerValidation.error,
        customerValidation.field ? { field: customerValidation.field } : {},
      );
    }

    const itemsValidation = validateItems(safeBody?.items);

    if (itemsValidation.error) {
      return badRequest(itemsValidation.error);
    }

    const paymentMethod = getTrimmedString(safeBody?.paymentMethod);

    if (!VALID_PAYMENT_METHODS.has(paymentMethod)) {
      return badRequest("Invalid payment method.");
    }

    // Shipping is authoritative server-side: flat SHIPPING_COST on every order,
    // never trusted from the client (spec 7.2). Tip is clamped to [MIN, MAX].
    const shippingCost = SHIPPING_COST;
    const tip = clampTip(safeBody?.tip);

    const customer = customerValidation.value;
    const requestItems = itemsValidation.value;

    // Deduplicate by productId alone (no variants). Quantities are summed.
    const aggregatedItems = new Map();

    requestItems.forEach((item) => {
      const existingItem = aggregatedItems.get(item.productId);

      if (existingItem) {
        existingItem.quantity += item.quantity;
        return;
      }

      aggregatedItems.set(item.productId, {
        productId: item.productId,
        productName: item.productName,
        image: item.image,
        quantity: item.quantity,
      });
    });

    const productObjectIds = [...aggregatedItems.keys()].map(
      (productId) => new mongoose.Types.ObjectId(productId),
    );

    // Only active products are eligible (spec 7.1 — isActive re-validation).
    const products = await Product.find({
      _id: { $in: productObjectIds },
      isActive: true,
    })
      .select("name slug basePrice originalPrice images isActive maxQuantity sku")
      .lean();

    const productMap = new Map(
      products.map((product) => [String(product._id), product]),
    );

    // First pass: availability + maxQuantity enforcement (server-side).
    const unavailableItems = [];

    for (const aggregatedItem of aggregatedItems.values()) {
      const product = productMap.get(aggregatedItem.productId);

      if (!product) {
        unavailableItems.push({
          productName: aggregatedItem.productName,
          reason: "unavailable",
        });
        continue;
      }

      const maxQuantity = Math.max(1, Number(product.maxQuantity) || 1);

      if (aggregatedItem.quantity > maxQuantity) {
        unavailableItems.push({
          productName: product.name || aggregatedItem.productName,
          reason: "max_quantity_exceeded",
          maxQuantity,
        });
      }
    }

    if (unavailableItems.length > 0) {
      return badRequest(
        "Some items are no longer available or exceed the allowed quantity.",
        { unavailableItems },
      );
    }

    // Second pass: build authoritative order items from live product data.
    // Price/originalPrice/name/slug/sku come from the DB, not the client.
    const serverItems = [...aggregatedItems.values()].map((aggregatedItem) => {
      const product = productMap.get(aggregatedItem.productId);
      const serverPrice = Number(product.basePrice);
      const serverOriginalPrice =
        product.originalPrice != null ? Number(product.originalPrice) : null;

      return {
        productId: new mongoose.Types.ObjectId(aggregatedItem.productId),
        productName: getTrimmedString(product.name) || aggregatedItem.productName,
        slug: getTrimmedString(product.slug),
        sku: getTrimmedString(product.sku),
        image: aggregatedItem.image || getPrimaryImageUrl(product.images),
        price: serverPrice,
        ...(serverOriginalPrice != null
          ? { originalPrice: serverOriginalPrice }
          : {}),
        quantity: aggregatedItem.quantity,
      };
    });

    const serverSubtotal = serverItems.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0,
    );
    const serverTotal = serverSubtotal + shippingCost + tip;

    const order = await createOrderWithUniqueId({
      customer: {
        name: `${customer.firstName} ${customer.lastName}`.trim(),
        email: customer.email,
        phone: customer.phone,
        whatsappNumber: customer.phone,
        address: customer.address,
      },
      items: serverItems,
      paymentMethod,
      subtotal: serverSubtotal,
      shippingCost,
      tip,
      totalAmount: serverTotal,
      orderStatus: "pending_confirmation",
      paymentStatus: "pending",
    });

    return NextResponse.json({
      success: true,
      orderId: order.orderId,
    });
  } catch (error) {
    console.error("Order creation error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Internal server error.",
      },
      { status: 500 },
    );
  }
}
