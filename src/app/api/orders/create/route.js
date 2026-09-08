import { NextResponse } from "next/server";
import mongoose from "mongoose";
import sanitize from "mongo-sanitize";
import dbConnect from "@/lib/db";
import { MAX_TIP, MIN_TIP, SHIPPING_COST, ORDER_ID_PREFIX } from "@/lib/constants";
import Order from "@/models/Order";
import Product from "@/models/Product";

// ---------------------------------------------------------------------------
// Order creation (spec 7.1) — rebuilt for Flowerista.
// No variants, no quantity-based stock. Server-side re-validation is limited
// to: product exists + isActive, price matches the live basePrice, and
// quantity <= maxQuantity. Shipping is the flat SHIPPING_COST on every order.
// Removed vs. SM Drips: size/color/colorHex, stock decrement + rollback,
// inStock sync, VALID_SHIPPING_COSTS.
// ---------------------------------------------------------------------------

const VALID_PAYMENT_METHODS = new Set(["cod", "bank_deposit"]);

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

function validateCustomer(customer) {
  if (!customer || typeof customer !== "object") {
    return { error: "Customer details are required." };
  }

  const safeFirstName = sanitize(customer.firstName);
  const safeLastName = sanitize(customer.lastName);
  const safeEmail = sanitize(customer.email);
  const safePhone = sanitize(customer.phone);
  const safeAddress = sanitize(customer.address);

  if (
    typeof safeFirstName !== "string" ||
    typeof safeLastName !== "string" ||
    typeof safeEmail !== "string" ||
    typeof safePhone !== "string" ||
    typeof safeAddress !== "object"
  ) {
    return { error: "Invalid input types." };
  }

  const firstName = getTrimmedString(safeFirstName);
  const lastName = getTrimmedString(safeLastName);
  const email = getTrimmedString(safeEmail);
  const phone = getTrimmedString(safePhone);
  const address = safeAddress;

  if (
    firstName.length > 100 ||
    lastName.length > 100 ||
    email.length > 200 ||
    phone.length > 30
  ) {
    return { error: "Input exceeds allowed length." };
  }

  if (!firstName) {
    return { error: "Customer first name is required." };
  }

  if (!lastName) {
    return { error: "Customer last name is required." };
  }

  if (!email) {
    return { error: "Customer email is required." };
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { error: "Customer email is invalid." };
  }

  if (!phone) {
    return { error: "Customer phone is required." };
  }

  if (!address || typeof address !== "object") {
    return { error: "Customer address is required." };
  }

  const safeStreet = sanitize(address.street);
  const safeCity = sanitize(address.city);
  const safeProvince = sanitize(address.province);
  const safePostalCode = sanitize(address.postalCode);
  const safeCountry = sanitize(address.country);

  if (
    typeof safeStreet !== "string" ||
    typeof safeCity !== "string" ||
    typeof safeProvince !== "string" ||
    (safePostalCode != null && typeof safePostalCode !== "string") ||
    (safeCountry != null && typeof safeCountry !== "string")
  ) {
    return { error: "Invalid input types." };
  }

  const street = getTrimmedString(safeStreet);
  const city = getTrimmedString(safeCity);
  const province = getTrimmedString(safeProvince);
  const postalCode = getTrimmedString(safePostalCode);
  const country = getTrimmedString(safeCountry) || "Pakistan";

  if (
    street.length > 300 ||
    city.length > 100 ||
    province.length > 100 ||
    postalCode.length > 20 ||
    country.length > 100
  ) {
    return { error: "Input exceeds allowed length." };
  }

  if (!street) {
    return { error: "Customer street address is required." };
  }

  if (!city) {
    return { error: "Customer city is required." };
  }

  if (!province) {
    return { error: "Customer province is required." };
  }

  return {
    value: {
      firstName,
      lastName,
      email,
      phone,
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

    const safeProductId = sanitize(item.productId);
    const safeProductName = sanitize(item.productName);
    const safeSku = sanitize(item.sku);
    const safeSlug = sanitize(item.slug);
    const safeImage = sanitize(item.image);

    if (
      typeof safeProductId !== "string" ||
      typeof safeProductName !== "string" ||
      (safeSku != null && typeof safeSku !== "string") ||
      (safeSlug != null && typeof safeSlug !== "string") ||
      typeof safeImage !== "string"
    ) {
      return { error: `Item ${index + 1} has invalid input types.` };
    }

    const productId = getTrimmedString(safeProductId);
    const productName = getTrimmedString(safeProductName);
    const sku = getTrimmedString(safeSku);
    const slug = getTrimmedString(safeSlug);
    const image = getTrimmedString(safeImage);
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
    await dbConnect();

    let body;

    try {
      body = await request.json();
    } catch {
      return badRequest("Invalid request body.");
    }

    const customerValidation = validateCustomer(body?.customer);

    if (customerValidation.error) {
      return badRequest(customerValidation.error);
    }

    const itemsValidation = validateItems(body?.items);

    if (itemsValidation.error) {
      return badRequest(itemsValidation.error);
    }

    const paymentMethod = getTrimmedString(body?.paymentMethod);

    if (!VALID_PAYMENT_METHODS.has(paymentMethod)) {
      return badRequest("Invalid payment method.");
    }

    // Shipping is authoritative server-side: flat SHIPPING_COST on every order,
    // never trusted from the client (spec 7.2). Tip is clamped to [MIN, MAX].
    const shippingCost = SHIPPING_COST;
    const tip = clampTip(body?.tip);

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
