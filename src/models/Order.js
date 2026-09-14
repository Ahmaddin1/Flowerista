import mongoose from "mongoose";
import { MAX_TIP, MIN_TIP } from "@/lib/constants";
import {
  NAME_REGEX,
  EMAIL_REGEX,
  PHONE_REGEX,
  POSTAL_CODE_REGEX,
  NAME_MAX_LENGTH,
  EMAIL_MAX_LENGTH,
  PHONE_MAX_LENGTH,
  POSTAL_CODE_MAX_LENGTH,
} from "@/lib/checkoutValidation";

const { Schema } = mongoose;

// ---------------------------------------------------------------------------
// Schema-level format constraints are DEFENSE-IN-DEPTH (PROMPT 2). The API
// route (src/app/api/orders/create/route.js) already validates + normalizes
// every field before write; these validators ensure the database itself
// rejects malformed customer data arriving from ANY code path (seed scripts,
// migrations, future admin tooling), using the SAME regexes and length limits
// as the shared @/lib/checkoutValidation module.
// ---------------------------------------------------------------------------

// Free-text address caps mirror the API route (these fields have no format
// rule — only a length ceiling — matching the checkout UI's presence-only rule).
const STREET_MAX_LENGTH = 300;
const CITY_MAX_LENGTH = 100;
const PROVINCE_MAX_LENGTH = 100;
const COUNTRY_MAX_LENGTH = 100;

const orderAddressSchema = new Schema(
  {
    street: {
      type: String,
      required: true,
      trim: true,
      maxlength: STREET_MAX_LENGTH,
    },
    city: {
      type: String,
      required: true,
      trim: true,
      maxlength: CITY_MAX_LENGTH,
    },
    province: {
      type: String,
      required: true,
      trim: true,
      maxlength: PROVINCE_MAX_LENGTH,
    },
    postalCode: {
      type: String,
      trim: true,
      maxlength: POSTAL_CODE_MAX_LENGTH,
      // Optional field: empty/absent is allowed, but a provided value must be
      // exactly 5 digits (same rule as the shared validator). A custom
      // validator is used instead of `match` so an empty string is explicitly
      // treated as valid regardless of Mongoose version behavior.
      validate: {
        validator(value) {
          return value == null || value === "" || POSTAL_CODE_REGEX.test(value);
        },
        message: "Invalid postal code.",
      },
    },
    country: {
      type: String,
      required: true,
      default: "Pakistan",
      trim: true,
      maxlength: COUNTRY_MAX_LENGTH,
    },
  },
  { _id: false },
);

const orderCustomerSchema = new Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      // Stored as "First Last"; each part is capped at NAME_MAX_LENGTH by the
      // route, so the combined value fits in 2*NAME_MAX_LENGTH + 1 (the space).
      // A single space is a valid NAME_REGEX separator, so the combined name
      // still satisfies the format rule.
      maxlength: NAME_MAX_LENGTH * 2 + 1,
      match: [NAME_REGEX, "Invalid customer name."],
    },
    email: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      maxlength: EMAIL_MAX_LENGTH,
      match: [EMAIL_REGEX, "Invalid email address."],
    },
    phone: {
      type: String,
      required: true,
      trim: true,
      maxlength: PHONE_MAX_LENGTH,
      match: [PHONE_REGEX, "Invalid phone number."],
    },
    whatsappNumber: {
      type: String,
      required: true,
      trim: true,
      maxlength: PHONE_MAX_LENGTH,
      match: [PHONE_REGEX, "Invalid WhatsApp number."],
    },
    address: {
      type: orderAddressSchema,
      required: true,
    },
  },
  { _id: false },
);

// Order item shape (spec 6.6 core: productId, productName, slug, price, image,
// quantity) PLUS sku + originalPrice, retained per user decision to preserve
// per-line traceability, the analytics item_id, and discount display on order
// records. Dropped vs. SM Drips: size, color, colorHex (no variants).
const orderItemSchema = new Schema(
  {
    productId: {
      type: Schema.Types.ObjectId,
      ref: "Product",
    },
    productName: {
      type: String,
      required: true,
      trim: true,
    },
    slug: {
      type: String,
      trim: true,
    },
    sku: {
      type: String,
      trim: true,
    },
    price: {
      type: Number,
      required: true,
      min: 0,
    },
    originalPrice: {
      type: Number,
      min: 0,
      default: null,
    },
    image: {
      type: String,
      required: true,
      trim: true,
    },
    quantity: {
      type: Number,
      required: true,
      min: 1,
    },
  },
  { _id: false },
);

const orderSchema = new Schema(
  {
    orderId: {
      type: String,
      required: true,

      trim: true,
    },
    customer: {
      type: orderCustomerSchema,
      required: true,
    },
    items: {
      type: [orderItemSchema],
      required: true,
      default: [],
    },
    shippingCost: {
      type: Number,
      required: true,
      default: 0,
      min: 0,
    },
    tip: {
      type: Number,
      required: true,
      default: 0,
      min: [MIN_TIP, "Tip cannot be negative"],
      max: [MAX_TIP, `Tip cannot exceed Rs. ${MAX_TIP}`],
    },
    subtotal: {
      type: Number,
      required: true,
      min: 0,
    },
    totalAmount: {
      type: Number,
      required: true,
      min: 0,
    },
    paymentMethod: {
      type: String,
      required: true,
      enum: ["cod", "bank_deposit"],
      trim: true,
    },
    paymentStatus: {
      type: String,
      required: true,
      enum: ["pending", "paid", "failed", "refunded"],
      default: "pending",
    },
    // Kept as-is from the live SM Drips schema (includes "processing").
    // Spec 6.6 called this enum "unchanged" but listed only 5 values; the real
    // 6-value enum is retained per user decision, matching OrderStatusUpdater.
    orderStatus: {
      type: String,
      required: true,
      enum: [
        "pending_confirmation",
        "confirmed",
        "processing",
        "shipped",
        "delivered",
        "cancelled",
      ],
      default: "pending_confirmation",
    },
    bankTransferProof: {
      type: String,
      default: null,
      trim: true,
    },
    whatsappNotified: {
      type: Boolean,
      default: false,
    },
    notes: {
      type: String,
      trim: true,
    },
    createdAt: {
      type: Date,
      default: Date.now,
      immutable: true,
    },
    updatedAt: {
      type: Date,
      default: Date.now,
    },
    confirmedAt: {
      type: Date,
    },
    shippedAt: {
      type: Date,
    },
    deliveredAt: {
      type: Date,
    },
  },
  {
    timestamps: false,
  },
);

orderSchema.index({ orderId: 1 }, { unique: true });
orderSchema.index({ orderStatus: 1 });
orderSchema.index({ paymentStatus: 1 });
orderSchema.index({ "customer.email": 1 });
orderSchema.index({ createdAt: 1 });

// orderSchema.pre("save", function updateTimestamp(next) {
//   this.updatedAt = new Date();
//   next();
// });
orderSchema.pre("save", async function updateTimestamp() {
  this.updatedAt = new Date();
});

const Order = mongoose.models.Order || mongoose.model("Order", orderSchema);

export default Order;
