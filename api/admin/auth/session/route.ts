export const runtime = "nodejs";
import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth/auth-server";

export async function GET() {
  try {
    const user = await getSessionUser();
    return NextResponse.json({ authenticated: Boolean(user) });
  } catch (error) {
    console.error("[auth] session check failed.", error);
    return NextResponse.json({ error: "Service temporarily unavailable." }, { status: 503 });
  }
}
