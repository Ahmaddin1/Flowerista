"use client";

import Image from "next/image";
import { useCartStore } from "@/store/cartStore";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import {
  ChevronDown,
  ChevronRight,
  Info,
  LoaderCircle,
  Minus,
  Plus,
} from "lucide-react";
import { CheckoutBackButton } from "@/components/BackButton";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { MAX_TIP, MIN_TIP, SHIPPING_COST } from "@/lib/constants";

// export const metadata = {
//   title: "Checkout",
//   description: "Complete your Flowerista order securely.",
//   robots: {
//     index: false,
//     follow: false,
//   },
// };

const CART_STORAGE_KEY = "cart";

const COUNTRIES = ["Pakistan"];
const PROVINCES = [
  "Punjab",
  "Sindh",
  "KPK",
  "Balochistan",
  "AJK",
  "Gilgit Baltistan",
];

const BASE_INPUT_CLASS =
  "w-full rounded-lg border bg-bg px-4 py-3 text-[14px] text-text outline-none transition-colors placeholder:text-muted-text focus:border-accent scroll-mt-24";
const LABEL_CLASS =
  "mb-1 block text-[10px] uppercase tracking-[2px] text-muted-text";
const SECTION_TITLE_CLASS =
  "mb-4 font-heading text-[20px] leading-tight text-text";

function joinClasses(...classes) {
  return classes.filter(Boolean).join(" ");
}

function formatPrice(value) {
  return Number(value ?? 0).toLocaleString("en-PK");
}

function clampTipAmount(value) {
  const numericValue = Number.parseInt(value ?? 0, 10);

  if (Number.isNaN(numericValue)) {
    return MIN_TIP;
  }

  return Math.max(MIN_TIP, Math.min(numericValue, MAX_TIP));
}

function getImageSrc(image) {
  if (!image) {
    return "";
  }

  return typeof image === "string" ? image : (image.url ?? "");
}

function writeStoredCart(cartItems) {
  try {
    localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cartItems));
  } catch {}
}

function emitCartUpdated() {
  if (typeof window === "undefined") {
    return;
  }

  window.dispatchEvent(new Event("cartUpdated"));
}

function InputField({
  label,
  name,
  value,
  onChange,
  type = "text",
  placeholder = "",
  error = false,
  helperText,
  fieldRef,
  autoComplete,
  min,
  max,
  step,
}) {
  return (
    <div>
      <label htmlFor={name} className={LABEL_CLASS}>
        {label}
      </label>
      <input
        ref={fieldRef}
        id={name}
        name={name}
        type={type}
        value={value}
        min={min}
        max={max}
        step={step}
        autoComplete={autoComplete}
        placeholder={placeholder}
        aria-invalid={error}
        onChange={(event) => onChange(name, event.target.value)}
        className={joinClasses(
          BASE_INPUT_CLASS,
          error ? "border-red-500" : "border-card-border",
        )}
      />
      {helperText ? (
        <p className="mt-2 text-xs leading-5 text-muted-text">{helperText}</p>
      ) : null}
    </div>
  );
}

function SelectField({
  label,
  name,
  value,
  onChange,
  options,
  error = false,
  fieldRef,
}) {
  return (
    <div>
      <label htmlFor={name} className={LABEL_CLASS}>
        {label}
      </label>
      <select
        ref={fieldRef}
        id={name}
        name={name}
        value={value}
        aria-invalid={error}
        onChange={(event) => onChange(name, event.target.value)}
        className={joinClasses(
          BASE_INPUT_CLASS,
          error ? "border-red-500" : "border-card-border",
        )}
      >
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    </div>
  );
}

function OptionCard({
  label,
  description,
  selected,
  onClick,
  rightSlot,
  error = false,
  nonInteractive = false,
  showIndicator = true,
  cardRef,
  children,
}) {
  const classes = joinClasses(
    "w-full rounded-[var(--radius-card)] border px-4 py-4 text-left transition-colors",
    selected
      ? "border-accent bg-accent/10"
      : error
        ? "border-red-500 bg-bg"
        : "border-card-border bg-bg",
    !nonInteractive && !selected ? "hover:border-accent" : "",
  );

  const content = (
    <div className="space-y-3">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          {showIndicator ? (
            <span
              className={joinClasses(
                "mt-1 flex h-4 w-4 shrink-0 items-center justify-center rounded-full border transition-colors",
                selected
                  ? "border-accent bg-accent"
                  : error
                    ? "border-red-500"
                    : "border-muted-text",
              )}
            >
              {selected ? (
                <span className="h-1.5 w-1.5 rounded-full bg-text-on-accent" />
              ) : null}
            </span>
          ) : null}

          <div>
            <p className="text-sm font-medium text-text">{label}</p>
            {description ? (
              <p className="mt-1 text-xs leading-5 text-muted-text">
                {description}
              </p>
            ) : null}
          </div>
        </div>

        {rightSlot ? <div className="shrink-0">{rightSlot}</div> : null}
      </div>

      {children}
    </div>
  );

  if (nonInteractive) {
    return (
      <div ref={cardRef} className={classes}>
        {content}
      </div>
    );
  }

  return (
    <button ref={cardRef} type="button" onClick={onClick} className={classes}>
      {content}
    </button>
  );
}

