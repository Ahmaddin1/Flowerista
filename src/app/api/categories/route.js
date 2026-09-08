import { NextResponse } from "next/server";
import { getCategories } from "@/lib/products";

// Public categories endpoint (spec 7.5) — no auth. Powers the storefront
// FilterBar. Returns the flat, order-sorted category list (with parentSlug so
// the client can build the two-level Crochet / Pipecleaner Art UI).
export async function GET() {
  try {
    const categories = await getCategories();
    return NextResponse.json({ categories });
  } catch (error) {
    console.error("Categories fetch error:", error);
    return NextResponse.json(
      { error: "Failed to fetch categories" },
      { status: 500 },
    );
  }
}
