export const runtime = "nodejs";
import { NextResponse } from "next/server";
import { logNotFoundEvent } from "@/lib/services/monitoring";

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as { path?: unknown } | null;
  const path = typeof body?.path === "string" ? body.path : "";

  if (!path) {
    return NextResponse.json({ ok: false, error: "Path required." }, { status: 400 });
  }

  await logNotFoundEvent({
    path,
    referrer: request.headers.get("referer"),
    userAgent: request.headers.get("user-agent"),
  });

  return NextResponse.json({ ok: true });
}
