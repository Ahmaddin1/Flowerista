import dbConnect from "@/lib/db";
import Category from "@/models/Category";
import Product from "@/models/Product";

const FALLBACK_BASE_URL = "https://flowerista.vercel.app";

export const revalidate = 3600;

function getBaseUrl() {
  const configuredUrl = process.env.NEXT_PUBLIC_SITE_URL || FALLBACK_BASE_URL;
  return configuredUrl.replace(/\/$/, "");
}

export default async function sitemap() {
  const baseUrl = getBaseUrl();

  const staticRoutes = [
    { url: `${baseUrl}/`, changeFrequency: "weekly", priority: 1.0 },
    { url: `${baseUrl}/products`, changeFrequency: "daily", priority: 0.9 },
    {
      url: `${baseUrl}/collections`,
      changeFrequency: "weekly",
      priority: 0.7,
    },
    { url: `${baseUrl}/about`, changeFrequency: "monthly", priority: 0.5 },
    { url: `${baseUrl}/contact`, changeFrequency: "monthly", priority: 0.4 },
    { url: `${baseUrl}/shipping`, changeFrequency: "monthly", priority: 0.3 },
    { url: `${baseUrl}/returns`, changeFrequency: "monthly", priority: 0.3 },
    {
      url: `${baseUrl}/privacy-policy`,
      changeFrequency: "yearly",
      priority: 0.2,
    },
  ];

  try {
    await dbConnect();

    const [products, categories] = await Promise.all([
      Product.find({ isActive: true }).select("slug category updatedAt").lean(),
      Category.find({}).select("slug updatedAt").lean(),
    ]);

    const productRoutes = products.map((product) => ({
      url: `${baseUrl}/products/${product.category}/${product.slug}`,
      lastModified: product.updatedAt ? new Date(product.updatedAt) : undefined,
      changeFrequency: "weekly",
      priority: 0.7,
    }));

    const categoryRoutes = categories.map((category) => ({
      url: `${baseUrl}/products/${category.slug}`,
      lastModified: category.updatedAt
        ? new Date(category.updatedAt)
        : undefined,
      changeFrequency: "weekly",
      priority: 0.6,
    }));

    return [...staticRoutes, ...categoryRoutes, ...productRoutes];
  } catch (error) {
    console.error("sitemap: failed to load routes", error);
    return staticRoutes;
  }
}
