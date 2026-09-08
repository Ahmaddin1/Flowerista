"use client";

import { useEffect } from "react";

export default function Error({ error, reset }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="fixed inset-0 z-[9999] min-h-screen min-w-screen flex flex-col items-center justify-center gap-4 bg-bg px-4">
      <h1 className="text-5xl text-text font-heading">
        Something went wrong
      </h1>
      <p className="text-sm text-muted-text text-center max-w-sm">
        An unexpected error occurred. Please try again.
      </p>
      <button
        onClick={reset}
        className="bg-accent text-text-on-accent font-semibold px-6 py-2.5 rounded-pill hover:bg-accent-strong transition-colors"
      >
        Try again
      </button>
    </div>
  );
}
