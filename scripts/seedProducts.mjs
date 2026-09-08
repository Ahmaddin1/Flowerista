// ---------------------------------------------------------------------------
// Seed a handful of Flowerista products for local catalog review (spec 6.1).
//
// Idempotent: upserts each product by slug, so re-running is safe and refreshes
// fields without creating duplicates. Covers Crochet (no subcategory) and all
// four Pipecleaner Art subcategories, with a couple of discounted items and a
// couple of multi-image items so the discount badge and the detail-page
// thumbnail rail can both be reviewed.
//
// Images are LOCAL placeholders committed under /public/seed (root-relative
// paths), so they render through next/image with no remotePatterns config.
// Replace them with real Cloudinary URLs once photography is ready.
//
// Writes via the raw driver collection (not the Mongoose model) on purpose:
// src/models/Product.js imports the "@/lib/constants" path alias, which only
// resolves under the Next.js bundler — plain `node` cannot import it. Every
// field is set explicitly here, including the category/subcategory invariant
// the model's pre-validate hook would otherwise enforce.
//
// Run order (from the project root, with a valid .env containing MONGODB_URI):
//   node scripts/seedCategories.mjs   # taxonomy — powers the filter UI
//   node scripts/seedProducts.mjs     # this file
// ---------------------------------------------------------------------------
import "dotenv/config";
import { config } from "dotenv";
import mongoose from "mongoose";
import {
  CATEGORY_SLUGS,
  SUBCATEGORY_SLUGS,
  getDefaultMaxQuantity,
  SKU_PREFIX,
  brandName,
} from "../src/lib/constants.js";
config({ path: ".env.local" }); // or '.env' if that's what you use

const img = (file) => `/seed/${file}.jpg`;

// Staggered, FIXED timestamps so "newest first" ordering is deterministic and
// the seeder stays idempotent (re-runs don't drift createdAt forward). Later
// entries in the list get newer dates -> appear first on the catalog.
const BASE = new Date("2026-09-01T09:00:00.000Z").getTime();
const DAY = 24 * 60 * 60 * 1000;

