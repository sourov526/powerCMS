import jpMetaConfig from "@/api/messages/meta/jp.json";
import type { Metadata } from "next";

export type RouteLocale = "ja";

type MetaPageConfig = {
  title?: string;
  description?: string;
  canonical?: string | null;
  robots?: string;
  titleTemplate?: string;
  descriptionTemplate?: string;
  canonicalTemplate?: string | null;
  titleTemplates?: Record<string, string>;
  ogType?: "website" | "article" | string | null;
  ogTitle?: string | null;
  ogDescription?: string | null;
  ogUrl?: string | null;
  ogImage?: string | null;
  ogImageSecureUrl?: string | null;
  articlePublishedTime?: string | null;
  articleModifiedTime?: string | null;
  twitterCard?: "summary" | "summary_large_image" | string | null;
  twitterTitle?: string | null;
  twitterDescription?: string | null;
  twitterImage?: string | null;
  twitterSite?: string | null;
  twitterCreator?: string | null;
};

type MetaConfig = {
  site: {
    name: string;
    description: string;
    baseUrl: string;
    defaultRobots: string;
    generator?: string;
    defaultOgImage: string;
    defaultOgType?: "website" | "article" | string;
    ogSiteNameTemplate?: string | null;
    defaultTwitterCard: "summary" | "summary_large_image" | string;
    defaultTwitterSite?: string | null;
    defaultTwitterCreator?: string | null;
    locale: string;
  };
  pages: Record<string, MetaPageConfig>;
};

export type ResolvedSiteWideSeo = {
  title: string;
  description: string;
  canonical: string;
  robots: string;
  generator: string;
  ogLocale: string;
  siteName: string;
  ogType: "website" | "article";
  ogTitle: string;
  ogDescription: string;
  ogUrl: string;
  ogImage: string;
  ogImageSecureUrl: string;
  articlePublishedTime?: string;
  articleModifiedTime?: string;
  twitterCard: "summary" | "summary_large_image";
  twitterTitle: string;
  twitterDescription: string;
  twitterImage: string;
  twitterSite?: string;
  twitterCreator?: string;
};

const BRAND_NAME_OVERRIDES: Array<{ from: string; to: string }> = [
  { from: "株式会社ブランドクラウド", to: "株式会社Power CMS" },
];
const Power CMS_BRAND_LABEL = "株式会社Power CMS";
const Power CMS_DEFAULT_DESCRIPTION =
  "株式会社Power CMSは、蓄電池システム（BESS）を中心に、再生可能エネルギーの導入・運用を支援し、持続可能なエネルギーインフラの実現に取り組んでいます。";

function applyBrandOverride(input: string) {
  let output = input;
  BRAND_NAME_OVERRIDES.forEach(({ from, to }) => {
    output = output.replaceAll(from, to);
  });
  return output;
}

function ensureHobeDescription(input: string) {
  const normalized = applyBrandOverride(input).trim();
  if (!normalized) return Power CMS_DEFAULT_DESCRIPTION;
  if (/hobe\s*energy/i.test(normalized) || normalized.includes(Power CMS_BRAND_LABEL)) {
    return normalized;
  }
  return `${Power CMS_BRAND_LABEL} - ${normalized}`;
}

function getConfigByLocale(locale: string): MetaConfig {
  if (locale === "ja") return jpMetaConfig as MetaConfig;
  return jpMetaConfig as MetaConfig;
}

function normalizeOgType(
  value: string | null | undefined
): "website" | "article" {
  return value === "website" ? "website" : "article";
}

function normalizeTwitterCard(
  value: string | null | undefined
): "summary" | "summary_large_image" {
  return value === "summary" ? "summary" : "summary_large_image";
}

function normalizeOptionalString(value: string | null | undefined) {
  return value ?? undefined;
}

function ensureSlashes(pathname: string) {
  if (!pathname || pathname === "/") return "/";
  const trimmed = pathname.replace(/\/+/g, "/").replace(/\/$/, "");
  return `${trimmed}/`;
}

