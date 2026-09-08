"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { ShoppingBag } from "lucide-react";
import CartModal from "@/components/CartModal";
import { getCartCount } from "@/lib/cart";
import { useCartStore } from "@/store/cartStore";

gsap.registerPlugin(useGSAP);

export default function CartBubble() {
  const router = useRouter();
  const pathname = usePathname();
  const [cartCount, setCartCount] = useState(0);
  const [visible, setVisible] = useState(false);
  const bubbleRef = useRef(null);

  useEffect(() => {
    useCartStore.getState().initializeCart();
    setCartCount(getCartCount());
    setVisible(true);

    const handleCartUpdated = () => {
      setCartCount(getCartCount());
    };

    window.addEventListener("cartUpdated", handleCartUpdated);

    return () => {
      window.removeEventListener("cartUpdated", handleCartUpdated);
    };
  }, []);

  useGSAP(
    () => {
      if (!visible || !bubbleRef.current) {
        return;
      }

      gsap.fromTo(
        bubbleRef.current,
        { opacity: 0, y: 20 },
        { opacity: 1, y: 0, duration: 0.3, ease: "power2.out" },
      );
    },
    { dependencies: [visible] },
  );

  const shouldHideBubble =
    pathname === "/cart" || pathname === "/checkout" || cartCount === 0;

  return (
    <>
      {shouldHideBubble ? null : (
        <div
          ref={bubbleRef}
          className="fixed bottom-8 right-[88px] z-50"
          style={{ opacity: 0 }}
        >
          <button
            type="button"
            onClick={() => router.push("/cart")}
            className="relative flex h-14 w-14 cursor-pointer items-center justify-center rounded-full bg-accent shadow-[var(--shadow-card)] transition-transform duration-200 hover:scale-110"
          >
            <ShoppingBag size={22} className="text-text-on-accent" strokeWidth={1.5} />
            <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-accent-strong text-[10px] font-bold text-text-on-accent">
              {cartCount > 99 ? "99+" : cartCount}
            </span>
          </button>
        </div>
      )}
      <CartModal />
    </>
  );
}
