"use client";

import Image from "next/image";
import Link from "next/link";
import { useRef, useState } from "react";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { toast } from "sonner";
import PriceDisplay from "@/components/PriceDisplay";
import { useCartStore } from "@/store/cartStore";

gsap.registerPlugin(useGSAP, ScrollTrigger);

function getMaxQuantity(value) {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? Math.floor(parsed) : 1;
}

export default function ProductDetails({ product }) {
  const addToCart = useCartStore((state) => state.addToCart);
  const [activeImage, setActiveImage] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [isShippingOpen, setIsShippingOpen] = useState(false);
  const [isReturnsOpen, setIsReturnsOpen] = useState(false);
  const shippingContentRef = useRef(null);
  const returnsContentRef = useRef(null);
  const imageGalleryRef = useRef(null);
  const productInfoRef = useRef(null);

  const images = Array.isArray(product?.images)
    ? product.images.filter((image) => typeof image === "string" && image)
    : [];
  const maxQuantity = getMaxQuantity(product?.maxQuantity);
  const categoryLabel = product?.categoryLabel ?? "";
  const categorySlug =
    typeof product?.category === "string" ? product.category : "";
  const displayedImage = images[activeImage] ?? images[0] ?? null;

  useGSAP(
    () => {
      if (!shippingContentRef.current) return;

      if (isShippingOpen) {
        gsap.fromTo(
          shippingContentRef.current,
          { height: 0, opacity: 0 },
          { height: "auto", opacity: 1, duration: 0.4, ease: "power2.out" },
        );
      } else {
        gsap.to(shippingContentRef.current, {
          height: 0,
          opacity: 0,
          duration: 0.3,
          ease: "power2.in",
        });
      }
    },
    { dependencies: [isShippingOpen] },
  );

  useGSAP(
    () => {
      if (!returnsContentRef.current) return;

      if (isReturnsOpen) {
        gsap.fromTo(
          returnsContentRef.current,
          { height: 0, opacity: 0 },
          { height: "auto", opacity: 1, duration: 0.4, ease: "power2.out" },
        );
      } else {
        gsap.to(returnsContentRef.current, {
          height: 0,
          opacity: 0,
          duration: 0.3,
          ease: "power2.in",
        });
      }
    },
    { dependencies: [isReturnsOpen] },
  );

  useGSAP(() => {
    const imageElements = imageGalleryRef.current?.children;
    const infoElements = productInfoRef.current?.children;
    const sharedEntryFrom = { opacity: 0, y: 20 };
    const sharedEntryTo = {
      opacity: 1,
      y: 0,
      duration: 0.6,
      stagger: 0.08,
      ease: "power2.out",
    };

    if (imageElements) {
      gsap.fromTo(Array.from(imageElements), sharedEntryFrom, {
        ...sharedEntryTo,
        scrollTrigger: {
          trigger: imageGalleryRef.current,
          start: "top 80%",
        },
      });
    }

    if (infoElements) {
      gsap.fromTo(Array.from(infoElements), sharedEntryFrom, {
        ...sharedEntryTo,
        scrollTrigger: {
          trigger: productInfoRef.current,
          start: "top 80%",
        },
      });
    }
  });

  const handleQuantityChange = (direction) => {
    const next = quantity + direction;

    if (next < 1) {
      return;
    }

    if (next > maxQuantity) {
      toast.error(`You can order up to ${maxQuantity} of this item per order.`);
      setQuantity(maxQuantity);
      return;
    }

    setQuantity(next);
  };

  const handleAddToCart = () => {
    if (!product?._id) {
      return;
    }

    addToCart({
      productId: product._id,
      slug: product.slug,
      sku: product.sku ?? "",
      name: product.name,
      image: images[0] ?? "",
      quantity,
      price: product.basePrice,
      originalPrice: product.originalPrice,
      maxQuantity,
    });

    toast.success("Added to cart.");
  };

  return (
    <div className="min-h-screen bg-bg px-4 pt-8 pb-8 md:px-10 lg:px-20">
      <div className="grid grid-cols-1 gap-10 md:grid-cols-2">
        <div ref={imageGalleryRef} className="flex flex-row gap-3">
          {images.length > 1 ? (
            <div className="w-18 shrink-0">
              <div className="flex flex-col gap-2">
                {images.map((image, index) => {
                  const isActive = index === activeImage;

                  return (
                    <button
                      key={`${image}-${index}`}
                      type="button"
                      onClick={() => setActiveImage(index)}
                      className={`relative aspect-3/4 w-full cursor-pointer overflow-hidden rounded-[10px] border ${
                        isActive ? "border-accent" : "border-card-border"
                      }`}
                    >
                      <Image
                        src={image}
                        alt={`${product?.name ?? "Product"} thumbnail ${
                          index + 1
                        }`}
                        fill
                        unoptimized
                        sizes="72px"
                        className="object-cover"
                      />
                    </button>
                  );
                })}
              </div>
            </div>
          ) : null}

          <div className="relative aspect-3/4 flex-1 overflow-hidden rounded-[20px]">
            {displayedImage ? (
              <Image
                src={displayedImage}
                alt={product?.name ?? "Product image"}
                fill
                unoptimized
                sizes="(max-width: 768px) 100vw, 50vw"
                className="object-cover"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center rounded-[20px] border border-card-border bg-card text-[10px] uppercase tracking-[3px] text-muted-text">
                No Image
              </div>
            )}
          </div>
        </div>

        <div ref={productInfoRef} className="flex flex-col gap-4">
          <div className="flex flex-wrap items-center gap-1 text-[10px] uppercase tracking-[2px] text-muted-text">
            <Link
              href="/"
              className="transition-colors hover:text-accent-strong"
            >
              Home
            </Link>
            <span>/</span>
            <Link
              href={categorySlug ? `/products/${categorySlug}` : "/products"}
              className="transition-colors hover:text-accent-strong"
            >
              {categoryLabel || "Products"}
            </Link>
            <span>/</span>
            <span className="text-text">{product?.name}</span>
          </div>

          <h1 className="font-heading text-[42px] leading-none text-text">
            {product?.name}
          </h1>

          <PriceDisplay
            price={product?.basePrice}
            originalPrice={product?.originalPrice}
            size="lg"
          />

          <div className="flex items-center gap-4">
            <p className="text-[10px] uppercase tracking-[3px] text-muted-text">
              Quantity
            </p>

            <button
              type="button"
              aria-label="Decrease quantity"
              disabled={quantity <= 1}
              onClick={() => handleQuantityChange(-1)}
              className={`flex h-9 w-9 items-center justify-center rounded-full border border-card-border bg-card transition-colors ${
                quantity <= 1
                  ? "cursor-not-allowed opacity-40"
                  : "cursor-pointer hover:border-accent"
              }`}
            >
              <span aria-hidden="true" className="text-text">
                −
              </span>
            </button>

            <span className="w-8 text-center text-[16px] font-semibold text-text">
              {quantity}
            </span>

            <button
              type="button"
              aria-label="Increase quantity"
              disabled={quantity >= maxQuantity}
              onClick={() => handleQuantityChange(1)}
              className={`flex h-9 w-9 items-center justify-center rounded-full border border-card-border bg-card transition-colors ${
                quantity >= maxQuantity
                  ? "cursor-not-allowed opacity-40"
                  : "cursor-pointer hover:border-accent"
              }`}
            >
              <span aria-hidden="true" className="text-text">
                +
              </span>
            </button>
          </div>

          <button
            type="button"
            onClick={handleAddToCart}
            className="w-full cursor-pointer rounded-pill bg-accent py-4 text-[13px] font-bold uppercase tracking-[3px] text-text transition-all duration-300 hover:-translate-y-1 hover:shadow-[var(--shadow-card-hover)] active:scale-95"
          >
            Add to Cart
          </button>

          {product?.description ? (
            <div>
              <p className="mb-2 text-[10px] uppercase tracking-[3px] text-muted-text">
                Product Description
              </p>
              <p className="text-[13px] leading-relaxed text-muted-text">
                {product.description}
              </p>
            </div>
          ) : null}

          {Array.isArray(product?.tags) && product.tags.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {product.tags.map((tag) => (
                <span
                  key={tag}
                  className="rounded-pill border border-card-border px-3 py-1 text-[10px] uppercase tracking-[2px] text-muted-text"
                >
                  {tag}
                </span>
              ))}
            </div>
          ) : null}

          <div>
            <div
              className={`card-surface transition-colors ${
                isShippingOpen ? "border-accent" : "hover:border-accent"
              }`}
            >
              <button
                type="button"
                onClick={() => setIsShippingOpen((isOpen) => !isOpen)}
                className="flex w-full cursor-pointer items-center justify-between px-4 py-4"
              >
                <span className="text-sm font-medium text-text">Shipping</span>
                <span className="text-lg text-text">
                  {isShippingOpen ? "−" : "+"}
                </span>
              </button>

              <div
                ref={shippingContentRef}
                style={{ height: 0, opacity: 0, overflow: "hidden" }}
              >
                <div className="px-4 pb-4 text-sm leading-relaxed text-muted-text">
                  Every piece is made with care and dispatched within 2–3
                  working days, with nationwide delivery across Pakistan.
                </div>
              </div>
            </div>

            <div
              className={`card-surface mt-3 transition-colors ${
                isReturnsOpen ? "border-accent" : "hover:border-accent"
              }`}
            >
              <button
                type="button"
                onClick={() => setIsReturnsOpen((isOpen) => !isOpen)}
                className="flex w-full cursor-pointer items-center justify-between px-4 py-4"
              >
                <span className="text-sm font-medium text-text">
                  Returns &amp; Exchange
                </span>
                <span className="text-lg text-text">
                  {isReturnsOpen ? "−" : "+"}
                </span>
              </button>

              <div
                ref={returnsContentRef}
                style={{ height: 0, opacity: 0, overflow: "hidden" }}
              >
                <div className="px-4 pb-4 text-sm leading-relaxed text-muted-text">
                  As each item is handmade to order, we accept returns only if
                  the product arrives damaged or incorrect.
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
