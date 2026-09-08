"use client";

import { useRef, useState, useLayoutEffect, useEffect } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

export default function HomeInfoSection() {
  const [openIndex, setOpenIndex] = useState(null);
  const [isMounted, setIsMounted] = useState(false);
  const answersRef = useRef([]);
  const leftColumnRef = useRef(null);
  const rightColumnItemsRef = useRef([]);
  const promoBoxesRef = useRef([]);

  const faqs = [
    {
      q: "How much does shipping cost?",
      a: "We charge a flat rate of Rs. 350/- on every order, nationwide. No minimum order required.",
    },
    {
      q: "How long does delivery take?",
      a: "Because every piece is handmade to order, please allow 2–4 business days for preparation, plus 2–4 working days for delivery after dispatch.",
    },
    {
      q: "Do you accept returns or exchanges?",
      a: "Because each piece is handmade to order, we cannot accept change-of-mind returns. If your item arrives damaged or incorrect, contact us within 7 days with photos and we'll make it right.",
    },
    {
      q: "What payment methods do you accept?",
      a: "We accept Cash on Delivery (COD) and Bank Transfer. No online payment gateway is required.",
    },
  ];

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (!isMounted) return;

    rightColumnItemsRef.current = rightColumnItemsRef.current.slice(
      0,
      faqs.length,
    );
    promoBoxesRef.current = promoBoxesRef.current.slice(0, 2);

    const ctx = gsap.context(() => {
      if (leftColumnRef.current) {
        gsap.set(leftColumnRef.current, {
          x: -40,
          autoAlpha: 0,
        });
      }

      const validRightItems = rightColumnItemsRef.current.filter(Boolean);
      if (validRightItems.length > 0) {
        gsap.set(validRightItems, { x: 40, autoAlpha: 0 });
      }

      const validPromoBoxes = promoBoxesRef.current.filter(Boolean);
      if (validPromoBoxes.length > 0) {
        gsap.set(validPromoBoxes, { y: 30, autoAlpha: 0 });
      }

      const mm = gsap.matchMedia();

      mm.add("(max-width: 1023px)", () => {
        // Mobile: separate animations with top 90% start
        if (leftColumnRef.current) {
          gsap.to(leftColumnRef.current, {
            x: 0,
            autoAlpha: 1,
            duration: 0.9,
            ease: "power2.out",
            scrollTrigger: {
              trigger: leftColumnRef.current,
              start: "top 90%",
              toggleActions: "play none none none",
            },
          });
        }

        if (validRightItems.length > 0) {
          validRightItems.forEach((item) => {
            gsap.to(item, {
              x: 0,
              autoAlpha: 1,
              duration: 0.9,
              ease: "power2.out",
              scrollTrigger: {
                trigger: item,
                start: "top 90%",
                toggleActions: "play none none none",
              },
            });
          });
        }

        if (validPromoBoxes.length > 0) {
          gsap.to(validPromoBoxes, {
            y: 0,
            autoAlpha: 1,
            duration: 0.9,
            stagger: 0.15,
            ease: "power2.out",
            scrollTrigger: {
              trigger: validPromoBoxes[0],
              start: "top 90%",
              toggleActions: "play none none none",
            },
          });
        }
      });

      mm.add("(min-width: 1024px)", () => {
        // Desktop: simultaneous animations with top 80% start
        const tl = gsap.timeline({
          scrollTrigger: {
            trigger: leftColumnRef.current,
            start: "top 80%",
            toggleActions: "play none none none",
          },
        });

        if (leftColumnRef.current) {
          tl.to(leftColumnRef.current, {
            x: 0,
            autoAlpha: 1,
            duration: 0.9,
            ease: "power2.out",
          });
        }

        if (validRightItems.length > 0) {
          tl.to(
            validRightItems,
            {
              x: 0,
              autoAlpha: 1,
              duration: 0.9,
              stagger: 0.12,
              ease: "power2.out",
            },
            "<",
          );
        }

        if (validPromoBoxes.length > 0) {
          tl.to(
            validPromoBoxes,
            {
              y: 0,
              autoAlpha: 1,
              duration: 0.9,
              stagger: 0.15,
              ease: "power2.out",
            },
            "-=0.2",
          );
        }
      });

      ScrollTrigger.refresh();
    });

    return () => ctx.revert();
  }, [isMounted, faqs.length]);

  useLayoutEffect(() => {
    answersRef.current.forEach((el, index) => {
      if (el) {
        if (openIndex === index) {
          gsap.fromTo(
            el,
            { height: 0, opacity: 0 },
            { height: "auto", opacity: 1, duration: 0.4, ease: "power2.out" },
          );
        } else {
          gsap.to(el, {
            height: 0,
            opacity: 0,
            duration: 0.3,
            ease: "power2.in",
          });
        }
      }
    });
  }, [openIndex]);

  return (
    <section className="w-full bg-bg text-text overflow-hidden">
      <div className="grid grid-cols-1 gap-16 px-6 py-20 lg:grid-cols-2 lg:px-16">
        <div ref={leftColumnRef}>
          <p className="mb-4 text-xs uppercase tracking-widest text-muted-text">
            HANDMADE CROCHET &amp; PIPE-CLEANER ART
          </p>
          <h2 className="mb-6 font-heading text-5xl leading-tight text-text lg:text-6xl">
            Crafted with care, made for you.
          </h2>
          <p className="mb-4 text-sm leading-relaxed text-muted-text">
            Every piece at Flowerista is made by hand — from soft crochet creations to intricate pipe-cleaner art. No two pieces are exactly alike.
          </p>
          <p className="text-sm leading-relaxed text-muted-text">
            Questions?{" "}
            <a
              href={`https://wa.me/${process.env.NEXT_PUBLIC_WHATSAPP_NUMBER}`}
              className="font-bold text-accent-strong"
            >
              WhatsApp us anytime.
            </a>
          </p>
        </div>

        <div className="space-y-3">
          {faqs.map((faq, index) => (
            <div
              key={index}
              ref={(el) => {
                rightColumnItemsRef.current[index] = el;
              }}
              className={`rounded-[22px] border bg-card transition-colors hover:border-accent ${
                openIndex === index ? "border-accent" : "border-card-border"
              }`}
            >
              <button
                onClick={() => setOpenIndex(openIndex === index ? null : index)}
                className="flex w-full items-center justify-between px-4 py-4 text-left"
              >
                <span className="text-sm font-medium text-text">
                  {faq.q}
                </span>
                <span className="text-lg text-text">
                  {openIndex === index ? "−" : "+"}
                </span>
              </button>
              <div
                ref={(el) => (answersRef.current[index] = el)}
                className="overflow-hidden"
                style={{ height: 0, opacity: 0 }}
              >
                <div className="px-4 pb-4 text-sm leading-relaxed text-muted-text">
                  {faq.a}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="px-6 py-10">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-15">
          <div
            ref={(el) => {
              promoBoxesRef.current[0] = el;
            }}
            className="flex flex-col items-center justify-center text-center py-14 px-8 border border-card-border rounded-lg bg-card"
          >
            <p className="text-sm font-bold text-text">
              Flat-rate shipping
            </p>
            <p className="text-xs text-muted-text">on every order, nationwide</p>
          </div>
          <div
            ref={(el) => {
              promoBoxesRef.current[1] = el;
            }}
            className="flex flex-col items-center justify-center text-center py-14 px-8 border border-card-border rounded-lg bg-card"
          >
            <p className="text-sm font-bold text-text">Handmade to order</p>
            <p className="text-xs text-muted-text">every piece made with care</p>
          </div>
        </div>
      </div>
    </section>
  );
}
