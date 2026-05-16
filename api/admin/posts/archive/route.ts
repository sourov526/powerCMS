export const runtime = "nodejs";
import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { getSessionUser } from "@/lib/auth/auth-server";
import { db } from "@/lib/db";
import { initCloudflareD1 } from "@/lib/db-cloudflare";
import { createNotification } from "@/lib/services/notifications";
import { defaultLocale } from '@/utils/strings/config';
import { getPostBySlugPreview } from "@/lib/services/posts";

export async function POST(request: Request) {
  await initCloudflareD1();
  const user = await getSessionUser();
  if (!user || user.status !== "active") {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }
  if (user.role !== "superuser" && user.role !== "author") {
    return NextResponse.json({ error: "Forbidden." }, { status: 403 });
  }

  const body = (await request.json().catch(() => null)) as
    | { id?: unknown; status?: unknown; locale?: unknown }
    | null;
  const id = Number(body?.id);
  const nextStatus =
    body?.status === "archived" || body?.status === "draft" ? body.status : null;
  const locale: typeof defaultLocale = defaultLocale;
  if (!id || !nextStatus) {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const existing = await db.queryOne<{ id: number; createdBy: number | null }>(
    `SELECT id, createdBy FROM posts WHERE id = ?`,
    [id],
  );
  if (!existing) {
    return NextResponse.json({ error: "Not found." }, { status: 404 });
  }
  if (user.role === "author" && existing.createdBy !== user.id) {
    return NextResponse.json({ error: "Forbidden." }, { status: 403 });
  }

  await db.execute(
    `UPDATE posts SET status = ?, updatedAt = ? WHERE id = ?`,
    [nextStatus, new Date(), id],
  );
  const updated = await db.queryOne<{ id: number }>(
    `SELECT id FROM posts WHERE id = ?`,
    [id],
  );

  const localeRow = await db.queryOne<{ slug: string }>(
    `SELECT slug
     FROM post_locales
     WHERE postId = ? AND locale = ?
     LIMIT 1`,
    [id, locale],
  );
  const localized = localeRow
    ? await getPostBySlugPreview(localeRow.slug, locale)
    : null;

  await createNotification({
    type: nextStatus === "archived" ? "post_archived" : "post_restored",
    title: nextStatus === "archived" ? "Post archived" : "Post restored",
    message: localized?.title ?? `Post #${updated?.id ?? id}`,
    link: localized
      ? `/admin/posts/${encodeURIComponent(localized.slug)}`
      : `/admin/posts/${updated?.id ?? id}`,
    actorId: user.id,
    recipientRole: user.role === "superuser" ? "superuser" : undefined,
    recipientUserId: user.role === "author" ? user.id : undefined,
  });

  revalidatePath("/category/news");
  revalidatePath("/sitemap");
  if (localized?.slug) {
    revalidatePath(`/${encodeURIComponent(localized.slug)}`);
  }
  if (localized?.category?.slug) {
    revalidatePath(`/category/${encodeURIComponent(localized.category.slug)}`);
  }

  return NextResponse.json({ ok: true });
}
