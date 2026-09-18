"use client";

import { ArrowRight, Plus, Minus, ChevronRight } from "lucide-react";
import { useRef, useState, useMemo, useEffect } from "react";
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
    // NOTE: same URL as "crochet" above — placeholder, swap before launch.
    image:
      "https://images.unsplash.com/photo-1610701596007-11502861dcfa?auto=format&fit=crop&w=1600&q=80",
    alt: "Pipe cleaner floral art",
  },
];

/* ------------------------------------------------------------------ */
/* Geometry + motion tokens
/* The initial (pre-interaction) markup and every GSAP tween both read */
/* from these two objects, so the resting size can never drift from    */
/* the animated-to size again (that drift was the old bug: the initial */
/* JSX used 95vw/45vh while these constants said 99vw/50vh).          */
/* ------------------------------------------------------------------ */
const OPEN = { w: "99vw", h: "50vh", scale: 1.1 };
const CLOSED = { w: "80vw", h: "20vh", scale: 0.9 };

const DEFAULT_OPEN_INDEX = 0;
const DURATION = 0.7;
const EASE = "power3.inOut";
const LABEL_DELAY = 0.05; // 100ms-ish lag on the label when opening

// "99vw" -> "49.5vw". Used to center the oversized image layer on the
// card. Deriving this from OPEN instead of hand-typing it means it can
// never fall out of sync with OPEN again.
function half(value) {
  const m = /^(-?\d*\.?\d+)([a-z%]+)$/.exec(value);
  if (!m) return value;
  return `${parseFloat(m[1]) / 2}${m[2]}`;
}

// Applies one panel's visual state (open or closed) onto a GSAP timeline.
// Replaces the old ~45-line "collapse the previous / expand the next"
// duplication with one function called twice.
function applyPanelState(tl, panel, { open, delay = 0 }) {
  if (!panel) return;
  const dims = open ? OPEN : CLOSED;
  const pillState = open
    ? { opacity: 1, y: 0, stagger: 0.07 }
    : { opacity: 0, y: 50, stagger: 0.1 };

  tl.to(panel.minus, { opacity: open ? 1 : 0 }, 0);
  tl.to(panel.plus, { opacity: open ? 0 : 1 }, 0);
  tl.to(panel.card, { width: dims.w, height: dims.h }, 0);
  tl.to(panel.rail, { width: dims.w, height: dims.h }, open ? delay : 0);
  tl.to(panel.image, { scale: dims.scale }, 0);
  tl.to(
    panel.cta,
    {
      backgroundColor: open ? "#e51f76" : "rgba(0,0,0,0)",
      color: open ? "#ffffff" : "#000000",
    },
    0,
  );
  if (panel.pills?.length) {
    tl.to(panel.pills.filter(Boolean), pillState, open ? delay : 0);
  }
}

