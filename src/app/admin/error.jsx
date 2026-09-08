"use client";

import { useEffect } from "react";

export default function Error({ error, reset }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="fixed inset-0 z-[9999] min-h-screen min-w-screen flex flex-col items-center justify-center gap-4 bg-[#000000] px-4">
      <h1 className="text-4xl text-[#E9E9E9] font-heading">
        ADMIN ERROR
      </h1>
      <p className="text-sm text-[#E9E9E9] opacity-60 text-center max-w-sm font-[family-name:var(--font-dm-sans)]">
        The admin panel encountered an error. If this persists, check your database connection.
      </p>
      <button
        onClick={reset}
        className="bg-[#defc3e] text-[#000000] font-semibold px-6 py-2 hover:opacity-80 transition-opacity"
      >
        TRY AGAIN
      </button>
    </div>
  );
}
