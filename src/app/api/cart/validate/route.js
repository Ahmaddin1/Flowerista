import { NextResponse } from "next/server";
import mongoose from "mongoose";
import dbConnect from "@/lib/db";
import Product from "@/models/Product";
import { validateCartItem } from "@/lib/cartValidation";

export async function POST(request) {
  try {
    const body = await request.json();
    const items = Array.isArray(body?.items) ? body.items : null;

    if (!items) {
      return NextResponse.json(
        { error: "Invalid cart payload." },
        { status: 400 },
      );
    }

    const productIds = [...new Set(
      items
        .map((item) => item?.productId)
        .filter((productId) => mongoose.Types.ObjectId.isValid(productId)),
    )];

    await dbConnect();

    const products = productIds.length
      ? await Product.find({ _id: { $in: productIds } })
          .select("name slug basePrice originalPrice images isActive maxQuantity")
          .lean()
      : [];

    const productMap = new Map(
      products.map((product) => [String(product._id), product]),
    );

    let valid = true;
    const correctedItems = items.map((item) => {
      const { isValid, item: correctedItem } = validateCartItem(
        item,
        productMap.get(String(item?.productId ?? "")),
      );

      if (!isValid) {
        valid = false;
      }

      return correctedItem;
    });

    return NextResponse.json({
      valid,
      items: correctedItems,
    });
  } catch (error) {
    console.error("Cart validation error:", error);

    return NextResponse.json(
      { error: "Failed to validate cart." },
      { status: 500 },
    );
  }
}
