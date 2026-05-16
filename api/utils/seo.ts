import { resolveMediaUrl } from "@/lib/media";
import type { PostStatus } from "@/lib/services/posts";
import { getSiteUrl, siteConfig } from "@/lib/site";
import type { Metadata } from "next";

const TRACKING_PARAMS = [
  "utm_source",
  "utm_medium",
  "utm_campaign",
  "utm_term",
  "utm_content",
  "gclid",
  "fbclid",
];

export type SeoCheck = {
  label: string;
  status: "ok" | "warn";
};

export type PostSeoInput = {
  locale?: string | null;
  slug: string;
  seoSlug?: string | null;
  title: string;
  excerpt: string;
  content: string;
  status: PostStatus;
  publishedAt?: string | null;
  updatedAt: string;
  seoTitle?: string | null;
  seoDescription?: string | null;
  ogImage?: string | null;
  ogImageMedia?: {
    provider: string;
    key: string;
    bucket?: string | null;
    url?: string | null;
    width?: number | null;
    height?: number | null;
  } | null;
  noindex?: boolean;
  canonical?: string | null;
  featuredImage?: string | null;
  featuredImageMedia?: {
    provider: string;
    key: string;
    bucket?: string | null;
    url?: string | null;
    width?: number | null;
    height?: number | null;
  } | null;
  featuredImageAlt?: string | null;
  featuredImageWidth?: number | null;
  featuredImageHeight?: number | null;
  primaryKeyword?: string | null;
  tags?: string[];
  author?: { slug?: string | null; name?: string | null } | null;
  category?: { slug?: string | null; name?: string | null } | null;
  locales?: { locale: string; slug: string }[] | null;
};

export type PostSeoPreview = {
  title: string;
  description: string;
  canonical: string;
  robots: { index: boolean; follow: boolean };
  ogImage: string;
  twitterCard: string;
  titleSource: string;
  descriptionSource: string;
  ogImageSource: string;
  score: number;
  scoreNotes: string[];
  checks: SeoCheck[];
  wordCount: number;
  internalLinkCount: number;
  externalLinkCount: number;
};

type LanguageCode = "en" | "ja";

export function buildPageMetadata(input: {
  title: string;
  description?: string;
  image?: string;
  imageAlt?: string;
  twitterCard?: "summary" | "summary_large_image";
}): Metadata {
  const description = input.description ?? siteConfig.description;
  const image = input.image ?? siteConfig.ogImage;
  const imageAlt = input.imageAlt ?? input.title ?? siteConfig.name;
  const twitterCard = input.twitterCard ?? "summary_large_image";

  return {
    title: input.title,
    description,
    openGraph: {
      title: input.title,
      description,
      siteName: siteConfig.name,
      type: "website",
      images: [
        {
          url: image,
          width: 1200,
          height: 630,
          alt: imageAlt,
        },
      ],
    },
    twitter: {
      card: twitterCard,
      title: input.title,
      description,
      images: [image],
    },
  };
}

type SeoStrings = {
  titleLengthShort: string;
  titleLengthLong: string;
  titleLengthCheck: string;
  contentQualityNote: string;
  contentQualityCheck: string;
  titleGibberish: string;
  titleReadabilityCheck: string;
  descriptionGibberish: string;
  descriptionReadabilityCheck: string;
  excerptGibberish: string;
  excerptReadabilityCheck: string;
  seoTitleMissing: string;
  seoTitleCheck: string;
  seoDescriptionMissing: string;
  seoDescriptionCheck: string;
  ogDefaultNote: string;
  ogCustomCheck: string;
  slugQualityNote: string;
  slugQualityCheck: string;
  h1Note: string;
  h1Check: string;
  h2Note: string;
  h2Check: string;
  headingSkipNote: string;
  headingSkipCheck: string;
  introNote: string;
  introCheck: string;
  introGibberish: string;
  introReadabilityCheck: string;
  contentGibberish: string;
  contentReadabilityCheck: string;
  listNote: string;
  listCheck: string;
  keywordMissingTitle: string;
  keywordMissingIntro: string;
  keywordMissingH2: string;
  keywordPlacementCheck: string;
  outboundLinksNote: string;
  outboundLinksCheck: string;
  anchorTextNote: string;
  anchorTextCheck: string;
  featuredImageNote: string;
  featuredImageCheck: string;
  inlineImageAltNote: string;
  inlineImageAltCheck: string;
  canonicalNormalizedNote: string;
  gibberishFieldsNote: (fields: string) => string;
  looksGood: string;
  fieldLabels: Record<string, string>;
};

