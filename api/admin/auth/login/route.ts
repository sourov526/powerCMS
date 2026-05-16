export const runtime = "nodejs";
import { NextResponse } from "next/server";
import {
  AUTH_COOKIE_NAME,
  buildAuthCookieOptions,
  createAuthToken,
  verifyPassword,
} from "@/lib/auth/auth";
import { ensureRootUser } from "@/lib/auth/user";
import { getUserByEmail, setTwoFactorOtp } from "@/lib/auth/users";
import { generateOtp, hashOtp } from "@/lib/auth/auth";

export async function POST(request: Request) {
  try {
    const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
    const email =
      typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
    const password = typeof body.password === "string" ? body.password : "";

    if (!email || !password) {
      return NextResponse.json({ error: "Email and password are required." }, { status: 400 });
    }
    if (password.length > 128) {
      return NextResponse.json({ error: "Invalid credentials." }, { status: 401 });
    }

    await ensureRootUser();
    const user = await getUserByEmail(email);
    if (!user || !verifyPassword(password, user.passwordHash)) {
      return NextResponse.json({ error: "Invalid credentials." }, { status: 401 });
    }

    if (user.status !== "active") {
      return NextResponse.json(
        { error: "Your account is not approved yet." },
        { status: 403 }
      );
    }

    if (user.twoFactorEnabled) {
      const now = new Date();
      const twoFactorOtpHash = user.twoFactorOtpHash;
      const twoFactorOtpExpiresAt = user.twoFactorOtpExpiresAt;
      const hasUsableExistingOtp =
        typeof twoFactorOtpHash === "string" &&
        twoFactorOtpHash.length > 0 &&
        twoFactorOtpExpiresAt instanceof Date &&
        twoFactorOtpExpiresAt > now;
      if (!hasUsableExistingOtp) {
        const otp = generateOtp();
        console.log(`[auth] login 2fa otp for ${user.email}: ${otp}`);
        const otpHash = hashOtp(otp);
        const otpExpiresAt = new Date(now.getTime() + 5 * 60 * 1000);
        await setTwoFactorOtp(user.id, otpHash, otpExpiresAt);
      }
      return NextResponse.json({ requiresTwoFactor: true });
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

    const response = NextResponse.json({ ok: true });
    response.cookies.set({
      name: AUTH_COOKIE_NAME,
      value: token,
      ...buildAuthCookieOptions(),
    });
    return response;
  } catch (error) {
    console.error("[auth] login failed.", error);
    return NextResponse.json({ error: "Service temporarily unavailable." }, { status: 503 });
  }
}
