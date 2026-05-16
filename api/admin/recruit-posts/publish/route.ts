export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { getSessionUser } from "@/lib/auth/auth-server";
import { initCloudflareD1 } from "@/lib/db-cloudflare";
import { db } from "@/lib/db";
import { updateRecruitPostStatus } from "@/lib/services/recruit-posts";
import { createNotification } from "@/lib/services/notifications";

export async function POST(request: Request) {
  const user = await getSessionUser();
  if (!user || (user.role !== "superuser" && user.role !== "author")) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const body = (await request.json().catch(() => ({}))) as { id?: number };
  const id = Number(body.id);
  if (!id) {
    return NextResponse.json({ error: "Invalid id." }, { status: 400 });
  }

  await initCloudflareD1();
  const post = await db.queryOne<{ id: number; createdBy: number | null; slug: string; title: string }>(
    `SELECT id, createdBy, slug, title FROM recruit_posts WHERE id = ?`,
    [id]
  );
  if (!post) {
    return NextResponse.json({ error: "Not found." }, { status: 404 });
  }
  if (user.role === "author" && post.createdBy !== user.id) {
    return NextResponse.json({ error: "Forbidden." }, { status: 403 });
  }

  await updateRecruitPostStatus({
    id,
    status: "published",
    actorId: user.id,
    publishedAt: new Date().toISOString(),
  });

  await createNotification({
    type: "recruit_published",
    title: "Recruit published",
    message: post.title,
    link: `/admin/editor?slug=${encodeURIComponent(post.slug)}&mode=recruit`,
    actorId: user.id,
    recipientRole: user.role === "superuser" ? "superuser" : undefined,
    recipientUserId: user.role === "author" ? user.id : undefined,
  });

  revalidatePath("/recruit");
  revalidatePath("/sitemap");
  revalidatePath(`/recruit/${encodeURIComponent(post.slug)}`);

  return NextResponse.json({ ok: true });
}
