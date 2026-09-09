"use client";

import { ChevronUp } from "lucide-react";

export default function ScrollToTop() {
  return (
    <button
      onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
      className="fixed bottom-28 right-6 z-50 md:bottom-8 flex h-12 w-12 items-center justify-center rounded-full bg-accent shadow-[var(--shadow-card)] transition-transform hover:scale-110 active:scale-90"
      aria-label="Scroll to top"
    >
      <ChevronUp className="h-6 w-6 text-text-on-accent" strokeWidth={2} />
    </button>
  );
}
