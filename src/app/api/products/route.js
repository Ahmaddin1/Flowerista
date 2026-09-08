import { NextResponse } from "next/server";
import {
  buildProductFilter,
  getProducts,
  getSortObject,
} from "@/lib/products";

// Public product listing (spec 6.5 / 7.9). Delegates filtering + serialization
// to the data layer. Returns a bare array (the InfiniteProductGrid consumer
// expects an array). category/subcategory are slug strings; only active
// products are returned. No populate, no size/stock logic.
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);

    const pageParam = parseInt(searchParams.get("page") || "1", 10);
    const limitParam = parseInt(searchParams.get("limit") || "16", 10);
    const page = Number.isFinite(pageParam) && pageParam > 0 ? pageParam : 1;
    const limit = Number.isFinite(limitParam) && limitParam > 0 ? limitParam : 16;

    const category = searchParams.get("category") || "";
    const subcategory = searchParams.get("subcategory") || "";
    const sort = searchParams.get("sort") || "newest";
    const minPrice = searchParams.get("minPrice");
    const maxPrice = searchParams.get("maxPrice");

    const filter = buildProductFilter({
      category,
      subcategory,
      minPrice,
      maxPrice,
    });

    const products = await getProducts({
      filter,
      limit,
      sort: getSortObject(sort),
      skip: (page - 1) * limit,
    });

    return NextResponse.json(products);
  } catch (error) {
    console.error("Error fetching products:", error);
    return NextResponse.json(
      { error: "Failed to fetch products" },
      { status: 500 },
    );
  }
}
