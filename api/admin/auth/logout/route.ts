export const runtime = "nodejs";
import { NextResponse } from "next/server";
import { AUTH_COOKIE_NAME } from "@/lib/auth/auth";

export async function POST() {
  try {
    const response = NextResponse.json({ ok: true });
    response.cookies.set({
      name: AUTH_COOKIE_NAME,
      value: "",
      path: "/",
      maxAge: 0,
    });
    return response;
  } catch (error) {
    console.error("[auth] logout failed.", error);
    return NextResponse.json({ error: "Service temporarily unavailable." }, { status: 503 });
  }
}
