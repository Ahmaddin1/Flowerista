"use client";

import Link from "next/link";
import { ChevronLeft } from "lucide-react";

const BUTTON_CLASS =
  "fixed top-4 left-4 z-50 flex h-11 w-11 items-center justify-center rounded-full border-2 border-accent bg-accent/40 backdrop-blur-md md:hidden";

export function CartBackButton() {
  return (
    <Link href="/products" aria-label="Back to shop" className={BUTTON_CLASS}>
      <ChevronLeft className="h-5 w-5 text-white" strokeWidth={2.5} fill="white" />
    </Link>
  );
}

export function CheckoutBackButton() {
  return (
    <Link href="/cart" aria-label="Back to cart" className={BUTTON_CLASS}>
      <ChevronLeft className="h-5 w-5 text-white" strokeWidth={2.5} fill="white" />
    </Link>
  );
}
