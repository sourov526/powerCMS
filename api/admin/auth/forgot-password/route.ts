export const runtime = "nodejs";
import { NextResponse } from "next/server";
import { generateOtp, hashOtp } from "@/lib/auth/auth";
import { getUserByEmail, setUserOtp } from "@/lib/auth/users";
import { createNotification } from "@/lib/services/notifications";

const OTP_TTL_MINUTES = 5;

export async function POST(request: Request) {
  try {
    const body = (await request.json().catch(() => ({}))) as { email?: unknown };
    const email =
      typeof body.email === "string" ? body.email.trim().toLowerCase() : "";

    if (!email || !email.includes("@")) {
      return NextResponse.json({ error: "Invalid email." }, { status: 400 });
    }

    const user = await getUserByEmail(email);
    if (!user || user.status !== "active") {
      return NextResponse.json({ error: "User not found." }, { status: 404 });
    }

    const now = new Date();
    if (user.otpHash && user.otpExpiresAt && user.otpExpiresAt > now) {
      return NextResponse.json({ ok: true });
    }
    const otp = generateOtp();
    console.log(`[auth] forgot-password otp for ${user.email}: ${otp}`);
    const otpHash = hashOtp(otp);
    const otpExpiresAt = new Date(now.getTime() + OTP_TTL_MINUTES * 60 * 1000);
    await setUserOtp(user.id, otpHash, otpExpiresAt);

    await createNotification({
      type: "password_reset_requested",
      title: "Password reset requested",
      message: user.email,
      actorId: user.id,
      recipientUserId: user.id,
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("[auth] forgot-password failed.", error);
    return NextResponse.json({ error: "Service temporarily unavailable." }, { status: 503 });
  }
}
