"use client";

import Link from "next/link";

export default function ErrorPage({ reset }: { reset: () => void }) {
  return (
    <main className="min-h-svh bg-brand-offwhite px-4 py-10 font-sans">
      <section className="mx-auto w-full max-w-[520px] rounded-2xl border border-brand-stone bg-white p-6 text-ink shadow-[0_10px_28px_rgba(15,23,42,0.08)]">
        <h1 className="text-[22px] font-bold">Something went wrong</h1>
        <p className="mt-2 text-ink/70">
          Please try again or return to the homepage.
        </p>
        <div className="mt-5 flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={() => reset()}
            className="inline-flex items-center justify-center rounded-full bg-brand-green-dark px-4 py-2 text-sm font-semibold text-white hover:bg-brand-green-dark/90"
          >
            Try again
          </button>
          <Link href="/" className="text-sm font-semibold text-brand-green-dark underline">
            Back to home
          </Link>
        </div>
      </section>
    </main>
  );
}
