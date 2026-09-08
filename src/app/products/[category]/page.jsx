import { notFound, unstable_rethrow } from "next/navigation";
import InfiniteProductGrid from "@/components/InfiniteProductGrid";
import {
  buildProductFilter,
  countProducts,
  getCategories,
  getProducts,
} from "@/lib/products";
import { brandName } from "@/lib/constants";

const PAGE_SIZE = 16;

function parseCategorySlug(resolvedParams) {
  return typeof resolvedParams?.category === "string"
    ? resolvedParams.category.trim()
    : "";
}

async function findCategory(categorySlug) {
  if (!categorySlug) {
    return null;
  }

  const categories = await getCategories();
  return categories.find((category) => category.slug === categorySlug) ?? null;
}

function filterForCategory(category) {
  // A subcategory doc carries a parentSlug; products store it in `subcategory`.
  // Top-level categories are matched on `category`.
  return category.parentSlug
    ? buildProductFilter({ subcategory: category.slug })
    : buildProductFilter({ category: category.slug });
}

export async function generateMetadata({ params }) {
  const categorySlug = parseCategorySlug(await params);

  try {
    const category = await findCategory(categorySlug);

    if (!category) {
      return {
        title: "Category Not Found",
        description: "This category is unavailable or no longer exists.",
      };
    }

    return {
      title: category.name,
      description: `Shop handmade ${category.name} at ${brandName}.`,
      robots: { index: true, follow: true },
    };
  } catch {
    return {
      title: "Category Not Found",
      description: "This category is unavailable or no longer exists.",
    };
  }
}

export default async function CategoryPage({ params }) {
  const categorySlug = parseCategorySlug(await params);

  if (!categorySlug) {
    notFound();
  }

  try {
    const category = await findCategory(categorySlug);

    if (!category) {
      notFound();
    }

    const filter = filterForCategory(category);
    const isSubcategory = Boolean(category.parentSlug);

    const [initialProducts, totalCount] = await Promise.all([
      getProducts({
        filter,
        sort: { createdAt: -1 },
        limit: PAGE_SIZE,
        skip: 0,
      }),
      countProducts(filter),
    ]);

    return (
      <section className="min-h-screen bg-bg px-4 pb-20 pt-12 md:px-8 lg:px-10">
        <div className="mx-auto max-w-360">
          <h1 className="mb-8 font-heading text-[54px] leading-none text-text md:text-[72px]">
            {category.name}
          </h1>
          <InfiniteProductGrid
            initialProducts={initialProducts}
            totalCount={totalCount}
            categorySlug={isSubcategory ? "" : category.slug}
            subcategorySlug={isSubcategory ? category.slug : ""}
            isEmpty={totalCount === 0}
          />
        </div>
      </section>
    );
  } catch (error) {
    unstable_rethrow(error);
    console.error("Failed to load category page:", error);
    throw new Error("Failed to load category");
  }
}
