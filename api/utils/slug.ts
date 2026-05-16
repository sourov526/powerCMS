export function normalizeSlug(input: string) {
  return input
    .normalize("NFKC")
    .toLowerCase()
    .trim()
    .replace(/[^\p{Letter}\p{Number}]+/gu, "-")
    .replace(/^-+|-+$/g, "");
}

function safeDecodeURIComponent(input: string) {
  try {
    return decodeURIComponent(input);
  } catch {
    return input;
  }
}

export function normalizePostSlug(input: string) {
  const decoded = safeDecodeURIComponent(String(input ?? ""));
  return decoded
    .normalize("NFKC")
    .toLowerCase()
    .trim()
    .replace(/['"`’]+/g, "")
    .replace(/[^\p{Letter}\p{Number}\s-]+/gu, "-")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function buildPostSlugCandidates(input: string) {
  const raw = String(input ?? "");
  const decoded = safeDecodeURIComponent(raw);
  const normalized = normalizePostSlug(raw);
  const normalizedDecoded = normalizePostSlug(decoded);
  const encodedRaw = encodeURIComponent(raw);
  const encodedDecoded = encodeURIComponent(decoded);
  const encodedNormalized = encodeURIComponent(normalized);
  const encodedNormalizedDecoded = encodeURIComponent(normalizedDecoded);
  const legacyNormalized = normalizeSlug(raw);
  const legacyNormalizedDecoded = normalizeSlug(decoded);
  return Array.from(
    new Set(
      [
        raw,
        decoded,
        normalized,
        normalizedDecoded,
        encodedRaw,
        encodedDecoded,
        encodedNormalized,
        encodedNormalizedDecoded,
        legacyNormalized,
        legacyNormalizedDecoded,
      ].filter(Boolean),
    ),
  );
}
