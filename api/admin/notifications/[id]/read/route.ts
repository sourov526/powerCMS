export const runtime = "nodejs";
import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth/auth-server";
import { db } from "@/lib/db";
import { initCloudflareD1 } from "@/lib/db-cloudflare";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id?: string }> }
) {
  await initCloudflareD1();
  const user = await getSessionUser();
  if (!user || (user.role !== "superuser" && user.role !== "author")) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const resolved = await params;
  const id = Number(resolved?.id);
  if (!id) {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const existing = await db.queryOne<{ id: number }>(
    `SELECT id
     FROM notifications
     WHERE id = ?
     ${user.role === "superuser" ? "" : "AND recipientUserId = ?"}`,
    user.role === "superuser" ? [id] : [id, user.id],
  );
  if (!existing) {
    return NextResponse.json({ error: "Not found." }, { status: 404 });
  }

  await db.execute(
    `UPDATE notifications SET readAt = ? WHERE id = ?`,
    [new Date(), existing.id],
  );

  return NextResponse.json({ ok: true });
}
