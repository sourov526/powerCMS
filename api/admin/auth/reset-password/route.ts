export const runtime = "nodejs";
import { NextResponse } from "next/server";
import { hashPassword, verifyOtp, AUTH_COOKIE_NAME, buildAuthCookieOptions } from "@/lib/auth/auth";
import { getUserByEmail, updateUserPassword } from "@/lib/auth/users";
import { createNotification } from "@/lib/services/notifications";
import { passwordMeetsRequirements } from "@/lib/auth/password";

export async function POST(request: Request) {
  try {
    const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
    const email =
      typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
    const otp = typeof body.otp === "string" ? body.otp.trim() : "";
    const password = typeof body.password === "string" ? body.password : "";

    if (!email || !/^\d{6}$/.test(otp) || !password) {
      return NextResponse.json(
        { error: "Invalid OTP or expired." },
        { status: 400 }
      );
    }
    if (!email.includes("@")) {
      return NextResponse.json({ error: "Invalid email." }, { status: 400 });
    }
    if (!passwordMeetsRequirements(password)) {
      return NextResponse.json(
        { error: "Password does not meet requirements." },
        { status: 400 }
      );
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

    const updatedUser = await updateUserPassword(user.id, hashPassword(password));
    if (!updatedUser) {
      return NextResponse.json({ error: "User not found." }, { status: 404 });
    }
    await createNotification({
      type: "password_changed",
      title: "Password reset",
      message: updatedUser.email,
      actorId: updatedUser.id,
      recipientUserId: updatedUser.id,
    });

    const response = NextResponse.json({ ok: true });
    response.cookies.set({
      name: AUTH_COOKIE_NAME,
      value: "",
      ...buildAuthCookieOptions(),
      maxAge: 0,
    });
    return response;
  } catch (error) {
    console.error("[auth] reset-password failed.", error);
    return NextResponse.json({ error: "Service temporarily unavailable." }, { status: 503 });
  }
}
