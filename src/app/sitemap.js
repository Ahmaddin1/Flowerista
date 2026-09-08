import dbConnect from "@/lib/db";
import Product from "@/models/Product";

export default async function sitemap() {
  const base = process.env.NEXT_PUBLIC_SITE_URL;

  const staticRoutes = [
    {
      url: `${base}/`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 1.0,
    },
    {
      url: `${base}/products`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.9,
    },
    {
      url: `${base}/collections`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.8,
    },
    {
      url: `${base}/about`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.5,
    },
  ];

  try {
    await dbConnect();

    const products = await Product.find({ isActive: true })
      .select("slug updatedAt category")
      .populate("category", "slug")
      .lean();

    const productRoutes = products.map((product) => ({
      url: `${base}/products/${product.category?.slug ?? "all"}/${product.slug}`,
      lastModified: product.updatedAt,
      changeFrequency: "weekly",
      priority: 0.8,
    }));

    return [...staticRoutes, ...productRoutes];
  } catch (error) {
    console.error("Sitemap generation error:", error);
    return staticRoutes;
  }
}
