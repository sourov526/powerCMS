export const runtime = "nodejs";
import { NextResponse } from "next/server";
import {
  AUTH_COOKIE_NAME,
  buildAuthCookieOptions,
  createAuthToken,
  hashPassword,
  verifyOtp,
  verifyPassword,
} from "@/lib/auth/auth";
import { getSessionUser } from "@/lib/auth/auth-server";
import { getUserById, updateUserPassword } from "@/lib/auth/users";
import { createNotification } from "@/lib/services/notifications";
import { passwordMeetsRequirements } from "@/lib/auth/password";

export async function POST(request: Request) {
  try {
    const sessionUser = await getSessionUser();
    if (!sessionUser) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
    const otp = typeof body.otp === "string" ? body.otp.trim() : "";
    const password = typeof body.password === "string" ? body.password : "";
    const currentPassword =
      typeof body.currentPassword === "string" ? body.currentPassword : "";

    if (!otp || !password) {
      return NextResponse.json({ error: "OTP and password are required." }, { status: 400 });
    }
    if (!/^\d{6}$/.test(otp)) {
      return NextResponse.json({ error: "Invalid OTP or expired." }, { status: 400 });
    }
    if (!currentPassword) {
      return NextResponse.json({ error: "Current password is required." }, { status: 400 });
    }
    if (!passwordMeetsRequirements(password)) {
      return NextResponse.json(
        { error: "Password does not meet requirements." },
        { status: 400 }
      );
    }

    const user = await getUserById(sessionUser.id);
    if (!user || !user.otpHash || !user.otpExpiresAt) {
      return NextResponse.json({ error: "Invalid OTP or expired." }, { status: 400 });
    }

    const now = new Date();
    if (user.otpExpiresAt <= now || !verifyOtp(otp, user.otpHash)) {
      return NextResponse.json({ error: "Invalid OTP or expired." }, { status: 400 });
    }
    if (!verifyPassword(currentPassword, user.passwordHash)) {
      return NextResponse.json({ error: "Current password is incorrect." }, { status: 400 });
    }

    const updatedUser = await updateUserPassword(user.id, hashPassword(password));
    if (!updatedUser) {
      return NextResponse.json({ error: "User not found." }, { status: 404 });
    }
    await createNotification({
      type: "password_changed",
      title: "Password changed",
      message: updatedUser.email,
      actorId: updatedUser.id,
      recipientUserId: updatedUser.id,
    });
    const token = createAuthToken({
      userId: updatedUser.id,
      email: updatedUser.email,
      role: updatedUser.role === "superuser" ? "superuser" : "author",
      status:
        updatedUser.status === "active" || updatedUser.status === "rejected"
          ? updatedUser.status
          : "pending",
      authVersion: updatedUser.authVersion,
    });

    const response = NextResponse.json({ ok: true });
    response.cookies.set({
      name: AUTH_COOKIE_NAME,
      value: token,
      ...buildAuthCookieOptions(),
    });
    return response;
  } catch (error) {
    console.error("[auth] change-password verify failed.", error);
    return NextResponse.json({ error: "Service temporarily unavailable." }, { status: 503 });
  }
}
