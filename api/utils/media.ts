import { siteConfig } from "@/lib/site";

type MediaRecord = {
  provider: string;
  key: string;
  bucket?: string | null;
  url?: string | null;
};

const LOCAL_UPLOAD_DIR = "uploads";

function normalizeKey(key: string) {
  return key.replace(/^\/+/, "");
}

function buildR2Url(media: MediaRecord) {
  const explicit = process.env.R2_PUBLIC_URL;
  if (explicit) {
    return new URL(normalizeKey(media.key), explicit).toString();
  }
  const bucket = media.bucket || process.env.R2_BUCKET;
  const accountId = process.env.R2_ACCOUNT_ID;
  if (!bucket || !accountId) {
    return normalizeKey(media.key);
  }
  return `https://${accountId}.r2.cloudflarestorage.com/${bucket}/${normalizeKey(media.key)}`;
}

function buildSignedProxyUrl(media: MediaRecord) {
  const key = normalizeKey(media.key);
  const bucket = media.bucket || process.env.R2_BUCKET;
  const params = new URLSearchParams({ key });
  if (bucket) params.set("bucket", bucket);
  return `/api/media/signed?${params.toString()}`;
}

function buildLocalUrl(media: MediaRecord) {
  const key = normalizeKey(media.key);
  if (key.startsWith("http://") || key.startsWith("https://")) return key;
  if (key.startsWith(`${LOCAL_UPLOAD_DIR}/`)) {
    return `/${key}`;
  }
  if (key.startsWith("/")) return key;
  const cleaned = key.replace(/^\/+/, "");
  return `/${LOCAL_UPLOAD_DIR}/${cleaned}`;
}

export function resolveMediaUrl(media: MediaRecord, baseUrl = siteConfig.url) {
  if (media.url) {
    return media.url.startsWith("http") ? media.url : new URL(media.url, baseUrl).toString();
  }
  const isRemote = media.provider === "r2" || media.provider === "s3";
  const allowPublic =
    process.env.R2_PRIVATE_URLS === "false" || process.env.R2_PRIVATE_URLS === "0";
  const hasPublicBase = Boolean(process.env.R2_PUBLIC_URL);
  const useSigned =
    isRemote && (!allowPublic || !hasPublicBase);
  const raw = isRemote
    ? useSigned
      ? buildSignedProxyUrl(media)
      : buildR2Url(media)
    : buildLocalUrl(media);
  return raw.startsWith("http") ? raw : new URL(raw, baseUrl).toString();
}
