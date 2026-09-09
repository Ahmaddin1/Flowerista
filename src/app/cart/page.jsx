"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState, useRef } from "react";
import { LoaderCircle, Minus, Plus, ShoppingCart } from "lucide-react";
import { CartBackButton } from "@/components/BackButton";
import { toast } from "sonner";
import { gsap } from "gsap";

const CART_STORAGE_KEY = "cart";

function getImageSrc(image) {
  if (!image) {
    return "";
  }

  return typeof image === "string" ? image : (image.url ?? "");
}

function formatPrice(value) {
  return Number(value ?? 0).toLocaleString();
}

function readStoredCart() {
  try {
    const currentCart = localStorage.getItem(CART_STORAGE_KEY);

    if (!currentCart) {
      return [];
    }

    const parsedCart = JSON.parse(currentCart);
    return Array.isArray(parsedCart) ? parsedCart : [];
  } catch {
    return [];
  }
}

function NoteAccordion({
  label,
  value,
  onChange,
  isOpen,
  onToggle,
  wrapperRef,
  contentRef,
}) {
  return (
    <div
      className={`rounded-[var(--radius-card)] border bg-card shadow-[var(--shadow-card)] transition-colors hover:border-accent ${
        isOpen ? "border-accent" : "border-card-border"
      }`}
    >
      <button
        type="button"
        onClick={onToggle}
        className="flex w-full items-center justify-between px-4 py-4 text-left"
      >
        <span className="text-sm text-text">{label}</span>
        <span className="text-lg leading-none text-text">
          {isOpen ? "−" : "+"}
        </span>
      </button>

      <div
        ref={wrapperRef}
        style={{
          height: 0,
          opacity: 0,
          overflow: "hidden",
          pointerEvents: "none",
        }}
      >
        <div ref={contentRef}>
          <textarea
            rows={3}
            value={value}
            onChange={(event) => onChange(event.target.value)}
            className="mx-4 mb-4 w-[calc(100%-2rem)] resize-none rounded-lg border border-card-border bg-bg p-3 text-sm text-text outline-none placeholder:text-muted-text focus:border-accent"
            placeholder="Type your note here..."
          />
        </div>
      </div>
    </div>
  );
}