function sanitizePathCandidate(pathname: string) {
  const noQuery = pathname.split("?")[0] || "/";
  const stripped = noQuery
    .replace(/\/(page|route)$/, "")
    .replace(/\/\([^/]+\)/g, "")
    .replace(/\/\[locale\](?=\/|$)/g, "");
  return stripped || "/";
}

function normalizeRoutePath(pathname: string, locale: RouteLocale) {
  const clean = pathname.split("?")[0] || "/";
  const rawSegments = clean.split("/").filter(Boolean);
  const localeLike = new Set(["ja", locale]);
  const segments = [...rawSegments];
  while (segments.length > 0 && localeLike.has(segments[0])) {
    segments.shift();
  }
  const normalized = `/${segments.join("/")}`;
  return ensureSlashes(normalized || "/");
}

function pickPathFromHeaders(getHeader: (name: string) => string | null) {
  const directCandidates = [
    "x-pathname",
    "x-nextjs-matched-path",
    "x-next-pathname",
    "x-forwarded-uri",
    "x-original-uri",
  ];
  for (const headerName of directCandidates) {
    const value = getHeader(headerName);
    if (value) return sanitizePathCandidate(value);
  }

  const candidates = [
    getHeader("next-url"),
    getHeader("x-invoke-path"),
    getHeader("x-matched-path"),
    getHeader("x-nextjs-route"),
    getHeader("x-rewrite-url"),
  ].filter(Boolean) as string[];

  for (const candidate of candidates) {
    try {
      if (candidate.startsWith("http://") || candidate.startsWith("https://")) {
        return sanitizePathCandidate(new URL(candidate).pathname);
      }
      return sanitizePathCandidate(candidate);
    } catch {
      // Ignore invalid values and continue.
    }
  }
  const referer = getHeader("referer");
  if (referer) {
    try {
      return sanitizePathCandidate(new URL(referer).pathname);
    } catch {
      // Ignore invalid referer.
    }
  }
  return "/";
}

function resolvePageConfig(config: MetaConfig, normalizedPath: string) {
  const pages = config.pages;
  const direct =
    pages[normalizedPath] ?? pages[normalizedPath.replace(/\/$/, "")];
  if (direct) return { page: direct, routeKey: normalizedPath };

  // Handle paths that accidentally keep locale segments (e.g. /ja/company/about/).
  const withoutLocalePrefix =
    normalizedPath.replace(/^\/(?:ja)(?=\/|$)/, "") || "/";
  const directWithoutLocale =
    pages[withoutLocalePrefix] ?? pages[withoutLocalePrefix.replace(/\/$/, "")];
  if (directWithoutLocale) {
    return {
      page: directWithoutLocale,
      routeKey: ensureSlashes(withoutLocalePrefix),
    };
  }

  const withQuery = Object.entries(pages).find(([key]) =>
    key.startsWith(normalizedPath)
  );
  if (withQuery) return { page: withQuery[1], routeKey: withQuery[0] };

  // Final fallback: longest key that matches the end of the requested path.
  const suffixMatch = Object.entries(pages)
    .filter(
      ([key]) => key !== "/" && normalizedPath.endsWith(ensureSlashes(key))
    )
    .sort((a, b) => b[0].length - a[0].length)[0];
  if (suffixMatch) return { page: suffixMatch[1], routeKey: suffixMatch[0] };

  const categoryMatch = normalizedPath.match(/^\/category\/news\/([^/]+)\/$/);
  if (categoryMatch) {
    const page = pages["/category/news/{category}/"];
    if (page)
      return {
        page,
        routeKey: "/category/news/{category}/",
        slug: categoryMatch[1],
      };
  }

  return { page: undefined, routeKey: normalizedPath };
}

function renderTemplate(template: string, values: Record<string, string>) {
  return template.replace(
    /\{\{\s*([^}]+)\s*\}\}/g,
    (_, key: string) => values[key] ?? ""
  );
}

function normalizeAbsoluteUrl(url: string | undefined, fallbackBase: string) {
  if (!url) return undefined;
  try {
    return new URL(url, fallbackBase).toString();
  } catch {
    return undefined;
  }
}