export default function CategorySection({ id, categories = CATEGORIES }) {
  const topLevel = useMemo(
    () => categories.filter((c) => !c.parentSlug),
    [categories],
  );
  const [openIndex, setOpenIndex] = useState(DEFAULT_OPEN_INDEX);

  // One ref bucket per card instead of seven parallel ref arrays.
  const panelRefs = useRef([]);
  const tlRef = useRef(null);
  const reducedMotionRef = useRef(false);

  useEffect(() => {
    reducedMotionRef.current = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    // Kill any in-flight tween if this section unmounts mid-animation —
    // the original had no cleanup, so GSAP could end up animating
    // DOM nodes that no longer exist.
    return () => tlRef.current?.kill();
  }, []);

  const getRef = (i, key) => (el) => {
    if (!panelRefs.current[i]) panelRefs.current[i] = { pills: [] };
    panelRefs.current[i][key] = el;
  };

  const getPillRef = (i, j) => (el) => {
    if (!panelRefs.current[i]) panelRefs.current[i] = { pills: [] };
    if (!panelRefs.current[i].pills) panelRefs.current[i].pills = [];
    panelRefs.current[i].pills[j] = el;
  };

  const handleToggle = (index) => {
    const prev = openIndex;
    const next = index === openIndex ? null : index;
    setOpenIndex(next);

    const dur = reducedMotionRef.current ? 0 : DURATION;
    const delay = reducedMotionRef.current ? 0 : LABEL_DELAY;

    tlRef.current?.kill();
    const tl = gsap.timeline({ defaults: { duration: dur, ease: EASE } });
    tlRef.current = tl;

    if (prev !== null) {
      applyPanelState(tl, panelRefs.current[prev], { open: false, delay });
    }
    if (next !== null) {
      applyPanelState(tl, panelRefs.current[next], { open: true, delay });
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
              // isDefaultOpen never changes across re-renders (it only
              // depends on index), so React never re-writes these inline
              // styles after mount — GSAP owns them from the first click
              // onward. It's deliberately NOT tied to `openIndex`/`isOpen`;
              // if it were, React would snap the size to its final value
              // instantly on every toggle and GSAP would have nothing
              // left to animate from.
              const isDefaultOpen = i === DEFAULT_OPEN_INDEX;
              const isOpen = i === openIndex;
              const dims = isDefaultOpen ? OPEN : CLOSED;
              const subcategories = categories.filter(
                (c) => c.parentSlug === category.slug,
              );
              const hasMobileVariant =
                category.imageMobile && category.imageMobile !== category.image;

              return (
                <div
                  key={category.slug}
                  ref={getRef(i, "card")}
                  style={{ width: dims.w, height: dims.h }}
                  className="relative overflow-hidden rounded-[16px] bg-white"
                >
                  {/* Image layer: fixed at the OPEN dimensions, centered on
                      the card center, so the middle of the image is always
                      what shows through the clipped window. Only `scale`
                      (cheap, GPU-only) changes when the card resizes —
                      no image relayout on toggle. */}
                  <div
                    ref={getRef(i, "image")}
                    style={{
                      width: OPEN.w,
                      height: OPEN.h,
                      marginLeft: `-${half(OPEN.w)}`,
                      marginTop: `-${half(OPEN.h)}`,
                      transform: `scale(${dims.scale})`,
                    }}
                    className="pointer-events-none absolute left-1/2 top-1/2 origin-center will-change-transform"
                  >
                    {category.image ? (
                      hasMobileVariant ? (
                        <>
                          {/* Only rendered when a distinct mobile crop
                              actually exists — otherwise this doubled the
                              image payload for nothing. */}
                          <Image
                            src={category.imageMobile}
                            alt={category.alt || category.name}
                            fill
                            sizes={OPEN.w}
                            priority={isDefaultOpen}
                            className="object-cover lg:hidden"
                          />
                          <Image
                            src={category.image}
                            alt={category.alt || category.name}
                            fill
                            sizes={OPEN.w}
                            priority={isDefaultOpen}
                            className="object-cover hidden lg:block"
                          />
                        </>
                      ) : (
                        <Image
                          src={category.image}
                          alt={category.alt || category.name}
                          fill
                          sizes={OPEN.w}
                          priority={isDefaultOpen}
                          className="object-cover"
                        />
                      )
                    ) : (
                      <div className="h-full w-full bg-white" />
                    )}
                  </div>

                  {/* Click surface — sits under the CTA, above the image. */}
                  <button
                    type="button"
                    onClick={() => handleToggle(i)}
                    aria-expanded={isOpen}
                    aria-label={`${isOpen ? "Hide" : "Show"} ${category.name}`}
                    className="absolute inset-0 z-10 cursor-pointer focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[-4px] focus-visible:outline-accent-strong"
                  />

                  {/* Label rail: height is animated separately so the label
                      trails the card edge by ~50ms on open. */}
                  <div
                    ref={getRef(i, "rail")}
                    style={{ width: dims.w, height: dims.h }}
                    className="pointer-events-none absolute left-0 top-0 z-20"
                  >
                    <p className="absolute top-0 left-0 max-w-[60%] p-5 text-left font-heading text-[clamp(22px,4vw,40px)] uppercase leading-[1.05] tracking-[0.08em] text-black md:max-w-[70%] md:p-8">
                      {category.name}
                    </p>

                    <div className="pointer-events-none absolute top-5 right-5 h-5 w-5 md:top-8 md:right-8">
                      <Plus
                        ref={getRef(i, "plus")}
                        size={20}
                        className="absolute inset-0 text-black"
                        style={{ opacity: isDefaultOpen ? 0 : 1 }}
                      />
                      <Minus
                        ref={getRef(i, "minus")}
                        size={20}
                        className="absolute inset-0 text-black"
                        style={{ opacity: isDefaultOpen ? 1 : 0 }}
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
                              ref={getPillRef(i, j)}
                              href={`/products?category=${category.slug}&subcategory=${sub.slug}`}
                              className="flex items-center gap-1 rounded-[22px] border border-black/50 px-4 py-1.5 font-sans text-xs font-medium text-black hover:bg-black/5"
                              style={{
                                opacity: isDefaultOpen ? 1 : 0,
                                transform: isDefaultOpen
                                  ? "translateY(0px)"
                                  : "translateY(12px)",
                              }}
                            >
                              <div className="flex items-center justify-center">
                                {sub.name} <ChevronRight size={16} />
                              </div>
                            </Link>
                          ))}
                        </div>
                      )}

                      <Link
                        ref={getRef(i, "cta")}
                        href={`/products?category=${category.slug}`}
                        className="pointer-events-auto flex items-center gap-1 self-end rounded-[22px] px-5 py-2.5 font-sans text-sm font-medium"
                        style={{
                          backgroundColor: isDefaultOpen
                            ? "#e51f76"
                            : "rgba(0,0,0,0)",
                          color: isDefaultOpen ? "#ffffff" : "#000000",
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