function CartItemRow({ item, onQuantityChange, onRemove }) {
  const imageSrc = getImageSrc(item.image);
  const hasCap = Number.isFinite(Number(item.maxQuantity)) && Number(item.maxQuantity) > 0;
  const disableMinus = item.quantity <= 1;
  const disablePlus = hasCap && item.quantity >= Number(item.maxQuantity);

  return (
    <div className="rounded-[var(--radius-card)] border border-card-border bg-card p-6 shadow-[var(--shadow-card)] transition-colors hover:border-accent">
      <div className="flex items-start gap-4">
        <div
          className="relative h-32 w-24 shrink-0 overflow-hidden rounded-lg bg-bg"
          style={{ aspectRatio: "3 / 4" }}
        >
          {imageSrc ? (
            <Image
              src={imageSrc}
              alt={item.productName ?? item.name ?? "Cart product"}
              fill
              unoptimized
              sizes="96px"
              className="object-cover"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-[10px] uppercase tracking-[2px] text-muted-text">
              No Image
            </div>
          )}
        </div>

        <div className="flex min-w-0 flex-1 flex-col gap-2 md:flex-row md:items-start md:justify-between md:gap-4">
          <div className="min-w-0 flex-1">
            <h2 className="text-sm font-semibold leading-tight text-text">
              {item.productName ?? item.name}
            </h2>
          </div>

          <div className="hidden w-28 shrink-0 text-right md:block">
            <p className="text-sm font-medium text-text">
              Rs.{formatPrice(item.price)}
            </p>
            {item.originalPrice ? (
              <p className="text-xs text-muted-text line-through">
                Rs.{formatPrice(item.originalPrice)}
              </p>
            ) : null}
          </div>

          <div className="flex shrink-0 flex-col items-start gap-1 md:items-end">
            <div className="md:hidden">
              <p className="text-sm font-medium text-text">
                Rs.{formatPrice(item.price)}
              </p>
              {item.originalPrice ? (
                <p className="text-xs text-muted-text line-through">
                  Rs.{formatPrice(item.originalPrice)}
                </p>
              ) : null}
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                aria-label={`Decrease quantity for ${item.productName ?? item.name}`}
                onClick={() => onQuantityChange(item, -1)}
                disabled={disableMinus}
                className={`flex h-9 w-9 items-center justify-center rounded-full border border-card-border bg-bg text-text transition-colors ${
                  disableMinus
                    ? "cursor-not-allowed opacity-40"
                    : "cursor-pointer hover:border-accent hover:text-accent"
                }`}
              >
                <Minus size={16} strokeWidth={1.8} aria-hidden="true" />
              </button>

              <span className="w-8 text-center text-[16px] font-semibold text-text">
                {item.quantity}
              </span>

              <button
                type="button"
                aria-label={`Increase quantity for ${item.productName ?? item.name}`}
                onClick={() => onQuantityChange(item, 1)}
                disabled={disablePlus}
                className={`flex h-9 w-9 items-center justify-center rounded-full border border-card-border bg-bg text-text transition-colors ${
                  disablePlus
                    ? "cursor-not-allowed opacity-40"
                    : "cursor-pointer hover:border-accent hover:text-accent"
                }`}
              >
                <Plus size={16} strokeWidth={1.8} aria-hidden="true" />
              </button>
            </div>

            <button
              type="button"
              onClick={() => onRemove(item.cartItemId)}
              className="cursor-pointer bg-transparent text-xs uppercase tracking-widest text-muted-text underline transition-colors hover:text-accent"
            >
              Remove
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function CartPage() {
  const router = useRouter();
  const orderNoteWrapperRef = useRef(null);
  const orderNoteContentRef = useRef(null);
  const giftNoteWrapperRef = useRef(null);
  const giftNoteContentRef = useRef(null);
  const orderNoteWrapperRefMobile = useRef(null);
  const orderNoteContentRefMobile = useRef(null);
  const giftNoteWrapperRefMobile = useRef(null);
  const giftNoteContentRefMobile = useRef(null);
  const headingH1Ref = useRef(null);
  const headingCountRef = useRef(null);
  const headingLinkRef = useRef(null);
  const cartItemRefs = useRef([]);
  const rightSubtotalRef = useRef(null);
  const rightNotesRef = useRef(null);
  const desktopCheckoutBtnRef = useRef(null);
  const mobileCheckoutBtnRef = useRef(null);
  const emptyStateRef = useRef(null);
  const emptyCartIconRef = useRef(null);
  const mobileNotesRefs = useRef([]);
  const desktopShippingTextRef = useRef(null);
  const mobileShippingTextRef = useRef(null);
  const [cartItems, setCartItems] = useState([]);
  const [isMounted, setIsMounted] = useState(false);
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const [orderNote, setOrderNote] = useState("");
  const [giftNote, setGiftNote] = useState("");
  const [isOrderNoteOpen, setIsOrderNoteOpen] = useState(false);
  const [isGiftNoteOpen, setIsGiftNoteOpen] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    setCartItems(readStoredCart());
  }, []);

  useEffect(() => {
    const wrapper = orderNoteWrapperRef.current;
    const content = orderNoteContentRef.current;

    if (!wrapper || !content) {
      return;
    }

    gsap.killTweensOf(wrapper);

    if (isOrderNoteOpen) {
      const nextHeight = content.getBoundingClientRect().height;

      gsap.to(wrapper, {
        height: nextHeight,
        opacity: 1,
        duration: 0.525,
        ease: "power2.out",
        onStart: () => {
          wrapper.style.pointerEvents = "auto";
        },
        onComplete: () => {
          wrapper.style.height = "auto";
        },
      });

      return;
    }

    const currentHeight =
      wrapper.getBoundingClientRect().height ||
      content.getBoundingClientRect().height;

    gsap.set(wrapper, { height: currentHeight });
    gsap.to(wrapper, {
      height: 0,
      opacity: 0,
      duration: 0.42,
      ease: "power2.out",
      onComplete: () => {
        wrapper.style.pointerEvents = "none";
      },
    });
  }, [isOrderNoteOpen]);

  useEffect(() => {
    const wrapper = giftNoteWrapperRef.current;
    const content = giftNoteContentRef.current;

    if (!wrapper || !content) {
      return;
    }

    gsap.killTweensOf(wrapper);

    if (isGiftNoteOpen) {
      const nextHeight = content.getBoundingClientRect().height;

      gsap.to(wrapper, {
        height: nextHeight,
        opacity: 1,
        duration: 0.525,
        ease: "power2.out",
        onStart: () => {
          wrapper.style.pointerEvents = "auto";
        },
        onComplete: () => {
          wrapper.style.height = "auto";
        },
      });

      return;
    }

    const currentHeight =
      wrapper.getBoundingClientRect().height ||
      content.getBoundingClientRect().height;

    gsap.set(wrapper, { height: currentHeight });
    gsap.to(wrapper, {
      height: 0,
      opacity: 0,
      duration: 0.42,
      ease: "power2.out",
      onComplete: () => {
        wrapper.style.pointerEvents = "none";
      },
    });
  }, [isGiftNoteOpen]);

  useEffect(() => {
    const wrapper = orderNoteWrapperRefMobile.current;
    const content = orderNoteContentRefMobile.current;

    if (!wrapper || !content) {
      return;
    }

    gsap.killTweensOf(wrapper);

    if (isOrderNoteOpen) {
      const nextHeight = content.getBoundingClientRect().height;

      gsap.to(wrapper, {
        height: nextHeight,
        opacity: 1,
        duration: 0.525,
        ease: "power2.out",
        onStart: () => {
          wrapper.style.pointerEvents = "auto";
        },
        onComplete: () => {
          wrapper.style.height = "auto";
        },
      });

      return;
    }

    const currentHeight =
      wrapper.getBoundingClientRect().height ||
      content.getBoundingClientRect().height;

    gsap.set(wrapper, { height: currentHeight });
    gsap.to(wrapper, {
      height: 0,
      opacity: 0,
      duration: 0.42,
      ease: "power2.out",
      onComplete: () => {
        wrapper.style.pointerEvents = "none";
      },
    });
  }, [isOrderNoteOpen]);

  useEffect(() => {
    const wrapper = giftNoteWrapperRefMobile.current;
    const content = giftNoteContentRefMobile.current;

    if (!wrapper || !content) {
      return;
    }

    gsap.killTweensOf(wrapper);

    if (isGiftNoteOpen) {
      const nextHeight = content.getBoundingClientRect().height;

      gsap.to(wrapper, {
        height: nextHeight,
        opacity: 1,
        duration: 0.525,
        ease: "power2.out",
        onStart: () => {
          wrapper.style.pointerEvents = "auto";
        },
        onComplete: () => {
          wrapper.style.height = "auto";
        },
      });

      return;
    }

    const currentHeight =
      wrapper.getBoundingClientRect().height ||
      content.getBoundingClientRect().height;

    gsap.set(wrapper, { height: currentHeight });
    gsap.to(wrapper, {
      height: 0,
      opacity: 0,
      duration: 0.42,
      ease: "power2.out",
      onComplete: () => {
        wrapper.style.pointerEvents = "none";
      },
    });
  }, [isGiftNoteOpen]);

  useEffect(() => {
    if (!isMounted) return;

    cartItemRefs.current = cartItemRefs.current.slice(0, cartItems.length);
    mobileNotesRefs.current = mobileNotesRefs.current.slice(0, 2);

    if (cartItems.length === 0) {
      if (emptyStateRef.current) {
        const children = Array.from(emptyStateRef.current.children);
        gsap.fromTo(
          children,
          { autoAlpha: 0, y: 30 },
          { autoAlpha: 1, y: 0, duration: 0.75, stagger: 0.225, ease: "power2.out" },
        );
      }
      return;
    }

    const tl = gsap.timeline({ defaults: { ease: "power2.out" } });

    // Phase 1: Heading — y:30 → 0, staggered
    const headingEls = [
      headingH1Ref.current,
      headingCountRef.current,
      headingLinkRef.current,
    ].filter(Boolean);

    tl.fromTo(
      headingEls,
      { y: 30, autoAlpha: 0 },
      { y: 0, autoAlpha: 1, duration: 0.825, stagger: 0.15 },
    );

    // Phase 2: Left items (from left) + Right column (from right) — simultaneous
    const validItemRefs = cartItemRefs.current.filter(Boolean);

    tl.fromTo(
      validItemRefs,
      { x: () => -window.innerWidth, autoAlpha: 0 },
      { x: 0, autoAlpha: 1, duration: 0.9, stagger: 0.18 },
      "+=0.075",
    );

    const rightEls = [rightSubtotalRef.current, rightNotesRef.current].filter(
      Boolean,
    );
    tl.fromTo(
      rightEls,
      { x: () => window.innerWidth, autoAlpha: 0 },
      { x: 0, autoAlpha: 1, duration: 0.9, stagger: 0.18 },
      "<", // "<" means: start at the same time as left items above
    );

    // Phase 2.5: Mobile notes (from left, staggered)
    const validMobileNotes = mobileNotesRefs.current.filter(Boolean);
    if (validMobileNotes.length > 0) {
      tl.fromTo(
        validMobileNotes,
        { x: () => -window.innerWidth, autoAlpha: 0 },
        { x: 0, autoAlpha: 1, duration: 0.75, stagger: 0.15 },
        "<", // start at same time as right column
      );
    }

    // Phase 3: Checkout buttons — opacity only, no translate
    const checkoutBtns = [
      desktopCheckoutBtnRef.current,
      mobileCheckoutBtnRef.current,
    ].filter(Boolean);

    tl.fromTo(
      checkoutBtns,
      { autoAlpha: 0 },
      { autoAlpha: 1, duration: 0.6 },
      "-=0.3",
    );

    // Phase 4: Shipping text — y:10 → 0
    const shippingTexts = [
      desktopShippingTextRef.current,
      mobileShippingTextRef.current,
    ].filter(Boolean);

    tl.fromTo(
      shippingTexts,
      { y: 10, autoAlpha: 0 },
      { y: 0, autoAlpha: 1, duration: 0.45 },
      "-=0.15",
    );
  }, [isMounted]);

  const syncCart = (updatedItems) => {
    setCartItems(updatedItems);
    localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(updatedItems));
    window.dispatchEvent(new Event("cartUpdated"));
  };

  const subtotal = cartItems.reduce(
    (sum, item) => sum + Number(item.price ?? 0) * Number(item.quantity ?? 0),
    0,
  );
  const totalQuantity = cartItems.reduce(
    (sum, item) => sum + Number(item.quantity ?? 0),
    0,
  );

  const handleRemove = (cartItemId) => {
    const itemIndex = cartItems.findIndex(
      (item) => item.cartItemId === cartItemId,
    );
    if (itemIndex === -1) return;

    const itemElement = cartItemRefs.current[itemIndex];
    if (!itemElement) {
      syncCart(cartItems.filter((item) => item.cartItemId !== cartItemId));
      return;
    }

    // Get positions of all items below the removed item
    const itemsBelow = cartItemRefs.current
      .slice(itemIndex + 1)
      .filter(Boolean);
    const beforePositions = itemsBelow.map(
      (el) => el.getBoundingClientRect().top,
    );

    gsap.to(itemElement, {
      x: -window.innerWidth,
      autoAlpha: 0,
      duration: 1,
      ease: "power2.out",
      onComplete: () => {
        syncCart(cartItems.filter((item) => item.cartItemId !== cartItemId));

        // Animate items moving up after removal
        requestAnimationFrame(() => {
          const afterPositions = itemsBelow.map(
            (el) => el.getBoundingClientRect().top,
          );

          itemsBelow.forEach((el, i) => {
            const delta = beforePositions[i] - afterPositions[i];
            if (delta !== 0) {
              gsap.fromTo(
                el,
                { y: delta },
                { y: 0, duration: 0.6, ease: "power2.out" },
              );
            }
          });
        });
      },
    });
  };

  // Flowerista has no stock counting — the only per-line limit is the product's
  // maxQuantity (spec 6.3). Clamp locally; server-side re-validation at order
  // creation is the authoritative guard. No network call here.
  const handleQuantityChange = (item, direction) => {
    const currentQuantity = Number(item.quantity ?? 0);
    const requestedQuantity = currentQuantity + direction;

    if (requestedQuantity < 1) {
      return;
    }

    const maxQuantity = Number(item.maxQuantity);
    const hasCap = Number.isFinite(maxQuantity) && maxQuantity > 0;

    if (hasCap && requestedQuantity > maxQuantity) {
      toast.error(`Maximum of ${maxQuantity} per order reached.`);
      return;
    }

    const updatedItems = cartItems.map((cartItem) =>
      cartItem.cartItemId === item.cartItemId
        ? { ...cartItem, quantity: requestedQuantity }
        : cartItem,
    );

    syncCart(updatedItems);
  };

  const handleCheckout = async () => {
    if (cartItems.length === 0) {
      toast.error("Could not checkout. Your cart is empty.");
      return;
    }

    setIsCheckingOut(true);
    let shouldResetCheckout = true;

    try {
      const response = await fetch("/api/cart/validate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ items: cartItems }),
      });

      if (!response.ok) {
        throw new Error("Cart validation failed");
      }

      const data = await response.json();

      if (!data?.valid) {
        toast.error(
          "Some items in your cart are no longer available or have changed. Please review your cart.",
        );

        if (Array.isArray(data?.items)) {
          syncCart(data.items);
        }

        return;
      }

      try {
        if (typeof gtag !== "undefined") {
          gtag("event", "begin_checkout", {
            currency: "PKR",
            value: subtotal,
            items: cartItems.map((item) => ({
              item_id: item.productId,
              item_name: item.productName ?? item.name,
              price: item.price,
              quantity: item.quantity,
            })),
          });
        }

        if (typeof fbq !== "undefined") {
          fbq("track", "InitiateCheckout", {
            value: subtotal,
            currency: "PKR",
            num_items: totalQuantity,
          });
        }
      } catch {}

      try {
        sessionStorage.setItem(
          "checkoutNotes",
          JSON.stringify({
            orderNote,
            giftNote,
          }),
        );
      } catch {}

      shouldResetCheckout = false;
      router.push("/checkout");
    } catch {
      toast.error("Something went wrong. Please try again.");
    } finally {
      if (shouldResetCheckout) {
        setIsCheckingOut(false);
      }
    }
  };

  if (!isMounted) {
    return <div className="min-h-screen bg-bg" />;
  }

  if (cartItems.length === 0) {
    return (
      <div className="min-h-screen bg-bg overflow-y-auto overflow-x-hidden">
        <CartBackButton />
        <div className="mx-auto flex min-h-screen max-w-7xl items-center justify-center px-4 pt-8 pb-28 text-center sm:px-6 lg:px-8 lg:pb-0">
          <div ref={emptyStateRef} className="flex flex-col items-center gap-4">
            <ShoppingCart ref={emptyCartIconRef} size={48} className="text-muted-text" />
            <h1 className="font-heading text-2xl text-text">
              Your cart is empty
            </h1>
            <Link
              href="/products"
              className="inline-flex items-center justify-center rounded-full bg-accent px-6 py-3 text-sm font-bold uppercase tracking-widest text-text-on-accent transition-all duration-300 hover:translate-y-[-10px] hover:shadow-[var(--shadow-card-hover)] active:scale-90"
            >
              Start Shopping
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-bg overflow-y-auto overflow-x-hidden">
      <CartBackButton />
      <div className="mx-auto max-w-7xl px-4 pt-24 pb-28 sm:px-6 lg:px-8 lg:pb-0">
        <div className="flex items-baseline justify-between pb-4">
          <div className="flex items-baseline gap-2">
            <div className="overflow-hidden">
              <h1
                ref={headingH1Ref}
                className="font-heading text-5xl text-text"
              >
                Cart
              </h1>
            </div>
            <div className="overflow-hidden">
              <span ref={headingCountRef} className="text-xl text-muted-text">
                ({totalQuantity} items)
              </span>
            </div>
          </div>
          <div className="overflow-hidden">
            <Link
              ref={headingLinkRef}
              href="/products"
              className="inline-flex items-center text-center justify-center rounded-full bg-accent px-6 py-3 text-sm font-bold uppercase tracking-widest text-text-on-accent transition-all duration-300 hover:translate-y-[-10px] hover:shadow-[var(--shadow-card-hover)] active:scale-90"
            >
              All Products
            </Link>
          </div>
        </div>

        <div className="border-b border-hairline" />

        <div className="pt-6 lg:grid lg:grid-cols-[1fr_380px] lg:gap-12">
          <div>
            <div className="space-y-3">
              {cartItems.map((item, index) => (
                <div
                  key={item.cartItemId}
                  ref={(el) => {
                    cartItemRefs.current[index] = el;
                  }}
                >
                  <CartItemRow
                    item={item}
                    onQuantityChange={handleQuantityChange}
                    onRemove={handleRemove}
                  />
                </div>
              ))}
            </div>

            <div className="mt-4 space-y-3 lg:hidden">
              <div
                ref={(el) => {
                  mobileNotesRefs.current[0] = el;
                }}
              >
                <NoteAccordion
                  label="Add order notes"
                  value={orderNote}
                  onChange={setOrderNote}
                  isOpen={isOrderNoteOpen}
                  onToggle={() => setIsOrderNoteOpen((current) => !current)}
                  wrapperRef={orderNoteWrapperRefMobile}
                  contentRef={orderNoteContentRefMobile}
                />
              </div>
              <div
                ref={(el) => {
                  mobileNotesRefs.current[1] = el;
                }}
              >
                <NoteAccordion
                  label="Is this a gift? Add a note."
                  value={giftNote}
                  onChange={setGiftNote}
                  isOpen={isGiftNoteOpen}
                  onToggle={() => setIsGiftNoteOpen((current) => !current)}
                  wrapperRef={giftNoteWrapperRefMobile}
                  contentRef={giftNoteContentRefMobile}
                />
              </div>
            </div>
          </div>

          <aside className="hidden lg:block">
            <div
              ref={rightSubtotalRef}
              className="mb-4 rounded-[var(--radius-card)] border border-card-border bg-card px-4 py-4 shadow-[var(--shadow-card)] transition-colors hover:border-accent"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs uppercase tracking-widest text-muted-text">
                  Subtotal
                </span>
                <span className="text-lg font-bold text-text">
                  RS.{formatPrice(subtotal)} PKR
                </span>
              </div>
            </div>

            <div ref={rightNotesRef} className="space-y-3">
              <NoteAccordion
                label="Add order notes"
                value={orderNote}
                onChange={setOrderNote}
                isOpen={isOrderNoteOpen}
                onToggle={() => setIsOrderNoteOpen((current) => !current)}
                wrapperRef={orderNoteWrapperRef}
                contentRef={orderNoteContentRef}
              />

              <NoteAccordion
                label="Is this a gift? Add a note."
                value={giftNote}
                onChange={setGiftNote}
                isOpen={isGiftNoteOpen}
                onToggle={() => setIsGiftNoteOpen((current) => !current)}
                wrapperRef={giftNoteWrapperRef}
                contentRef={giftNoteContentRef}
              />
            </div>

            <button
              ref={desktopCheckoutBtnRef}
              type="button"
              onClick={handleCheckout}
              disabled={isCheckingOut}
              className={`mt-4 flex w-full items-center justify-center gap-2 rounded-full py-4 text-sm font-bold uppercase tracking-widest text-text-on-accent transition-all duration-300 active:scale-90 ${
                isCheckingOut
                  ? "cursor-not-allowed bg-accent opacity-60"
                  : "bg-accent hover:translate-y-[-10px] hover:shadow-[var(--shadow-card-hover)]"
              }`}
            >
              {isCheckingOut ? (
                <>
                  <LoaderCircle className="h-4 w-4 animate-spin" />
                  <span>Processing</span>
                </>
              ) : (
                <span>CHECKOUT &bull; RS. {formatPrice(subtotal)}</span>
              )}
            </button>

            <div className="overflow-hidden">
              <p
                ref={desktopShippingTextRef}
                className="mt-2 text-center text-xs text-muted-text"
              >
                Shipping & taxes calculated at checkout
              </p>
            </div>
          </aside>
        </div>
      </div>

      <div className="fixed right-0 bottom-0 left-0 z-[60] border-t border-card-border bg-bg px-4 pt-4 pb-[calc(1rem+env(safe-area-inset-bottom))] lg:hidden">
        <button
          ref={mobileCheckoutBtnRef}
          type="button"
          onClick={handleCheckout}
          disabled={isCheckingOut}
          className={`flex w-full items-center justify-center gap-2 rounded-full py-4 font-bold uppercase tracking-widest text-text-on-accent transition-all duration-300 active:scale-90 ${
            isCheckingOut
              ? "cursor-not-allowed bg-accent opacity-60"
              : "bg-accent hover:translate-y-[-10px] hover:shadow-[var(--shadow-card-hover)]"
          }`}
        >
          {isCheckingOut ? (
            <>
              <LoaderCircle className="h-4 w-4 animate-spin" />
              <span>Processing</span>
            </>
          ) : (
            <span>CHECKOUT &bull; RS. {formatPrice(subtotal)}</span>
          )}
        </button>
        <div className="overflow-hidden">
          <p
            ref={mobileShippingTextRef}
            className="mt-2 text-center text-xs text-muted-text"
          >
            Shipping & taxes calculated at checkout
          </p>
        </div>
      </div>
    </div>
  );
}
