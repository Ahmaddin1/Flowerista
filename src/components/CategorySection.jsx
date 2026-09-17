"use client";

import { ArrowRight, Plus, Minus, ChevronRight } from "lucide-react";
import { useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import gsap from "gsap";

/* ------------------------------------------------------------------ */
/* Data — add/remove entries here. The component adapts automatically. */
/* ------------------------------------------------------------------ */
const CATEGORIES = [
  {
    slug: "crochet",
    name: "Crochet",
    image:
      "https://images.unsplash.com/photo-1610701596007-11502861dcfa?auto=format&fit=crop&w=1600&q=80",
    alt: "Handmade crochet flowers",
  },
  {
    slug: "pipecleaner-art",
    name: "Pipecleaner Art",
    image:
      "https://images.unsplash.com/photo-1610701596007-11502861dcfa?auto=format&fit=crop&w=1600&q=80",

    alt: "Pipe cleaner floral art",
  },
];

/* ------------------------------------------------------------------ */
/* Geometry + motion tokens                 */
/* ------------------------------------------------------------------ */
const OPEN = { w: "99vw", h: "50vh", scale: 1.25 };
const CLOSED = { w: "85vw", h: "20vh", scale: 1 };

const DEFAULT_OPEN_INDEX = 0;
const DURATION = 0.7;
const EASE = "power3.inOut";
const LABEL_DELAY = 0.05; // 100ms lag on the label when opening

export default function CategorySection({ id, categories = CATEGORIES }) {
  const topLevel = categories.filter((c) => !c.parentSlug);
  const [openIndex, setOpenIndex] = useState(DEFAULT_OPEN_INDEX);

  const cardRefs = useRef([]);
  const railRefs = useRef([]);
  const imageRefs = useRef([]);
  const ctaRefs = useRef([]);
  const tlRef = useRef(null);
  const plusRefs = useRef([]);
  const minusRefs = useRef([]);
  const pillRefs = useRef([]);

  const handleToggle = (index) => {
    const prev = openIndex;
    const next = index === openIndex ? null : index;
    setOpenIndex(next);

    const reduced =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const dur = reduced ? 0 : DURATION;
    const labelDelay = reduced ? 0 : LABEL_DELAY;

    tlRef.current?.kill();
    const tl = gsap.timeline({ defaults: { duration: dur, ease: EASE } });
    tlRef.current = tl;

    /* ---- collapse whichever panel was open ---- */
    if (prev !== null) {
      tl.to(minusRefs.current[prev], { opacity: 0 }, 0);
      tl.to(plusRefs.current[prev], { opacity: 1 }, 0);
      tl.to(cardRefs.current[prev], { width: CLOSED.w, height: CLOSED.h }, 0);
      tl.to(railRefs.current[prev], { width: CLOSED.w, height: CLOSED.h }, 0);
      tl.to(imageRefs.current[prev], { scale: CLOSED.scale }, 0);
      tl.to(
        ctaRefs.current[prev],
        { backgroundColor: "rgba(0,0,0,0)", color: "#000000" },
        0,
      );
      if (pillRefs.current[prev]?.length) {
        tl.to(
          pillRefs.current[prev].filter(Boolean),
          { opacity: 0, y: 50, stagger: 0.07 },
          0,
        );
      }
    }

    /* ---- expand the newly opened panel ---- */
    if (next !== null) {
      tl.to(plusRefs.current[next], { opacity: 0 }, 0);
      tl.to(minusRefs.current[next], { opacity: 1 }, 0);
      tl.to(cardRefs.current[next], { width: OPEN.w, height: OPEN.h }, 0);
      tl.to(
        railRefs.current[next],
        { width: OPEN.w, height: OPEN.h },
        labelDelay,
      );
      tl.to(imageRefs.current[next], { scale: OPEN.scale }, 0);
      tl.to(
        ctaRefs.current[next],
        { backgroundColor: "#e51f76", color: "#ffffff" },
        0,
      );
      if (pillRefs.current[next]?.length) {
        tl.to(
          pillRefs.current[next].filter(Boolean),
          { opacity: 1, y: 0, stagger: 0.03 },
          labelDelay,
        );
      }
    }
  };

  return (
    <section id={id} className="scroll-mt-24">
      {topLevel.length === 0 ? (
        <p className="px-4 text-center text-[12px] uppercase tracking-[3px] text-muted-text">
          More categories coming soon.
        </p>
      ) : (
        <>
          <div className="flex flex-col items-center gap-2 py-2">
            {topLevel.map((category, i) => {
              const initiallyOpen = i === DEFAULT_OPEN_INDEX;
              const isOpen = i === openIndex;
              const subcategories = categories.filter(
                (c) => c.parentSlug === category.slug,
              );

              return (
                <div
                  key={category.slug}
                  ref={(el) => {
                    cardRefs.current[i] = el;
                  }}
                  className={[
                    "relative overflow-hidden rounded-[16px] bg-white",
                    initiallyOpen ? "h-[45vh] w-[95vw]" : "h-[20vh] w-[80vw]",
                  ].join(" ")}
                >
                  {/* Image layer: fixed at the OPEN dimensions, centred on the
                      card centre, so the middle of the image is always what
                      shows through the clipped window. Never resized. */}
                  <div
                    ref={(el) => {
                      imageRefs.current[i] = el;
                    }}
                    className={[
                      "pointer-events-none absolute left-1/2 top-1/2",
                      "ml-[-47.5vw] mt-[-22.5vh] h-[45vh] w-[95vw]",
                      "origin-center will-change-transform",
                      initiallyOpen ? "scale-125" : "scale-100",
                    ].join(" ")}
                  >
                    {category.image ? (
                      <Image
                        src={category.image}
                        alt={category.alt || category.name}
                        fill
                        unoptimized
                        sizes="95vw"
                        priority={initiallyOpen}
                        className="object-cover"
                      />
                    ) : (
                      <div className="h-full w-full bg-white" />
                    )}
                  </div>

                  {/* Click surface — sits under the CTA, above the image. */}
                  <button
                    type="button"
                    onClick={() => handleToggle(i)}
                    aria-expanded={isOpen}
                    aria-label={`Show ${category.name}`}
                    className="absolute inset-0 z-10 cursor-pointer focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[-4px] focus-visible:outline-accent-strong"
                  />

                  {/* Label rail: height is animated separately so the label
                      trails the card edge by 100ms on open. */}
                  <div
                    ref={(el) => {
                      railRefs.current[i] = el;
                    }}
                    className={[
                      "pointer-events-none absolute left-0 top-0 z-20",
                      initiallyOpen ? "h-[45vh] w-[95vw]" : "h-[20vh] w-[80vw]",
                    ].join(" ")}
                  >
                    <p className="absolute top-0 left-0 max-w-[60%] p-5 text-left font-heading text-[clamp(22px,4vw,40px)] uppercase leading-[1.05] tracking-[0.08em] text-black md:max-w-[70%] md:p-8">
                      {category.name}
                    </p>

                    <div className="pointer-events-none absolute top-5 right-5 h-5 w-5 md:top-8 md:right-8">
                      <Plus
                        ref={(el) => {
                          plusRefs.current[i] = el;
                        }}
                        size={20}
                        className="absolute inset-0 text-black"
                        style={{ opacity: initiallyOpen ? 0 : 1 }}
                      />
                      <Minus
                        ref={(el) => {
                          minusRefs.current[i] = el;
                        }}
                        size={20}
                        className="absolute inset-0 text-black"
                        style={{ opacity: initiallyOpen ? 1 : 0 }}
                      />
                    </div>

                    <div className="pointer-events-none absolute inset-x-5 bottom-5 z-20 flex flex-col items-start gap-3 md:inset-x-8 md:bottom-8">
                      {subcategories.length > 0 && (
                        <div
                          className={[
                            "flex flex-wrap gap-2",
                            isOpen
                              ? "pointer-events-auto"
                              : "pointer-events-none",
                          ].join(" ")}
                        >
                          {subcategories.map((sub, j) => (
                            <Link
                              key={sub.slug}
                              ref={(el) => {
                                if (!pillRefs.current[i])
                                  pillRefs.current[i] = [];
                                pillRefs.current[i][j] = el;
                              }}
                              href={`/products?category=${category.slug}&subcategory=${sub.slug}`}
                              className="flex items-center gap-1 rounded-[22px] border border-accent/50 px-4 py-1.5 font-sans text-xs font-medium text-accent hover:bg-black/5"
                              style={{
                                opacity: initiallyOpen ? 1 : 0,
                                transform: initiallyOpen
                                  ? "translateY(0px)"
                                  : "translateY(12px)",
                              }}
                            >
                              <div className="flex items-center justify-center">
                                {" "}
                                {sub.name} <ChevronRight size={16} />
                              </div>
                            </Link>
                          ))}
                        </div>
                      )}

                      <Link
                        ref={(el) => {
                          ctaRefs.current[i] = el;
                        }}
                        href={`/products?category=${category.slug}`}
                        className="pointer-events-auto flex items-center gap-1 self-end rounded-[22px] px-5 py-2.5 font-sans text-sm font-medium"
                        style={{
                          backgroundColor: initiallyOpen
                            ? "#e51f76"
                            : "rgba(0,0,0,0)",
                          color: initiallyOpen ? "#ffffff" : "#000000",
                        }}
                      >
                        View category <ArrowRight size={16} />
                      </Link>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mt-6 flex justify-center">
            <Link
              href="/products"
              className="flex items-center font-sans font-medium text-accent-strong"
            >
              View All <ArrowRight className="ml-1" size={16} />
            </Link>
          </div>
        </>
      )}
    </section>
  );
}
