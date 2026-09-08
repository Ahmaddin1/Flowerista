import FilterBar from "@/components/shop/FilterBar";
import InfiniteProductGrid from "@/components/InfiniteProductGrid";
import {
  buildProductFilter,
  countProducts,
  getCategories,
  getProducts,
  getSortObject,
} from "@/lib/products";

export const metadata = {
  title: "Shop All",
  description:
    "Browse the full Flowerista collection of handmade crochet and pipecleaner art — thoughtfully made for the girly at heart.",
  robots: {
    index: true,
    follow: true,
  },
};

const PAGE_SIZE = 12;

export default async function ProductsPage({ searchParams }) {
  const resolvedParams = await searchParams;
  const rawCategory =
    typeof resolvedParams?.category === "string" ? resolvedParams.category : "";
  const rawSubcategory =
    typeof resolvedParams?.subcategory === "string"
      ? resolvedParams.subcategory
      : "";
  const sort =
    typeof resolvedParams?.sort === "string" ? resolvedParams.sort : "newest";

  const categories = await getCategories();
  const knownSlugs = new Set(categories.map((category) => category.slug));
  const category = knownSlugs.has(rawCategory) ? rawCategory : "";
  const subcategory = knownSlugs.has(rawSubcategory) ? rawSubcategory : "";

  const filter = buildProductFilter({ category, subcategory });

  const [initialProducts, totalCount] = await Promise.all([
    getProducts({
      filter,
      sort: getSortObject(sort),
      limit: PAGE_SIZE,
      skip: 0,
    }),
    countProducts(filter),
  ]);

  return (
    <section className="min-h-screen bg-bg px-4 pb-20 pt-12 md:px-8 lg:px-10">
      <div className="mx-auto max-w-360">
        <h1 className="mb-2 font-heading text-[54px] leading-none text-text md:text-[72px]">
          Shop All
        </h1>
        <p className="mb-6 text-sm text-muted-text">
          {totalCount} {totalCount === 1 ? "piece" : "pieces"}
        </p>

        <FilterBar
          categories={categories}
          activeCategory={category}
          activeSubcategory={subcategory}
          activeSort={sort}
        />

        <div className="mt-8">
          <InfiniteProductGrid
            initialProducts={initialProducts}
            totalCount={totalCount}
            categorySlug={category}
            subcategorySlug={subcategory}
            sortValue={sort}
            isEmpty={totalCount === 0}
          />
        </div>
      </div>
    </section>
  );
}
