import mongoose from "mongoose";
import {
  CATEGORY_ENUM,
  SUBCATEGORY_ENUM,
  CATEGORY_SLUGS,
  SUBCATEGORIES_BY_CATEGORY,
  MAX_QUANTITY_DEFAULT,
} from "@/lib/constants";

const { Schema } = mongoose;

// ---------------------------------------------------------------------------
// Product (spec 6.1) — rebuilt from scratch.
// Removed entirely vs. SM Drips: sizes[], color, colorHex, per-size SKU/stock,
// inStock, syncInStock hook. No variant concept exists in Flowerista.
// ---------------------------------------------------------------------------
const productSchema = new Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    slug: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
      default: "",
    },
    // Stored as a slug string (not an ObjectId ref) per spec 6.1. The Category
    // collection remains the source of truth for the filter UI (spec 7.5);
    // products denormalize the category/subcategory slugs for querying.
    category: {
      type: String,
      required: true,
      enum: CATEGORY_ENUM,
      index: true,
    },
    // null when category === "crochet"; one of the four Pipecleaner Art slugs
    // otherwise. Invariant enforced in the pre-validate hook below.
    subcategory: {
      type: String,
      enum: [...SUBCATEGORY_ENUM, null],
      default: null,
      index: true,
    },
    basePrice: {
      type: Number,
      required: true,
      min: 0,
    },
    originalPrice: {
      type: Number,
      min: 0,
      default: null,
    },
    images: {
      // Plain Cloudinary URL strings (spec 6.1). Display order is array order.
      type: [String],
      default: [],
    },
    // Manual out-of-stock toggle (spec 6.1). This boolean is the ONLY stock
    // signal in Flowerista — there is no quantity-based stock tracking.
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
    // Per-order cap (spec 6.3). Prefilled per-category in the admin form; a
    // schema-level fallback default guards direct writes.
    maxQuantity: {
      type: Number,
      required: true,
      min: 1,
      default: MAX_QUANTITY_DEFAULT,
    },
    // Single SKU per product (spec 6.2), e.g. "FLW-CRO-001". No per-variant SKUs.
    sku: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    tags: {
      type: [String],
      default: [],
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  },
);

productSchema.index({ createdAt: -1 });
productSchema.index({ category: 1, subcategory: 1 });

// Out-of-stock is now driven solely by the manual isActive toggle (spec 7.9).
// This replaces SM Drips' sizes.every(stock<=0) logic (which defaulted to
// out-of-stock when no sizes existed).
productSchema.virtual("isOutOfStock").get(function isOutOfStock() {
  return this.isActive === false;
});

// Enforce the category/subcategory invariant (spec 6.1):
//   - crochet          -> subcategory must be null
//   - pipecleaner-art  -> subcategory must be one of the four allowed slugs
productSchema.pre("validate", function enforceSubcategoryInvariant(next) {
  const allowed = SUBCATEGORIES_BY_CATEGORY[this.category] ?? [];

  if (this.category === CATEGORY_SLUGS.CROCHET) {
    this.subcategory = null;
  } else if (!this.subcategory || !allowed.includes(this.subcategory)) {
    this.invalidate(
      "subcategory",
      `subcategory is required for ${this.category} and must be one of: ${allowed.join(", ")}`,
    );
  }
});

const Product =
  mongoose.models.Product || mongoose.model("Product", productSchema);

export default Product;