function TipOptionButton({ label, amountLabel, selected, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={joinClasses(
        "rounded-[var(--radius-card)] border px-3 py-3 text-center transition-colors",
        selected
          ? "border-accent bg-accent/10"
          : "border-card-border bg-bg hover:border-accent",
      )}
    >
      <p className="text-sm font-semibold text-text">{label}</p>
      <p className="mt-1 text-xs text-muted-text">{amountLabel}</p>
    </button>
  );
}

function SummaryItem({ item }) {
  const imageSrc = getImageSrc(item.image);

  return (
    <div className="flex items-start gap-3 rounded-[var(--radius-card)] border border-card-border bg-bg p-3">
      <div className="relative h-18 w-14 shrink-0 overflow-hidden rounded-lg border border-card-border bg-card sm:h-20 sm:w-16">
        {imageSrc ? (
          <Image
            src={imageSrc}
            alt={item.productName ?? item.name ?? "Cart item"}
            fill
            sizes="64px"
            unoptimized
            className="object-cover"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-[9px] uppercase tracking-[2px] text-muted-text">
            No Image
          </div>
        )}

        <span className="absolute top-1 right-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-accent px-1 text-[10px] font-semibold text-text">
          {item.quantity}
        </span>
      </div>

      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-text">
          {item.productName ?? item.name}
        </p>
      </div>

      <div className="shrink-0 text-right">
        <p className="text-sm font-medium text-text">
          Rs {formatPrice(Number(item.price ?? 0) * Number(item.quantity ?? 1))}
        </p>
      </div>
    </div>
  );
}

function DiscountCodeRow({ value, onChange }) {
  return (
    <div className="rounded-[var(--radius-card)] border border-card-border p-3">
      <label htmlFor="discountCode" className={LABEL_CLASS}>
        Discount Code
      </label>
      <div className="flex gap-2">
        <input
          id="discountCode"
          name="discountCode"
          type="text"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder="Discount code"
          autoComplete="off"
          className="w-full rounded-lg border border-card-border bg-bg px-4 py-3 text-[14px] text-text outline-none transition-colors placeholder:text-muted-text focus:border-accent"
        />
        <button
          type="button"
          disabled
          className="rounded-lg border border-card-border bg-bg px-4 py-3 text-[11px] font-semibold uppercase tracking-[2px] text-muted-text disabled:cursor-not-allowed"
        >
          Apply
        </button>
      </div>
    </div>
  );
}

function SummaryRows({
  subtotal,
  shippingCost,
  tipAmount,
  total,
  totalQuantity,
}) {
  return (
    <div className="space-y-3 border-t border-hairline pt-4">
      <div className="flex items-center justify-between gap-3 text-sm text-text">
        <p className="text-muted-text">Subtotal · {totalQuantity} items</p>
        <p>Rs {formatPrice(subtotal)}</p>
      </div>

      <div className="flex items-center justify-between gap-3 text-sm text-text">
        <p className="flex items-center gap-1 text-muted-text">
          <span>Shipping</span>
          <Info className="h-3.5 w-3.5" />
        </p>
        <p className={shippingCost === 0 ? "text-accent-strong" : ""}>
          {shippingCost === 0 ? "Free" : `Rs ${formatPrice(shippingCost)}`}
        </p>
      </div>

      {tipAmount > 0 ? (
        <div className="flex items-center justify-between gap-3 text-sm text-text">
          <p className="text-muted-text">Tip</p>
          <p>Rs {formatPrice(tipAmount)}</p>
        </div>
      ) : null}

      <div className="flex items-center justify-between gap-3 border-t border-hairline pt-4">
        <p className="text-base font-semibold text-text">Total</p>
        <p className="text-lg font-semibold text-text">
          PKR Rs {formatPrice(total)}
        </p>
      </div>
    </div>
  );
}

