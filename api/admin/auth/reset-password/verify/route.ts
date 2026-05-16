export const runtime = "nodejs";
import { NextResponse } from "next/server";
import { verifyOtp } from "@/lib/auth/auth";
import { getUserByEmail } from "@/lib/auth/users";

export async function POST(request: Request) {
  try {
    const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
    const email =
      typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
    const otp = typeof body.otp === "string" ? body.otp.trim() : "";

    if (!email || !/^\d{6}$/.test(otp)) {
      return NextResponse.json(
        { error: "Invalid OTP or expired." },
        { status: 400 }
      );
    }
    if (!email.includes("@")) {
      return NextResponse.json({ error: "Invalid email." }, { status: 400 });
    }

    const user = await getUserByEmail(email);
    if (!user || user.status !== "active" || !user.otpHash || !user.otpExpiresAt) {
      return NextResponse.json(
        { error: "Invalid OTP or expired." },
        { status: 400 }
      );
    }

    const now = new Date();
    if (user.otpExpiresAt <= now || !verifyOtp(otp, user.otpHash)) {
      return NextResponse.json(
        { error: "Invalid OTP or expired." },
        { status: 400 }
      );
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("[auth] reset-password verify failed.", error);
    return NextResponse.json({ error: "Service temporarily unavailable." }, { status: 503 });
  }
}