const SEO_STRINGS: Record<LanguageCode, SeoStrings> = {
  en: {
    titleLengthShort: "Title is short (aim 50-60 chars).",
    titleLengthLong: "Title is long (aim 50-60 chars).",
    titleLengthCheck: "Title length 50-60 chars",
    contentQualityNote:
      "Improve content quality: expand the post body to 300+ words.",
    contentQualityCheck: "Content quality (post body 300+ words)",
    titleGibberish: "Title looks like gibberish.",
    titleReadabilityCheck: "Title readability",
    descriptionGibberish: "Description looks like gibberish.",
    descriptionReadabilityCheck: "Description readability",
    excerptGibberish: "Excerpt looks like gibberish.",
    excerptReadabilityCheck: "Excerpt readability",
    seoTitleMissing: "SEO title not set (using title).",
    seoTitleCheck: "SEO title set",
    seoDescriptionMissing: "SEO description not set (using excerpt).",
    seoDescriptionCheck: "SEO description set",
    ogDefaultNote: "Using default OG image.",
    ogCustomCheck: "Custom OG image",
    slugQualityNote: "Slug should be short, lowercase, and hyphenated.",
    slugQualityCheck: "Slug quality",
    h1Note: "Content contains an H1. Keep exactly one H1 (the title).",
    h1Check: "Single H1 structure",
    h2Note: "Add at least one H2 section.",
    h2Check: "Has H2 sections",
    headingSkipNote: "Avoid skipping heading levels (e.g., H2 → H4).",
    headingSkipCheck: "Logical heading levels",
    introNote: "Add a strong intro paragraph before headings.",
    introCheck: "Strong intro paragraph",
    introGibberish: "Intro paragraph looks like gibberish.",
    introReadabilityCheck: "Intro readability",
    contentGibberish: "Content looks like gibberish.",
    contentReadabilityCheck: "Content readability",
    listNote: "Add a list or steps to improve scannability.",
    listCheck: "Has lists/steps",
    keywordMissingTitle: "Primary keyword missing from title.",
    keywordMissingIntro: "Primary keyword missing from intro.",
    keywordMissingH2: "Add primary keyword to 1-2 H2 headings.",
    keywordPlacementCheck: "Primary keyword placement",
    outboundLinksNote:
      "Add 1-2 authoritative outbound references when relevant.",
    outboundLinksCheck: "Outbound references",
    anchorTextNote: "Use descriptive anchor text instead of generic labels.",
    anchorTextCheck: "Descriptive anchor text",
    featuredImageNote: "Add a featured image with descriptive alt text.",
    featuredImageCheck: "Featured image + alt",
    inlineImageAltNote: "Add alt text for all inline images.",
    inlineImageAltCheck: "Inline image alt text",
    canonicalNormalizedNote:
      "Canonical normalized (tracking params or trailing slash removed).",
    gibberishFieldsNote: (fields) => `Gibberish detected in: ${fields}.`,
    looksGood: "Looks good.",
    fieldLabels: {
      title: "title",
      description: "description",
      excerpt: "excerpt",
      intro: "intro",
      content: "content",
    },
  },
  ja: {
    titleLengthShort: "タイトルが短すぎます（28〜40文字が目安）。",
    titleLengthLong: "タイトルが長すぎます（28〜40文字が目安）。",
    titleLengthCheck: "タイトルの長さ（28〜40文字）",
    contentQualityNote:
      "品質改善: 投稿本文を300語以上にしてください。",
    contentQualityCheck: "コンテンツ品質（投稿本文300語以上）",
    titleGibberish: "タイトルが意味不明な文字列に見えます。",
    titleReadabilityCheck: "タイトルの可読性",
    descriptionGibberish: "ディスクリプションが意味不明な文字列に見えます。",
    descriptionReadabilityCheck: "ディスクリプションの可読性",
    excerptGibberish: "抜粋が意味不明な文字列に見えます。",
    excerptReadabilityCheck: "抜粋の可読性",
    seoTitleMissing: "SEOタイトル未設定（タイトルを使用）。",
    seoTitleCheck: "SEOタイトル設定",
    seoDescriptionMissing: "SEOディスクリプション未設定（抜粋を使用）。",
    seoDescriptionCheck: "SEOディスクリプション設定",
    ogDefaultNote: "OG画像がデフォルトです。",
    ogCustomCheck: "カスタムOG画像",
    slugQualityNote: "スラッグは短く、英小文字とハイフンで。",
    slugQualityCheck: "スラッグ品質",
    h1Note: "本文にH1があります。H1はタイトルのみ。",
    h1Check: "H1は1つ",
    h2Note: "H2セクションを1つ以上追加。",
    h2Check: "H2セクションあり",
    headingSkipNote: "見出しレベルの飛ばしは避けてください（例: H2→H4）。",
    headingSkipCheck: "見出しレベルの論理性",
    introNote: "見出し前に導入段落を追加。",
    introCheck: "導入段落",
    introGibberish: "導入段落が意味不明な文字列に見えます。",
    introReadabilityCheck: "導入段落の可読性",
    contentGibberish: "本文が意味不明な文字列に見えます。",
    contentReadabilityCheck: "本文の可読性",
    listNote: "リスト/手順を追加して可読性を上げましょう。",
    listCheck: "リスト/手順あり",
    keywordMissingTitle: "主要キーワードがタイトルにありません。",
    keywordMissingIntro: "主要キーワードが導入にありません。",
    keywordMissingH2: "主要キーワードをH2に1〜2回入れてください。",
    keywordPlacementCheck: "主要キーワード配置",
    outboundLinksNote: "権威ある外部リンクを1〜2本追加。",
    outboundLinksCheck: "外部参照リンク",
    anchorTextNote: "アンカーテキストは具体的に。",
    anchorTextCheck: "具体的なアンカーテキスト",
    featuredImageNote: "アイキャッチ画像とaltを追加。",
    featuredImageCheck: "アイキャッチ + alt",
    inlineImageAltNote: "本文内画像のaltを追加。",
    inlineImageAltCheck: "本文画像のalt",
    canonicalNormalizedNote:
      "canonicalを正規化しました（パラメータ/末尾スラッシュ）。",
    gibberishFieldsNote: (fields) => `意味不明な文字列を検出: ${fields}。`,
    looksGood: "良好です。",
    fieldLabels: {
      title: "タイトル",
      description: "ディスクリプション",
      excerpt: "抜粋",
      intro: "導入",
      content: "本文",
    },
  },
};