export default function CheckoutPage() {
  const router = useRouter();
  const hasInitializedRef = useRef(false);
  const fieldRefs = useRef({});
  const bankDetailsWrapperRef = useRef(null);
  const bankDetailsContentRef = useRef(null);
  const billingAddressWrapperRef = useRef(null);
  const billingAddressContentRef = useRef(null);
  const desktopListRef = useRef(null);
  const sectionRefs = useRef([]);

  const [isReady, setIsReady] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showDesktopScrollIndicator, setShowDesktopScrollIndicator] =
    useState(false);
  const cartItems = useCartStore((state) => state.cart);
  const initializeCart = useCartStore((state) => state.initializeCart);
  const clearCart = useCartStore((state) => state.clearCart);
  const [paymentMethod, setPaymentMethod] = useState("cod");
  const [billingAddressMode, setBillingAddressMode] = useState("same");
  const [discountCode, setDiscountCode] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});
  const [tipEnabled, setTipEnabled] = useState(true);
  const [selectedTipOption, setSelectedTipOption] = useState("none");
  const [customTipValue, setCustomTipValue] = useState("");
  const [tipConfirmed, setTipConfirmed] = useState(false);
  const [tipConfirmedAmount, setTipConfirmedAmount] = useState(0);
  const [showTipCapWarning, setShowTipCapWarning] = useState(false);
  const [formValues, setFormValues] = useState({
    email: "",
    emailOffers: false,
    country: "Pakistan",
    firstName: "",
    lastName: "",
    streetAddress: "",
    apartment: "",
    city: "",
    postalCode: "",
    province: "Punjab",
    phoneNumber: "",
    saveInfo: false,
  });
  const [billingValues, setBillingValues] = useState({
    country: "Pakistan",
    streetAddress: "",
    apartment: "",
    city: "",
    postalCode: "",
    province: "Punjab",
  });

  const subtotal = cartItems.reduce(
    (total, item) =>
      total + Number(item.price ?? 0) * Number(item.quantity ?? 1),
    0,
  );
  // Flat shipping per spec (SHIPPING_COST). The old free-over-Rs.3000 tier
  // has been removed; every order is charged the flat shipping constant.
  const shippingCost = SHIPPING_COST;
  const totalQuantity = cartItems.reduce(
    (total, item) => total + Number(item.quantity ?? 1),
    0,
  );

  let rawLiveTipAmount = 0;

  if (tipEnabled) {
    if (selectedTipOption === "10") {
      rawLiveTipAmount = Math.round(subtotal * 0.1);
    } else if (selectedTipOption === "15") {
      rawLiveTipAmount = Math.round(subtotal * 0.15);
    } else if (selectedTipOption === "20") {
      rawLiveTipAmount = Math.round(subtotal * 0.2);
    } else if (selectedTipOption === "custom") {
      rawLiveTipAmount = clampTipAmount(customTipValue);
    }
  }

  const liveTipAmount = clampTipAmount(rawLiveTipAmount);
  const tipAmount = tipConfirmed ? tipConfirmedAmount : liveTipAmount;
  const total = subtotal + shippingCost + tipAmount;
  const previewItem = cartItems[0] ?? null;

  function setFieldRef(fieldName) {
    return (node) => {
      if (node) {
        fieldRefs.current[fieldName] = node;
      }
    };
  }

  function clearFieldError(fieldName) {
    if (!fieldErrors[fieldName]) {
      return;
    }

    setFieldErrors((current) => ({
      ...current,
      [fieldName]: false,
    }));
  }

  function updateFormValue(name, value) {
    setFormValues((current) => ({
      ...current,
      [name]: value,
    }));

    clearFieldError(name);
  }

  function updateFormCheckbox(name, checked) {
    setFormValues((current) => ({
      ...current,
      [name]: checked,
    }));
  }

  function updateBillingValue(name, value) {
    const fieldName = name
      .replace("billing", "")
      .replace(/^(.)/, (m) => m.toLowerCase());
    setBillingValues((current) => ({
      ...current,
      [fieldName]: value,
    }));
  }

  function selectTipOption(option) {
    setSelectedTipOption(option);
    setShowTipCapWarning(false);

    if (option !== "custom") {
      clearFieldError("customTip");
    }

    if (option === "10") {
      setShowTipCapWarning(Math.round(subtotal * 0.1) > MAX_TIP);
    } else if (option === "15") {
      setShowTipCapWarning(Math.round(subtotal * 0.15) > MAX_TIP);
    } else if (option === "20") {
      setShowTipCapWarning(Math.round(subtotal * 0.2) > MAX_TIP);
    }
  }

  function updateCustomTip(nextValue) {
    if (nextValue === "") {
      setCustomTipValue("");
      setShowTipCapWarning(false);

      if (selectedTipOption === "custom") {
        setSelectedTipOption("none");
      }

      return;
    }

    const parsedValue = Number.parseInt(nextValue, 10);
    const attemptedValue = Number.isNaN(parsedValue) ? MIN_TIP : parsedValue;
    const safeValue = clampTipAmount(attemptedValue);

    setCustomTipValue(String(safeValue));
    setShowTipCapWarning(attemptedValue > MAX_TIP);

    if (safeValue > 0) {
      setSelectedTipOption("custom");
    } else if (selectedTipOption === "custom") {
      setSelectedTipOption("none");
    }
  }

  function adjustCustomTip(amount) {
    const currentValue = Number(customTipValue || 0);
    const attemptedValue = currentValue + amount;
    const nextValue = clampTipAmount(attemptedValue);

    setCustomTipValue(nextValue > 0 ? String(nextValue) : "");
    setSelectedTipOption(nextValue > 0 ? "custom" : "none");
    setShowTipCapWarning(attemptedValue > MAX_TIP);
  }

  useEffect(() => {
    if (tipConfirmed) {
      setTipConfirmed(false);
    }
  }, [customTipValue, selectedTipOption, subtotal, tipConfirmed, tipEnabled]);

  useEffect(() => {
    if (hasInitializedRef.current) {
      return;
    }

    hasInitializedRef.current = true;

    initializeCart();

    if (cartItems.length === 0) {
      toast.error("Could not checkout. Your cart is empty.");
      router.replace("/cart");
      return;
    }

    setIsReady(true);

    gsap.registerPlugin(ScrollTrigger);

    sectionRefs.current.forEach((section, index) => {
      if (section) {
        gsap.fromTo(
          section,
          { x: -100, opacity: 0 },
          {
            x: 0,
            opacity: 1,
            duration: 0.6,
            delay: index * 0.1,
            ease: "power2.out",
            scrollTrigger: {
              trigger: section,
              start: "top 80%",
              toggleActions: "play none none none",
            },
          },
        );
      }
    });

    const cartValue = cartItems.reduce(
      (totalPrice, item) =>
        totalPrice + Number(item.price ?? 0) * Number(item.quantity ?? 1),
      0,
    );
    const itemCount = cartItems.reduce(
      (count, item) => count + Number(item.quantity ?? 1),
      0,
    );

    try {
      if (typeof gtag === "function") {
        gtag("event", "begin_checkout", {
          currency: "PKR",
          value: cartValue,
          items: cartItems.map((item) => ({
            item_id: item.productId,
            item_name: item.productName ?? item.name,
            price: Number(item.price ?? 0),
            quantity: Number(item.quantity ?? 1),
          })),
        });
      }

      if (typeof fbq === "function") {
        fbq("track", "InitiateCheckout", {
          value: cartValue,
          currency: "PKR",
          num_items: itemCount,
        });
      }
    } catch {}
  }, [router]);

  useEffect(() => {
    const wrapper = bankDetailsWrapperRef.current;
    const content = bankDetailsContentRef.current;

    if (!wrapper || !content) {
      return;
    }

    const isOpen = paymentMethod === "bank_deposit";

    gsap.killTweensOf(wrapper);

    if (isOpen) {
      const nextHeight = content.getBoundingClientRect().height;

      gsap.to(wrapper, {
        height: nextHeight,
        opacity: 1,
        duration: 0.35,
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
      duration: 0.28,
      ease: "power2.inOut",
      onComplete: () => {
        wrapper.style.pointerEvents = "none";
      },
    });
  }, [paymentMethod]);

  useEffect(() => {
    const wrapper = billingAddressWrapperRef.current;
    const content = billingAddressContentRef.current;

    if (!wrapper || !content) {
      return;
    }

    const isOpen = billingAddressMode === "different";

    gsap.killTweensOf(wrapper);

    if (isOpen) {
      const nextHeight = content.getBoundingClientRect().height;

      gsap.to(wrapper, {
        height: nextHeight,
        opacity: 1,
        duration: 0.35,
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
      duration: 0.28,
      ease: "power2.inOut",
      onComplete: () => {
        wrapper.style.pointerEvents = "none";
      },
    });
  }, [billingAddressMode]);

  useEffect(() => {
    const scroller = desktopListRef.current;

    if (!scroller) {
      return;
    }

    const updateScrollIndicator = () => {
      const hasOverflow = scroller.scrollHeight > scroller.clientHeight + 4;
      const hasMoreContent =
        scroller.scrollTop + scroller.clientHeight < scroller.scrollHeight - 4;

      setShowDesktopScrollIndicator(hasOverflow && hasMoreContent);
    };

    updateScrollIndicator();
    scroller.addEventListener("scroll", updateScrollIndicator);
    window.addEventListener("resize", updateScrollIndicator);

    return () => {
      scroller.removeEventListener("scroll", updateScrollIndicator);
      window.removeEventListener("resize", updateScrollIndicator);
    };
  }, [cartItems]);

  async function handleSubmit(event) {
    event.preventDefault();

    if (isSubmitting) {
      return;
    }

    if (cartItems.length === 0) {
      toast.error("Could not checkout. Your cart is empty.");
      router.replace("/cart");
      return;
    }

    const nextErrors = {};
    const requiredFields = [
      ["email", formValues.email.trim()],
      ["firstName", formValues.firstName.trim()],
      ["lastName", formValues.lastName.trim()],
      ["streetAddress", formValues.streetAddress.trim()],
      ["city", formValues.city.trim()],
      ["province", formValues.province.trim()],
      ["phoneNumber", formValues.phoneNumber.trim()],
      ["paymentMethod", paymentMethod.trim()],
    ];

    let firstInvalidField = null;

    requiredFields.forEach(([fieldName, fieldValue]) => {
      if (!fieldValue) {
        nextErrors[fieldName] = true;

        if (!firstInvalidField) {
          firstInvalidField = fieldName;
        }
      }
    });

    setFieldErrors(nextErrors);

    if (firstInvalidField) {
      toast.error(
        "Please fill out all required fields before placing your order.",
      );

      const firstField = fieldRefs.current[firstInvalidField];

      if (firstField) {
        firstField.scrollIntoView({ behavior: "smooth", block: "center" });
        firstField.focus?.();
      }

      return;
    }

    setIsSubmitting(true);

    try {
      const payload = {
        customer: {
          firstName: formValues.firstName.trim(),
          lastName: formValues.lastName.trim(),
          name: `${formValues.firstName.trim()} ${formValues.lastName.trim()}`.trim(),
          email: formValues.email.trim(),
          phone: formValues.phoneNumber.trim(),
          address: {
            street: formValues.streetAddress.trim(),
            city: formValues.city.trim(),
            province: formValues.province.trim(),
            postalCode: formValues.postalCode.trim(),
            country: formValues.country,
          },
        },
        items: cartItems.map((item) => ({
          productId: item.productId,
          productName: item.productName ?? item.name ?? "",
          sku: item.sku ?? "",
          slug: item.slug ?? "",
          image: getImageSrc(item.image),
          price: Number(item.price ?? 0),
          originalPrice:
            item.originalPrice == null ? undefined : Number(item.originalPrice),
          quantity: Number(item.quantity ?? 1),
        })),
        subtotal,
        shippingCost,
        tip: clampTipAmount(tipAmount),
        totalAmount: total,
        paymentMethod,
      };

      const response = await fetch("/api/orders/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });
      const data = await response.json().catch(() => null);

      if (!response.ok || data?.success === false) {
        const outOfStockSummary =
          Array.isArray(data?.outOfStockItems) &&
          data.outOfStockItems.length > 0
            ? ` ${data.outOfStockItems
                .map((item) => item?.productName)
                .filter(Boolean)
                .join(", ")}`
            : "";

        throw new Error(
          `${data?.message ?? "Order creation failed."}${outOfStockSummary}`.trim(),
        );
      }

      const nextOrderId =
        typeof data?.orderId === "string" && data.orderId.trim()
          ? data.orderId.trim()
          : "";

      writeStoredCart([]);
      emitCartUpdated();
      clearCart();
      router.push(
        nextOrderId
          ? `/thank-you?orderId=${encodeURIComponent(nextOrderId)}`
          : "/thank-you",
      );
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Something went wrong. Please try again.",
      );
      setIsSubmitting(false);
    }
  }

  if (!isReady) {
    return <div className="min-h-screen bg-bg" />;
  }

  return (
    <div className="min-h-screen bg-bg text-text">
      <div className="top-15 left-5">
        <CheckoutBackButton />
      </div>
      <form onSubmit={handleSubmit} noValidate>
        <div className="mx-auto max-w-7xl px-4 pb-28 md:px-6 md:pb-0">
          <div className="md:grid md:grid-cols-[minmax(0,1.38fr)_minmax(360px,1fr)] md:items-start md:gap-8">
            <div className="pb-10 pt-4 md:pb-12 md:pt-8">
              <div className="sticky top-0 z-20 -mx-4 border-b border-hairline bg-bg/95 px-4 py-3 backdrop-blur md:hidden">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    {previewItem ? (
                      <div className="relative h-12 w-10 overflow-hidden rounded-lg border border-card-border bg-card">
                        {getImageSrc(previewItem.image) ? (
                          <Image
                            src={getImageSrc(previewItem.image)}
                            alt={
                              previewItem.productName ??
                              previewItem.name ??
                              "Cart item"
                            }
                            fill
                            sizes="40px"
                            unoptimized
                            className="object-cover"
                          />
                        ) : null}
                      </div>
                    ) : null}

                    {cartItems.length > 1 ? (
                      <div className="flex items-center gap-1 text-[10px] uppercase tracking-[2px] text-muted-text">
                        <span>{cartItems.length - 1} more</span>
                        <ChevronRight className="h-3.5 w-3.5" />
                      </div>
                    ) : null}
                  </div>

                  <div className="flex items-center gap-2">
                    <div className="text-right">
                      <p className="text-[10px] uppercase tracking-[2px] text-muted-text">
                        Total
                      </p>
                      <p className="text-sm font-semibold text-text">
                        PKR Rs {formatPrice(total)}
                      </p>
                    </div>
                    <ChevronDown className="h-4 w-4 text-muted-text" />
                  </div>
                </div>
              </div>

              <div className="space-y-6 pt-6 md:pt-0">
                <section
                  ref={(el) => (sectionRefs.current[0] = el)}
                  className="rounded-[var(--radius-card)] border border-card-border bg-card p-5 shadow-[var(--shadow-card)] sm:p-6"
                >
                  <h2 className={SECTION_TITLE_CLASS}>Contact</h2>

                  <div className="space-y-4">
                    <InputField
                      label="Email"
                      name="email"
                      type="email"
                      placeholder="Email or mobile phone number"
                      value={formValues.email}
                      onChange={updateFormValue}
                      error={fieldErrors.email}
                      fieldRef={setFieldRef("email")}
                      autoComplete="email"
                    />

                    <label className="flex items-center gap-3 text-sm text-text">
                      <input
                        type="checkbox"
                        checked={formValues.emailOffers}
                        onChange={(event) =>
                          updateFormCheckbox(
                            "emailOffers",
                            event.target.checked,
                          )
                        }
                        className="h-4 w-4 rounded border border-card-border bg-bg accent-[var(--color-accent)]"
                      />
                      <span>Email me with news and offers</span>
                    </label>
                  </div>
                </section>

                <section
                  ref={(el) => (sectionRefs.current[1] = el)}
                  className="rounded-[var(--radius-card)] border border-card-border bg-card p-5 shadow-[var(--shadow-card)] sm:p-6"
                >
                  <h2 className={SECTION_TITLE_CLASS}>Delivery</h2>

                  <div className="space-y-4">
                    <SelectField
                      label="Country / Region"
                      name="country"
                      value={formValues.country}
                      onChange={updateFormValue}
                      options={COUNTRIES}
                    />

                    <div className="grid gap-4 sm:grid-cols-2">
                      <InputField
                        label="First Name"
                        name="firstName"
                        value={formValues.firstName}
                        onChange={updateFormValue}
                        error={fieldErrors.firstName}
                        fieldRef={setFieldRef("firstName")}
                        autoComplete="given-name"
                      />
                      <InputField
                        label="Last Name"
                        name="lastName"
                        value={formValues.lastName}
                        onChange={updateFormValue}
                        error={fieldErrors.lastName}
                        fieldRef={setFieldRef("lastName")}
                        autoComplete="family-name"
                      />
                    </div>

                    <InputField
                      label="Street Address"
                      name="streetAddress"
                      value={formValues.streetAddress}
                      onChange={updateFormValue}
                      error={fieldErrors.streetAddress}
                      fieldRef={setFieldRef("streetAddress")}
                      autoComplete="street-address"
                    />

                    <InputField
                      label="Apartment, Suite, Etc."
                      name="apartment"
                      value={formValues.apartment}
                      onChange={updateFormValue}
                      autoComplete="address-line2"
                    />

                    <div className="grid gap-4 sm:grid-cols-2">
                      <InputField
                        label="City"
                        name="city"
                        value={formValues.city}
                        onChange={updateFormValue}
                        error={fieldErrors.city}
                        fieldRef={setFieldRef("city")}
                        autoComplete="address-level2"
                      />
                      <InputField
                        label="Postal Code"
                        name="postalCode"
                        value={formValues.postalCode}
                        onChange={updateFormValue}
                        autoComplete="postal-code"
                      />
                    </div>

                    <SelectField
                      label="Province"
                      name="province"
                      value={formValues.province}
                      onChange={updateFormValue}
                      options={PROVINCES}
                      error={fieldErrors.province}
                      fieldRef={setFieldRef("province")}
                    />

                    <InputField
                      label="Delivery Contact Number"
                      name="phoneNumber"
                      type="tel"
                      value={formValues.phoneNumber}
                      onChange={updateFormValue}
                      error={fieldErrors.phoneNumber}
                      fieldRef={setFieldRef("phoneNumber")}
                      helperText="The courier will use this number for delivery."
                      autoComplete="tel"
                    />

                    <label className="flex items-center gap-3 text-sm text-text">
                      <input
                        type="checkbox"
                        checked={formValues.saveInfo}
                        onChange={(event) =>
                          updateFormCheckbox("saveInfo", event.target.checked)
                        }
                        className="h-4 w-4 rounded border border-card-border bg-bg accent-[var(--color-accent)]"
                      />
                      <span>Save this information for next time</span>
                    </label>
                  </div>
                </section>

                <section
                  ref={(el) => (sectionRefs.current[2] = el)}
                  className="rounded-[var(--radius-card)] border border-card-border bg-card p-5 shadow-[var(--shadow-card)] sm:p-6"
                >
                  <h2 className={SECTION_TITLE_CLASS}>Shipping method</h2>

                  <OptionCard
                    label="Standard Shipping"
                    selected
                    nonInteractive
                    showIndicator={false}
                    rightSlot={
                      <span
                        className={joinClasses(
                          "text-sm font-semibold",
                          shippingCost === 0
                            ? "text-accent-strong"
                            : "text-text",
                        )}
                      >
                        {shippingCost === 0
                          ? "Free"
                          : `Rs ${formatPrice(shippingCost)}`}
                      </span>
                    }
                  />
                </section>

                <section
                  ref={(el) => (sectionRefs.current[3] = el)}
                  className="rounded-[var(--radius-card)] border border-card-border bg-card p-5 shadow-[var(--shadow-card)] sm:p-6"
                >
                  <h2 className={SECTION_TITLE_CLASS}>Payment</h2>
                  <p className="mb-4 text-sm text-muted-text">
                    All transactions are secure and encrypted.
                  </p>

                  <div ref={setFieldRef("paymentMethod")} className="space-y-3">
                    <OptionCard
                      label="Cash on Delivery (COD)"
                      selected={paymentMethod === "cod"}
                      error={fieldErrors.paymentMethod}
                      onClick={() => {
                        setPaymentMethod("cod");
                        clearFieldError("paymentMethod");
                      }}
                    />

                    <OptionCard
                      label="Bank Deposit"
                      selected={paymentMethod === "bank_deposit"}
                      error={fieldErrors.paymentMethod}
                      onClick={() => {
                        setPaymentMethod("bank_deposit");
                        clearFieldError("paymentMethod");
                      }}
                    />
                  </div>

                  <div
                    ref={bankDetailsWrapperRef}
                    style={{
                      height: 0,
                      opacity: 0,
                      overflow: "hidden",
                      pointerEvents: "none",
                    }}
                  >
                    <div
                      ref={bankDetailsContentRef}
                      className="mt-3 rounded-[var(--radius-card)] border border-card-border p-5"
                    >
                      {/* TODO(Flowerista): replace the placeholders below with
                          Flowerista's real bank account details and support
                          contact. The previous values were the original store
                          owner's account/contact and must NOT ship. */}
                      <div className="space-y-3 text-sm leading-6 text-text">
                        <p>
                          <span className="text-muted-text">Bank Name:</span> —
                        </p>
                        <p>
                          <span className="text-muted-text">Account No:</span> —
                        </p>
                        <p>
                          <span className="text-muted-text">IBAN No:</span> —
                        </p>
                        <p>
                          <span className="text-muted-text">
                            Account Title:
                          </span>{" "}
                          Flowerista
                        </p>
                        <p className="text-muted-text">
                          After completing the transfer, please share a
                          screenshot of the payment along with your ORDER ID
                          with our support team.
                        </p>
                      </div>
                    </div>
                  </div>
                </section>

                <section
                  ref={(el) => (sectionRefs.current[4] = el)}
                  className="rounded-[var(--radius-card)] border border-card-border bg-card p-5 shadow-[var(--shadow-card)] sm:p-6"
                >
                  <h2 className={SECTION_TITLE_CLASS}>Billing address</h2>

                  <div className="space-y-3">
                    <OptionCard
                      label="Same as shipping address"
                      selected={billingAddressMode === "same"}
                      onClick={() => setBillingAddressMode("same")}
                    />

                    <OptionCard
                      label="Use a different billing address"
                      selected={billingAddressMode === "different"}
                      onClick={() => setBillingAddressMode("different")}
                    />
                  </div>

                  <div
                    ref={billingAddressWrapperRef}
                    style={{
                      height: 0,
                      opacity: 0,
                      overflow: "hidden",
                      pointerEvents: "none",
                    }}
                  >
                    <div
                      ref={billingAddressContentRef}
                      className="mt-4 space-y-4 rounded-[var(--radius-card)] border border-card-border p-4"
                    >
                      <SelectField
                        label="Country / Region"
                        name="billingCountry"
                        value={billingValues.country}
                        onChange={updateBillingValue}
                        options={COUNTRIES}
                      />

                      <InputField
                        label="Street Address"
                        name="billingStreetAddress"
                        value={billingValues.streetAddress}
                        onChange={updateBillingValue}
                        autoComplete="billing street-address"
                      />

                      <InputField
                        label="Apartment, Suite, Etc."
                        name="billingApartment"
                        value={billingValues.apartment}
                        onChange={updateBillingValue}
                        autoComplete="billing address-line2"
                      />

                      <div className="grid gap-4 sm:grid-cols-2">
                        <InputField
                          label="City"
                          name="billingCity"
                          value={billingValues.city}
                          onChange={updateBillingValue}
                          autoComplete="billing address-level2"
                        />
                        <InputField
                          label="Postal Code"
                          name="billingPostalCode"
                          value={billingValues.postalCode}
                          onChange={updateBillingValue}
                          autoComplete="billing postal-code"
                        />
                      </div>

                      <SelectField
                        label="Province"
                        name="billingProvince"
                        value={billingValues.province}
                        onChange={updateBillingValue}
                        options={PROVINCES}
                      />
                    </div>
                  </div>
                </section>

                <section
                  ref={(el) => (sectionRefs.current[5] = el)}
                  className="rounded-[var(--radius-card)] border border-card-border bg-card p-5 shadow-[var(--shadow-card)] sm:p-6"
                >
                  <h2 className={SECTION_TITLE_CLASS}>Add tip</h2>

                  <div className="rounded-[var(--radius-card)] border border-card-border p-4">
                    <label className="flex items-start gap-3 text-sm text-text">
                      <input
                        type="checkbox"
                        checked={tipEnabled}
                        onChange={(event) => {
                          setTipEnabled(event.target.checked);

                          if (!event.target.checked) {
                            setTipConfirmed(false);
                          }
                        }}
                        className="mt-0.5 h-4 w-4 rounded border border-card-border bg-bg accent-[var(--color-accent)]"
                      />
                      <span>Show your support for the Flowerista team</span>
                    </label>

                    {tipEnabled ? (
                      <div className="mt-4 space-y-4">
                        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                          <TipOptionButton
                            label="10%"
                            amountLabel={`Rs ${formatPrice(Math.round(subtotal * 0.1))}`}
                            selected={selectedTipOption === "10"}
                            onClick={() => selectTipOption("10")}
                          />
                          <TipOptionButton
                            label="15%"
                            amountLabel={`Rs ${formatPrice(Math.round(subtotal * 0.15))}`}
                            selected={selectedTipOption === "15"}
                            onClick={() => selectTipOption("15")}
                          />
                          <TipOptionButton
                            label="20%"
                            amountLabel={`Rs ${formatPrice(Math.round(subtotal * 0.2))}`}
                            selected={selectedTipOption === "20"}
                            onClick={() => selectTipOption("20")}
                          />
                          <TipOptionButton
                            label="None"
                            amountLabel="Rs 0"
                            selected={selectedTipOption === "none"}
                            onClick={() => selectTipOption("none")}
                          />
                        </div>

                        <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto]">
                          <InputField
                            label="Custom tip"
                            name="customTip"
                            type="number"
                            min={MIN_TIP}
                            max={MAX_TIP}
                            step="50"
                            value={customTipValue}
                            onChange={(_, value) => updateCustomTip(value)}
                            error={fieldErrors.customTip}
                          />

                          <div className="grid grid-cols-2 gap-3 self-end">
                            <button
                              type="button"
                              onClick={() => adjustCustomTip(-50)}
                              className="flex h-[50px] w-[58px] items-center justify-center rounded-lg border border-card-border bg-bg text-text transition-colors hover:border-accent hover:text-accent"
                            >
                              <Minus className="h-4 w-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() => adjustCustomTip(50)}
                              className="flex h-[50px] w-[58px] items-center justify-center rounded-lg border border-card-border bg-bg text-text transition-colors hover:border-accent hover:text-accent"
                            >
                              <Plus className="h-4 w-4" />
                            </button>
                          </div>
                        </div>

                        <button
                          type="button"
                          disabled={liveTipAmount === 0}
                          onClick={() => {
                            setTipConfirmedAmount(liveTipAmount);
                            setTipConfirmed(true);
                          }}
                          className={joinClasses(
                            "w-full rounded-full px-4 py-3 text-sm font-semibold uppercase tracking-[2px] transition-colors",
                            liveTipAmount === 0
                              ? "cursor-not-allowed bg-bg text-muted-text"
                              : "bg-accent text-text-on-accent hover:bg-accent-strong",
                          )}
                        >
                          Add tip
                        </button>

                        <p className="text-xs text-muted-text">
                          Max tip: Rs. {MAX_TIP.toLocaleString("en-PK")}
                        </p>

                        {showTipCapWarning ? (
                          <p className="text-xs text-accent-strong">
                            That&apos;s over the maximum — your tip has been
                            capped at Rs. {MAX_TIP.toLocaleString("en-PK")}.
                          </p>
                        ) : null}
                      </div>
                    ) : null}

                    <p className="mt-4 text-sm text-muted-text">
                      Thank you, we appreciate it.
                    </p>
                  </div>
                </section>

                <section className="space-y-4 md:hidden">
                  <div className="rounded-[var(--radius-card)] border border-card-border bg-card p-5 shadow-[var(--shadow-card)]">
                    <div className="space-y-3">
                      {cartItems.map((item) => (
                        <SummaryItem
                          key={item.cartItemId ?? item.productId}
                          item={item}
                        />
                      ))}
                    </div>

                    <div className="mt-4 space-y-4">
                      <DiscountCodeRow
                        value={discountCode}
                        onChange={setDiscountCode}
                      />
                      <SummaryRows
                        subtotal={subtotal}
                        shippingCost={shippingCost}
                        tipAmount={tipAmount}
                        total={total}
                        totalQuantity={totalQuantity}
                      />
                    </div>
                  </div>
                </section>
              </div>
            </div>

            <aside className="hidden md:block md:sticky md:top-8 md:self-start">
              <div className="flex flex-col overflow-hidden rounded-[var(--radius-card)] border border-card-border bg-card shadow-[var(--shadow-card)]">
                <div className="border-b border-hairline px-6 py-6">
                  <p className="text-[10px] uppercase tracking-[3px] text-muted-text">
                    Order Summary
                  </p>
                  <p className="mt-3 text-2xl font-semibold text-text">
                    PKR Rs {formatPrice(total)}
                  </p>
                </div>

                <div className="relative overflow-hidden">
                  <div
                    ref={desktopListRef}
                    className="max-h-[400px] space-y-3 overflow-y-auto px-6 py-6"
                  >
                    {cartItems.map((item) => (
                      <SummaryItem
                        key={item.cartItemId ?? item.productId}
                        item={item}
                      />
                    ))}
                  </div>

                  {showDesktopScrollIndicator ? (
                    <div className="pointer-events-none absolute inset-x-0 bottom-0 flex justify-center bg-gradient-to-t from-card via-card/95 to-transparent px-4 pt-10 pb-3">
                      <p className="rounded-full border border-card-border bg-bg px-3 py-1 text-[10px] uppercase tracking-[2px] text-muted-text">
                        Scroll for more items ↓
                      </p>
                    </div>
                  ) : null}
                </div>

                <div className="space-y-4 border-t border-hairline px-6 py-6">
                  <DiscountCodeRow
                    value={discountCode}
                    onChange={setDiscountCode}
                  />

                  <SummaryRows
                    subtotal={subtotal}
                    shippingCost={shippingCost}
                    tipAmount={tipAmount}
                    total={total}
                    totalQuantity={totalQuantity}
                  />

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className={joinClasses(
                      "mt-2 flex w-full items-center justify-center gap-2 rounded-full px-4 py-4 text-sm font-semibold uppercase tracking-[2px] transition-all duration-300 active:scale-95",
                      isSubmitting
                        ? "cursor-not-allowed bg-accent text-text-on-accent opacity-70"
                        : "bg-accent text-text-on-accent hover:-translate-y-1 hover:bg-accent-strong hover:shadow-[var(--shadow-card-hover)]",
                    )}
                  >
                    {isSubmitting ? (
                      <>
                        <LoaderCircle className="h-4 w-4 animate-spin" />
                        <span>Processing</span>
                      </>
                    ) : (
                      <span>Complete order</span>
                    )}
                  </button>
                </div>
              </div>
            </aside>
          </div>
        </div>

        <div className="fixed right-0 bottom-0 left-0 z-30 border-t border-hairline bg-bg/95 px-4 py-4 backdrop-blur md:hidden">
          <button
            type="submit"
            disabled={isSubmitting}
            className={joinClasses(
              "flex w-full items-center justify-center gap-2 rounded-full px-4 py-4 text-sm font-semibold uppercase tracking-[2px] transition-all duration-300 active:scale-95",
              isSubmitting
                ? "cursor-not-allowed bg-accent text-text-on-accent opacity-70"
                : "bg-accent text-text-on-accent hover:-translate-y-1 hover:bg-accent-strong hover:shadow-[var(--shadow-card-hover)]",
            )}
          >
            {isSubmitting ? (
              <>
                <LoaderCircle className="h-4 w-4 animate-spin" />
                <span>Processing</span>
              </>
            ) : (
              <span>Complete order</span>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