function rebaseUrlToCurrentOrigin(
  url: string | undefined,
  currentBaseUrl: string
) {
  if (!url) return undefined;
  try {
    const parsed = new URL(url, currentBaseUrl);
    const current = new URL(currentBaseUrl);
    return new URL(
      `${parsed.pathname}${parsed.search}${parsed.hash}`,
      current
    ).toString();
  } catch {
    return undefined;
  }
}

export function resolveSiteWideSeo(input: {
  locale: RouteLocale;
  baseUrl: string;
  pathFromHeaders: string;
  ogImageUrl: string;
}): ResolvedSiteWideSeo {
  const config = getConfigByLocale(input.locale);
  const normalizedPath = normalizeRoutePath(
    input.pathFromHeaders,
    input.locale
  );
  const resolved = resolvePageConfig(config, normalizedPath);
  const page = resolved.page;

  const fallbackTitle = config.site.name;
  const fallbackDescription = "";
  const title =
    page?.title ??
    (page?.titleTemplate
      ? renderTemplate(page.titleTemplate, {
          postTitle: config.site.name,
          postSlug: "",
        })
      : fallbackTitle);
  const description =
    page?.description ?? page?.descriptionTemplate ?? fallbackDescription;

  const canonicalFromConfig =
    page?.canonical ??
    (page?.canonicalTemplate
      ? page.canonicalTemplate.replace("{category}", resolved.slug ?? "")
      : undefined) ??
    normalizeAbsoluteUrl(
      `${config.site.baseUrl}${normalizedPath}`,
      input.baseUrl
    );
  const canonical =
    rebaseUrlToCurrentOrigin(canonicalFromConfig, input.baseUrl) ??
    normalizeAbsoluteUrl(normalizedPath, input.baseUrl) ??
    input.baseUrl;

  const categoryTitle =
    page?.titleTemplates && resolved.slug
      ? page.titleTemplates[resolved.slug]
      : undefined;
  const finalTitle = categoryTitle ?? title;
  const robots = page?.robots ?? config.site.defaultRobots;
  // DB-managed OG image must take precedence over static JSON defaults.
  const ogImageRaw =
    input.ogImageUrl ?? page?.ogImage ?? config.site.defaultOgImage;
  const ogImage = normalizeAbsoluteUrl(ogImageRaw, input.baseUrl) ?? ogImageRaw;
  const ogImageSecureRaw =
    input.ogImageUrl ??
    page?.ogImageSecureUrl ??
    page?.ogImage ??
    config.site.defaultOgImage;
  const ogImageSecureUrl =
    normalizeAbsoluteUrl(ogImageSecureRaw, input.baseUrl) ??
    normalizeAbsoluteUrl(ogImage, input.baseUrl) ??
    ogImage;
  const ogTitle = page?.ogTitle ?? finalTitle;
  const ogUrlFromPage = normalizeOptionalString(page?.ogUrl);
  const ogUrl =
    rebaseUrlToCurrentOrigin(ogUrlFromPage, input.baseUrl) ??
    normalizeAbsoluteUrl(ogUrlFromPage, input.baseUrl) ??
    canonical;
  const ogType = normalizeOgType(
    (page?.ogType as string | null | undefined) ?? config.site.defaultOgType
  );
 
  const twitterCard = normalizeTwitterCard(
    (page?.twitterCard as string | null | undefined) ??
      config.site.defaultTwitterCard
  );
  const twitterTitle = page?.twitterTitle ?? ogTitle;
  const twitterImageRaw = page?.twitterImage ?? ogImage;
  const twitterImage =
    normalizeAbsoluteUrl(twitterImageRaw, input.baseUrl) ??
    normalizeAbsoluteUrl(ogImage, input.baseUrl) ??
    ogImage;

  const overriddenTitle = applyBrandOverride(finalTitle);
  const overriddenDescription = ensureHobeDescription(description);
  const overriddenOgTitle = applyBrandOverride(ogTitle ?? overriddenTitle);
  const overriddenOgDescription = ensureHobeDescription(
    page?.ogDescription ?? overriddenDescription
  );
  const overriddenTwitterTitle = applyBrandOverride(
    (page?.twitterTitle ?? overriddenOgTitle) || overriddenOgTitle
  );
  const overriddenTwitterDescription = ensureHobeDescription(
    page?.twitterDescription ?? overriddenOgDescription
  );
  const overriddenSiteName = applyBrandOverride(
    config.site.name + " - " + config.site.description
  );

  return {
    title: overriddenTitle,
    description: overriddenDescription,
    canonical,
    robots,
    generator: config.site.generator ?? "All in One SEO (AIOSEO) 4.9.5",
    ogLocale: config.site.locale,
    siteName: overriddenSiteName,
    ogType,
    ogTitle: overriddenOgTitle,
    ogDescription: overriddenOgDescription,
    ogUrl,
    ogImage,
    ogImageSecureUrl,
    articlePublishedTime: normalizeOptionalString(page?.articlePublishedTime),
    articleModifiedTime: normalizeOptionalString(page?.articleModifiedTime),
    twitterCard,
    twitterTitle: overriddenTwitterTitle,
    twitterDescription: overriddenTwitterDescription,
    twitterImage,
    twitterSite: normalizeOptionalString(
      page?.twitterSite ?? config.site.defaultTwitterSite
    ),
    twitterCreator: normalizeOptionalString(
      page?.twitterCreator ?? config.site.defaultTwitterCreator
    ),
  };
}

