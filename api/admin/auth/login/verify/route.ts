export const runtime = "nodejs";
import { NextResponse } from "next/server";
import {
  AUTH_COOKIE_NAME,
  buildAuthCookieOptions,
  createAuthToken,
  verifyOtp,
} from "@/lib/auth/auth";
import { getUserByEmail, clearTwoFactorOtp } from "@/lib/auth/users";

export async function POST(request: Request) {
  try {
    const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
    const email =
      typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
    const otp = typeof body.otp === "string" ? body.otp.trim() : "";

    if (!email || !/^\d{6}$/.test(otp)) {
      return NextResponse.json({ error: "Invalid OTP or expired." }, { status: 400 });
    }

    const user = await getUserByEmail(email);
    if (
      !user ||
      user.status !== "active" ||
      !user.twoFactorEnabled ||
      !user.twoFactorOtpHash ||
      !user.twoFactorOtpExpiresAt
    ) {
      return NextResponse.json({ error: "Invalid OTP or expired." }, { status: 400 });
    }

    const now = new Date();
    if (user.twoFactorOtpExpiresAt <= now || !verifyOtp(otp, user.twoFactorOtpHash)) {
      return NextResponse.json({ error: "Invalid OTP or expired." }, { status: 400 });
    }

    const role = user.role === "superuser" ? "superuser" : "author";
    const status =
      user.status === "active" || user.status === "rejected" ? user.status : "pending";
    const token = createAuthToken({
      userId: user.id,
      email: user.email,
      role,
      status,
      authVersion: user.authVersion,
    });

    await clearTwoFactorOtp(user.id);

    const response = NextResponse.json({ ok: true });
    response.cookies.set({
      name: AUTH_COOKIE_NAME,
      value: token,
      ...buildAuthCookieOptions(),
    });
    return response;
  } catch (error) {
    console.error("[auth] login 2fa verify failed.", error);
    return NextResponse.json({ error: "Service temporarily unavailable." }, { status: 503 });
  }
}
