export const runtime = "nodejs";
import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { getSessionUser } from "@/lib/auth/auth-server";
import { db } from "@/lib/db";
import { initCloudflareD1 } from "@/lib/db-cloudflare";
import { buildPostMetadata } from "@/lib/seo";
import { createNotification } from "@/lib/services/notifications";
import { getPostBySlugPreview } from "@/lib/services/posts";
import { promoteMediaToR2 } from "@/lib/services/media";
import { defaultLocale } from '@/utils/strings/config';
import { resolveSiteUrlFromHeaders } from "@/lib/site";

export async function POST(request: Request) {
  await initCloudflareD1();
  const baseUrl = resolveSiteUrlFromHeaders((name) => request.headers.get(name));
  const user = await getSessionUser();
  if (!user || (user.role !== "superuser" && user.role !== "author")) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const body = (await request.json().catch(() => null)) as
    | { id?: unknown; locale?: unknown }
    | null;
  const id = Number(body?.id);
  const locale: typeof defaultLocale = defaultLocale;
  if (!id) {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const post = await db.queryOne<{ id: number; createdBy: number | null }>(
    `SELECT id, createdBy FROM posts WHERE id = ?`,
    [id],
  );
  if (!post) {
    return NextResponse.json({ error: "Not found." }, { status: 404 });
  }
  if (user.role === "author" && post.createdBy !== user.id) {
    return NextResponse.json({ error: "Forbidden." }, { status: 403 });
  }

  const now = new Date();
  await db.execute(
    `UPDATE posts
     SET status = ?, publishedAt = ?, updatedAt = ?, updatedBy = ?
     WHERE id = ?`,
    ["published", now, now, user.id, id],
  );
  const updated = await db.queryOne<{ publishedAt: string | null; updatedAt: string }>(
    `SELECT publishedAt, updatedAt FROM posts WHERE id = ?`,
    [id],
  );

  await db.execute(
    `UPDATE post_locales
     SET noindex = 0, updatedAt = ?
     WHERE postId = ? AND locale = ?`,
    [new Date(), id, locale],
  );

  const localized = await db.queryOne<{ slug: string }>(
    `SELECT slug
     FROM post_locales
     WHERE postId = ? AND locale = ?
     LIMIT 1`,
    [id, locale],
  );
  if (!localized) {
    return NextResponse.json({ error: "Locale not found." }, { status: 404 });
  }

  const refreshed = await getPostBySlugPreview(localized.slug, locale, { includeLocales: true });
  if (!refreshed) {
    return NextResponse.json({ error: "Not found." }, { status: 404 });
  }

  const mediaIds = new Set<number>();
  if (refreshed.ogImageMedia?.id) mediaIds.add(refreshed.ogImageMedia.id);
  if (refreshed.featuredImageMedia?.id) mediaIds.add(refreshed.featuredImageMedia.id);
  (refreshed.attachments ?? []).forEach((attachment) => {
    if (attachment.id) mediaIds.add(attachment.id);
  });
  await promoteMediaToR2(Array.from(mediaIds));

  await createNotification({
    type: "post_published",
    title: "Post published",
    message: refreshed.title,
    link: `/admin/posts/${encodeURIComponent(refreshed.slug)}`,
    actorId: user.id,
    recipientRole: user.role === "superuser" ? "superuser" : undefined,
    recipientUserId: user.role === "author" ? user.id : undefined,
  });

  const { seoPreview } = buildPostMetadata({
    locale,
    slug: refreshed.slug,
    seoSlug: refreshed.seoSlug ?? undefined,
    title: refreshed.title,
    excerpt: refreshed.excerpt,
    content: refreshed.contentRich ?? refreshed.content,
    status: "published",
    publishedAt: updated?.publishedAt ? new Date(updated.publishedAt).toISOString() : null,
    updatedAt: updated?.updatedAt ? new Date(updated.updatedAt).toISOString() : new Date().toISOString(),
    seoTitle: refreshed.seoTitle,
    seoDescription: refreshed.seoDescription,
    ogImage: refreshed.ogImage,
    noindex: refreshed.noindex ?? false,
    canonical: refreshed.canonical,
    featuredImage: refreshed.featuredImage,
    featuredImageAlt: refreshed.featuredImageAlt,
    featuredImageWidth: refreshed.featuredImageWidth,
    featuredImageHeight: refreshed.featuredImageHeight,
    primaryKeyword: refreshed.primaryKeyword,
    tags: refreshed.tags,
    author: refreshed.author ? { slug: refreshed.author.slug, name: refreshed.author.name } : null,
    category: refreshed.category
      ? { slug: refreshed.category.slug, name: refreshed.category.name }
      : null,
    locales: refreshed.locales?.map((entry) => ({ locale: entry.locale, slug: entry.slug })) ?? null,
  }, { baseUrl });

  if (seoPreview.score < 70) {
    await createNotification({
      type: "seo_warning",
      title: "SEO needs attention",
      message: `${refreshed.title} • score ${seoPreview.score}/100`,
      link: `/admin/posts/${encodeURIComponent(refreshed.slug)}`,
      actorId: user.id,
      recipientRole: user.role === "superuser" ? "superuser" : undefined,
      recipientUserId: user.role === "author" ? user.id : undefined,
      metadata: { score: seoPreview.score, notes: seoPreview.scoreNotes },
    });
  }

  revalidatePath("/category/news");
  revalidatePath("/sitemap");
  revalidatePath(`/${encodeURIComponent(refreshed.slug)}`);
  if (refreshed.category?.slug) {
    revalidatePath(`/category/${encodeURIComponent(refreshed.category.slug)}`);
  }

  return NextResponse.json({ ok: true });
}
