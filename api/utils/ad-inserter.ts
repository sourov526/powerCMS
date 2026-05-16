type InsertAdOptions = {
  positions: number[];
  adHtml: string;
  containerClassName?: string;
};

const FALLBACK_AD_POSITIONS = [3];

function normalizeLocale(locale: string) {
  return locale;
}

function parsePositions(raw: string | undefined) {
  if (!raw) return null;
  const parsed = raw
    .split(",")
    .map((entry) => Number.parseInt(entry.trim(), 10))
    .filter((value) => Number.isFinite(value) && value > 0);
  if (parsed.length === 0) return null;
  return Array.from(new Set(parsed)).sort((a, b) => a - b);
}

function resolveAdPositions(locale: string) {
  const normalizedLocale = normalizeLocale(locale);
  const localePositions =
    normalizedLocale === "ja"
      ? parsePositions(process.env.NEWS_AD_INSERTER_POSITIONS_JA)
      : parsePositions(process.env.NEWS_AD_INSERTER_POSITIONS_EN);
  if (localePositions) return localePositions;

  return parsePositions(process.env.NEWS_AD_INSERTER_POSITIONS) ??
    FALLBACK_AD_POSITIONS;
}

function resolveAdHtml(locale: string) {
  const normalizedLocale = normalizeLocale(locale);
  const localeSnippet =
    normalizedLocale === "ja"
      ? process.env.NEWS_AD_INSERTER_HTML_JA
      : process.env.NEWS_AD_INSERTER_HTML_EN;
  const sharedSnippet = process.env.NEWS_AD_INSERTER_HTML;
  return String(localeSnippet ?? sharedSnippet ?? "").trim();
}

function buildAdContainer(
  adHtml: string,
  index: number,
  className = "bc-inline-ad-slot",
) {
  return `<div class="${className}" data-inline-ad-index="${index}">${adHtml}</div>`;
}

export function insertAdsAfterParagraphs(
  html: string,
  options: InsertAdOptions,
) {
  const source = String(html ?? "");
  const adHtml = String(options.adHtml ?? "").trim();
  if (!source || !adHtml) return source;

  const positions = Array.from(
    new Set(options.positions.filter((position) => position > 0)),
  ).sort((a, b) => a - b);
  if (positions.length === 0) return source;

  const closingParagraphPattern = /<\/p>/gi;
  let paragraphCount = 0;
  let positionCursor = 0;
  let lastIndex = 0;
  let output = "";

  for (const match of source.matchAll(closingParagraphPattern)) {
    const endIndex = match.index! + match[0].length;
    output += source.slice(lastIndex, endIndex);
    paragraphCount += 1;

    while (
      positionCursor < positions.length &&
      paragraphCount === positions[positionCursor]
    ) {
      output += buildAdContainer(
        adHtml,
        positionCursor + 1,
        options.containerClassName,
      );
      positionCursor += 1;
    }

    lastIndex = endIndex;
  }

  output += source.slice(lastIndex);
  return output;
}

export function injectNewsInlineAds(html: string, locale: string) {
  const adHtml = resolveAdHtml(locale);
  if (!adHtml) return html;

  return insertAdsAfterParagraphs(html, {
    positions: resolveAdPositions(locale),
    adHtml,
    containerClassName: "bc-inline-ad-slot",
  });
}
