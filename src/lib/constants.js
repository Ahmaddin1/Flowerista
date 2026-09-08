// ---------------------------------------------------------------------------
// Flowerista — central constants
// Single source of truth for brand values, tip caps, shipping, ID prefixes,
// and the confirmed category taxonomy. Nothing here reuses SM Drips' values.
// ---------------------------------------------------------------------------

// Brand ------------------------------------------------------------------
export const brandName = "Flowerista";

// ⚠️ CLIENT REVIEW: confirm this tagline is final before launch.
export const tagline = "Handmade for the girly at heart";

// Tips (spec 6.6) --------------------------------------------------------
// SM Drips' MAX_TIP of 20,000 does NOT carry over.
export const MIN_TIP = 0;
export const MAX_TIP = 5000;

// Shipping (spec 6.6, 7.2, 9) -------------------------------------------
// Flat value applied to EVERY order regardless of subtotal — no free-shipping
// threshold (SM Drips' "free above Rs. 3,000" rule is removed). Defined ONCE
// here and imported everywhere (order validation, WhatsApp, checkout UI).
// TODO: confirm real shipping cost
export const SHIPPING_COST = 350;

// ID prefixes (spec 6.2) -------------------------------------------------
// Flowerista-specific. Must NOT reuse SM Drips' "SM-" (SKU) / "SRT-" (order).
export const SKU_PREFIX = "FLW";
export const ORDER_ID_PREFIX = "FLW";

// Category taxonomy (spec 3, 6.1) — FINAL, complete list for launch -------
export const CATEGORY_SLUGS = {
  CROCHET: "crochet",
  PIPECLEANER_ART: "pipecleaner-art",
};

export const SUBCATEGORY_SLUGS = {
  NAME_WALL_HANGINGS: "name-wall-hangings",
  DECORATIVE_WALL_HANGINGS: "decorative-wall-hangings",
  FLOWER_BASKETS: "flower-baskets",
  FLOWER_BOUQUETS: "flower-bouquets",
};

// Enum arrays (reused by the Product model + validation) -----------------
export const CATEGORY_ENUM = Object.values(CATEGORY_SLUGS);
export const SUBCATEGORY_ENUM = Object.values(SUBCATEGORY_SLUGS);

// Only Pipecleaner Art has subcategories; Crochet has none (spec 3).
export const SUBCATEGORIES_BY_CATEGORY = {
  [CATEGORY_SLUGS.CROCHET]: [],
  [CATEGORY_SLUGS.PIPECLEANER_ART]: SUBCATEGORY_ENUM,
};

// Human-readable display labels for slugs (card category label, admin, etc.)
// Category display names are sourced from the Category collection at runtime
// (spec 7.5); this map is a fallback for label rendering only.
export const CATEGORY_LABELS = {
  [CATEGORY_SLUGS.CROCHET]: "Crochet",
  [CATEGORY_SLUGS.PIPECLEANER_ART]: "Pipecleaner Art",
  [SUBCATEGORY_SLUGS.NAME_WALL_HANGINGS]: "Name Wall Hangings",
  [SUBCATEGORY_SLUGS.DECORATIVE_WALL_HANGINGS]: "Decorative Wall Hangings",
  [SUBCATEGORY_SLUGS.FLOWER_BASKETS]: "Flower Baskets",
  [SUBCATEGORY_SLUGS.FLOWER_BOUQUETS]: "Flower Bouquets",
};

// maxQuantity per-order caps (spec 6.3) — PROVISIONAL placeholders, not
// derived from real production-capacity data.
//   - Smaller/faster items (Flower Baskets, Flower Bouquets): 5
//   - Larger/slower items (Name/Decorative Wall Hangings): 3
// Crochet has no subcategory; the spec doesn't state a default for it, so it
// falls through to the general default of 5 (FLAG: confirm crochet cap).
export const MAX_QUANTITY_DEFAULT = 5;
export const MAX_QUANTITY_LARGE_ITEM = 3;

const LARGE_ITEM_SUBCATEGORIES = new Set([
  SUBCATEGORY_SLUGS.NAME_WALL_HANGINGS,
  SUBCATEGORY_SLUGS.DECORATIVE_WALL_HANGINGS,
]);

export function getDefaultMaxQuantity(subcategory) {
  return LARGE_ITEM_SUBCATEGORIES.has(subcategory)
    ? MAX_QUANTITY_LARGE_ITEM
    : MAX_QUANTITY_DEFAULT;
}

// Order status labels (human-readable) — used by WhatsApp fallback (7.8) and
// admin UI so raw enum values are never shown to customers.
export const ORDER_STATUS_LABELS = {
  pending_confirmation: "Pending Confirmation",
  confirmed: "Confirmed",
  processing: "Processing",
  shipped: "Shipped",
  delivered: "Delivered",
  cancelled: "Cancelled",
};

// Payment method labels (fixes raw enum labels in admin chart, spec 7.7) ---
export const PAYMENT_METHOD_LABELS = {
  cod: "Cash on Delivery",
  bank_deposit: "Bank Deposit",
};
