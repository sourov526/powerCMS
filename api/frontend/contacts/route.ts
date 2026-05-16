export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { hashPassword } from "@/lib/auth/auth";
import { getUserByEmail } from "@/lib/auth/users";
import { db } from "@/lib/db";
import { initCloudflareD1 } from "@/lib/db-cloudflare";
import { createContact } from "@/lib/services/contacts";

const CONTACT_ACTOR_EMAIL = "marina.kurosu@brandcloud.co.jp";
const CONTACT_ACTOR_NAME = "Marina Kurosu";
const CONTACT_THANK_YOU_COOKIE = "contact_thank_you_access";

function toTrimmedString(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

async function verifyRecaptchaToken(token: string, remoteIp: string | null) {
  const secret = (process.env.RECAPTCHA_SECRET_KEY || "").trim();
  if (!secret || !token) return false;

  try {
    const params = new URLSearchParams({
      secret,
      response: token,
    });
    if (remoteIp) {
      params.set("remoteip", remoteIp);
    }

    const response = await fetch("https://www.google.com/recaptcha/api/siteverify", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: params.toString(),
      cache: "no-store",
    });

    if (!response.ok) return false;
    const data = (await response.json().catch(() => null)) as { success?: boolean } | null;
    return data?.success === true;
  } catch {
    return false;
  }
}

async function ensureContactActorUser() {
  await initCloudflareD1();
  const existing = await getUserByEmail(CONTACT_ACTOR_EMAIL);
  if (existing) return existing;

  const now = new Date();
  const passwordHash = hashPassword(`contact-actor:${CONTACT_ACTOR_EMAIL}`);
  await db.execute(
    `INSERT INTO users (email, name, passwordHash, role, status, createdAt, updated_at, two_factor_enabled, auth_version)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      CONTACT_ACTOR_EMAIL,
      CONTACT_ACTOR_NAME,
      passwordHash,
      "author",
      "active",
      now,
      now,
      0,
      0,
    ],
  );

  const created = await getUserByEmail(CONTACT_ACTOR_EMAIL);
  if (!created) throw new Error("Failed to ensure contact actor user.");
  return created;
}

export async function POST(request: Request) {
  const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
  const companyName = toTrimmedString(body.companyName);
  const homePage = toTrimmedString(body.homePage);
  const name = toTrimmedString(body.name);
  const department = toTrimmedString(body.department);
  const contactNumber = toTrimmedString(body.contactNumber);
  const email = toTrimmedString(body.email);
  const schedule = toTrimmedString(body.schedule);
  const message = toTrimmedString(body.message);
  const utmTerm = toTrimmedString(body.utmTerm);
  const kwid = toTrimmedString(body.kwid);
  const captchaResponse = toTrimmedString(body.captchaResponse);
  const rawLocale = toTrimmedString(body.locale);
  void rawLocale;
  const locale = "ja";
  const privacyAgreed = body.privacyAgreed === true;

  const maxLengths = {
    companyName: 40,
    homePage: 80,
    name: 80,
    department: 120,
    contactNumber: 40,
    email: 80,
    schedule: 100,
    message: 2000,
    utmTerm: 200,
    kwid: 200,
    captchaResponse: 4000,
  };

  if (!name || !department || !email || !schedule || !message) {
    return NextResponse.json({ error: "required" }, { status: 400 });
  }

  if (
    companyName.length > maxLengths.companyName ||
    homePage.length > maxLengths.homePage ||
    name.length > maxLengths.name ||
    department.length > maxLengths.department ||
    contactNumber.length > maxLengths.contactNumber ||
    email.length > maxLengths.email ||
    schedule.length > maxLengths.schedule ||
    message.length > maxLengths.message ||
    utmTerm.length > maxLengths.utmTerm ||
    kwid.length > maxLengths.kwid ||
    captchaResponse.length > maxLengths.captchaResponse
  ) {
    return NextResponse.json({ error: "too_long" }, { status: 400 });
  }

  if (!privacyAgreed) {
    return NextResponse.json({ error: "terms" }, { status: 400 });
  }

  if (homePage && !(homePage.startsWith("http://") || homePage.startsWith("https://"))) {
    return NextResponse.json({ error: "url_invalid" }, { status: 400 });
  }

  if (!email.includes("@")) {
    return NextResponse.json({ error: "email_invalid" }, { status: 400 });
  }

  if (contactNumber && !/^\d+$/.test(contactNumber)) {
    return NextResponse.json({ error: "number_invalid" }, { status: 400 });
  }

  const forwardedFor = request.headers.get("x-forwarded-for") ?? "";
  const ipAddress = forwardedFor.split(",")[0]?.trim() || null;
  const captchaVerified = await verifyRecaptchaToken(captchaResponse, ipAddress);
  if (!captchaVerified) {
    return NextResponse.json({ error: "spam" }, { status: 400 });
  }

  const userAgent = request.headers.get("user-agent") ?? null;
  const deviceOs = (() => {
    const ua = (userAgent || "").toLowerCase();
    if (ua.includes("windows")) return "Windows";
    if (ua.includes("mac os") || ua.includes("macintosh")) return "macOS";
    if (ua.includes("android")) return "Android";
    if (ua.includes("iphone") || ua.includes("ipad") || ua.includes("ios")) return "iOS";
    if (ua.includes("linux")) return "Linux";
    return "Unknown";
  })();

  const contactActor = await ensureContactActorUser();
  const created = await createContact({
    companyName,
    homePage: homePage || null,
    name,
    department,
    contactNumber,
    email,
    schedule,
    message,
    utmTerm: utmTerm || null,
    kwid: kwid || null,
    ipAddress,
    userAgent,
    deviceOs,
    locale: locale || null,
    privacyAgreed,
    actorId: contactActor.id,
  });

  const response = NextResponse.json({ ok: true });
  response.cookies.set(CONTACT_THANK_YOU_COOKIE, "1", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 5,
  });
  return response;
}
