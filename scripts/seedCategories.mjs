// ---------------------------------------------------------------------------
// Seed the Flowerista category taxonomy (spec 3 / 6.4).
//
// Idempotent: upserts each category by slug, so re-running is safe and will
// refresh names/order/parentSlug without creating duplicates.
//
// Usage (from the project root, with a valid .env containing MONGODB_URI):
//   node scripts/seedCategories.mjs
// ---------------------------------------------------------------------------
import "dotenv/config";
import { config } from "dotenv";
import mongoose from "mongoose";
import Category from "../src/models/Category.js";
config({ path: ".env.local" }); // or '.env' if that's what you use

// Two top-level categories; only Pipecleaner Art has subcategories (Crochet
// has none). Slugs MUST match CATEGORY_SLUGS / SUBCATEGORY_SLUGS in
// src/lib/constants.js.
const CATEGORIES = [
  { name: "Crochet", slug: "crochet", parentSlug: null, order: 1 },
  {
    name: "Pipecleaner Art",
    slug: "pipecleaner-art",
    parentSlug: null,
    order: 2,
  },
  {
    name: "Name Wall Hangings",
    slug: "name-wall-hangings",
    parentSlug: "pipecleaner-art",
    order: 3,
  },
  {
    name: "Decorative Wall Hangings",
    slug: "decorative-wall-hangings",
    parentSlug: "pipecleaner-art",
    order: 4,
  },
  {
    name: "Flower Baskets",
    slug: "flower-baskets",
    parentSlug: "pipecleaner-art",
    order: 5,
  },
  {
    name: "Flower Bouquets",
    slug: "flower-bouquets",
    parentSlug: "pipecleaner-art",
    order: 6,
  },
];

async function seed() {
  const uri = process.env.MONGODB_URI;

  if (!uri) {
    throw new Error("Please define the MONGODB_URI environment variable.");
  }

  await mongoose.connect(uri);
  console.log("Connected. Seeding categories...");

  for (const category of CATEGORIES) {
    await Category.updateOne(
      { slug: category.slug },
      { $set: category },
      { upsert: true },
    );
    console.log(`  ✓ ${category.name} (${category.slug})`);
  }

  const count = await Category.countDocuments({});
  console.log(`Done. ${count} categories in the collection.`);

  await mongoose.disconnect();
}

seed()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Category seed failed:", error);
    process.exit(1);
  });
