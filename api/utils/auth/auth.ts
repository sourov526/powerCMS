import { hmac } from "@noble/hashes/hmac";
import { scrypt } from "@noble/hashes/scrypt";
import { sha256 } from "@noble/hashes/sha256";

export type UserRole = "superuser" | "author";
export type UserStatus = "active" | "pending" | "rejected";

export type AuthTokenPayload = {
  userId: number;
  email: string;
  role: UserRole;
  status: UserStatus;
  authVersion: number;
  exp: number;
};

const TOKEN_TTL_SECONDS = 60 * 60 * 24 * 7;
export const AUTH_COOKIE_NAME = "corp_auth";
const LEGACY_PASSWORD_SCRYPT_PARAMS = { N: 16384, r: 8, p: 1, dkLen: 64 };
const PASSWORD_SCRYPT_PARAMS = { N: 4096, r: 8, p: 1, dkLen: 64 };
const OTP_SCRYPT_PARAMS = { N: 1024, r: 8, p: 1, dkLen: 32 };

function getAuthSecret() {
  const secret = process.env.AUTH_SECRET;
  if (!secret) {
    throw new Error("AUTH_SECRET is not set.");
  }
  return secret;
}

function toBytes(input: string | Uint8Array) {
  if (typeof input === "string") {
    return new TextEncoder().encode(input);
  }
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

function getRandomBytes(length: number) {
  const bytes = new Uint8Array(length);
  if (globalThis.crypto?.getRandomValues) {
    globalThis.crypto.getRandomValues(bytes);
    return bytes;
  }
  throw new Error("Secure random generator is not available.");
}

function timingSafeEqual(a: Uint8Array, b: Uint8Array) {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i += 1) {
    diff |= a[i] ^ b[i];
  }
  return diff === 0;
}

export function hashPassword(password: string) {
  const salt = getRandomBytes(16);
  const hash = scrypt(toBytes(password), salt, PASSWORD_SCRYPT_PARAMS);
  return `scrypt2$${base64UrlEncode(salt)}$${base64UrlEncode(hash)}`;
}

function verifyScryptHash(
  value: string,
  saltPart: string,
  hashPart: string,
  params: { N: number; r: number; p: number; dkLen: number },
) {
  const salt = base64UrlDecode(saltPart);
  const hash = base64UrlDecode(hashPart);
  const candidate = scrypt(toBytes(value), salt, { ...params, dkLen: hash.length });
  return timingSafeEqual(candidate, hash);
}

export function verifyPassword(password: string, stored: string) {
  const [scheme, saltPart, hashPart] = stored.split("$");
  if (!saltPart || !hashPart) return false;
  if (scheme === "scrypt2") {
    return verifyScryptHash(password, saltPart, hashPart, PASSWORD_SCRYPT_PARAMS);
  }
  if (scheme === "scrypt") {
    return verifyScryptHash(password, saltPart, hashPart, LEGACY_PASSWORD_SCRYPT_PARAMS);
  }
  return false;
}

export function generateOtp() {
  const bytes = getRandomBytes(4);
  const value =
    ((bytes[0] << 24) | (bytes[1] << 16) | (bytes[2] << 8) | bytes[3]) >>> 0;
  return String(value % 1000000).padStart(6, "0");
}

export function hashOtp(otp: string) {
  const digest = base64UrlEncode(
    hmac(sha256, toBytes(getAuthSecret()), toBytes(`otp:${otp}`)),
  );
  return `otp_hmac$${digest}`;
}

export function verifyOtp(otp: string, stored: string) {
  const [scheme, saltPart, hashPart] = stored.split("$");
  if (scheme === "otp_hmac" && saltPart) {
    const expected = base64UrlEncode(
      hmac(sha256, toBytes(getAuthSecret()), toBytes(`otp:${otp}`)),
    );
    return timingSafeEqual(toBytes(saltPart), toBytes(expected));
  }
  if (!saltPart || !hashPart) return false;
  if (scheme === "otp_scrypt") {
    return verifyScryptHash(otp, saltPart, hashPart, OTP_SCRYPT_PARAMS);
  }
  // Backward compatibility for OTPs generated before otp_scrypt scheme rollout.
  if (scheme === "scrypt") {
    return verifyScryptHash(otp, saltPart, hashPart, LEGACY_PASSWORD_SCRYPT_PARAMS);
  }
  return false;
}

export function createAuthToken(payload: Omit<AuthTokenPayload, "exp">) {
  const exp = Math.floor(Date.now() / 1000) + TOKEN_TTL_SECONDS;
  const data: AuthTokenPayload = { ...payload, exp };
  const encodedPayload = base64UrlEncode(JSON.stringify(data));
  const signature = base64UrlEncode(
    hmac(sha256, toBytes(getAuthSecret()), toBytes(encodedPayload)),
  );
  return `${encodedPayload}.${signature}`;
}

export function verifyAuthToken(token: string): AuthTokenPayload | null {
  const [encodedPayload, signature] = token.split(".");
  if (!encodedPayload || !signature) return null;
  const expected = base64UrlEncode(
    hmac(sha256, toBytes(getAuthSecret()), toBytes(encodedPayload)),
  );
  const sigBytes = toBytes(signature);
  const expBytes = toBytes(expected);
  if (!timingSafeEqual(sigBytes, expBytes)) {
    return null;
  }
  try {
    const decoded = base64UrlDecode(encodedPayload);
    const json = new TextDecoder().decode(decoded);
    const payload = JSON.parse(json) as AuthTokenPayload;
    if (payload.exp < Math.floor(Date.now() / 1000)) return null;
    return payload;
  } catch {
    return null;
  }
}

export function buildAuthCookieOptions() {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    maxAge: TOKEN_TTL_SECONDS,
  };
}
