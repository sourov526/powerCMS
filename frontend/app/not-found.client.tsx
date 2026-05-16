"use client";

import Link from "next/link";
import { useEffect } from "react";

export default function NotFoundClient() {
  useEffect(() => {
    const { pathname, search } = window.location;
    const path = search ? `${pathname}${search}` : pathname;
    fetch("/api/404", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ path }),
    }).catch(() => undefined);
  }, []);

  return (
    <main className="min-h-svh bg-brand-offwhite px-4 py-8 font-sans sm:px-6 md:px-10 md:py-12">
      <section className="mx-auto flex w-full max-w-xl flex-col rounded-2xl border border-brand-stone bg-white px-5 py-6 text-ink shadow-[0_10px_28px_rgba(15,23,42,0.08)] sm:px-7 sm:py-8 md:max-w-2xl md:px-10 md:py-10">
        <p className="m-0 text-[0.74rem] font-bold uppercase tracking-[0.16em] text-brand-green-dark">
          Error 404
        </p>
        <h1 className="mt-2 text-center text-[clamp(5rem,18vw,8.2rem)] font-extrabold leading-[1.7] text-brand-green-dark [text-shadow:0_2px_0_#fff,0_10px_20px_rgba(37,36,34,0.20)]">
          404
        </h1>
        <h2 className="mt-2 text-center text-[clamp(1.45rem,4vw,2rem)] font-bold leading-tight">
          Page Not Found
        </h2>
        <blockquote className="mx-auto mt-3 max-w-[54ch] text-center text-[0.94rem] italic leading-relaxed text-ink/70 sm:text-[0.98rem]">
          The page you are looking for may have moved, been deleted, or never
          existed.
        </blockquote>

        <div className="mt-6 flex w-full flex-col items-stretch justify-center gap-2 sm:flex-row sm:items-center">
          <Link
            href="/"
            className="inline-flex items-center justify-center text-[0.95rem] font-bold text-brand-green-dark underline underline-offset-2 transition-colors duration-150 hover:text-brand-green-dark/90"
          >
            Back to Home
          </Link>
          <button
            type="button"
            className="inline-flex min-w-[140px] items-center justify-center rounded-lg border border-brand-green-dark bg-brand-green-dark px-[18px] py-[11px] text-[0.9rem] font-bold text-white shadow-[0_2px_8px_rgba(15,23,42,0.08)] transition-all duration-150 hover:-translate-y-px hover:bg-brand-green-dark/90"
            onClick={() => window.history.back()}
          >
            Go Back
          </button>
        </div>
      </section>
    </main>
  );
}
