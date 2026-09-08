"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import Lenis from "lenis";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

export default function SmoothScroll({ children }) {
  const lenisRef = useRef(null);
  const pathname = usePathname();

  useEffect(() => {
    const isMobile = window.matchMedia("(max-width: 768px)").matches;

    const lenis = new Lenis({
      duration: 1.5,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      orientation: "vertical",
      gestureDirection: "vertical",
      smoothWheel: true,
      wheelMultiplier: 0.8,
      smoothTouch: !isMobile,
      touchMultiplier: 0.8,
      touchInertiaMultiplier: isMobile ? 20 : 35,
      infinite: false,
    });

    lenisRef.current = lenis;

    lenis.on("scroll", ScrollTrigger.update);

    const ticker = (time) => {
      lenis.raf(time * 1000);
    };

    gsap.ticker.add(ticker);
    gsap.ticker.lagSmoothing(0);

    const handleCartModal = (e) => {
      if (e.detail?.isOpen) {
        lenis.stop();
      } else {
        lenis.start();
      }
    };

    window.addEventListener("cartModalChange", handleCartModal);

    let resizeTimer;
    const observer = new MutationObserver(() => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(() => {
        lenis.resize();
      }, 150);
    });

    observer.observe(document.body, {
      childList: true,
      subtree: false,
    });

    return () => {
      clearTimeout(resizeTimer);
      lenis.destroy();
      window.removeEventListener("cartModalChange", handleCartModal);
      observer.disconnect();
      gsap.ticker.remove(ticker);
    };
  }, []);

  useEffect(() => {
    if (!lenisRef.current) return;
    const timer = setTimeout(() => {
      lenisRef.current.resize();
      ScrollTrigger.refresh();
    }, 100);
    return () => clearTimeout(timer);
  }, [pathname]);

  return <>{children}</>;
}