export function buildSiteWideMetadata(input: {
  locale: RouteLocale;
  baseUrl: string;
  pathFromHeaders: string;
  ogImageUrl: string;
}): Metadata {
  const seo = resolveSiteWideSeo(input);

  return {
    title: seo.title,
    description: seo.description,
    alternates: seo.canonical ? { canonical: seo.canonical } : undefined,
    generator: seo.generator,
    robots: seo.robots,
    openGraph: {
      locale: seo.ogLocale,
      siteName: seo.siteName,
      type: seo.ogType,
      title: seo.ogTitle,
      description: seo.ogDescription,
      url: seo.ogUrl,
      publishedTime: seo.articlePublishedTime,
      modifiedTime: seo.articleModifiedTime,
      images: seo.ogImage
        ? [
            {
              url: seo.ogImage,
              secureUrl: seo.ogImageSecureUrl,
            },
          ]
        : undefined,
    },
    twitter: {
      card: seo.twitterCard,
      title: seo.twitterTitle,
      description: seo.twitterDescription,
      site: seo.twitterSite,
      creator: seo.twitterCreator,
      images: seo.twitterImage ? [seo.twitterImage] : undefined,
    },
  };
}

export function buildAioseoSchema(input: {
  seo: ResolvedSiteWideSeo;
  locale: RouteLocale;
}) {
  const language = "ja";
  const siteUrl = new URL("/", input.seo.canonical).toString();
  const breadcrumbName = "ホーム";

  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "BreadcrumbList",
        "@id": `${input.seo.canonical}#breadcrumblist`,
        itemListElement: [
          {
            "@type": "ListItem",
            "@id": `${input.seo.canonical}#listItem`,
            position: 1,
            name: breadcrumbName,
          },
        ],
      },
      {
        "@type": "Organization",
        "@id": `${siteUrl}#organization`,
        name: input.seo.siteName,
        description: input.seo.description,
        url: siteUrl,
      },
      {
        "@type": "WebPage",
        "@id": `${input.seo.canonical}#webpage`,
        url: input.seo.canonical,
        name: input.seo.title,
        description: input.seo.description,
        inLanguage: language,
        isPartOf: { "@id": `${siteUrl}#website` },
        breadcrumb: { "@id": `${input.seo.canonical}#breadcrumblist` },
      },
      {
        "@type": "WebSite",
        "@id": `${siteUrl}#website`,
        url: siteUrl,
        name: input.seo.siteName,
        description: input.seo.description,
        inLanguage: language,
        publisher: { "@id": `${siteUrl}#organization` },
      },
    ],
  };
}

export function resolveRoutePathFromHeaders(
  getHeader: (name: string) => string | null
) {
  return pickPathFromHeaders(getHeader);
}
