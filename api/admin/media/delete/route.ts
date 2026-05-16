export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth/auth-server";
import { deleteOrphanedMedia } from "@/lib/services/media";

export async function POST(request: Request) {
  const user = await getSessionUser();
  if (!user || (user.role !== "superuser" && user.role !== "author")) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const body = (await request.json().catch(() => null)) as { id?: unknown } | null;
  const id = Number(body?.id);
  if (!id) {
    return NextResponse.json({ error: "Invalid media id." }, { status: 400 });
  }

  await deleteOrphanedMedia([id]);
  return NextResponse.json({ ok: true });
}
