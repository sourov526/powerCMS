export const runtime = "nodejs";

import { NextIntlClientProvider } from '@/utils/strings/client';
import { getMessages } from '@/utils/strings/server';
import "./globals.css";
import "./styles/desktop.css";
import "./styles/mobile.css";
import "./styles/tablet.css";

import { ReactNode } from "react";
import { GeeeNTagManagerScript } from "@/components/analytics/GeeeNTagManager";
import {
  GoogleTagManagerNoscript,
  GoogleTagManagerScripts,
} from "@/components/analytics/GoogleTagManager";
import { MarketingHeadScripts } from "@/components/analytics/MarketingHeadScripts";
import BackToTopButton from "@/components/news/BackToTopButton";
import { fontInter, fontNotoSansJP } from "./fonts";

export default async function RootLayout({
  children,
}: {
  children: ReactNode;
}) {
  const enableMarketingScripts = process.env.NODE_ENV === "production";
  const messages = await getMessages({ locale: "en" });

  return (
    <html lang="en" className="h-full" suppressHydrationWarning>
      <head>
        {enableMarketingScripts ? (
          <>
            <MarketingHeadScripts />
            <GoogleTagManagerScripts />
            <GeeeNTagManagerScript />
          </>
        ) : null}
        <link rel="icon" href="/favicon.svg" sizes="any" type="image/svg+xml" />
        <link rel="shortcut icon" href="/favicon.svg" type="image/svg+xml" />
        <link rel="apple-touch-icon" sizes="180x180" href="/images/favicon/favicon_180x180px.svg" />
      </head>
      <body
        className={`${fontInter.variable} ${fontNotoSansJP.variable} font-sans overflow-auto!`}
        suppressHydrationWarning
      >
        {enableMarketingScripts ? <GoogleTagManagerNoscript /> : null}
        <NextIntlClientProvider locale="en" messages={messages}>
          {children}
          <BackToTopButton label={"Back to top"} />
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
