export const siteConfig = {
  name: "株式会社Power CMS",
  description:
    "Power CMSは、自社開発のBMS・EMSを核に、系統用から産業用・家庭用まで蓄電ソリューションをワンストップで提供します。",
  url:
    (process.env.SITE_URL ??
      process.env.NEXT_PUBLIC_SITE_URL ??
      process.env.NEXT_PUBLIC_BASE_URL ??
      "").trim() || "https://powercms.pages.dev",
  ogImage: "/images/top/top-page-m-slider01.webp",
  locale: "ja_JP",
};

export function getSiteUrl() {
  return siteConfig.url;
}

type HeaderGetter = (name: string) => string | null | undefined;

export function resolveSiteUrlFromHeaders(getHeader: HeaderGetter) {
  const origin = getHeader("origin");
  if (origin) return origin;

  const referer = getHeader("referer");
  if (referer) {
    try {
      return new URL(referer).origin;
    } catch {
      // Ignore invalid referrer.
    }
  }

  const forwarded = getHeader("forwarded");
  if (forwarded) {
    const hostMatch = forwarded.match(/host=([^;,\s]+)/i);
    const protoMatch = forwarded.match(/proto=([^;,\s]+)/i);
    if (hostMatch?.[1]) {
      const proto = protoMatch?.[1] ?? "https";
      return `${proto}://${hostMatch[1]}`;
    }
  }

  const forwardedHost = getHeader("x-forwarded-host");
  const host =
    forwardedHost?.split(",")[0]?.trim() ??
    getHeader("x-host") ??
    getHeader("host");
  if (!host) return siteConfig.url;

  const forwardedProto = getHeader("x-forwarded-proto");
  const proto =
    forwardedProto?.split(",")[0]?.trim() ??
    getHeader("x-proto") ??
    "https";
  return `${proto}://${host}`;
}
