export const runtime = "nodejs";
import { NextResponse } from "next/server";
import { generateOtp, hashOtp } from "@/lib/auth/auth";
import { getSessionUser } from "@/lib/auth/auth-server";
import { getUserById, setUserOtp } from "@/lib/auth/users";

const OTP_TTL_MINUTES = 5;

export async function POST() {
  try {
    const sessionUser = await getSessionUser();
    if (!sessionUser) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }
    if (sessionUser.status !== "active") {
      return NextResponse.json({ error: "Account not active." }, { status: 403 });
    }

    const user = await getUserById(sessionUser.id);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    const now = new Date();
    if (!user.otpExpiresAt || user.otpExpiresAt <= now) {
      const otp = generateOtp();
      console.log(`[auth] change-password otp for ${user.email}: ${otp}`);
      const otpHash = hashOtp(otp);
      const otpExpiresAt = new Date(now.getTime() + OTP_TTL_MINUTES * 60 * 1000);
      await setUserOtp(user.id, otpHash, otpExpiresAt);
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("[auth] change-password otp send failed.", error);
    return NextResponse.json({ error: "Service temporarily unavailable." }, { status: 503 });
  }
}
