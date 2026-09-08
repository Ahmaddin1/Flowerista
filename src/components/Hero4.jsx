"use client";

import { useRef } from "react";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import Link from "next/link";

gsap.registerPlugin(useGSAP);

export default function Hero4() {
  const containerRef = useRef(null);
  const overlayRef = useRef(null);
  const brandRef = useRef(null);

  useGSAP(
    () => {
      const handleVisibility = () => {
        if (document.hidden) gsap.globalTimeline.pause();
        else gsap.globalTimeline.resume();
      };
      document.addEventListener("visibilitychange", handleVisibility);
      const cleanupVisibility = () => {
        document.removeEventListener("visibilitychange", handleVisibility);
      };

      function startIdleLoop() {
        const words = containerRef.current.querySelectorAll(".hero-word");

        words.forEach((word, i) => {
          gsap.to(word, {
            y: -8,
            duration: 2.8,
            ease: "sine.inOut",
            yoyo: true,
            repeat: -1,
            delay: i * 0.6,
          });
        });
      }

      function runHeroEntry() {
        const entryTl = gsap.timeline({
          delay: 0.2,
          onComplete: startIdleLoop,
        });

        entryTl
          .set(containerRef.current, { opacity: 1 })
          .fromTo(
            containerRef.current.querySelectorAll(".hero-word"),
            { yPercent: 110, opacity: 0, scale: 1.08 },
            {
              yPercent: 0,
              opacity: 1,
              scale: 1,
              duration: 1.3,
              ease: "power3.out",
              stagger: 0.14,
            },
          )
          .fromTo(
            containerRef.current.querySelector(".hero-bg-word"),
            { opacity: 0 },
            { opacity: 1, duration: 1.8, ease: "power2.out" },
            "<0.3",
          )
          .fromTo(
            containerRef.current.querySelectorAll(
              ".hero-season, .hero-cta-row",
            ),
            { opacity: 0, y: 12 },
            {
              opacity: 1,
              y: 0,
              duration: 0.9,
              ease: "power2.out",
              stagger: 0.12,
            },
            "-=0.5",
          );
      }

      // First visit — full sequence
      gsap
        .timeline()
        .fromTo(
          brandRef.current,
          { opacity: 0, y: 40 },
          { opacity: 1, y: 0, duration: 1.0, ease: "power2.out" },
          0.3,
        )
        .to(brandRef.current, { duration: 0.9 })
        .to(brandRef.current, {
          opacity: 0,
          y: -40,
          duration: 0.5,
          ease: "power2.inOut",
        })
        .to(overlayRef.current, {
          yPercent: -100,
          duration: 1.4,
          ease: "power3.inOut",
        })
        .add(runHeroEntry, "-=0.5")
        .call(() => {
          overlayRef.current.style.display = "none";
        });

      return () => {
        cleanupVisibility();
      };
    },
    { scope: containerRef },
  );

  return (
    <>
      <div
        ref={overlayRef}
        className="fixed inset-0 z-100 flex items-center justify-center bg-card"
      >
        <span
          ref={brandRef}
          className="font-heading text-6xl uppercase text-text"
          style={{ opacity: 0 }}
        >
          FLOWERISTA
        </span>
      </div>

      <section
        ref={containerRef}
        className="relative flex min-h-screen items-center justify-center overflow-hidden bg-bg py-20"
        style={{ opacity: 0 }}
      >
        <div className="hero-bg-word pointer-events-none absolute inset-0 flex items-center justify-center font-heading text-[clamp(120px,25vw,320px)] font-bold uppercase leading-none tracking-tight opacity-0 text-accent/10">
          BLOOM
        </div>

        <div className="relative z-10 flex flex-col items-center gap-12 px-6 text-center">
          <div
            className="hero-main flex flex-col items-center gap-2"
            aria-label="Made with love. Crafted by hand."
          >
            <div className="overflow-hidden">
              <span
                className="hero-word block font-heading text-[clamp(54px,10vw,110px)] leading-[0.9] text-text"
                style={{ willChange: "transform, opacity" }}
              >
                Made with
              </span>
            </div>

            <div className="overflow-hidden">
              <span
                className="hero-word block font-heading text-[clamp(54px,10vw,110px)] leading-[0.9] text-accent"
                style={{ willChange: "transform, opacity" }}
              >
                Love.
              </span>
            </div>

            <div className="overflow-hidden">
              <span
                className="hero-word block font-heading text-[clamp(54px,10vw,110px)] leading-[0.9] text-text"
                style={{ willChange: "transform, opacity" }}
              >
                Crafted by hand.
              </span>
            </div>
          </div>

          <div className="hero-cta-row flex flex-wrap justify-center gap-3 opacity-0">
            <Link
              href="/products"
              className="rounded-full bg-accent px-6 py-3 text-[11px] font-bold uppercase tracking-[2px] text-text-on-accent transition-all duration-300 hover:-translate-y-[6px] hover:bg-accent-strong active:scale-95"
            >
              Shop Now
            </Link>
            <Link
              href="#categories"
              className="rounded-full border border-card-border bg-transparent px-6 py-3 text-[11px] uppercase tracking-[2px] text-text transition-all duration-300 hover:border-accent hover:text-accent"
            >
              Explore Categories
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