function normalizeLanguage(input?: string | null): LanguageCode {
  void input;
  return "ja";
}

function getSeoStrings(language?: string | null) {
  return SEO_STRINGS[normalizeLanguage(language)];
}

export function isGibberishText(input: string) {
  const text = input.trim();
  if (!text) return false;
  const letters = text.toLowerCase().replace(/[^a-z]/g, "");
  if (letters.length < 12) return false;
  const vowels = letters.match(/[aeiou]/g)?.length ?? 0;
  const vowelRatio = vowels / letters.length;
  const uniqueCount = new Set(letters).size;
  const uniqueRatio = uniqueCount / letters.length;
  const alphabetCoverage = uniqueCount / 26;

  let maxRun = 1;
  let run = 1;
  for (let i = 1; i < letters.length; i += 1) {
    if (letters[i] === letters[i - 1]) {
      run += 1;
      if (run > maxRun) maxRun = run;
    } else {
      run = 1;
    }
  }

  const words = text.split(/\s+/).filter(Boolean);
  const longSingleToken =
    words.length <= 2 && letters.length >= 20 && !/\s/.test(text);

  // Use two diversity views:
  // - short texts: uniqueRatio catches obvious repetitive noise
  // - longer texts: alphabetCoverage avoids length-based false positives
  const diversityLooksBad =
    letters.length < 40 ? uniqueRatio < 0.2 : alphabetCoverage < 0.18;

  return (
    maxRun >= 5 || vowelRatio < 0.2 || diversityLooksBad || longSingleToken
  );
}

function normalizeCanonical(input: string, baseUrl: string) {
  const url = new URL(input, baseUrl);
  TRACKING_PARAMS.forEach((param) => url.searchParams.delete(param));
  url.hash = "";
  const pathname =
    url.pathname !== "/" ? url.pathname.replace(/\/+$/, "") : "/";
  url.pathname = pathname;
  return url.toString();
}

