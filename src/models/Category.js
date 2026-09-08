import mongoose from "mongoose";

const { Schema } = mongoose;

// ---------------------------------------------------------------------------
// Category (spec 6.4) — flat model with an optional parent reference (NOT a
// recursive tree). Matches the confirmed one-branch, one-level taxonomy:
//   crochet (parentSlug: null)
//   pipecleaner-art (parentSlug: null)
//     ├─ name-wall-hangings       (parentSlug: "pipecleaner-art")
//     ├─ decorative-wall-hangings (parentSlug: "pipecleaner-art")
//     ├─ flower-baskets           (parentSlug: "pipecleaner-art")
//     └─ flower-bouquets          (parentSlug: "pipecleaner-art")
// ---------------------------------------------------------------------------
const categorySchema = new Schema(
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
    // null for top-level categories; the parent's slug for subcategories.
    parentSlug: {
      type: String,
      default: null,
      trim: true,
      index: true,
    },
    // Display/sort order within a level.
    order: {
      type: Number,
      default: 0,
    },
    // Retained beyond the 6.4 minimum to support the homepage CategorySection
    // (which renders a representative image per category). Optional.
    image: {
      type: String,
      default: null,
      trim: true,
    },
  },
  {
    timestamps: true,
  },
);

const Category =
  mongoose.models.Category || mongoose.model("Category", categorySchema);

export default Category;
