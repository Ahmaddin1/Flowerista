"use client";

import { useEffect, useRef } from "react";
import { gsap } from "gsap";

export default function MarqueeSection() {
  const marqueeRef = useRef(null);
  const tweenRef = useRef(null);
  const resetTimeoutRef = useRef(null);
  const directionRef = useRef(1);
  const lastScrollY = useRef(0);

  useEffect(() => {
    tweenRef.current = gsap.to(marqueeRef.current, {
      x: "-50%",
      duration: 30,
      repeat: -1,
      ease: "none",
    });

    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      const delta = currentScrollY - lastScrollY.current;
      lastScrollY.current = currentScrollY;

      if (delta > 0) directionRef.current = 1;
      else if (delta < 0) directionRef.current = -1;

      const speed = gsap.utils.clamp(1, 6, Math.abs(delta) * 0.1);
      gsap.to(tweenRef.current, {
        timeScale: directionRef.current * speed,
        duration: 0.4,
        ease: "power2.out",
        overwrite: true,
      });

      clearTimeout(resetTimeoutRef.current);
      resetTimeoutRef.current = setTimeout(() => {
        gsap.to(tweenRef.current, {
          timeScale: directionRef.current * 1,
          duration: 1.2,
          ease: "power2.out",
          overwrite: true,
        });
      }, 250);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });

    return () => {
      window.removeEventListener("scroll", handleScroll);
      tweenRef.current?.kill();
      clearTimeout(resetTimeoutRef.current);
    };
  }, []);

  return (
    <section className="overflow-hidden bg-accent py-3 text-white font-bold text-lg">
      <div
        ref={marqueeRef}
        className="flex min-w-max whitespace-nowrap font-heading text-[18px] tracking-[0.35em] uppercase"
      >
        {["", "", "", "", ""].map((_, i) => (
          <span key={i} className="pr-8" aria-hidden={i > 0 || undefined}>
            HANDMADE WITH LOVE &middot; NATIONWIDE SHIPPING &middot;
          </span>
        ))}
      </div>
    </section>
  );
}
