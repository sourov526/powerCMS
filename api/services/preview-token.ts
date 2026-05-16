import { hmac } from "@noble/hashes/hmac";
import { sha256 } from "@noble/hashes/sha256";

type PreviewTokenPayload = {
  postId: number;
  locale: string;
  slug: string;
  userId: number;
  exp: number;
  iat: number;
};

const PREVIEW_TOKEN_TTL_SECONDS = 60 * 10;

function getPreviewSecret() {
  return process.env.PREVIEW_TOKEN_SECRET || process.env.AUTH_SECRET || "";
}

function toBytes(input: string | Uint8Array) {
  if (typeof input === "string") return new TextEncoder().encode(input);
  return input;
}

function base64UrlEncode(input: Uint8Array | string) {
  const bytes = toBytes(input);
  if (typeof Buffer !== "undefined") {
    return Buffer.from(bytes)
      .toString("base64")
      .replace(/=/g, "")
      .replace(/\+/g, "-")
      .replace(/\//g, "_");
  }
  let binary = "";
  bytes.forEach((b) => {
    binary += String.fromCharCode(b);
  });
  return btoa(binary).replace(/=/g, "").replace(/\+/g, "-").replace(/\//g, "_");
}

function base64UrlDecode(input: string) {
  const padded = input.replace(/-/g, "+").replace(/_/g, "/");
  const padLength = (4 - (padded.length % 4)) % 4;
  const base64 = padded + "=".repeat(padLength);
  if (typeof Buffer !== "undefined") {
    return new Uint8Array(Buffer.from(base64, "base64"));
  }
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

function timingSafeEqual(a: Uint8Array, b: Uint8Array) {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i += 1) {
    diff |= a[i] ^ b[i];
  }
  return diff === 0;
}

export function createPreviewToken(input: {
  postId: number;
  locale: string;
  slug: string;
  userId: number;
}) {
  const secret = getPreviewSecret();
  if (!secret) {
    throw new Error("AUTH_SECRET or PREVIEW_TOKEN_SECRET is required.");
  }
  const now = Math.floor(Date.now() / 1000);
  const payload: PreviewTokenPayload = {
    postId: input.postId,
    locale: input.locale,
    slug: input.slug,
    userId: input.userId,
    iat: now,
    exp: now + PREVIEW_TOKEN_TTL_SECONDS,
  };
  const encodedPayload = base64UrlEncode(JSON.stringify(payload));
  const signature = base64UrlEncode(
    hmac(sha256, toBytes(secret), toBytes(encodedPayload)),
  );
  return `${encodedPayload}.${signature}`;
}

export function verifyPreviewToken(token: string): PreviewTokenPayload | null {
  const secret = getPreviewSecret();
  if (!secret) return null;
  const [encodedPayload, signature] = token.split(".");
  if (!encodedPayload || !signature) return null;
  const expected = base64UrlEncode(
    hmac(sha256, toBytes(secret), toBytes(encodedPayload)),
  );
  if (!timingSafeEqual(toBytes(signature), toBytes(expected))) return null;
  try {
    const decoded = base64UrlDecode(encodedPayload);
    const json = new TextDecoder().decode(decoded);
    const payload = JSON.parse(json) as PreviewTokenPayload;
    if (!payload.postId || !payload.slug || !payload.locale || !payload.userId) return null;
    if (payload.exp < Math.floor(Date.now() / 1000)) return null;
    return payload;
  } catch {
    return null;
  }
}
