"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, ShoppingBag, LayoutGrid, ShoppingCart } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useCartStore } from "@/store/cartStore";
import { useEffect } from "react";

const links = [
  { href: "/", label: "Home", icon: Home, exact: true },
  { href: "/products", label: "Shop All", icon: ShoppingBag, exact: false },
  { href: "/collections", label: "Collections", icon: LayoutGrid, exact: false },
  { href: "/cart", label: "Cart", icon: ShoppingCart, exact: false },
];

export default function BottomNav() {
  const pathname = usePathname();
  const { cart, initializeCart, getCartCount } = useCartStore();

  useEffect(() => {
    initializeCart();
  }, [initializeCart]);

  const cartCount = getCartCount();

  function isActive(link) {
    return link.exact ? pathname === link.href : pathname.startsWith(link.href);
  }

  if (pathname === "/cart" || pathname === "/checkout") return null;

  return (
    <div
      className="fixed bottom-0 left-0 right-0 z-50 md:hidden"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      <nav className="mx-4 mb-4 flex items-center justify-around rounded-full border border-card-border bg-bg/70 backdrop-blur-md px-2 py-1 shadow-[var(--shadow-card)]">
        {links.map((link) => {
          const active = isActive(link);
          const Icon = link.icon;
          const showBadge = link.href === "/cart" && cartCount > 0;

          return (
            <Link
              key={link.href}
              href={link.href}
              aria-label={link.label}
              className="relative flex flex-col items-center justify-center gap-0.5 px-3 py-2 min-w-0"
            >
              <AnimatePresence>
                {active && (
                  <motion.span
                    layoutId="bottomNavActivePill"
                    className="absolute inset-0 -z-10 rounded-full bg-accent"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ type: "spring", stiffness: 350, damping: 30 }}
                  />
                )}
              </AnimatePresence>

              <span className="relative">
                <Icon
                  className={active ? "text-text-on-accent" : "text-muted-text"}
                  size={20}
                  strokeWidth={1.8}
                />
                {showBadge && (
                  <span className="absolute -top-1 -right-1 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-accent-strong text-[8px] font-bold text-text-on-accent">
                    {cartCount > 9 ? "9+" : cartCount}
                  </span>
                )}
              </span>

              <span
                className={`text-[10px] font-medium leading-none ${
                  active ? "text-text-on-accent" : "text-muted-text"
                }`}
              >
                {link.label}
              </span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
