"use client";

import { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import ProductCard from "@/components/ProductCard";
import SkeletonCard from "@/components/SkeletonCard";

gsap.registerPlugin(ScrollTrigger);

const PAGE_SIZE = 12;

function buildProductsUrl(categorySlug, subcategorySlug, page, sortValue) {
  const searchParams = new URLSearchParams({
    page: String(page),
    limit: String(PAGE_SIZE),
    sort: sortValue || "newest",
  });

  if (categorySlug) {
    searchParams.set("category", categorySlug);
  }

  if (subcategorySlug) {
    searchParams.set("subcategory", subcategorySlug);
  }

  return `/api/products?${searchParams.toString()}`;
}

export default function InfiniteProductGrid({
  initialProducts = [],
  totalCount = 0,
  categorySlug = "",
  subcategorySlug = "",
  sortValue = "newest",
  isEmpty = false,
}) {
  const [products, setProducts] = useState(initialProducts);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(initialProducts.length < totalCount);
  const sentinelRef = useRef(null);
  const requestInFlightRef = useRef(false);
  const gridRef = useRef(null);

  useEffect(() => {
    setProducts(initialProducts);
    setPage(1);
    setHasMore(initialProducts.length < totalCount);
    requestInFlightRef.current = false;
  }, [initialProducts, totalCount, categorySlug, subcategorySlug, sortValue]);

  useEffect(() => {
    if (!sentinelRef.current || !hasMore || loading) {
      return undefined;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (
          !entry?.isIntersecting ||
          loading ||
          !hasMore ||
          requestInFlightRef.current
        ) {
          return;
        }

        const nextPage = page + 1;

        requestInFlightRef.current = true;
        setLoading(true);

        fetch(buildProductsUrl(categorySlug, subcategorySlug, nextPage, sortValue), {
          cache: "no-store",
        })
          .then(async (response) => {
            if (!response.ok) {
              throw new Error("Failed to fetch more products.");
            }

            return response.json();
          })
          .then((nextProducts) => {
            if (!Array.isArray(nextProducts) || nextProducts.length === 0) {
              setHasMore(false);
              return;
            }

            setProducts((currentProducts) => [
              ...currentProducts,
              ...nextProducts,
            ]);
            setPage(nextPage);
            setHasMore(products.length + nextProducts.length < totalCount);
          })
          .catch((error) => {
            console.error(error);
            setHasMore(false);
          })
          .finally(() => {
            requestInFlightRef.current = false;
            setLoading(false);
          });
      },
      {
        rootMargin: "200px 0px",
      },
    );

    observer.observe(sentinelRef.current);

    return () => {
      observer.disconnect();
    };
  }, [
    categorySlug,
    subcategorySlug,
    sortValue,
    hasMore,
    loading,
    page,
    products.length,
    totalCount,
  ]);

  useEffect(() => {
    if (!gridRef.current) return;

    const uninitializedCards = gridRef.current.querySelectorAll(
      ".product-card:not([data-gsap-init])",
    );

    if (!uninitializedCards.length) return;

    gsap.set(uninitializedCards, { opacity: 0, scale: 0.94, y: 25 });

    uninitializedCards.forEach((el) =>
      el.setAttribute("data-gsap-init", "true"),
    );

    ScrollTrigger.batch(uninitializedCards, {
      onEnter: (batch) => {
        gsap.to(batch, {
          opacity: 1,
          scale: 1,
          y: 0,
          duration: 0.55,
          stagger: 0.05,
          ease: "power2.out",
          overwrite: true,
        });
      },
      once: true,
      start: "top 95%",
    });

    ScrollTrigger.refresh();
  }, [products.length]);

  useEffect(() => {
    return () => {
      ScrollTrigger.getAll().forEach((trigger) => trigger.kill());
    };
  }, []);

  if (isEmpty) {
    return (
      <div className="flex flex-col items-center justify-center py-32 text-center">
        <p className="font-heading text-[42px] text-text leading-none">
          Coming Soon
        </p>
        <p className="text-sm text-muted-text mt-3">
          This category is getting stocked up. Check back soon.
        </p>
      </div>
    );
  }

  if (products.length === 0) {
    return null;
  }

  return (
    <div>
      <div
        ref={gridRef}
        className="grid grid-cols-2 gap-2.5 md:grid-cols-3 lg:grid-cols-4"
      >
        {products.map((product) => (
          <ProductCard key={product._id} product={product} />
        ))}
      </div>

      {loading ? (
        <div className="mt-2.5 grid grid-cols-2 gap-2.5 md:grid-cols-3 lg:grid-cols-4">
          {Array.from({ length: 4 }, (_, index) => (
            <SkeletonCard key={`loading-card-${index}`} />
          ))}
        </div>
      ) : null}

      <div ref={sentinelRef} className="h-10" aria-hidden="true" />

      {!hasMore && products.length > 0 ? (
        <p className="text-center text-[11px] uppercase tracking-[3px] text-muted-text">
          You&apos;ve seen it all :)
        </p>
      ) : null}
    </div>
  );
}
