import { NextResponse } from "next/server";
import mongoose from "mongoose";
import dbConnect from "@/lib/db";
import Product from "@/models/Product";
import { serializeProductForCart } from "@/lib/cartValidation";

export async function GET(_request, { params }) {
  try {
    const { productId } = await params;

    if (!mongoose.Types.ObjectId.isValid(productId)) {
      return NextResponse.json(
        { error: "Product not found." },
        { status: 404 },
      );
    }

    await dbConnect();

    const product = await Product.findById(productId)
      .select("name slug basePrice originalPrice images isActive maxQuantity")
      .lean();

    if (!product || product.isActive === false) {
      return NextResponse.json(
        { error: "Product not found." },
        { status: 404 },
      );
    }

    return NextResponse.json({
      product: serializeProductForCart(product),
    });
  } catch (error) {
    console.error("Product verification error:", error);

    return NextResponse.json(
      { error: "Failed to verify product." },
      { status: 500 },
    );
  }
}
