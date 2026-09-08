import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import Category from "@/models/Category";
import { getTokenFromRequest, verifyToken } from "@/lib/auth";

// Admin categories (spec 6.4). Categories now carry parentSlug (two-level
// taxonomy: Crochet / Pipecleaner Art + its subcategories) and an order field
// for controlling display sequence.
export async function GET(request) {
  const token = getTokenFromRequest(request);
  if (!token || !verifyToken(token)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    await dbConnect();
    const categories = await Category.find({})
      .select("_id name slug parentSlug order image")
      .sort({ order: 1 })
      .lean();
    return NextResponse.json({ categories });
  } catch (error) {
    console.error("Categories fetch error:", error);
    return NextResponse.json(
      { error: "Failed to fetch categories" },
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
    const { name, slug, parentSlug, order, image } = await request.json();

    if (!name) {
      return NextResponse.json({ error: "Name is required" }, { status: 400 });
    }

    await dbConnect();

    const generatedSlug =
      slug ||
      name
        .toLowerCase()
        .replace(/\s+/g, "-")
        .replace(/[^a-z0-9-]/g, "");

    const numericOrder = Number(order);

    const category = await Category.create({
      name,
      slug: generatedSlug,
      parentSlug: parentSlug || null,
      order: Number.isFinite(numericOrder) ? numericOrder : 0,
      image: image || null,
    });

    return NextResponse.json(category, { status: 201 });
  } catch (error) {
    console.error("Category creation error:", error);

    if (error.code === 11000) {
      return NextResponse.json(
        { error: "A category with this slug already exists" },
        { status: 400 },
      );
    }

    return NextResponse.json(
      { error: "Failed to create category" },
      { status: 500 },
    );
  }
}
