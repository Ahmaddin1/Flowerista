import dbConnect from "@/lib/db";
import Category from "@/models/Category";
import Product from "@/models/Product";
import { CATEGORY_LABELS } from "@/lib/constants";

function serializeDate(value) {
  if (!value) {
    return "";
  }

  const parsedDate = value instanceof Date ? value : new Date(value);
  return Number.isNaN(parsedDate.getTime()) ? "" : parsedDate.toISOString();
}

// Images are plain Cloudinary URL strings (spec 6.1). Tolerate legacy
// {url, order} objects defensively in case any pre-migration docs remain.
function normalizeImages(images) {
  if (!Array.isArray(images)) {
    return [];
  }

  return images
    .map((image) => (typeof image === "string" ? image : (image?.url ?? "")))
    .filter(Boolean);
}

function labelFor(slug) {
  if (!slug) {
    return null;
  }
  return CATEGORY_LABELS[slug] ?? slug;
}

// Canonical serialized product shape used by the storefront (grid + cards +
// detail). category/subcategory are slug strings; *Label fields are the
// human-readable display names. isOutOfStock is driven solely by isActive
// (spec 7.9) — no size/stock logic anywhere.
export function serializeProduct(product) {
  if (!product) {
    return null;
  }

  const isActive = product.isActive !== false;

  return {
    _id: String(product._id),
    name: product.name ?? "",
    slug: product.slug ?? "",
    description: product.description ?? "",
    category: product.category ?? "",
    categoryLabel: labelFor(product.category),
    subcategory: product.subcategory ?? null,
    subcategoryLabel: labelFor(product.subcategory),
    basePrice: Number(product.basePrice ?? 0),
    originalPrice:
      product.originalPrice != null ? Number(product.originalPrice) : null,
    images: normalizeImages(product.images),
    maxQuantity: Number(product.maxQuantity ?? 1),
    sku: product.sku ?? "",
    tags: Array.isArray(product.tags) ? product.tags : [],
    isActive,
    isOutOfStock: !isActive,
    createdAt: serializeDate(product.createdAt),
  };
}

const SELECT_FIELDS =
  "name slug description category subcategory basePrice originalPrice images maxQuantity sku tags isActive createdAt";

const SORT_MAP = {
  newest: { createdAt: -1 },
  price_asc: { basePrice: 1 },
  price_desc: { basePrice: -1 },
};

export function getSortObject(sort) {
  return SORT_MAP[sort] || SORT_MAP.newest;
}

// Builds the MongoDB filter conditionally from the query params (spec 6.5).
// `category` and `subcategory` are independent slug strings; `subcategory` is
// only meaningful alongside category=pipecleaner-art but is applied whenever
// present. Price filtering carries over on basePrice.
export function buildProductFilter({
  category,
  subcategory,
  minPrice,
  maxPrice,
  includeInactive = false,
} = {}) {
  const filter = {};

  if (!includeInactive) {
    filter.isActive = true;
  }

  if (category) {
    filter.category = category;
  }

  if (subcategory) {
    filter.subcategory = subcategory;
  }

  const min = Number(minPrice);
  const max = Number(maxPrice);
  const hasMin = Number.isFinite(min) && minPrice !== "" && minPrice != null;
  const hasMax = Number.isFinite(max) && maxPrice !== "" && maxPrice != null;

  if (hasMin || hasMax) {
    filter.basePrice = {};
    if (hasMin) {
      filter.basePrice.$gte = min;
    }
    if (hasMax) {
      filter.basePrice.$lte = max;
    }
  }

  return filter;
}

export async function getProducts({
  filter = {},
  limit = 16,
  sort = { createdAt: -1 },
  skip,
} = {}) {
  if (typeof skip !== "number") {
    throw new Error("getProducts requires a numeric skip value.");
  }

  await dbConnect();

  let query = Product.find(filter)
    .select(SELECT_FIELDS)
    .sort(sort)
    .skip(skip)
    .lean();

  if (typeof limit === "number") {
    query = query.limit(limit);
  }

  const products = await query;
  return products.map(serializeProduct);
}

export async function countProducts(filter = {}) {
  await dbConnect();
  return Product.countDocuments(filter);
}

// Flat, enriched category list (spec 6.4 / 7.5). Sorted by `order`. Consumers
// (e.g. FilterBar) group by parentSlug to render the two-level UI.
export async function getCategories() {
  await dbConnect();

  const categories = await Category.find({})
    .select("name slug parentSlug order image")
    .sort({ order: 1 })
    .lean();

  return categories.map((category) => ({
    _id: String(category._id),
    name: category.name ?? "",
    slug: category.slug ?? "",
    parentSlug: category.parentSlug ?? null,
    order: Number(category.order ?? 0),
    image: category.image ?? null,
  }));
}
