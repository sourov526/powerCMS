export const runtime = "nodejs";
import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth/auth-server";
import { generateOtp, hashOtp } from "@/lib/auth/auth";
import { getUserById, setTwoFactorOtp } from "@/lib/auth/users";

const OTP_TTL_MINUTES = 5;

export async function POST() {
  try {
    const sessionUser = await getSessionUser();
    if (!sessionUser) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    const user = await getUserById(sessionUser.id);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    if (user.twoFactorEnabled) {
      return NextResponse.json({ ok: true, enabled: true });
    }

    const now = new Date();
    if (user.twoFactorOtpHash && user.twoFactorOtpExpiresAt && user.twoFactorOtpExpiresAt > now) {
      return NextResponse.json({ ok: true, enabled: false });
    }

    const otp = generateOtp();
    console.log(`[auth] 2fa enable otp for ${user.email}: ${otp}`);
    const otpHash = hashOtp(otp);
    const otpExpiresAt = new Date(now.getTime() + OTP_TTL_MINUTES * 60 * 1000);
    await setTwoFactorOtp(user.id, otpHash, otpExpiresAt);

    return NextResponse.json({ ok: true, enabled: false });
  } catch (error) {
    console.error("[auth] 2fa enable failed.", error);
    return NextResponse.json({ error: "Service temporarily unavailable." }, { status: 503 });
  }
}
