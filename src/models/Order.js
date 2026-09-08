import mongoose from "mongoose";
import { MAX_TIP, MIN_TIP } from "@/lib/constants";

const { Schema } = mongoose;

const orderAddressSchema = new Schema(
  {
    street: {
      type: String,
      required: true,
      trim: true,
    },
    city: {
      type: String,
      required: true,
      trim: true,
    },
    province: {
      type: String,
      required: true,
      trim: true,
    },
    postalCode: {
      type: String,
      trim: true,
    },
    country: {
      type: String,
      required: true,
      default: "Pakistan",
      trim: true,
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
    },
    email: {
      type: String,
      required: true,
      trim: true,
    },
    phone: {
      type: String,
      required: true,
      trim: true,
    },
    whatsappNumber: {
      type: String,
      required: true,
      trim: true,
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