// name / slug / category / subcategory / basePrice / originalPrice / images / tags
const CATALOG = [
  {
    name: "Blush Rose Coaster Set",
    slug: "blush-rose-coaster-set",
    category: CATEGORY_SLUGS.CROCHET,
    subcategory: null,
    basePrice: 1200,
    originalPrice: 1500,
    images: [img("blush-rose-coaster-set"), img("blush-rose-coaster-set-2")],
    sku: `${SKU_PREFIX}-CRO-001`,
    tags: ["coasters", "home", "gift"],
    description:
      "A set of four hand-crocheted rose coasters in soft blush cotton — a little bloom under every cup.",
  },
  {
    name: "Daisy Granny Square Tote",
    slug: "daisy-granny-square-tote",
    category: CATEGORY_SLUGS.CROCHET,
    subcategory: null,
    basePrice: 2800,
    originalPrice: null,
    images: [img("daisy-granny-square-tote")],
    sku: `${SKU_PREFIX}-CRO-002`,
    tags: ["bag", "tote", "everyday"],
    description:
      "A roomy granny-square tote worked in warm cream and daisy motifs — light enough for daily errands, sweet enough to gift.",
  },
  {
    name: "Soft Cloud Baby Blanket",
    slug: "soft-cloud-baby-blanket",
    category: CATEGORY_SLUGS.CROCHET,
    subcategory: null,
    basePrice: 4500,
    originalPrice: null,
    images: [img("soft-cloud-baby-blanket")],
    sku: `${SKU_PREFIX}-CRO-003`,
    tags: ["baby", "blanket", "gift"],
    description:
      "An heirloom-soft baby blanket crocheted in gentle sky-blue yarn, sized to swaddle, stroll, and snuggle.",
  },
  {
    name: "Custom Name Hanging",
    slug: "custom-name-hanging-script",
    category: CATEGORY_SLUGS.PIPECLEANER_ART,
    subcategory: SUBCATEGORY_SLUGS.NAME_WALL_HANGINGS,
    basePrice: 3500,
    originalPrice: null,
    images: [
      img("custom-name-hanging-script"),
      img("custom-name-hanging-script-2"),
    ],
    sku: `${SKU_PREFIX}-NWH-001`,
    tags: ["nursery", "custom", "name"],
    description:
      "A made-to-order pipecleaner name in flowing script, shaped by hand and finished with tiny blooms. Send the name at checkout.",
  },
  {
    name: "Mini Name Banner",
    slug: "mini-name-banner",
    category: CATEGORY_SLUGS.PIPECLEANER_ART,
    subcategory: SUBCATEGORY_SLUGS.NAME_WALL_HANGINGS,
    basePrice: 2200,
    originalPrice: null,
    images: [img("mini-name-banner")],
    sku: `${SKU_PREFIX}-NWH-002`,
    tags: ["name", "shelf", "gift"],
    description:
      "A petite pipecleaner name banner for shelves and desks — the same handmade charm in a smaller, giftable size.",
  },
  {
    name: "Boho Floral Wall Piece",
    slug: "boho-floral-wall-piece",
    category: CATEGORY_SLUGS.PIPECLEANER_ART,
    subcategory: SUBCATEGORY_SLUGS.DECORATIVE_WALL_HANGINGS,
    basePrice: 3800,
    originalPrice: 4200,
    images: [img("boho-floral-wall-piece")],
    sku: `${SKU_PREFIX}-DWH-001`,
    tags: ["boho", "wall", "decor"],
    description:
      "A sculptural pipecleaner floral spray in dusty rose and sage, arranged to sit pretty above a bed or reading nook.",
  },
  {
    name: "Pastel Tulip Basket",
    slug: "pastel-tulip-basket",
    category: CATEGORY_SLUGS.PIPECLEANER_ART,
    subcategory: SUBCATEGORY_SLUGS.FLOWER_BASKETS,
    basePrice: 2600,
    originalPrice: null,
    images: [img("pastel-tulip-basket")],
    sku: `${SKU_PREFIX}-FBK-001`,
    tags: ["tulip", "basket", "everlasting"],
    description:
      "A little basket of pastel pipecleaner tulips that never wilt — a windowsill of spring, all year round.",
  },
  {
    name: "Sunny Daisy Basket",
    slug: "sunny-daisy-basket",
    category: CATEGORY_SLUGS.PIPECLEANER_ART,
    subcategory: SUBCATEGORY_SLUGS.FLOWER_BASKETS,
    basePrice: 2400,
    originalPrice: null,
    images: [img("sunny-daisy-basket")],
    sku: `${SKU_PREFIX}-FBK-002`,
    tags: ["daisy", "basket", "cheerful"],
    description:
      "A cheerful basket of handmade daisies in buttery yellow and cream — a ray of sunshine for any corner.",
  },
  {
    name: "Everlasting Rose Bouquet",
    slug: "everlasting-rose-bouquet",
    category: CATEGORY_SLUGS.PIPECLEANER_ART,
    subcategory: SUBCATEGORY_SLUGS.FLOWER_BOUQUETS,
    basePrice: 3200,
    originalPrice: 3600,
    images: [
      img("everlasting-rose-bouquet"),
      img("everlasting-rose-bouquet-2"),
    ],
    sku: `${SKU_PREFIX}-FBQ-001`,
    tags: ["roses", "bouquet", "anniversary"],
    description:
      "A dozen handcrafted pipecleaner roses in deep pink, wrapped and ready to gift — the bouquet that outlasts the occasion.",
  },
  {
    name: "Lavender Dreams Bouquet",
    slug: "lavender-dreams-bouquet",
    category: CATEGORY_SLUGS.PIPECLEANER_ART,
    subcategory: SUBCATEGORY_SLUGS.FLOWER_BOUQUETS,
    basePrice: 2900,
    originalPrice: null,
    images: [img("lavender-dreams-bouquet")],
    sku: `${SKU_PREFIX}-FBQ-002`,
    tags: ["lavender", "bouquet", "calm"],
    description:
      "A soft bundle of lavender-hued pipecleaner stems — calm, pretty, and perfect for a bedside vase.",
  },
];

function buildDoc(entry, index) {
  const created = new Date(BASE + index * DAY);
  return {
    name: entry.name,
    slug: entry.slug,
    description: entry.description,
    category: entry.category,
    subcategory: entry.subcategory,
    basePrice: entry.basePrice,
    originalPrice: entry.originalPrice,
    images: entry.images,
    isActive: true,
    maxQuantity: getDefaultMaxQuantity(entry.subcategory),
    sku: entry.sku,
    tags: entry.tags,
    createdAt: created,
    updatedAt: created,
  };
}

async function seed() {
  const uri = process.env.MONGODB_URI;

  if (!uri) {
    throw new Error("Please define the MONGODB_URI environment variable.");
  }

  await mongoose.connect(uri);
  console.log(`Connected. Seeding ${brandName} products...`);

  const collection = mongoose.connection.collection("products");

  for (let index = 0; index < CATALOG.length; index += 1) {
    const doc = buildDoc(CATALOG[index], index);
    await collection.updateOne(
      { slug: doc.slug },
      { $set: doc },
      { upsert: true },
    );
    const sub = doc.subcategory ? ` / ${doc.subcategory}` : "";
    console.log(`  ✓ ${doc.name} (${doc.category}${sub}) — ${doc.sku}`);
  }

  const count = await collection.countDocuments({});
  console.log(`Done. ${count} products in the collection.`);

  await mongoose.disconnect();
}

seed()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Product seed failed:", error);
    process.exit(1);
  });