type OpenGraphImageData = {
  url: string;
  width?: number;
  height?: number;
  alt?: string;
  source: string;
};

function resolveImageUrl(input: string, baseUrl: string) {
  const trimmed = input.trim();
  if (trimmed.startsWith("data:") || trimmed.startsWith("blob:")) {
    return trimmed;
  }
  return new URL(trimmed, baseUrl).toString();
}

function normalizeOgImageUrl(
  url: string,
  options?: { preferSigned?: boolean }
) {
  try {
    if (options?.preferSigned) {
      return url;
    }
    const parsed = new URL(url);
    if (!parsed.pathname.endsWith("/api/media/signed")) {
      return url;
    }
    const allowPublic =
      process.env.R2_PRIVATE_URLS === "false" ||
      process.env.R2_PRIVATE_URLS === "0";
    if (!allowPublic) {
      return url;
    }
    const key = parsed.searchParams.get("key");
    if (!key) return url;
    const explicit = process.env.R2_PUBLIC_URL;
    const normalizedKey = key.replace(/^\/+/, "");
    if (explicit) {
      return new URL(normalizedKey, explicit).toString();
    }
    return url;
  } catch {
    return url;
  }
}

function getOpenGraphImage(
  post: PostSeoInput,
  baseUrl: string,
  options?: { preferSigned?: boolean; defaultOgImage?: string }
): OpenGraphImageData {
  if (post.ogImageMedia) {
    return {
      url: normalizeOgImageUrl(
        resolveMediaUrl(post.ogImageMedia, baseUrl),
        options
      ),
      width: post.ogImageMedia.width ?? undefined,
      height: post.ogImageMedia.height ?? undefined,
      source: "ogImageMedia",
    };
  }
  if (post.ogImage) {
    return {
      url: normalizeOgImageUrl(resolveImageUrl(post.ogImage, baseUrl), options),
      source: "ogImage",
    };
  }
  if (post.featuredImageMedia) {
    return {
      url: normalizeOgImageUrl(
        resolveMediaUrl(post.featuredImageMedia, baseUrl),
        options
      ),
      width:
        post.featuredImageMedia.width ?? post.featuredImageWidth ?? undefined,
      height:
        post.featuredImageMedia.height ?? post.featuredImageHeight ?? undefined,
      alt: post.featuredImageAlt ?? undefined,
      source: "featured image media",
    };
  }
  if (post.featuredImage) {
    return {
      url: normalizeOgImageUrl(
        resolveImageUrl(post.featuredImage, baseUrl),
        options
      ),
      width: post.featuredImageWidth ?? undefined,
      height: post.featuredImageHeight ?? undefined,
      alt: post.featuredImageAlt ?? undefined,
      source: "featured image",
    };
  }
  const defaultOgImagePath =
    options?.defaultOgImage?.trim() || siteConfig.ogImage;
  return {
    url: resolveImageUrl(defaultOgImagePath, baseUrl),
    source: "default post og image",
  };
}

function hasHtmlContent(content: string) {
  return /<\s*\/?\s*[a-z][\s>]/i.test(content);
}

