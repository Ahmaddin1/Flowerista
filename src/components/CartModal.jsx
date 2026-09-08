"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { Minus, Plus, X } from "lucide-react";
import { toast } from "sonner";
import PriceDisplay from "@/components/PriceDisplay";
import { useCartStore } from "@/store/cartStore";

gsap.registerPlugin(useGSAP);

function getImageSrc(image) {
  if (!image) {
    return "";
  }

  return typeof image === "string" ? image : image.url ?? "";
}

// Per-order cap (spec 6.3). Flowerista has no stock counting — the only
// quantity limit is the product's maxQuantity. Server-side re-validation at
// order creation is the authoritative guard; this is the client-side UX cap.
function getMaxQuantity(value) {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? Math.floor(parsed) : 1;
}

export default function CartModal() {
  const isCartModalOpen = useCartStore((state) => state.isCartModalOpen);
  const modalProduct = useCartStore((state) => state.modalProduct);
  const closeCartModal = useCartStore((state) => state.closeCartModal);
  const addToCart = useCartStore((state) => state.addToCart);

  const [quantity, setQuantity] = useState(1);
  const overlayRef = useRef(null);
  const modalRef = useRef(null);
  const isClosingRef = useRef(false);

  const maxQuantity = getMaxQuantity(modalProduct?.maxQuantity);
  const safeQuantity = Math.min(
    maxQuantity,
    Math.max(1, Math.floor(Number(quantity) || 1)),
  );
  const isAtMax = safeQuantity >= maxQuantity;
  const quantityAdjustedBasePrice =
    Number(modalProduct?.basePrice ?? 0) * safeQuantity;
  const quantityAdjustedOriginalPrice = Number.isFinite(
    Number(modalProduct?.originalPrice),
  )
    ? Number(modalProduct.originalPrice) * safeQuantity
    : null;

  useEffect(() => {
    setQuantity(1);
  }, [modalProduct]);

  useGSAP(
    () => {
      if (!isCartModalOpen || !overlayRef.current || !modalRef.current) {
        return;
      }

      isClosingRef.current = false;

      // Dispatch event to stop Lenis scrolling
      window.dispatchEvent(
        new CustomEvent("cartModalChange", { detail: { isOpen: true } }),
      );

      gsap.killTweensOf([overlayRef.current, modalRef.current]);
      gsap.set(overlayRef.current, { opacity: 0 });
      gsap.set(modalRef.current, { y: "100%", opacity: 0 });

      const openTimeline = gsap.timeline();

      openTimeline
        .to(overlayRef.current, { opacity: 1, duration: 0.3 }, 0)
        .to(
          modalRef.current,
          { y: "0%", opacity: 1, duration: 0.45, ease: "power3.out" },
          0,
        );

      return () => {
        openTimeline.kill();
      };
    },
    { dependencies: [isCartModalOpen, modalProduct] },
  );

  const handleQuantityChange = (direction) => {
    setQuantity((current) => {
      const next = Math.max(1, Math.floor(Number(current) || 1) + direction);
      return Math.min(next, maxQuantity);
    });
  };

  const handleClose = () => {
    if (isClosingRef.current || !overlayRef.current || !modalRef.current) {
      return;
    }

    isClosingRef.current = true;

    gsap.killTweensOf([overlayRef.current, modalRef.current]);

    const closeTimeline = gsap.timeline({
      onComplete: () => {
        isClosingRef.current = false;
        closeCartModal();
        // Dispatch event to restart Lenis scrolling
        window.dispatchEvent(
          new CustomEvent("cartModalChange", { detail: { isOpen: false } }),
        );
      },
    });

    closeTimeline
      .to(
        modalRef.current,
        { y: "100%", opacity: 0, duration: 0.35, ease: "power3.in" },
        0,
      )
      .to(overlayRef.current, { opacity: 0, duration: 0.3 }, 0);
  };

  const handleAddToCart = () => {
    if (!modalProduct) {
      return;
    }

    addToCart({
      productId: modalProduct._id,
      slug: modalProduct.slug,
      sku: modalProduct.sku ?? "",
      name: modalProduct.name,
      image: modalProduct.images?.[0],
      quantity: safeQuantity,
      price: modalProduct.basePrice,
      originalPrice: modalProduct.originalPrice,
      maxQuantity,
    });

    toast.success("Item added to cart");
    handleClose();
  };

  if (!isCartModalOpen || !modalProduct) {
    return null;
  }

  return (
    <div
      ref={overlayRef}
      onClick={handleClose}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60"
      style={{ opacity: 0 }}
    >
      <div
        ref={modalRef}
        onClick={(event) => event.stopPropagation()}
        data-lenis-prevent
        className="modal-scroll z-50 max-h-[90vh] w-[90vw] max-w-[420px] overflow-y-auto rounded-[var(--radius-card)] border border-card-border bg-card p-5 shadow-[var(--shadow-card-hover)]"
        style={{ opacity: 0 }}
      >
        <div className="mb-4 flex items-center justify-between gap-4">
          <h2 className="font-heading text-[24px] leading-tight text-text">
            {modalProduct.name}
          </h2>

          <button
            type="button"
            aria-label="Close cart modal"
            onClick={handleClose}
            className="flex h-8 w-8 shrink-0 cursor-pointer items-center justify-center rounded-full text-muted-text transition-colors hover:bg-bg hover:text-text"
          >
            <X size={16} strokeWidth={1.8} aria-hidden="true" />
          </button>
        </div>

        <div className="relative mb-4 aspect-[3/4] w-full overflow-hidden rounded-[var(--radius-card)]">
          {getImageSrc(modalProduct.images?.[0]) ? (
            <Image
              src={getImageSrc(modalProduct.images?.[0])}
              alt={modalProduct.name ?? "Product image"}
              fill
              unoptimized
              sizes="(max-width: 768px) 90vw, 420px"
              className="object-cover"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-bg text-[10px] uppercase tracking-[3px] text-muted-text">
              No Image
            </div>
          )}
        </div>

        <div className="mb-5">
          <PriceDisplay
            price={quantityAdjustedBasePrice}
            originalPrice={quantityAdjustedOriginalPrice}
            size="md"
          />
        </div>

        <div className="mb-5 flex items-center gap-3">
          <p className="text-[9px] uppercase tracking-[3px] text-muted-text">
            Quantity
          </p>

          <button
            type="button"
            aria-label="Decrease quantity"
            disabled={safeQuantity <= 1}
            onClick={() => handleQuantityChange(-1)}
            className={`flex h-8 w-8 items-center justify-center rounded-full border border-card-border bg-bg text-text transition-colors ${
              safeQuantity <= 1
                ? "cursor-not-allowed opacity-40"
                : "cursor-pointer hover:border-accent hover:text-accent"
            }`}
          >
            <Minus size={14} strokeWidth={1.8} aria-hidden="true" />
          </button>

          <span className="w-6 text-center text-[15px] font-semibold text-text">
            {safeQuantity}
          </span>

          <button
            type="button"
            aria-label="Increase quantity"
            disabled={isAtMax}
            onClick={() => handleQuantityChange(1)}
            className={`flex h-8 w-8 items-center justify-center rounded-full border border-card-border bg-bg text-text transition-colors ${
              isAtMax
                ? "cursor-not-allowed opacity-40"
                : "cursor-pointer hover:border-accent hover:text-accent"
            }`}
          >
            <Plus size={14} strokeWidth={1.8} aria-hidden="true" />
          </button>
        </div>

        {isAtMax ? (
          <p className="mb-4 text-[11px] text-muted-text">
            Maximum of {maxQuantity} per order reached.
          </p>
        ) : null}

        <button
          type="button"
          onClick={handleAddToCart}
          className="w-full cursor-pointer rounded-full bg-accent py-3 text-[12px] font-bold uppercase tracking-[2px] text-text-on-accent transition-colors hover:bg-accent-strong"
        >
          Add to Cart
        </button>
      </div>
    </div>
  );
}
