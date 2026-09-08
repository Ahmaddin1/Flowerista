import Link from "next/link";
import ProductCard from "@/components/ProductCard";
import { ArrowRight } from "lucide-react";

export default function NewArrivalsSection({ products = [] }) {
  return (
    <section id="new-arrivals">
      <div className="flex items-end justify-between gap-4 px-4">
        <h2 className="font-heading text-[36px] leading-none text-text">
          New Arrivals
        </h2>
        <Link
          href="/products"
          className="text-[11px] uppercase tracking-[2px] text-muted-text transition-colors duration-200 hover:text-accent-strong"
        >
          View All &rarr;
        </Link>
      </div>

      {products.length === 0 ? (
        <p className="mt-8 text-center text-[12px] uppercase tracking-[3px] text-muted-text">
          More products coming soon.
        </p>
      ) : (
        <div className="mt-4 flex snap-x snap-mandatory gap-2.5 overflow-x-auto scroll-smooth px-4 pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {products.map((product) => (
            <div
              key={product._id}
              className="w-[63vw] flex-shrink-0 snap-start sm:w-[44vw] md:w-[30vw] lg:w-[22vw]"
            >
              <ProductCard product={product} />
            </div>
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
