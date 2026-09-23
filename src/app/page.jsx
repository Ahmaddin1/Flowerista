import CategorySection from "@/components/CategorySection";
import NewArrivalsSection from "@/components/NewArrivalsSection";
import MarqueeSection from "@/components/MarqueeSection";
import Hero4 from "@/components/Hero4";
import HomeInfoSection from "@/components/HomeInfoSection";
import { getCategories, getProducts } from "@/lib/products";

export const metadata = {
  title: "Flowerista | Handmade Crochet & Pipe-Cleaner Art",
  description:
    "Handmade crochet creations and pipe-cleaner art for home decor and gifts, crafted with love. Shop unique, one-of-a-kind decorative and beautiful items from Flowerista.",
  keywords: [
    "Flowerista",
    "Flowerista Pakistan",
    "handmade crochet Pakistan",
    "flowers",
    "gifts for girls",
    "crochet flowers",
    "pipecleaner art",
    "pipe cleaner flowers",
    "handmade flower bouquets",
    "flower baskets",
    "name wall hangings",
    "decorative wall hangings",
    "handmade gifts Pakistan",
    "custom handmade decor",
    "artisan home decor Pakistan",
    "crochet items",
    "crochet decor",
    "home decor",
    "crochet flowers Pakistan",
    "home decor items",
    "gift items",
    "crochet gifts",
    "crochet items for home",
    "crochet wall decor",
    "crochet wall art",
    "home decor flowers",
    "crochet wall hangings",
    "handmade wall hangings",
    "wall hangings",
    "keychains",
    "crochet keychains",
    "flower keychains",
    "cute keychains",
    "pipecleaner keychains",
    "home decor lamps",
    "beautiful home decor art",
  ],
  openGraph: {
    title: "Flowerista | Handmade Crochet & Pipe-Cleaner Art",
    description:
      "Handmade crochet creations and pipe-cleaner art, crafted with love.",
    url: process.env.NEXT_PUBLIC_SITE_URL,
    siteName: "Flowerista",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Flowerista | Handmade Crochet & Pipe-Cleaner Art",
    description:
      "Handmade crochet creations and pipe-cleaner art, crafted with love.",
  },
};

export default async function HomePage() {
  const [products, categories] = await Promise.all([
    getProducts({
      filter: { isActive: true },
      sort: { createdAt: -1 },
      limit: 8,
      skip: 0,
    }),
    getCategories(),
  ]);

  return (
    <div className="bg-bg pb-28">
      <Hero4 />
      <div className="pt-20">
        <MarqueeSection />
      </div>

      <div className="space-y-20">
        <section
          id="categories"
          className="px-4 py-20 text-center scroll-mt-24"
        >
          <h2 className="font-heading text-[48px] leading-none text-text">
            Shop by Category
          </h2>
          <p className="mb-8 mt-3 text-[13px] tracking-[1px] text-muted-text">
            Explore our handmade collections.
          </p>
          <CategorySection categories={categories} />
        </section>

        <NewArrivalsSection products={products} />

        <HomeInfoSection />
      </div>
    </div>
  );
}
