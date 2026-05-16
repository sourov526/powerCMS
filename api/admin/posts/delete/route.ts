export const runtime = "nodejs";
import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { getSessionUser } from "@/lib/auth/auth-server";
import { db } from "@/lib/db";
import { initCloudflareD1 } from "@/lib/db-cloudflare";
import { deleteOrphanedMedia } from "@/lib/services/media";

export async function POST(request: Request) {
  await initCloudflareD1();
  const user = await getSessionUser();
  if (!user || (user.role !== "superuser" && user.role !== "author")) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }
  if (user.role === "author") {
    return NextResponse.json({ error: "Forbidden." }, { status: 403 });
  }

  const body = (await request.json().catch(() => null)) as { id?: unknown } | null;
  const id = Number(body?.id);
  if (!id) {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const post = await db.queryOne<{ id: number }>(`SELECT id FROM posts WHERE id = ?`, [id]);
  if (!post) {
    return NextResponse.json({ error: "Not found." }, { status: 404 });
  }

  const slugs = await db.query<{ slug: string }>(
    `SELECT slug FROM post_locales WHERE postId = ?`,
    [id],
  );
  const categorySlugs = await db.query<{ slug: string }>(
    `SELECT DISTINCT c.slug as slug
     FROM posts p
     LEFT JOIN categories c ON c.id = p.categoryId
     WHERE p.id = ? AND c.slug IS NOT NULL`,
    [id],
  );
  const locales = await db.query<{
    id: number;
    ogImageId: number | null;
    featuredImageId: number | null;
  }>(
    `SELECT id, ogImageId, featuredImageId
     FROM post_locales
     WHERE postId = ?`,
    [id],
  );
  const localeIds = locales.map((row) => row.id);
  const mediaIds = locales.flatMap((localeEntry) => [
    ...(localeEntry.ogImageId ? [localeEntry.ogImageId] : []),
    ...(localeEntry.featuredImageId ? [localeEntry.featuredImageId] : []),
  ]);
  if (localeIds.length > 0) {
    const placeholders = localeIds.map(() => "?").join(", ");
    const attachments = await db.query<{ mediaId: number }>(
      `SELECT mediaId FROM post_attachments WHERE postLocaleId IN (${placeholders})`,
      localeIds,
    );
    attachments.forEach((attachment) => mediaIds.push(attachment.mediaId));
  }

  await db.execute(`DELETE FROM posts WHERE id = ?`, [id]);
  await deleteOrphanedMedia(mediaIds);

  revalidatePath("/category/news");
  revalidatePath("/sitemap");
  slugs.forEach((row) => {
    if (row.slug) revalidatePath(`/${encodeURIComponent(row.slug)}`);
  });
  categorySlugs.forEach((row) => {
    if (row.slug) revalidatePath(`/category/${encodeURIComponent(row.slug)}`);
  });

  return NextResponse.json({ ok: true });
}
