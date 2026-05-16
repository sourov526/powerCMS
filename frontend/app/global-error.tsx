"use client";

import { GeeeNTagManagerScript } from "@/components/analytics/GeeeNTagManager";
import {
  GoogleTagManagerNoscript,
  GoogleTagManagerScripts,
} from "@/components/analytics/GoogleTagManager";
import { MarketingHeadScripts } from "@/components/analytics/MarketingHeadScripts";
import Link from "next/link";

export default function GlobalError({ reset }: { reset: () => void }) {
  return (
    <html lang="ja">
      <head>
        <MarketingHeadScripts />
        {/* GeeeN Tag Manager */}
        <GeeeNTagManagerScript />
        {/* End GeeeN Tag Manager */}
        {/* Google Tag Manager */}
        <GoogleTagManagerScripts />
        {/* End Google Tag Manager */}
      </head>
      <body className="bg-brand-offwhite text-ink font-sans">
        <GoogleTagManagerNoscript />
        <main className="px-4 py-10">
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
              <Link
                href="/"
                className="text-sm font-semibold text-brand-green-dark underline"
              >
                Back to home
              </Link>
            </div>
          </section>
        </main>
      </body>
    </html>
  );
}
