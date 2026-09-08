import Link from "next/link";

export default function NotFound() {
  return (
    <section className="flex min-h-screen overflow-hidden fixed inset-0 items-center justify-center bg-black px-6 py-24">
      <div className="flex max-w-md flex-col items-center text-center">
        <h1
          className="font-heading leading-none tracking-[0.08em] text-[#defc3e]"
          style={{ fontSize: "clamp(120px, 24vw, 220px)" }}
        >
          404
        </h1>
        <p className="mt-3 text-base text-white/72 sm:text-lg">
          Page not found :(
        </p>
        <Link
          href="/"
          className="mt-8 inline-flex items-center justify-center rounded-full bg-[#defc3e] px-6 py-3 text-sm font-semibold uppercase tracking-[0.24em] text-black transition-transform duration-200 hover:scale-[1.02]"
        >
          Go Home
        </Link>
      </div>
    </section>
  );
}
