"use client";

import Image from "next/image";
import { forwardRef } from "react";
import { useRouter } from "next/navigation";
import { ShoppingBag } from "lucide-react";
import PriceDisplay from "@/components/PriceDisplay";
import { useCartStore } from "@/store/cartStore";

const ProductCard = forwardRef(function ProductCard({ product }, ref) {
  const router = useRouter();
  const openCartModal = useCartStore(
    ({ openCartModal: modalOpener }) => modalOpener,
  );

  if (!product) {
    return null;
  }

  const {
    name,
    slug,
    category,
    categoryLabel,
    basePrice,
    originalPrice,
    images,
    isOutOfStock,
  } = product;

  const primaryImage = Array.isArray(images) ? images[0] : null;
  const imageSrc =
    typeof primaryImage === "string" ? primaryImage : primaryImage?.url;
  const categoryName = categoryLabel ?? "";
  const categorySlug = typeof category === "string" ? category : "";
  const normalizedPrice = Number(basePrice);
  const normalizedOriginalPrice = Number(originalPrice);
  const hasDiscount =
    Number.isFinite(normalizedOriginalPrice) &&
    normalizedOriginalPrice > normalizedPrice;
  const discountPercentage = hasDiscount
    ? Math.round(
        ((normalizedOriginalPrice - normalizedPrice) / normalizedOriginalPrice) *
          100,
      )
    : null;

  const handleNavigate = () => {
    if (slug && categorySlug) {
      router.push(`/products/${categorySlug}/${slug}`);
    }
  };

  const handleKeyDown = (event) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      handleNavigate();
    }
  };

  const handleCartButtonClick = (event) => {
    event.stopPropagation();
    openCartModal?.(product);
  };

  return (
    <article
      ref={ref}
      role="link"
      tabIndex={0}
      onClick={handleNavigate}
      onKeyDown={handleKeyDown}
      className="product-card card-surface group cursor-pointer p-2 transition-all duration-300 hover:-translate-y-2.5 hover:border-accent hover:shadow-[var(--shadow-card-hover)]"
    >
      <div className="relative aspect-3/4 overflow-hidden rounded-[12px]">
        {imageSrc ? (
          <Image
            src={imageSrc}
            alt={name ?? "Product image"}
            fill
            unoptimized
            sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 25vw"
            className={`object-cover transition-transform duration-500 group-hover:scale-110 ${
              isOutOfStock ? "grayscale" : ""
            }`}
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-hairline/40 text-[10px] uppercase tracking-[3px] text-muted-text">
            No Image
          </div>
        )}

        {hasDiscount && !isOutOfStock ? (
          <span className="absolute top-2 left-2 rounded-pill bg-accent px-2 py-1 text-[10px] font-bold uppercase tracking-[2px] text-text">
            -{discountPercentage}%
          </span>
        ) : null}

        {isOutOfStock ? (
          <span className="absolute top-2 right-2 rounded-pill border border-card-border bg-card px-2 py-1 text-[8px] font-bold uppercase tracking-[2px] text-muted-text">
            Sold Out
          </span>
        ) : null}

        {!isOutOfStock ? (
          <>
            <button
              type="button"
              aria-label={`Add ${name} to cart`}
              onClick={handleCartButtonClick}
              className="absolute right-2 bottom-2 z-10 flex h-9 w-9 items-center justify-center rounded-full bg-accent shadow-[var(--shadow-card)] md:hidden"
            >
              <ShoppingBag
                className="h-4 w-4 text-text-on-accent"
                strokeWidth={1.8}
                aria-hidden="true"
              />
            </button>

            <div className="pointer-events-none absolute inset-0 hidden bg-text/30 opacity-0 transition-opacity duration-300 md:block md:group-hover:pointer-events-auto md:group-hover:opacity-100">
              <button
                type="button"
                aria-label={`Add ${name} to cart`}
                onClick={handleCartButtonClick}
                className="pointer-events-auto absolute right-2 bottom-2 flex h-9 w-9 items-center justify-center rounded-full bg-accent shadow-[var(--shadow-card)]"
              >
                <ShoppingBag
                  className="h-4 w-4 text-text-on-accent"
                  strokeWidth={1.8}
                  aria-hidden="true"
                />
              </button>
            </div>
          </>
        ) : null}
      </div>

      <div className="px-2 pb-2 pt-3">
        <p className="mb-1 text-[9px] md:text-[11px] uppercase tracking-[3px] text-muted-text">
          {categoryName}
        </p>

        <h3 className="mb-2 font-heading text-[19px] md:text-[24px] leading-tight text-text">
          {name}
        </h3>

        <PriceDisplay
          price={basePrice}
          originalPrice={originalPrice}
          size="md"
          hideBadge
        />
      </div>
    </article>
  );
});

ProductCard.displayName = "ProductCard";

export default ProductCard;
