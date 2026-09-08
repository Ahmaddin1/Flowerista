import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import Product from "@/models/Product";
import { getTokenFromRequest, verifyToken } from "@/lib/auth";
import {
  CATEGORY_ENUM,
  SUBCATEGORY_ENUM,
  CATEGORY_SLUGS,
  SKU_PREFIX,
  getDefaultMaxQuantity,
} from "@/lib/constants";

// Generates a sequential, unique SKU of the form FLW-CRO-001 (spec 6.2).
// The 3-letter code is derived from the category slug (crochet -> CRO,
// pipecleaner-art -> PIP). The numeric suffix continues from the highest
// existing sequence for that prefix. No per-variant SKUs exist.
async function generateUniqueSku(categorySlug) {
  const categoryCode =
    String(categorySlug || "")
      .replace(/[^a-zA-Z]/g, "")
      .substring(0, 3)
      .toUpperCase() || "GEN";
  const prefix = `${SKU_PREFIX}-${categoryCode}-`;

  const existing = await Product.find({ sku: { $regex: `^${prefix}` } })
    .select("sku")
    .lean();

  let maxSeq = 0;
  for (const doc of existing) {
    const match = String(doc.sku).match(/(\d+)$/);
    if (match) {
      const seq = parseInt(match[1], 10);
      if (Number.isFinite(seq) && seq > maxSeq) {
        maxSeq = seq;
      }
    }
  }

  let nextSeq = maxSeq + 1;
  for (let attempt = 0; attempt < 50; attempt += 1) {
    const candidate = `${prefix}${String(nextSeq).padStart(3, "0")}`;
    // eslint-disable-next-line no-await-in-loop
    const clash = await Product.findOne({ sku: candidate })
      .select("_id")
      .lean();
    if (!clash) {
      return candidate;
    }
    nextSeq += 1;
  }

  return `${prefix}${Date.now().toString().slice(-6)}`;
}

export async function GET(request) {
  const token = getTokenFromRequest(request);
  if (!token || !verifyToken(token)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    await dbConnect();

    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search") || "";
    const category = searchParams.get("category") || "";
    const subcategory = searchParams.get("subcategory") || "";
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "20", 10);

    const filter = {};

    if (search) {
      filter.name = { $regex: search, $options: "i" };
    }

    // Category / subcategory are slug strings now (no ObjectId ref).
    if (category && CATEGORY_ENUM.includes(category)) {
      filter.category = category;
    }

    if (subcategory && SUBCATEGORY_ENUM.includes(subcategory)) {
      filter.subcategory = subcategory;
    }

    const skip = (page - 1) * limit;

    const [products, totalCount] = await Promise.all([
      Product.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Product.countDocuments(filter),
    ]);

    const totalPages = Math.ceil(totalCount / limit);

    return NextResponse.json({
      products,
      totalCount,
      page,
      totalPages,
    });
  } catch (error) {
    console.error("Products fetch error:", error);
    return NextResponse.json(
      { error: "Failed to fetch products" },
      { status: 500 },
    );
  }
}

export async function POST(request) {
  const token = getTokenFromRequest(request);
  if (!token || !verifyToken(token)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const {
      name,
      slug,
      category,
      subcategory,
      description,
      basePrice,
      originalPrice,
      images,
      isActive,
      tags,
      maxQuantity,
    } = body;

    if (!name || !slug || !category || basePrice == null || basePrice === "") {
      return NextResponse.json(
        { error: "Missing required fields: name, slug, category, basePrice" },
        { status: 400 },
      );
    }

    if (!CATEGORY_ENUM.includes(category)) {
      return NextResponse.json({ error: "Invalid category" }, { status: 400 });
    }

    // Enforce the taxonomy invariant up front (the model re-checks it too).
    const normalizedSubcategory =
      category === CATEGORY_SLUGS.CROCHET ? null : subcategory || null;

    if (
      category !== CATEGORY_SLUGS.CROCHET &&
      (!normalizedSubcategory ||
        !SUBCATEGORY_ENUM.includes(normalizedSubcategory))
    ) {
      return NextResponse.json(
        { error: "A valid subcategory is required for this category" },
        { status: 400 },
      );
    }

    await dbConnect();

    const sku = await generateUniqueSku(category);

    const parsedMaxQuantity = Number(maxQuantity);
    const resolvedMaxQuantity =
      Number.isFinite(parsedMaxQuantity) && parsedMaxQuantity >= 1
        ? Math.floor(parsedMaxQuantity)
        : getDefaultMaxQuantity(normalizedSubcategory);

    const product = await Product.create({
      name,
      slug,
      sku,
      category,
      subcategory: normalizedSubcategory,
      description: description || "",
      basePrice: Number(basePrice),
      originalPrice:
        originalPrice == null || originalPrice === ""
          ? null
          : Number(originalPrice),
      images: Array.isArray(images)
        ? images.map((img) => (typeof img === 'string' ? img : img.url))
        : [],
      isActive: isActive !== undefined ? Boolean(isActive) : true,
      tags: Array.isArray(tags) ? tags : [],
      maxQuantity: resolvedMaxQuantity,
    });

    return NextResponse.json(product, { status: 201 });
  } catch (error) {
    console.error("Product creation error:", error);

    if (error.code === 11000) {
      return NextResponse.json(
        { error: "A product with this slug or SKU already exists" },
        { status: 400 },
      );
    }

    if (error.name === "ValidationError") {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json(
      { error: "Failed to create product" },
      { status: 500 },
    );
  }
}
