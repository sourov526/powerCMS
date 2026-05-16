export const runtime = "nodejs";
import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth/auth-server";
import { verifyOtp } from "@/lib/auth/auth";
import {
  clearTwoFactorOtp,
  getUserById,
  setTwoFactorEnabled,
} from "@/lib/auth/users";

export async function POST(request: Request) {
  try {
    const sessionUser = await getSessionUser();
    if (!sessionUser) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
    const otp = typeof body.otp === "string" ? body.otp.trim() : "";
    if (!/^\d{6}$/.test(otp)) {
      return NextResponse.json({ error: "Invalid OTP or expired." }, { status: 400 });
    }

    const user = await getUserById(sessionUser.id);
    if (!user || !user.twoFactorOtpHash || !user.twoFactorOtpExpiresAt) {
      return NextResponse.json({ error: "Invalid OTP or expired." }, { status: 400 });
    }

    const now = new Date();
    if (user.twoFactorOtpExpiresAt <= now || !verifyOtp(otp, user.twoFactorOtpHash)) {
      return NextResponse.json({ error: "Invalid OTP or expired." }, { status: 400 });
    }

    await setTwoFactorEnabled(user.id, true);
    await clearTwoFactorOtp(user.id);

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("[auth] 2fa verify failed.", error);
    return NextResponse.json({ error: "Service temporarily unavailable." }, { status: 503 });
  }
}
