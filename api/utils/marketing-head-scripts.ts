const GOOGLE_ADS_ID_PATTERN = /^AW-\d+$/i;

function parseCsv(value?: string | null) {
  return (value || "")
    .split(",")
    .map((entry) => entry.trim())
    .filter(Boolean);
}

function normalizeHttpsUrl(value?: string | null) {
  const trimmed = (value || "").trim();
  if (!trimmed) return null;
  try {
    const url = new URL(trimmed);
    if (url.protocol !== "https:") return null;
    return url.toString();
  } catch {
    return null;
  }
}

export function getMierucaScriptUrl() {
  return normalizeHttpsUrl(process.env.NEXT_PUBLIC_MIERUCA_SCRIPT_URL);
}

export function getMierucaScriptId() {
  const trimmed = (process.env.NEXT_PUBLIC_MIERUCA_SCRIPT_ID || "").trim();
  return trimmed || null;
}

export function getLandingHubScriptUrl() {
  return normalizeHttpsUrl(process.env.NEXT_PUBLIC_LANDINGHUB_SCRIPT_URL);
}

export function getGoogleAdsIds() {
  return Array.from(
    new Set(
      parseCsv(process.env.NEXT_PUBLIC_GOOGLE_ADS_IDS).filter((id) =>
        GOOGLE_ADS_ID_PATTERN.test(id),
      ),
    ),
  );
}

export function getGoogleAdsLoaderUrl(id: string) {
  return `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(id)}`;
}

export function buildGoogleAdsBootstrap(ids: string[]) {
  const configs = ids.map((id) => `gtag('config', '${id}');`).join("\n");
  return `window.dataLayer = window.dataLayer || [];
function gtag(){dataLayer.push(arguments);}
gtag('js', new Date());
${configs}`;
}
