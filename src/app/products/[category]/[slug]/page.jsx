import { notFound, unstable_rethrow } from "next/navigation";
import ProductDetails from "@/components/ProductDetails";
import dbConnect from "@/lib/db";
import Product from "@/models/Product";
import { serializeProduct } from "@/lib/products";
import { brandName } from "@/lib/constants";

const PRODUCT_FIELDS =
  "name slug description category subcategory basePrice originalPrice images maxQuantity sku tags isActive createdAt";

function parseParams(resolvedParams) {
  const category =
    typeof resolvedParams?.category === "string"
      ? resolvedParams.category.trim()
      : "";
  const slug =
    typeof resolvedParams?.slug === "string" ? resolvedParams.slug.trim() : "";

  return { category, slug };
}

function firstImageUrl(images) {
  const first = Array.isArray(images) ? images[0] : null;
  return typeof first === "string" ? first : (first?.url ?? "");
}

export async function generateMetadata({ params }) {
  const { category, slug } = parseParams(await params);
  const fallback = {
    title: "Product Not Found",
    description: "This product is unavailable or no longer exists.",
  };

  if (!category || !slug) {
    return fallback;
  }

  try {
    await dbConnect();

    const product = await Product.findOne({ slug, category, isActive: true })
      .select("name description images")
      .lean();

    if (!product) {
      return fallback;
    }

    const description =
      product.description && product.description.length > 155
        ? `${product.description.slice(0, 155)}...`
        : product.description || `Shop ${product.name} at ${brandName}.`;

    const imageUrl = firstImageUrl(product.images);

    return {
      title: product.name,
      description,
      openGraph: {
        title: product.name,
        description,
        ...(imageUrl ? { images: [{ url: imageUrl }] } : {}),
      },
      twitter: {
        card: "summary_large_image",
        title: product.name,
        description,
      },
    };
  } catch {
    return fallback;
  }
}

export default async function ProductPage({ params }) {
  const { category, slug } = parseParams(await params);

  if (!category || !slug) {
    notFound();
  }

  try {
    await dbConnect();

    const product = await Product.findOne({ slug, category })
      .select(PRODUCT_FIELDS)
      .lean();

    if (!product || product.isActive === false) {
      notFound();
    }

    const serialized = serializeProduct(product);

    if (!serialized) {
      notFound();
    }

    return <ProductDetails product={serialized} />;
  } catch (error) {
    unstable_rethrow(error);
    console.error("Product fetch error:", error);
    throw new Error("Failed to load product");
  }
}
