import { NextResponse } from "next/server";
import mongoose from "mongoose";
import dbConnect from "@/lib/db";
import Product from "@/models/Product";
import { getTokenFromRequest, verifyToken } from "@/lib/auth";

// Fields an admin may edit. sku is immutable (generated at creation); _id and
// timestamps are never client-writable. category/subcategory changes are
// re-validated by the model's pre-validate taxonomy hook on save.
const ALLOWED_UPDATE_FIELDS = new Set([
  "name",
  "slug",
  "description",
  "category",
  "subcategory",
  "basePrice",
  "originalPrice",
  "images",
  "isActive",
  "tags",
  "maxQuantity",
]);

export async function GET(request, { params }) {
  const token = getTokenFromRequest(request);
  if (!token || !verifyToken(token)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { id } = await params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    await dbConnect();

    const product = await Product.findById(id).lean();

    if (!product) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    return NextResponse.json(product);
  } catch (error) {
    console.error("Product fetch error:", error);
    return NextResponse.json(
      { error: "Failed to fetch product" },
      { status: 500 },
    );
  }
}

export async function PATCH(request, { params }) {
  const token = getTokenFromRequest(request);
  if (!token || !verifyToken(token)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { id } = await params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    await dbConnect();

    const product = await Product.findById(id);
    if (!product) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    const updates = await request.json();

    // Apply only whitelisted fields, with light coercion for numeric/nullable
    // fields so empty strings from the admin form don't fail schema casting.
    for (const key of Object.keys(updates)) {
      if (!ALLOWED_UPDATE_FIELDS.has(key)) {
        continue;
      }

      const value = updates[key];

      if (key === "basePrice") {
        product.basePrice = Number(value);
      } else if (key === "originalPrice") {
        product.originalPrice =
          value == null || value === "" ? null : Number(value);
      } else if (key === "maxQuantity") {
        const parsed = Number(value);
        if (Number.isFinite(parsed) && parsed >= 1) {
          product.maxQuantity = Math.floor(parsed);
        }
      } else if (key === "images") {
        product.images = Array.isArray(value)
          ? value.map((img) => (typeof img === "string" ? img : img.url))
          : [];
      } else if (key === "tags") {
        product.tags = Array.isArray(value) ? value : [];
      } else if (key === "isActive") {
        product.isActive = Boolean(value);
      } else {
        product[key] = value;
      }
    }

    await product.save();

    const updatedProduct = await Product.findById(id).lean();

    return NextResponse.json(updatedProduct);
  } catch (error) {
    console.error("Product update error:", error);

    if (error.code === 11000) {
      return NextResponse.json(
        { error: "A product with this slug already exists" },
        { status: 400 },
      );
    }

    if (error.name === "ValidationError") {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json(
      { error: "Failed to update product" },
      { status: 500 },
    );
  }
}

export async function DELETE(request, { params }) {
  const token = getTokenFromRequest(request);
  if (!token || !verifyToken(token)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { id } = await params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    await dbConnect();

    const product = await Product.findByIdAndDelete(id);

    if (!product) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Product deletion error:", error);
    return NextResponse.json(
      { error: "Failed to delete product" },
      { status: 500 },
    );
  }
}
