import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

export default function CategorySection({ categories = [], id }) {
  const topLevel = categories.filter((c) => !c.parentSlug);

  return (
    <section id={id} className="scroll-mt-24">
      {topLevel.length === 0 ? (
        <p className="px-4 text-center text-[12px] uppercase tracking-[3px] text-muted-text">
          More categories coming soon.
        </p>
      ) : (
        <div className="scrollbar-none flex flex-row gap-4 overflow-x-auto py-2">
          {topLevel.map((category) => (
            <Link
              key={category._id}
              href={`/products?category=${category.slug}`}
              className="group block w-64 shrink-0 rounded-2xl transition-all duration-300 hover:-translate-y-1"
            >
              <div className="relative aspect-[4/5] overflow-hidden rounded-[16px]">
                {category.image ? (
                  <Image
                    src={category.image}
                    alt={category.name || "Category image"}
                    fill
                    unoptimized
                    sizes="256px"
                    className="object-cover transition-transform duration-500 group-hover:scale-110"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center bg-card text-[10px] uppercase tracking-[3px] text-muted-text">
                    Coming Soon
                  </div>
                )}
              </div>
              <p className="mt-3 text-center font-heading text-[28px] uppercase leading-none tracking-[0.08em] text-text">
                {category.name}
              </p>
            </Link>
          ))}

          <Link
            href="/products"
            className="flex h-12 w-30 shrink-0 items-center justify-center self-center font-sans font-medium text-accent-strong"
          >
            View All <ArrowRight className="ml-1" size={16} />
          </Link>
        </div>
      )}
    </section>
  );
}