function stripHtmlTags(content: string) {
  return content
    .replace(/<[^>]*>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function stripHtmlToMultilineText(content: string) {
  return content
    .replace(/<\s*br\s*\/?>/gi, "\n")
    .replace(/<\s*\/\s*(p|div|li|h[1-6])\s*>/gi, "\n")
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function countCjkChars(text: string) {
  return (
    text.match(
      /[\p{Script=Han}\p{Script=Hiragana}\p{Script=Katakana}\p{Script=Hangul}]/gu
    )?.length ?? 0
  );
}

function extractAnchors(content: string) {
  const links: { text: string; href: string }[] = [];
  if (hasHtmlContent(content)) {
    const regex = /<a[^>]+href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi;
    let match = regex.exec(content);
    while (match) {
      links.push({ text: stripHtmlTags(match[2]), href: match[1] });
      match = regex.exec(content);
    }
    if (links.length > 0) return links;
    return extractAnchors(stripHtmlTags(content));
  }
  const regex = /\[([^\]]+)]\(([^)]+)\)/g;
  let match = regex.exec(content);
  while (match) {
    links.push({ text: match[1], href: match[2] });
    match = regex.exec(content);
  }
  return links;
}

function countWords(text: string, language?: LanguageCode) {
  const normalized = hasHtmlContent(text) ? stripHtmlTags(text) : text;
  const trimmed = normalized.trim();
  if (!trimmed) return 0;

  const whitespaceTokens = trimmed.split(/\s+/).filter(Boolean).length;
  if (language !== "ja") return whitespaceTokens;

  // Japanese content often has no spaces. Approximate "word" count from CJK
  // characters so depth/intro checks can pass with natural Japanese writing.
  const cjkChars = countCjkChars(trimmed);
  if (cjkChars === 0) return whitespaceTokens;

  const cjkEstimatedWords = Math.ceil(cjkChars / 2);
  return Math.max(whitespaceTokens, cjkEstimatedWords);
}

function getIntroParagraph(content: string) {
  if (hasHtmlContent(content)) {
    const paragraphRegex = /<p[^>]*>([\s\S]*?)<\/p>/gi;
    let match = paragraphRegex.exec(content);
    while (match) {
      const text = stripHtmlTags(match[1]);
      if (text) return text;
      match = paragraphRegex.exec(content);
    }
    return stripHtmlTags(content);
  }
  const paragraphs = content.split(/\n\s*\n/).map((p) => p.trim());
  return paragraphs.find((p) => p.length > 0) ?? "";
}

function hasList(content: string) {
  if (hasHtmlContent(content)) {
    if (/<\s*(ul|ol|li)\b/i.test(content)) return true;
    return /^\s*([-*]|\d+\.)\s+/m.test(stripHtmlToMultilineText(content));
  }
  return /^\s*([-*]|\d+\.)\s+/m.test(content);
}

function getLocaleForLanguage(language?: string | null) {
  return normalizeLanguage(language) === "ja" ? "ja_JP" : siteConfig.locale;
}

function normalizeBasePath(basePath: string, locale?: string | null) {
  if (!locale) return basePath;
  if (basePath.startsWith(`/${locale}/`) || basePath === `/${locale}`)
    return basePath;
  if (basePath.startsWith("/")) return `/${locale}${basePath}`;
  return `/${locale}/${basePath}`;
}

function buildAlternateLanguages(
  locales: { locale: string; slug: string }[] | null | undefined,
  canonical: string,
  baseUrl: string,
  basePath: string,
  language: string
) {
  const languages: Record<string, string> = {};
  if (locales) {
    locales.forEach((entry) => {
      if (!entry.slug) return;
      const path = `${basePath}/${entry.slug}`;
      languages[entry.locale] = new URL(path, baseUrl).toString();
    });
  }
  if (language) {
    languages[language] = canonical;
  }
  return Object.keys(languages).length > 0 ? languages : undefined;
}

function normalizeMetaUrl(input: string) {
  try {
    const url = new URL(input);
    url.hash = "";
    url.pathname =
      url.pathname !== "/" ? url.pathname.replace(/\/+$/, "") : "/";
    return url.toString();
  } catch {
    return input.trim();
  }
}

function dedupeImageUrls(images: (string | { url: string })[] | undefined) {
  if (!images) return images;
  const seen = new Set<string>();
  const result: (string | { url: string })[] = [];
  images.forEach((image) => {
    const url = typeof image === "string" ? image : image.url;
    const normalized = url ? normalizeMetaUrl(url) : "";
    if (!normalized || seen.has(normalized)) return;
    seen.add(normalized);
    result.push(image);
  });
  return result.length > 0 ? result : undefined;
}

function dedupeLanguages(
  languages: Record<string, string> | undefined,
  canonical?: string
) {
  if (!languages) return undefined;
  const result: Record<string, string> = {};
  const canonicalNormalized = canonical ? normalizeMetaUrl(canonical) : null;
  Object.entries(languages).forEach(([locale, href]) => {
    if (!locale || !href || result[locale]) return;
    const normalized = normalizeMetaUrl(href);
    if (canonicalNormalized && normalized === canonicalNormalized) return;
    result[locale] = href;
  });
  return Object.keys(result).length > 0 ? result : undefined;
}

function sanitizeMetadata(metadata: Metadata): Metadata {
  const titleText =
    typeof metadata.title === "string" ? metadata.title : undefined;
  const descriptionText =
    typeof metadata.description === "string" ? metadata.description : undefined;
  const canonical = metadata.alternates?.canonical
    ? normalizeMetaUrl(metadata.alternates.canonical as string)
    : undefined;
  const openGraphImages = Array.isArray(metadata.openGraph?.images)
    ? dedupeImageUrls(metadata.openGraph.images as (string | { url: string })[])
    : metadata.openGraph?.images;
  const twitterImages = Array.isArray(metadata.twitter?.images)
    ? dedupeImageUrls(metadata.twitter.images as (string | { url: string })[])
    : metadata.twitter?.images;
  const other =
    metadata.other && typeof metadata.other === "object"
      ? Object.fromEntries(
          Object.entries(metadata.other as Record<string, string>).filter(
            ([key]) => key !== "title" && key !== "description"
          )
        )
      : metadata.other;
  const alternates = metadata.alternates
    ? {
        ...metadata.alternates,
        canonical: canonical ?? metadata.alternates.canonical,
        languages: dedupeLanguages(
          metadata.alternates.languages as Record<string, string> | undefined,
          canonical
        ),
      }
    : undefined;

  return {
    ...metadata,
    alternates,
    openGraph: metadata.openGraph
      ? {
          ...metadata.openGraph,
          images: openGraphImages,
          ...(titleText ? { title: titleText } : {}),
          ...(descriptionText ? { description: descriptionText } : {}),
        }
      : undefined,
    twitter: metadata.twitter
      ? {
          ...metadata.twitter,
          images: twitterImages,
          ...(titleText ? { title: titleText } : {}),
          ...(descriptionText ? { description: descriptionText } : {}),
        }
      : undefined,
    other,
  };
}

export function buildPostMetadata(
  post: PostSeoInput,
  // postCollections: {
  //   popularPosts: Post[];
  //   latestPosts: Post[];
  //   previousPosts: Post | null;
  //   nextPosts: Post | null;
  //   recommendedPosts: Post[];
  // },
  options?: {
    baseUrl?: string;
    basePath?: string;
    forceNoindex?: boolean;
    language?: string;
    stringsLanguage?: string;
    locale?: string;
    preferSignedOgImage?: boolean;
    defaultOgImage?: string;
  }
) {
  const baseUrl = options?.baseUrl ?? getSiteUrl();
  const rawBasePath = options?.basePath ?? "/post";
  const locale = options?.locale ?? post.locale ?? null;
  const basePath = normalizeBasePath(rawBasePath, locale);
  const canonicalInput = `${basePath}/${post.slug}`;
  const canonical = normalizeCanonical(canonicalInput, baseUrl);

  const language = normalizeLanguage(options?.language ?? locale);
  const strings = getSeoStrings(options?.stringsLanguage ?? language);

  const normalizedSeoTitle = post.seoTitle?.trim() || null;
  const normalizedSeoDescription = post.seoDescription?.trim() || null;

  const title = normalizedSeoTitle ?? post.title ?? siteConfig.name;
  const description =
    normalizedSeoDescription ?? post.excerpt ?? siteConfig.description;
  const descriptionForChecks = (
    normalizedSeoDescription ||
    (post.excerpt ?? "").trim() ||
    stripHtmlTags(post.content || "") ||
    siteConfig.description
  ).trim();
  const ogImageData = getOpenGraphImage(post, baseUrl, {
    preferSigned: options?.preferSignedOgImage,
    defaultOgImage: options?.defaultOgImage,
  });
  const ogImage = ogImageData.url;

  const scoreNotes: string[] = [];
  const checks: SeoCheck[] = [];
  let score = 100;

  const titleLength = title.trim().length;
  const titleLengthRange =
    language === "ja"
      ? { min: 28, max: 40 }
      : { min: 50, max: 60 };
  if (titleLength < titleLengthRange.min) {
    score -= 10;
    scoreNotes.push(strings.titleLengthShort);
    checks.push({ label: strings.titleLengthCheck, status: "warn" });
  } else if (titleLength > titleLengthRange.max) {
    score -= 10;
    scoreNotes.push(strings.titleLengthLong);
    checks.push({ label: strings.titleLengthCheck, status: "warn" });
  } else {
    checks.push({ label: strings.titleLengthCheck, status: "ok" });
  }

  const wordCount = countWords(post.content, language);
  const hasGoodContentQuality = wordCount >= 300;
  if (!hasGoodContentQuality) {
    score -= 10;
    scoreNotes.push(strings.contentQualityNote);
    checks.push({ label: strings.contentQualityCheck, status: "warn" });
  } else {
    checks.push({ label: strings.contentQualityCheck, status: "ok" });
  }

  const gibberishFields: string[] = [];

  if (isGibberishText(title)) {
    score -= 20;
    scoreNotes.push(strings.titleGibberish);
    gibberishFields.push("title");
    checks.push({ label: strings.titleReadabilityCheck, status: "warn" });
  } else {
    checks.push({ label: strings.titleReadabilityCheck, status: "ok" });
  }

  if (isGibberishText(descriptionForChecks)) {
    score -= 10;
    scoreNotes.push(strings.descriptionGibberish);
    gibberishFields.push("description");
    checks.push({ label: strings.descriptionReadabilityCheck, status: "warn" });
  } else {
    checks.push({ label: strings.descriptionReadabilityCheck, status: "ok" });
  }

  if (!normalizedSeoTitle) {
    score -= 3;
    scoreNotes.push(strings.seoTitleMissing);
    checks.push({ label: strings.seoTitleCheck, status: "warn" });
  } else {
    checks.push({ label: strings.seoTitleCheck, status: "ok" });
  }

  if (!normalizedSeoDescription) {
    score -= 3;
    scoreNotes.push(strings.seoDescriptionMissing);
    checks.push({ label: strings.seoDescriptionCheck, status: "warn" });
  } else {
    checks.push({ label: strings.seoDescriptionCheck, status: "ok" });
  }

  if (!post.ogImage && !post.featuredImage) {
    score -= 5;
    scoreNotes.push(strings.ogDefaultNote);
    checks.push({ label: strings.ogCustomCheck, status: "warn" });
  } else {
    checks.push({ label: strings.ogCustomCheck, status: "ok" });
  }

  const slugCandidate = post.seoSlug ?? post.slug;
  const slugOk = /^[\p{Letter}\p{Number}]+(?:-[\p{Letter}\p{Number}]+)*$/u.test(
    slugCandidate
  );
  if (!slugOk || slugCandidate.length < 3) {
    score -= 5;
    scoreNotes.push(strings.slugQualityNote);
    checks.push({ label: strings.slugQualityCheck, status: "warn" });
  } else {
    checks.push({ label: strings.slugQualityCheck, status: "ok" });
  }

  const normalizedContent = hasHtmlContent(post.content)
    ? stripHtmlTags(post.content)
    : post.content;
  const intro = getIntroParagraph(post.content);
  if (!intro || /^#{1,6}\s/.test(intro) || countWords(intro, language) < 12) {
    score -= 5;
    scoreNotes.push(strings.introNote);
    checks.push({ label: strings.introCheck, status: "warn" });
  } else {
    checks.push({ label: strings.introCheck, status: "ok" });
  }

  if (intro && isGibberishText(intro)) {
    score -= 10;
    scoreNotes.push(strings.introGibberish);
    gibberishFields.push("intro");
    checks.push({ label: strings.introReadabilityCheck, status: "warn" });
  } else {
    checks.push({ label: strings.introReadabilityCheck, status: "ok" });
  }

  if (normalizedContent && isGibberishText(normalizedContent)) {
    score -= 15;
    scoreNotes.push(strings.contentGibberish);
    gibberishFields.push("content");
    checks.push({ label: strings.contentReadabilityCheck, status: "warn" });
  } else {
    checks.push({ label: strings.contentReadabilityCheck, status: "ok" });
  }

  if (!hasList(post.content)) {
    score -= 5;
    scoreNotes.push(strings.listNote);
    checks.push({ label: strings.listCheck, status: "warn" });
  } else {
    checks.push({ label: strings.listCheck, status: "ok" });
  }

  const keyword = (post.primaryKeyword ?? "").trim().toLowerCase();
  if (keyword) {
    const titleHasKeyword = title.toLowerCase().includes(keyword);
    const introHasKeyword = intro.toLowerCase().includes(keyword);

    if (!titleHasKeyword) {
      score -= 10;
      scoreNotes.push(strings.keywordMissingTitle);
    }
    if (!introHasKeyword) {
      score -= 5;
      scoreNotes.push(strings.keywordMissingIntro);
    }

    checks.push({
      label: strings.keywordPlacementCheck,
      status: titleHasKeyword && introHasKeyword ? "ok" : "warn",
    });
  }

  const links = extractAnchors(post.content);
  const internalLinkCount = links.filter((link) => {
    if (link.href.startsWith("/")) return true;
    if (!/^https?:\/\//.test(link.href)) return false;
    return link.href.startsWith(baseUrl);
  }).length;
  const externalLinkCount = links.filter((link) => {
    if (!/^https?:\/\//.test(link.href)) return false;
    return !link.href.startsWith(baseUrl);
  }).length;

  if (externalLinkCount < 1 && wordCount >= 300) {
    score -= 5;
    scoreNotes.push(strings.outboundLinksNote);
    checks.push({ label: strings.outboundLinksCheck, status: "warn" });
  } else {
    checks.push({ label: strings.outboundLinksCheck, status: "ok" });
  }

  const badAnchors = new Set(["click here", "here", "read more", "learn more"]);
  const hasBadAnchor = links.some((link) =>
    badAnchors.has(link.text.trim().toLowerCase())
  );
  if (hasBadAnchor) {
    score -= 5;
    scoreNotes.push(strings.anchorTextNote);
    checks.push({ label: strings.anchorTextCheck, status: "warn" });
  } else {
    checks.push({ label: strings.anchorTextCheck, status: "ok" });
  }

  if (!post.featuredImage || !post.featuredImageAlt) {
    score -= 10;
    scoreNotes.push(strings.featuredImageNote);
    checks.push({ label: strings.featuredImageCheck, status: "warn" });
  } else {
    checks.push({ label: strings.featuredImageCheck, status: "ok" });
  }

  const isIndexable = post.status === "published" && !post.noindex;
  const shouldIndex = isIndexable && !options?.forceNoindex;

  if (canonical !== new URL(canonicalInput, baseUrl).toString()) {
    scoreNotes.push(strings.canonicalNormalizedNote);
  }

  if (gibberishFields.length > 0) {
    const fieldLabels = gibberishFields.map(
      (field) => strings.fieldLabels[field] ?? field
    );
    scoreNotes.push(strings.gibberishFieldsNote(fieldLabels.join(", ")));
  }

  if (scoreNotes.length === 0) {
    scoreNotes.push(strings.looksGood);
  }

  const tags = Array.from(new Set(post.tags ?? []));
  const authorUrl = post.author?.slug
    ? new URL(`/admin/authors/${post.author.slug}`, baseUrl).toString()
    : undefined;
  const section = post.category?.name ?? undefined;
  const openGraphImage = {
    url: ogImageData.url,
    ...(ogImageData.width ? { width: ogImageData.width } : {}),
    ...(ogImageData.height ? { height: ogImageData.height } : {}),
    ...(ogImageData.alt ? { alt: ogImageData.alt } : {}),
  };

  const alternateLanguages = buildAlternateLanguages(
    post.locales ?? null,
    canonical,
    baseUrl,
    basePath,
    language
  );

  const other: Record<string, string> = {
    "content-language": language,
  };

  const seoPreview: PostSeoPreview = {
    title,
    description,
    canonical,
    robots: {
      index: shouldIndex,
      follow: shouldIndex,
    },
    ogImage,
    twitterCard: "summary_large_image",
    titleSource: normalizedSeoTitle ? "seoTitle" : "title",
    descriptionSource: normalizedSeoDescription ? "seoDescription" : "excerpt",
    ogImageSource: ogImageData.source,
    score: Math.max(0, Math.min(100, score)),
    scoreNotes,
    checks,
    wordCount,
    internalLinkCount,
    externalLinkCount,
  };

  const metadata: Metadata = {
    title,
    description,
    alternates: {
      canonical,
      ...(alternateLanguages ? { languages: alternateLanguages } : {}),
    },
    robots: seoPreview.robots,
    openGraph: {
      type: "article",
      url: canonical,
      title,
      description,
      images: [openGraphImage],
      siteName: siteConfig.name,
      locale: getLocaleForLanguage(language),
      publishedTime: post.publishedAt ?? undefined,
      modifiedTime: post.updatedAt,
      authors: authorUrl ? [authorUrl] : undefined,
      section,
      tags: tags.length > 0 ? tags : undefined,
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [ogImage],
    },
    other: Object.keys(other).length > 0 ? other : undefined,
  };

  return { metadata: sanitizeMetadata(metadata), seoPreview };
}
