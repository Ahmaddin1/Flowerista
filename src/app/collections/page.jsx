import Link from "next/link";
import { ArrowRight } from "lucide-react";
import ProductCard from "@/components/ProductCard";
import {
  buildProductFilter,
  getCategories,
  getProducts,
  getSortObject,
} from "@/lib/products";
import { brandName } from "@/lib/constants";

export const metadata = {
  title: "Collections",
  description: `Explore the ${brandName} collections — handmade crochet and pipecleaner art, grouped by the pieces you love.`,
  robots: { index: true, follow: true },
};

const PER_COLLECTION = 8;

// Build the browseable collection list from the taxonomy: top-level categories
// that have no subcategories (e.g. Crochet) shown directly, plus every
// subcategory (the Pipecleaner Art groupings). The parent of a category that
// has children is omitted to avoid a redundant row that duplicates its subs.
function buildCollectionList(categories) {
  const subcategories = categories.filter((category) => category.parentSlug);
  const parentsWithChildren = new Set(
    subcategories.map((subcategory) => subcategory.parentSlug),
  );

  const standaloneParents = categories.filter(
    (category) => !category.parentSlug && !parentsWithChildren.has(category.slug),
  );

  return [...standaloneParents, ...subcategories].sort(
    (first, second) => first.order - second.order,
  );
}

async function getCollectionsData() {
  const categories = await getCategories();
  const collectionList = buildCollectionList(categories);

  const productLists = await Promise.all(
    collectionList.map((collection) =>
      getProducts({
        filter: collection.parentSlug
          ? buildProductFilter({ subcategory: collection.slug })
          : buildProductFilter({ category: collection.slug }),
        sort: getSortObject("newest"),
        limit: PER_COLLECTION,
        skip: 0,
      }),
    ),
  );

  return collectionList.map((collection, index) => ({
    ...collection,
    products: productLists[index],
  }));
}

export default async function CollectionsPage() {
  const collections = await getCollectionsData();

  return (
    <div className="min-h-screen bg-bg px-6 py-12">
      <h1 className="mb-12 font-heading text-6xl text-text">Collections</h1>

      <div className="space-y-16">
        {collections.map((collection) => (
          <section key={collection.slug}>
            {collection.products.length > 0 ? (
              <>
                <Link
                  href={`/products/${collection.slug}`}
                  className="group mb-4 flex items-center justify-between"
                >
                  <h2 className="font-heading text-4xl text-text transition-colors group-hover:text-accent-strong">
                    {collection.name}
                  </h2>
                  <ArrowRight className="h-8 w-8 text-accent-strong transition-transform group-hover:translate-x-1" />
                </Link>

                <div className="hide-scrollbar -mr-6 flex flex-row flex-nowrap gap-3 overflow-x-auto scroll-smooth pb-2 pr-0">
                  {collection.products.map((product) => (
                    <div key={product._id} className="w-64 shrink-0">
                      <ProductCard product={product} />
                    </div>
                  ))}

                  <Link
                    href={`/products/${collection.slug}`}
                    className="flex h-12 w-30 shrink-0 items-center justify-center self-center font-sans font-medium text-accent-strong hover:underline"
                  >
                    View All →
                  </Link>
                </div>
              </>
            ) : (
              <>
                <h2 className="mb-4 font-heading text-4xl text-text">
                  {collection.name}
                </h2>
                <p className="font-sans text-sm text-muted-text">
                  Coming Soon :)
                </p>
              </>
            )}
          </section>
        ))}
      </div>
    </div>
  );
}
