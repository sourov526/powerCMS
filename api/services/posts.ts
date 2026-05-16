import { defaultLocale } from '@/utils/strings/config';
import type { SqlValue } from "@/lib/db";
import { db, isD1 } from "@/lib/db";
import { initCloudflareD1 } from "@/lib/db-cloudflare";
import { resolveMediaUrl } from "@/lib/media";
import { addRedirect } from "@/lib/redirects";
import { deleteOrphanedMedia, ensureMediaFromUrl } from "@/lib/services/media";
import { siteConfig } from "@/lib/site";
import {
  buildPostSlugCandidates,
  normalizePostSlug,
  normalizeSlug,
} from "@/lib/utils/slug";

export type PostStatus = "draft" | "published" | "scheduled" | "archived";

export type Author = {
  id: number;
  slug: string;
  name: string;
  bio?: string | null;
};

export type Category = {
  id: number;
  slug: string;
  name: string;
  intro?: string | null;
  createdByUser?: { id: number; name: string | null; email: string } | null;
};

export type FAQItem = {
  question: string;
  answer: string;
};

export type MediaAsset = {
  id: number;
  provider: "local" | "r2";
  key: string;
  bucket?: string | null;
  url: string;
  mimeType?: string | null;
  size?: number | null;
  width?: number | null;
  height?: number | null;
};

export type PostLocale = {
  id: number;
  locale: string;
  slug: string;
  seoSlug?: string | null;
  title: string;
  excerpt: string;
  content: string;
  contentRich?: string | null;
  seoTitle?: string | null;
  seoDescription?: string | null;
  canonical?: string | null;
  noindex?: boolean;
  ogImage?: string | null;
  ogImageMedia?: MediaAsset | null;
  featuredImage?: string | null;
  featuredImageMedia?: MediaAsset | null;
  featuredImageAlt?: string | null;
  featuredImageWidth?: number | null;
  featuredImageHeight?: number | null;
  primaryKeyword?: string | null;
  tags: string[];
  faqs: FAQItem[];
  attachments?: MediaAsset[];
};

export type Post = {
  id: number;
  locale: string;
  slug: string;
  seoSlug?: string | null;
  title: string;
  excerpt: string;
  content: string;
  contentRich?: string | null;
  status: PostStatus;
  createdAt: string;
  publishedAt?: string | null;
  updatedAt: string;
  seoTitle?: string | null;
  seoDescription?: string | null;
  canonical?: string | null;
  noindex?: boolean;
  ogImage?: string | null;
  ogImageMedia?: MediaAsset | null;
  featuredImage?: string | null;
  featuredImageMedia?: MediaAsset | null;
  featuredImageAlt?: string | null;
  featuredImageWidth?: number | null;
  featuredImageHeight?: number | null;
  primaryKeyword?: string | null;
  tags: string[];
  faqs: FAQItem[];
  attachments?: MediaAsset[];
  author?: Author | null;
  category?: Category | null;
  categories?: Category[];
  createdBy?: number | null;
  updatedBy?: number | null;
  createdByUser?: {
    id: number;
    name: string | null;
    email: string;
    role: string;
  } | null;
  locales?: PostLocale[];
  draftRevision?: number;
  draftUpdatedAt?: string;
  draftBaseUpdatedAt?: string;
  editingPostId?: number;
  draftCategoryIds?: number[];
  views?: number;
};

export type TagSummary = {
  slug: string;
  name: string;
  count: number;
};

function stripHtmlToText(value: string) {
  return value
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function deriveExcerpt(input: {
  seoDescription?: string | null;
  description?: string | null;
}) {
  const MAX_EXCERPT_LENGTH = 160;
  const ELLIPSIS = "...";
  const seoDescription = String(input.seoDescription ?? "").trim();
  if (seoDescription) return seoDescription;
  const description = stripHtmlToText(String(input.description ?? "").trim());
  if (!description) return "";
  if (description.length <= MAX_EXCERPT_LENGTH) return description;
  const maxWithoutEllipsis = MAX_EXCERPT_LENGTH - ELLIPSIS.length;
  return `${description.slice(0, maxWithoutEllipsis).trimEnd()}${ELLIPSIS}`;
}

type PostLocaleWithAssets = {
  id: number;
  postId: number;
  locale: string;
  slug: string;
  seoSlug: string | null;
  title: string;
  excerpt: string;
  content: string;
  contentRich: string | null;
  seoTitle: string | null;
  seoDescription: string | null;
  canonical: string | null;
  noindex: number | null;
  ogImageId: number | null;
  featuredImageId: number | null;
  featuredImageAlt: string | null;
  featuredImageWidth: number | null;
  featuredImageHeight: number | null;
  primaryKeyword: string | null;
  tags: string | null;
  faqs: string | null;
  createdAt: string;
  updatedAt: string;
  ogId: number | null;
  ogProvider: string | null;
  ogKey: string | null;
  ogBucket: string | null;
  ogUrl: string | null;
  ogMimeType: string | null;
  ogSize: number | null;
  ogWidth: number | null;
  ogHeight: number | null;
  fiId: number | null;
  fiProvider: string | null;
  fiKey: string | null;
  fiBucket: string | null;
  fiUrl: string | null;
  fiMimeType: string | null;
  fiSize: number | null;
  fiWidth: number | null;
  fiHeight: number | null;
};

type PostLocaleWithRelations = PostLocaleWithAssets & {
  postStatus: PostStatus;
  postCreatedAt: string;
  postPublishedAt: string | null;
  postUpdatedAt: string;
  postAuthorId: number | null;
  postCategoryId: number | null;
  postCreatedBy: number | null;
  postUpdatedBy: number | null;
  authorId: number | null;
  authorSlug: string | null;
  authorName: string | null;
  authorBio: string | null;
  categoryId: number | null;
  categorySlug: string | null;
  categoryName: string | null;
  categoryIntro: string | null;
  createdByUserId: number | null;
  createdByUserName: string | null;
  createdByUserEmail: string | null;
  createdByUserRole: string | null;
  postViews: number | null;
};

function parseStringArray(value: unknown): string[] {
  if (!value) return [];
  if (Array.isArray(value)) {
    return value.map((item) => String(item)).filter(Boolean);
  }
  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value);
      if (Array.isArray(parsed)) {
        return parsed.map((item) => String(item)).filter(Boolean);
      }
    } catch {
      return [];
    }
  }
  return [];
}

function parseFaqs(value: unknown): FAQItem[] {
  if (!value) return [];
  const source = (() => {
    if (Array.isArray(value)) return value;
    if (typeof value === "string") {
      try {
        const parsed = JSON.parse(value);
        return Array.isArray(parsed) ? parsed : [];
      } catch {
        return [];
      }
    }
    return [];
  })();
  return source
    .map((item) => {
      if (!item || typeof item !== "object") return null;
      const entry = item as { question?: string; answer?: string };
      if (!entry.question || !entry.answer) return null;
      return { question: entry.question, answer: entry.answer };
    })
    .filter(Boolean) as FAQItem[];
}

function mapMedia(
  media: {
    id: number;
    provider: string;
    key: string;
    bucket: string | null;
    url: string | null;
    mimeType: string | null;
    size: number | null;
    width: number | null;
    height: number | null;
  } | null
): MediaAsset | null {
  if (!media) return null;
  const resolvedUrl = resolveMediaUrl(media);
  const isRemote = media.provider === "r2" || media.provider === "s3";
  return {
    id: media.id,
    provider: isRemote ? "r2" : "local",
    key: media.key,
    bucket: media.bucket,
    url: resolvedUrl,
    mimeType: media.mimeType,
    size: media.size,
    width: media.width,
    height: media.height,
  };
}

function mapMediaFromRow(
  row: {
    ogId?: number | null;
    ogProvider?: string | null;
    ogKey?: string | null;
    ogBucket?: string | null;
    ogUrl?: string | null;
    ogMimeType?: string | null;
    ogSize?: number | null;
    ogWidth?: number | null;
    ogHeight?: number | null;
    fiId?: number | null;
    fiProvider?: string | null;
    fiKey?: string | null;
    fiBucket?: string | null;
    fiUrl?: string | null;
    fiMimeType?: string | null;
    fiSize?: number | null;
    fiWidth?: number | null;
    fiHeight?: number | null;
  },
  prefix: "og" | "fi"
) {
  const id = prefix === "og" ? row.ogId : row.fiId;
  if (!id) return null;
  return mapMedia({
    id,
    provider:
      prefix === "og" ? row.ogProvider ?? "local" : row.fiProvider ?? "local",
    key: prefix === "og" ? row.ogKey ?? "" : row.fiKey ?? "",
    bucket: prefix === "og" ? row.ogBucket ?? null : row.fiBucket ?? null,
    url: prefix === "og" ? row.ogUrl ?? null : row.fiUrl ?? null,
    mimeType: prefix === "og" ? row.ogMimeType ?? null : row.fiMimeType ?? null,
    size: prefix === "og" ? row.ogSize ?? null : row.fiSize ?? null,
    width: prefix === "og" ? row.ogWidth ?? null : row.fiWidth ?? null,
    height: prefix === "og" ? row.ogHeight ?? null : row.fiHeight ?? null,
  });
}

function mapPostLocale(
  row: PostLocaleWithAssets,
  attachments: MediaAsset[] = []
): PostLocale {
  const ogImageMedia = mapMediaFromRow(row, "og");
  const featuredImageMedia = mapMediaFromRow(row, "fi");
  const derivedExcerpt = deriveExcerpt({
    seoDescription: row.seoDescription,
    description: row.contentRich ?? row.content,
  });

  return {
    id: row.id,
    locale: row.locale,
    slug: row.slug,
    seoSlug: row.seoSlug,
    title: row.title,
    excerpt: derivedExcerpt,
    content: row.contentRich ?? row.content,
    contentRich: row.contentRich ?? null,
    seoTitle: row.seoTitle,
    seoDescription: row.seoDescription,
    canonical: row.canonical,
    noindex: Boolean(row.noindex),
    ogImage: ogImageMedia?.url ?? null,
    ogImageMedia,
    featuredImage: featuredImageMedia?.url ?? null,
    featuredImageMedia,
    featuredImageAlt: row.featuredImageAlt,
    featuredImageWidth: row.featuredImageWidth,
    featuredImageHeight: row.featuredImageHeight,
    primaryKeyword: row.primaryKeyword,
    tags: parseStringArray(row.tags),
    faqs: parseFaqs(row.faqs),
    attachments,
  };
}

function mapLocalizedPost(
  localeRow: PostLocaleWithRelations,
  attachmentsByLocaleId: Map<number, MediaAsset[]>,
  localesByPostId: Map<number, PostLocale[]>,
  includeLocales = false
): Post {
  const mappedLocale = mapPostLocale(
    localeRow,
    attachmentsByLocaleId.get(localeRow.id) ?? []
  );

  return {
    id: localeRow.postId,
    locale: mappedLocale.locale,
    slug: mappedLocale.slug,
    seoSlug: mappedLocale.seoSlug,
    title: mappedLocale.title,
    excerpt: mappedLocale.excerpt,
    content: mappedLocale.content,
    contentRich: mappedLocale.contentRich,
    status: localeRow.postStatus as PostStatus,
    createdAt: new Date(localeRow.postCreatedAt).toISOString(),
    publishedAt: localeRow.postPublishedAt
      ? new Date(localeRow.postPublishedAt).toISOString()
      : null,
    updatedAt: new Date(localeRow.postUpdatedAt).toISOString(),
    seoTitle: mappedLocale.seoTitle,
    seoDescription: mappedLocale.seoDescription,
    canonical: mappedLocale.canonical,
    noindex: mappedLocale.noindex ?? false,
    ogImage: mappedLocale.ogImage,
    ogImageMedia: mappedLocale.ogImageMedia,
    featuredImage: mappedLocale.featuredImage,
    featuredImageMedia: mappedLocale.featuredImageMedia,
    featuredImageAlt: mappedLocale.featuredImageAlt,
    featuredImageWidth: mappedLocale.featuredImageWidth,
    featuredImageHeight: mappedLocale.featuredImageHeight,
    primaryKeyword: mappedLocale.primaryKeyword,
    tags: mappedLocale.tags,
    faqs: mappedLocale.faqs,
    attachments: mappedLocale.attachments,
    author: localeRow.authorId
      ? {
          id: localeRow.authorId,
          slug: localeRow.authorSlug ?? "",
          name: localeRow.authorName ?? "",
          bio: localeRow.authorBio ?? null,
        }
      : null,
    category: localeRow.categoryId
      ? {
          id: localeRow.categoryId,
          slug: localeRow.categorySlug ?? "",
          name: localeRow.categoryName ?? "",
          intro: localeRow.categoryIntro ?? null,
        }
      : null,
    categories: localeRow.categoryId
      ? [
          {
            id: localeRow.categoryId,
            slug: localeRow.categorySlug ?? "",
            name: localeRow.categoryName ?? "",
            intro: localeRow.categoryIntro ?? null,
          },
        ]
      : [],
    createdBy: localeRow.postCreatedBy ?? null,
    updatedBy: localeRow.postUpdatedBy ?? null,
    createdByUser: localeRow.createdByUserId
      ? {
          id: localeRow.createdByUserId,
          name: localeRow.createdByUserName,
          email: localeRow.createdByUserEmail ?? "",
          role: localeRow.createdByUserRole ?? "",
        }
      : null,
    locales: includeLocales
      ? localesByPostId.get(localeRow.postId) ?? []
      : undefined,
    views: Number(localeRow.postViews ?? 0),
  };
}

function tagToSlug(tag: string) {
  return normalizeSlug(tag);
}

function hasSlugLink(content: string, slug: string) {
  const encodedSlug = encodeURIComponent(slug);
  const relative = `/admin/posts/${slug}`;
  const encodedRelative = `/admin/posts/${encodedSlug}`;
  const publicRelative = `/post/${slug}`;
  const encodedPublicRelative = `/post/${encodedSlug}`;
  const legacyRelative = `/posts/${slug}`;
  const encodedLegacyRelative = `/posts/${encodedSlug}`;
  return (
    content.includes(relative) ||
    content.includes(encodedRelative) ||
    content.includes(publicRelative) ||
    content.includes(encodedPublicRelative) ||
    content.includes(legacyRelative) ||
    content.includes(encodedLegacyRelative)
  );
}

async function ensureDb() {
  await initCloudflareD1();
}

async function fetchPostAttachments(localeIds: number[]) {
  await ensureDb();
  const map = new Map<number, MediaAsset[]>();
  if (localeIds.length === 0) return map;
  const placeholders = localeIds.map(() => "?").join(", ");
  const rows = await db.query<{
    postLocaleId: number;
    id: number;
    provider: string;
    key: string;
    bucket: string | null;
    url: string | null;
    mimeType: string | null;
    size: number | null;
    width: number | null;
    height: number | null;
    sortOrder: number;
  }>(
    `SELECT pa.postLocaleId,
            pa.sortOrder,
            m.id,
            m.provider,
            m.key,
            m.bucket,
            m.url,
            m.mimeType,
            m.size,
            m.width,
            m.height
     FROM post_attachments pa
     JOIN media m ON m.id = pa.mediaId
     WHERE pa.postLocaleId IN (${placeholders})
     ORDER BY pa.postLocaleId ASC, pa.sortOrder ASC`,
    localeIds
  );
  rows.forEach((row) => {
    const media = mapMedia({
      id: row.id,
      provider: row.provider,
      key: row.key,
      bucket: row.bucket,
      url: row.url,
      mimeType: row.mimeType,
      size: row.size,
      width: row.width,
      height: row.height,
    });
    if (!media) return;
    const list = map.get(row.postLocaleId) ?? [];
    list.push(media);
    map.set(row.postLocaleId, list);
  });
  return map;
}

async function fetchLocalesByPostIds(postIds: number[]) {
  await ensureDb();
  const map = new Map<number, PostLocale[]>();
  if (postIds.length === 0) return map;
  const placeholders = postIds.map(() => "?").join(", ");
  const rows = await db.query<PostLocaleWithAssets>(
    `SELECT pl.id,
            pl.postId,
            pl.locale,
            pl.slug,
            pl.seoSlug,
            pl.title,
            pl.excerpt,
            pl.content,
            pl.contentRich,
            pl.seoTitle,
            pl.seoDescription,
            pl.canonical,
            pl.noindex,
            pl.ogImageId,
            pl.featuredImageId,
            pl.featuredImageAlt,
            pl.featuredImageWidth,
            pl.featuredImageHeight,
            pl.primaryKeyword,
            pl.tags,
            pl.faqs,
            pl.createdAt,
            pl.updatedAt,
            og.id as ogId,
            og.provider as ogProvider,
            og.key as ogKey,
            og.bucket as ogBucket,
            og.url as ogUrl,
            og.mimeType as ogMimeType,
            og.size as ogSize,
            og.width as ogWidth,
            og.height as ogHeight,
            fi.id as fiId,
            fi.provider as fiProvider,
            fi.key as fiKey,
            fi.bucket as fiBucket,
            fi.url as fiUrl,
            fi.mimeType as fiMimeType,
            fi.size as fiSize,
            fi.width as fiWidth,
            fi.height as fiHeight
     FROM post_locales pl
     LEFT JOIN media og ON og.id = pl.ogImageId
     LEFT JOIN media fi ON fi.id = pl.featuredImageId
     WHERE pl.postId IN (${placeholders})
     ORDER BY pl.locale ASC`,
    postIds
  );
  const attachmentsByLocaleId = await fetchPostAttachments(
    rows.map((row) => row.id)
  );
  rows.forEach((row) => {
    const locale = mapPostLocale(row, attachmentsByLocaleId.get(row.id) ?? []);
    const list = map.get(row.postId) ?? [];
    list.push(locale);
    map.set(row.postId, list);
  });
  return map;
}

async function fetchPostLocales(options: {
  where?: string;
  params?: SqlValue[];
  orderBy?: string;
  limit?: number;
  includeLocales?: boolean;
}) {
  await ensureDb();
  const whereClause = options.where ? `WHERE ${options.where}` : "";
  const orderClause = options.orderBy ? `ORDER BY ${options.orderBy}` : "";
  const limitClause = options.limit ? `LIMIT ${options.limit}` : "";
  const rows = await db.query<PostLocaleWithRelations>(
    `SELECT pl.id,
            pl.postId,
            pl.locale,
            pl.slug,
            pl.seoSlug,
            pl.title,
            pl.excerpt,
            pl.content,
            pl.contentRich,
            pl.seoTitle,
            pl.seoDescription,
            pl.canonical,
            pl.noindex,
            pl.ogImageId,
            pl.featuredImageId,
            pl.featuredImageAlt,
            pl.featuredImageWidth,
            pl.featuredImageHeight,
            pl.primaryKeyword,
            pl.tags,
            pl.faqs,
            pl.createdAt,
            pl.updatedAt,
            og.id as ogId,
            og.provider as ogProvider,
            og.key as ogKey,
            og.bucket as ogBucket,
            og.url as ogUrl,
            og.mimeType as ogMimeType,
            og.size as ogSize,
            og.width as ogWidth,
            og.height as ogHeight,
            fi.id as fiId,
            fi.provider as fiProvider,
            fi.key as fiKey,
            fi.bucket as fiBucket,
            fi.url as fiUrl,
            fi.mimeType as fiMimeType,
            fi.size as fiSize,
            fi.width as fiWidth,
            fi.height as fiHeight,
            p.status as postStatus,
            p.createdAt as postCreatedAt,
            p.publishedAt as postPublishedAt,
            p.updatedAt as postUpdatedAt,
            p.authorId as postAuthorId,
            p.categoryId as postCategoryId,
            p.createdBy as postCreatedBy,
            p.updatedBy as postUpdatedBy,
            a.id as authorId,
            a.slug as authorSlug,
            a.name as authorName,
            a.bio as authorBio,
            c.id as categoryId,
            c.slug as categorySlug,
            c.name as categoryName,
            c.intro as categoryIntro,
            u.id as createdByUserId,
            u.name as createdByUserName,
            u.email as createdByUserEmail,
            u.role as createdByUserRole,
            COALESCE(pm.views, 0) as postViews
     FROM post_locales pl
     JOIN posts p ON p.id = pl.postId
     LEFT JOIN post_metrics pm ON pm.postId = p.id
     LEFT JOIN authors a ON a.id = p.authorId
     LEFT JOIN categories c ON c.id = p.categoryId
     LEFT JOIN users u ON u.id = p.createdBy
     LEFT JOIN media og ON og.id = pl.ogImageId
     LEFT JOIN media fi ON fi.id = pl.featuredImageId
     ${whereClause}
     ${orderClause}
     ${limitClause}`,
    options.params ?? []
  );
  if (rows.length === 0) return [];
  const localeIds = rows.map((row) => row.id);
  const postIds = Array.from(new Set(rows.map((row) => row.postId)));
  const [attachmentsByLocaleId, localesByPostId] = await Promise.all([
    fetchPostAttachments(localeIds),
    options.includeLocales ? fetchLocalesByPostIds(postIds) : new Map(),
  ]);

  return rows.map((row) =>
    mapLocalizedPost(
      row,
      attachmentsByLocaleId,
      localesByPostId,
      options.includeLocales ?? false
    )
  );
}

export async function getRedirectTarget(
  slug: string,
  locale: string
): Promise<string | null> {
  await ensureDb();
  const slugCandidates = buildPostSlugCandidates(slug);
  if (slugCandidates.length === 0) return null;
  const placeholders = slugCandidates.map(() => "?").join(", ");
  const redirect = await db.queryOne<{ toSlug: string }>(
    `SELECT toSlug
     FROM redirects
     WHERE locale = ? AND fromSlug IN (${placeholders})
     LIMIT 1`,
    [locale, ...slugCandidates]
  );
  return redirect?.toSlug ?? null;
}

export async function upsertRedirect(
  fromSlug: string,
  toSlug: string,
  locale: string
) {
  await ensureDb();
  const normalizedFromSlug = normalizePostSlug(fromSlug);
  const normalizedToSlug = normalizePostSlug(toSlug);
  if (!normalizedFromSlug || !normalizedToSlug) return;
  const existing = await db.queryOne<{ id: number }>(
    `SELECT id FROM redirects WHERE locale = ? AND fromSlug = ?`,
    [locale, normalizedFromSlug]
  );
  if (existing) {
    await db.execute(
      `UPDATE redirects SET toSlug = ?, createdAt = ? WHERE id = ?`,
      [normalizedToSlug, new Date(), existing.id]
    );
  } else {
    await db.execute(
      `INSERT INTO redirects (fromSlug, toSlug, locale, createdAt)
       VALUES (?, ?, ?, ?)`,
      [normalizedFromSlug, normalizedToSlug, locale, new Date()]
    );
  }

  await addRedirect(normalizedFromSlug, normalizedToSlug, locale);
}

export async function getAllPosts(locale = defaultLocale): Promise<Post[]> {
  return fetchPostLocales({
    where: "pl.locale = ?",
    params: [locale],
    orderBy: "p.updatedAt DESC",
  });
}

export async function getAllPostsForAdmin(): Promise<Post[]> {
  return fetchPostLocales({
    orderBy: "p.updatedAt DESC",
  });
}

export async function getPublishedPosts(
  locale = defaultLocale
): Promise<Post[]> {
  const now = new Date().toISOString();
  return fetchPostLocales({
    where:
      "pl.locale = ? AND pl.noindex = 0 AND p.status = ? AND (p.publishedAt <= ? OR p.publishedAt IS NULL)",
    params: [locale, "published", now],
    orderBy: "p.updatedAt DESC",
  });
}

export async function getAllTags(
  locale = defaultLocale
): Promise<TagSummary[]> {
  const posts = await getPublishedPosts(locale);
  const counts = new Map<string, number>();
  posts.forEach((post) => {
    post.tags.forEach((tag) => {
      const slug = tagToSlug(tag);
      if (!slug) return;
      counts.set(slug, (counts.get(slug) ?? 0) + 1);
    });
  });
  return Array.from(counts.entries()).map(([slug, count]) => ({
    slug,
    name: slug.replace(/-/g, " "),
    count,
  }));
}

export async function getTagBySlug(
  slug: string,
  locale = defaultLocale
): Promise<TagSummary | undefined> {
  const tags = await getAllTags(locale);
  return tags.find((tag) => tag.slug === slug);
}

export async function getPostsByTagSlug(
  slug: string,
  locale = defaultLocale
): Promise<Post[]> {
  const posts = await getPublishedPosts(locale);
  return posts.filter((post) =>
    post.tags.some((tag) => tagToSlug(tag) === slug)
  );
}

export async function getPostBySlug(
  slug: string,
  locale = defaultLocale
): Promise<Post | undefined> {
  const slugCandidates = buildPostSlugCandidates(slug);
  if (slugCandidates.length === 0) return undefined;
  const now = new Date().toISOString();
  const placeholders = slugCandidates.map(() => "?").join(", ");
  const rows = await fetchPostLocales({
    where: `pl.slug IN (${placeholders}) AND pl.locale = ? AND pl.noindex = 0 AND p.status = ? AND (p.publishedAt <= ? OR p.publishedAt IS NULL)`,
    params: [...slugCandidates, locale, "published", now],
    limit: 1,
    includeLocales: true,
  });
  return rows[0] ?? undefined;
}

export async function getPostBySlugPreview(
  slug: string,
  locale = defaultLocale,
  options?: { includeLocales?: boolean }
): Promise<Post | undefined> {
  const slugCandidates = buildPostSlugCandidates(slug);
  if (slugCandidates.length === 0) return undefined;
  const placeholders = slugCandidates.map(() => "?").join(", ");
  const rows = await fetchPostLocales({
    where: `pl.slug IN (${placeholders}) AND pl.locale = ?`,
    params: [...slugCandidates, locale],
    limit: 1,
    includeLocales: options?.includeLocales ?? false,
  });
  return rows[0] ?? undefined;
}

export async function getPostByIdPreview(
  postId: number,
  locale = defaultLocale,
  options?: { includeLocales?: boolean }
): Promise<Post | undefined> {
  if (!postId) return undefined;
  const rows = await fetchPostLocales({
    where: "pl.postId = ? AND pl.locale = ?",
    params: [postId, locale],
    limit: 1,
    includeLocales: options?.includeLocales ?? false,
  });
  return rows[0] ?? undefined;
}

export async function getRelatedPosts(
  postId: number,
  categoryId?: number | null,
  locale = defaultLocale
): Promise<Post[]> {
  if (!categoryId) return [];
  const now = new Date().toISOString();
  return fetchPostLocales({
    where:
      "pl.locale = ? AND pl.postId != ? AND pl.noindex = 0 AND p.status = ? AND (p.publishedAt <= ? OR p.publishedAt IS NULL) AND p.categoryId = ?",
    params: [locale, postId, "published", now, categoryId],
    orderBy: "p.publishedAt DESC",
    limit: 5,
  });
}

export type PostCollections = {
  popularPosts: Post[];
  latestPosts: Post[];
  previousPosts: Post[];
  nextPosts: Post[];
  recommendedPosts: Post[];
};

function dedupeById(posts: Post[], usedIds: Set<number>, limit: number) {
  const output: Post[] = [];
  for (const post of posts) {
    if (usedIds.has(post.id)) continue;
    usedIds.add(post.id);
    output.push(post);
    if (output.length >= limit) break;
  }
  return output;
}

export async function incrementPostView(postId: number) {
  if (!postId) return;
  await ensureDb();
  const now = new Date();
  const day = now.toISOString().slice(0, 10);
  await db.execute(
    `INSERT INTO post_metrics (postId, views, clicks, updatedAt)
     VALUES (?, 1, 0, ?)
     ON CONFLICT(postId)
     DO UPDATE SET views = views + 1, updatedAt = excluded.updatedAt`,
    [postId, now]
  );
  await db.execute(
    `INSERT INTO post_metric_daily (postId, day, views, updatedAt)
     VALUES (?, ?, 1, ?)
     ON CONFLICT(postId, day)
     DO UPDATE SET views = views + 1, updatedAt = excluded.updatedAt`,
    [postId, day, now]
  );
}

export async function incrementPostClick(postId: number) {
  if (!postId) return;
  await ensureDb();
  await db.execute(
    `INSERT INTO post_metrics (postId, views, clicks, updatedAt)
     VALUES (?, 0, 1, ?)
     ON CONFLICT(postId)
     DO UPDATE SET clicks = clicks + 1, updatedAt = excluded.updatedAt`,
    [postId, new Date()]
  );
}

export type PostReachRange = "weekly" | "monthly" | "yearly" | "fiveYearly";
export type PostReachDayPoint = {
  day: string;
  totalViews: number;
  postViews: { postId: number; views: number }[];
};

function getReachRangeStart(range: PostReachRange) {
  const date = new Date();
  switch (range) {
    case "weekly":
      date.setDate(date.getDate() - 7);
      break;
    case "monthly":
      date.setMonth(date.getMonth() - 1);
      break;
    case "yearly":
      date.setFullYear(date.getFullYear() - 1);
      break;
    case "fiveYearly":
      date.setFullYear(date.getFullYear() - 5);
      break;
    default:
      date.setMonth(date.getMonth() - 1);
      break;
  }
  return date.toISOString().slice(0, 10);
}

export async function getPostReachByPostIds(
  postIds: number[],
  range: PostReachRange
): Promise<Map<number, number>> {
  await ensureDb();
  const reach = new Map<number, number>();
  if (postIds.length === 0) return reach;

  const placeholders = postIds.map(() => "?").join(", ");
  const startDay = getReachRangeStart(range);
  const rows = await db.query<{ postId: number; views: number }>(
    `SELECT postId, SUM(views) as views
     FROM post_metric_daily
     WHERE day >= ? AND postId IN (${placeholders})
     GROUP BY postId`,
    [startDay, ...postIds]
  );

  rows.forEach((row) => {
    reach.set(row.postId, Number(row.views ?? 0));
  });
  return reach;
}

export async function getPostReachTimelineByPostIds(
  postIds: number[],
  range: PostReachRange
): Promise<PostReachDayPoint[]> {
  await ensureDb();
  const startDay = getReachRangeStart(range);
  const endDay = new Date().toISOString().slice(0, 10);

  const timeline = new Map<string, PostReachDayPoint>();
  const cursor = new Date(`${startDay}T00:00:00.000Z`);
  const end = new Date(`${endDay}T00:00:00.000Z`);
  while (cursor <= end) {
    const day = cursor.toISOString().slice(0, 10);
    timeline.set(day, { day, totalViews: 0, postViews: [] });
    cursor.setUTCDate(cursor.getUTCDate() + 1);
  }

  if (postIds.length === 0) {
    return Array.from(timeline.values());
  }

  const placeholders = postIds.map(() => "?").join(", ");
  const rows = await db.query<{ day: string; postId: number; views: number }>(
    `SELECT day, postId, SUM(views) as views
     FROM post_metric_daily
     WHERE day >= ? AND postId IN (${placeholders})
     GROUP BY day, postId
     ORDER BY day ASC, views DESC`,
    [startDay, ...postIds]
  );

  rows.forEach((row) => {
    const day = row.day.slice(0, 10);
    const point =
      timeline.get(day) ??
      ({
        day,
        totalViews: 0,
        postViews: [],
      } satisfies PostReachDayPoint);
    const views = Number(row.views ?? 0);
    point.totalViews += views;
    point.postViews.push({ postId: row.postId, views });
    timeline.set(day, point);
  });

  return Array.from(timeline.values());
}

export async function getPostCollections(
  post: Post,
  _locale = defaultLocale
): Promise<PostCollections> {
  const now = new Date();
  const baseUsedIds = new Set<number>([post.id]);
  const nowIso = now.toISOString();

  const popularLocales = await fetchPostLocales({
    where:
      "pl.postId != ? AND pl.noindex = 0 AND p.status = ? AND p.publishedAt IS NOT NULL AND p.publishedAt <= ? AND pm.views > 0",
    params: [post.id, "published", nowIso],
    orderBy: "pm.views DESC, p.publishedAt DESC",
    limit: 12,
  });
  const popularPosts = dedupeById(popularLocales, new Set(baseUsedIds), 5);

  const latestLocales = await fetchPostLocales({
    where:
      "pl.postId != ? AND pl.noindex = 0 AND p.status = ? AND p.publishedAt IS NOT NULL AND p.publishedAt <= ? " +
      (post.category?.id ? "AND p.categoryId = ?" : ""),
    params: post.category?.id
      ? [post.id, "published", nowIso, post.category.id]
      : [post.id, "published", nowIso],
    orderBy: "p.publishedAt DESC",
    limit: 12,
  });
  let latestPosts = dedupeById(latestLocales, new Set(baseUsedIds), 4);
  if (latestPosts.length === 0) {
    const latestAllLocales = await fetchPostLocales({
      where:
        "pl.postId != ? AND pl.noindex = 0 AND p.status = ? AND p.publishedAt IS NOT NULL AND p.publishedAt <= ?",
      params: [post.id, "published", nowIso],
      orderBy: "p.publishedAt DESC",
      limit: 12,
    });
    latestPosts = dedupeById(latestAllLocales, new Set(baseUsedIds), 4);
  }

  let previousPosts: Post[] = [];
  if (post.category?.id) {
    const previousLocales = await fetchPostLocales({
      where:
        "pl.postId != ? AND pl.noindex = 0 AND p.status = ? AND p.publishedAt IS NOT NULL AND p.publishedAt <= ? " +
        (post.publishedAt ? "AND p.publishedAt < ?" : "") +
        " AND p.categoryId = ?",
      params: post.publishedAt
        ? [
            post.id,
            "published",
            nowIso,
            new Date(post.publishedAt).toISOString(),
            post.category.id,
          ]
        : [post.id, "published", nowIso, post.category.id],
      orderBy: "p.publishedAt DESC",
      limit: 12,
    });
    previousPosts = dedupeById(previousLocales, new Set(baseUsedIds), 1);
  }
  if (previousPosts.length === 0) {
    previousPosts = [];
    // previousPosts = latestPosts.slice(-1);
  }

  let nextPosts: Post[] = [];
  if (post.category?.id) {
    const nextLocales = await fetchPostLocales({
      where:
        "pl.postId != ? AND pl.noindex = 0 AND p.status = ? AND p.publishedAt IS NOT NULL AND p.publishedAt <= ? " +
        (post.publishedAt ? "AND p.publishedAt > ?" : "") +
        " AND p.categoryId = ?",
      params: post.publishedAt
        ? [
            post.id,
            "published",
            nowIso,
            new Date(post.publishedAt).toISOString(),
            post.category.id,
          ]
        : [post.id, "published", nowIso, post.category.id],
      orderBy: "p.publishedAt ASC",
      limit: 12,
    });
    nextPosts = dedupeById(nextLocales, new Set(baseUsedIds), 1);
  }
  if (nextPosts.length === 0) {
    nextPosts = [];
    // nextPosts = latestPosts.slice(0);
  }

  let recommendedPosts: Post[] = [];
  if (post.category?.id) {
    const categoryLocales = await fetchPostLocales({
      where:
        "pl.postId != ? AND pl.noindex = 0 AND p.status = ? AND p.publishedAt IS NOT NULL AND p.publishedAt <= ? AND pm.views > 0 AND p.categoryId = ?",
      params: [post.id, "published", nowIso, post.category.id],
      orderBy: "pm.views DESC, p.publishedAt DESC",
      limit: 12,
    });
    recommendedPosts = dedupeById(categoryLocales, new Set(baseUsedIds), 4);
  }
  if (recommendedPosts.length === 0) {
    recommendedPosts = popularPosts.slice(0, 9);
  }

  return {
    popularPosts,
    latestPosts,
    previousPosts,
    nextPosts,
    recommendedPosts,
  };
}

export async function getInboundLinkCount(
  slug: string,
  locale = defaultLocale
): Promise<number> {
  if (!slug) return 0;
  const posts = await getPublishedPosts(locale);
  return posts.reduce((count, post) => {
    if (post.slug === slug) return count;
    return hasSlugLink(post.content, slug) ? count + 1 : count;
  }, 0);
}

export async function getInternalLinkSuggestions(
  post: Post,
  limit = 5
): Promise<Post[]> {
  const posts = (await getPublishedPosts(post.locale)).filter(
    (candidate) => candidate.id !== post.id
  );
  const tagSet = new Set(post.tags.map((tag) => tagToSlug(tag)));

  const scored = posts
    .map((candidate) => {
      let score = 0;
      if (post.category?.id && candidate.category?.id === post.category.id) {
        score += 2;
      }
      candidate.tags.forEach((tag) => {
        if (tagSet.has(tagToSlug(tag))) score += 1;
      });
      return { post: candidate, score };
    })
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score || b.post.id - a.post.id)
    .map((item) => item.post);

  return scored.slice(0, limit);
}

export async function getAuthorBySlug(
  slug: string
): Promise<Author | undefined> {
  await ensureDb();
  const author = await db.queryOne<Author>(
    `SELECT id, slug, name, bio FROM authors WHERE slug = ?`,
    [slug]
  );
  return author ?? undefined;
}

export async function getCategoryBySlug(
  slug: string
): Promise<Category | undefined> {
  await ensureDb();
  const category = await db.queryOne<Category>(
    `SELECT id, slug, name, intro FROM categories WHERE slug = ?`,
    [slug]
  );
  return category ?? undefined;
}

export async function getPostsByAuthorSlug(
  slug: string,
  locale = defaultLocale
): Promise<Post[]> {
  const now = new Date().toISOString();
  return fetchPostLocales({
    where:
      "pl.locale = ? AND pl.noindex = 0 AND p.status = ? AND (p.publishedAt <= ? OR p.publishedAt IS NULL) AND a.slug = ?",
    params: [locale, "published", now, slug],
    orderBy: "p.publishedAt DESC",
  });
}

export async function getPostsByCategorySlug(
  slug: string,
  locale = defaultLocale
): Promise<Post[]> {
  const now = new Date().toISOString();
  return fetchPostLocales({
    where:
      "pl.locale = ? AND pl.noindex = 0 AND p.status = ? AND (p.publishedAt <= ? OR p.publishedAt IS NULL) AND c.slug = ?",
    params: [locale, "published", now, slug],
    orderBy: "p.publishedAt DESC",
  });
}

export async function getPostsByKewWords(
  keyword: string,
  locale: string
): Promise<Post[]> {
  const term = keyword.trim();
  if (!term) return [];
  const now = new Date().toISOString();
  return fetchPostLocales({
    where:
      "pl.locale = ? AND pl.noindex = 0 AND LOWER(pl.title) LIKE ? AND p.status = ? AND (p.publishedAt <= ? OR p.publishedAt IS NULL)",
    params: [locale, `%${term.toLowerCase()}%`, "published", now],
    orderBy: "p.publishedAt DESC",
  });
}

export async function getAllCategories(): Promise<Category[]> {
  await ensureDb();
  const rows = await db.query<{
    id: number;
    slug: string;
    name: string;
    intro: string | null;
    createdByUserId: number | null;
    createdByUserName: string | null;
    createdByUserEmail: string | null;
  }>(
    `SELECT c.id,
            c.slug,
            c.name,
            c.intro,
            u.id as createdByUserId,
            u.name as createdByUserName,
            u.email as createdByUserEmail
     FROM categories c
     LEFT JOIN users u ON u.id = c.createdBy
     ORDER BY c.name ASC`
  );
  return rows.map((row) => ({
    id: row.id,
    slug: row.slug,
    name: row.name,
    intro: row.intro,
    createdByUser: row.createdByUserId
      ? {
          id: row.createdByUserId,
          name: row.createdByUserName,
          email: row.createdByUserEmail ?? "",
        }
      : null,
  }));
}

export async function upsertCategory(input: {
  id?: number | null;
  slug: string;
  name: string;
  intro?: string | null;
  actorId?: number | null;
}) {
  await ensureDb();
  if (input.id) {
    await db.execute(
      `UPDATE categories
       SET slug = ?, name = ?, intro = ?, updatedBy = ?
       WHERE id = ?`,
      [input.slug, input.name, input.intro ?? null, input.actorId ?? null, input.id]
    );
    return;
  }
  const existing = await db.queryOne<{ id: number }>(
    `SELECT id FROM categories WHERE slug = ?`,
    [input.slug]
  );
  if (existing) {
    await db.execute(
      `UPDATE categories SET name = ?, intro = ?, updatedBy = ? WHERE id = ?`,
      [input.name, input.intro ?? null, input.actorId ?? null, existing.id]
    );
    return;
  }
  await db.execute(
    `INSERT INTO categories (slug, name, intro, createdAt, createdBy, updatedBy)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [
      input.slug,
      input.name,
      input.intro ?? null,
      new Date(),
      input.actorId ?? null,
      input.actorId ?? null,
    ]
  );
}

export async function deleteCategoryById(id: number) {
  await ensureDb();
  await db.execute(`DELETE FROM categories WHERE id = ?`, [id]);
}

export async function getAllAuthors(): Promise<Author[]> {
  await ensureDb();
  return db.query<Author>(
    `SELECT id, slug, name, bio FROM authors ORDER BY name ASC`
  );
}

export async function ensureAuthorForUser(input: {
  userId: number;
  name?: string | null;
  email?: string | null;
}) {
  await ensureDb();
  const slug = `user-${input.userId}`;
  const name = input.name || input.email || `User ${input.userId}`;
  const existing = await db.queryOne<{ id: number }>(
    `SELECT id FROM authors WHERE slug = ?`,
    [slug]
  );
  if (existing) {
    await db.execute(`UPDATE authors SET name = ? WHERE id = ?`, [
      name,
      existing.id,
    ]);
    return { id: existing.id, slug, name, bio: null };
  }
  await db.execute(
    `INSERT INTO authors (slug, name, bio, image) VALUES (?, ?, NULL, NULL)`,
    [slug, name]
  );
  const created = await db.queryOne<Author>(
    `SELECT id, slug, name, bio FROM authors WHERE slug = ?`,
    [slug]
  );
  if (!created) {
    throw new Error("Failed to create author.");
  }
  return created;
}

export async function upsertDraftPost(input: {
  postId?: number | null;
  locale: string;
  slug: string;
  seoSlug?: string;
  title: string;
  excerpt: string;
  content: string;
  contentRich?: string;
  seoTitle?: string;
  seoDescription?: string;
  canonical?: string;
  ogImageId?: number | null;
  ogImageUrl?: string | null;
  featuredImageUrl?: string | null;
  featuredImageId?: number | null;
  featuredImageAlt?: string;
  featuredImageWidth?: number;
  featuredImageHeight?: number;
  primaryKeyword?: string;
  tags?: string[];
  faqs?: FAQItem[];
  attachmentMediaIds?: number[];
  authorSlug?: string;
  categoryIds?: number[];
  status?: PostStatus;
  publishedAt?: string | null;
  noindex?: boolean;
  previousSlug?: string;
  confirmRedirect?: boolean;
  actorId?: number | null;
  baseUrl?: string;
}): Promise<Post> {
  await ensureDb();
  const now = new Date();
  const status: PostStatus = input.status ?? "draft";
  const noindex = Boolean(input.noindex);

  const locale = input.locale || defaultLocale;
  const slug = normalizePostSlug(input.slug);
  if (!slug) {
    throw new Error("Slug is required.");
  }
  const seoSlug = input.seoSlug ? normalizeSlug(input.seoSlug) : null;
  const computedExcerpt = deriveExcerpt({
    seoDescription: input.seoDescription ?? null,
    description: input.contentRich ?? input.content,
  });

  const previousSlug = input.previousSlug
    ? normalizePostSlug(input.previousSlug)
    : null;
  const slugChanged = Boolean(previousSlug && previousSlug !== slug);

  const requestedPostId = Number(input.postId) || null;
  const sourceSlugForLookup = slugChanged ? previousSlug ?? slug : slug;
  const slugLookupCandidates = buildPostSlugCandidates(sourceSlugForLookup);
  const slugLookupCandidatesLower = Array.from(
    new Set(slugLookupCandidates.map((entry) => entry.toLowerCase()))
  );
  const lookupInPlaceholders =
    slugLookupCandidates.length > 0
      ? slugLookupCandidates.map(() => "?").join(", ")
      : "NULL";
  const lookupLowerPlaceholders =
    slugLookupCandidatesLower.length > 0
      ? slugLookupCandidatesLower.map(() => "?").join(", ")
      : "NULL";
  const existingLocaleByPostId = requestedPostId
    ? await db.queryOne<{ id: number; postId: number }>(
        `SELECT id, postId
         FROM post_locales
         WHERE postId = ? AND locale = ?
         LIMIT 1`,
        [requestedPostId, locale]
      )
    : null;
  const existingLocaleBySlug =
    slugLookupCandidates.length === 0
      ? null
      : await db.queryOne<{ id: number; postId: number }>(
          `SELECT id, postId
           FROM post_locales
           WHERE (
               slug IN (${lookupInPlaceholders})
               OR LOWER(slug) IN (${lookupLowerPlaceholders})
             )
           LIMIT 1`,
          [...slugLookupCandidates, ...slugLookupCandidatesLower]
        );
  const existingLocale = existingLocaleByPostId ?? existingLocaleBySlug;
  const previousLocaleMediaIds: number[] = [];

  if (existingLocale?.id) {
    const currentLocaleMedia = await db.queryOne<{
      ogImageId: number | null;
      featuredImageId: number | null;
    }>(
      `SELECT ogImageId, featuredImageId
       FROM post_locales
       WHERE id = ?
       LIMIT 1`,
      [existingLocale.id],
    );
    if (currentLocaleMedia?.ogImageId) {
      previousLocaleMediaIds.push(currentLocaleMedia.ogImageId);
    }
    if (currentLocaleMedia?.featuredImageId) {
      previousLocaleMediaIds.push(currentLocaleMedia.featuredImageId);
    }
    const localeAttachmentRows = await db.query<{ mediaId: number }>(
      `SELECT mediaId
       FROM post_attachments
       WHERE postLocaleId = ?`,
      [existingLocale.id],
    );
    localeAttachmentRows.forEach((row) => previousLocaleMediaIds.push(row.mediaId));
  }

  if (slugChanged && existingLocale) {
    const conflictCandidates = buildPostSlugCandidates(slug);
    const conflictCandidatesLower = Array.from(
      new Set(conflictCandidates.map((entry) => entry.toLowerCase()))
    );
    const conflictInPlaceholders = conflictCandidates.map(() => "?").join(", ");
    const conflictLowerPlaceholders = conflictCandidatesLower
      .map(() => "?")
      .join(", ");
    const conflict = await db.queryOne<{ id: number; postId: number }>(
      `SELECT id, postId
       FROM post_locales
       WHERE (
           slug IN (${conflictInPlaceholders})
           OR LOWER(slug) IN (${conflictLowerPlaceholders})
         )
       LIMIT 1`,
      [...conflictCandidates, ...conflictCandidatesLower]
    );
    if (conflict && conflict.postId !== existingLocale.postId) {
      throw new Error("Slug already exists.");
    }
  }

  const author = input.authorSlug
    ? await db.queryOne<{ id: number }>(
        `SELECT id FROM authors WHERE slug = ?`,
        [input.authorSlug]
      )
    : null;

  const categoryIds = input.categoryIds?.filter(Boolean) ?? [];
  const categories =
    categoryIds.length > 0
      ? await db.query<{ id: number }>(
          `SELECT id FROM categories WHERE id IN (${categoryIds
            .map(() => "?")
            .join(", ")})`,
          categoryIds
        )
      : [];
  if (categoryIds.length > 0 && categories.length !== categoryIds.length) {
    throw new Error("Selected category not found.");
  }

  const existingPostId = existingLocale?.postId ?? requestedPostId ?? null;
  const existingPost = existingPostId
    ? await db.queryOne<{
        id: number;
        createdAt: string;
        createdBy: number | null;
        updatedBy: number | null;
        publishedAt: string | null;
      }>(
        `SELECT id, createdAt, createdBy, updatedBy, publishedAt FROM posts WHERE id = ?`,
        [existingPostId]
      )
    : null;

  const createdBy = existingPost?.createdBy ?? input.actorId ?? null;
  const updatedBy = input.actorId ?? existingPost?.updatedBy ?? null;
  const primaryCategoryId = categoryIds[0] ?? null;
  const resolvedPublishedAt =
    status === "published"
      ? input.publishedAt
        ? new Date(input.publishedAt)
        : existingPost?.publishedAt
        ? new Date(existingPost.publishedAt)
        : now
      : null;

  const resolvedOgImageId = input.ogImageId ?? null;
  const resolvedFeaturedImageId = input.featuredImageId ?? null;
  const ogImageId =
    !resolvedOgImageId && input.ogImageUrl
      ? (await ensureMediaFromUrl(input.ogImageUrl, input.actorId ?? null)).id
      : resolvedOgImageId;
  const featuredImageId =
    !resolvedFeaturedImageId && input.featuredImageUrl
      ? (
          await ensureMediaFromUrl(
            input.featuredImageUrl,
            input.actorId ?? null
          )
        ).id
      : resolvedFeaturedImageId;

  await db.transaction(async (tx) => {
    let postId = existingPost?.id ?? null;
    if (existingPost) {
      await tx.execute(
        `UPDATE posts
         SET status = ?, publishedAt = ?, updatedAt = ?, authorId = ?, categoryId = ?, createdBy = ?, updatedBy = ?
         WHERE id = ?`,
        [
          status,
          resolvedPublishedAt,
          now,
          author?.id ?? null,
          primaryCategoryId,
          createdBy,
          updatedBy,
          existingPost.id,
        ]
      );
    } else {
      if (isD1()) {
        const result = await tx.execute(
          `INSERT INTO posts (status, createdAt, publishedAt, updatedAt, authorId, categoryId, createdBy, updatedBy)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            status,
            now,
            resolvedPublishedAt,
            now,
            author?.id ?? null,
            primaryCategoryId,
            createdBy,
            updatedBy,
          ]
        );
        postId = result.lastInsertId ?? null;
      } else {
        const created = await tx.queryOne<{ id: number }>(
          `INSERT INTO posts (status, createdAt, publishedAt, updatedAt, authorId, categoryId, createdBy, updatedBy)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?)
           RETURNING id`,
          [
            status,
            now,
            resolvedPublishedAt,
            now,
            author?.id ?? null,
            primaryCategoryId,
            createdBy,
            updatedBy,
          ]
        );
        postId = created?.id ?? null;
      }
    }
    if (!postId) {
      throw new Error("Failed to persist post.");
    }

    const canonicalBase = input.baseUrl || siteConfig.url;
    const canonicalUrl = new URL(
      `/${locale}/post/${encodeURIComponent(slug)}`,
      canonicalBase
    ).toString();
    const localeData = [
      locale,
      slug,
      seoSlug,
      input.title,
      computedExcerpt,
      input.content,
      input.contentRich ?? input.content,
      input.seoTitle ?? null,
      input.seoDescription ?? null,
      canonicalUrl,
      noindex ? 1 : 0,
      ogImageId,
      featuredImageId,
      input.featuredImageAlt ?? null,
      input.featuredImageWidth ?? null,
      input.featuredImageHeight ?? null,
      input.primaryKeyword ?? null,
      JSON.stringify(input.tags ?? []),
      JSON.stringify(input.faqs ?? []),
      now,
    ];

    let localeId = existingLocale?.id ?? null;
    if (existingLocale) {
      await tx.execute(
        `UPDATE post_locales
         SET locale = ?, slug = ?, seoSlug = ?, title = ?, excerpt = ?, content = ?, contentRich = ?,
             seoTitle = ?, seoDescription = ?, canonical = ?, noindex = ?, ogImageId = ?, featuredImageId = ?,
             featuredImageAlt = ?, featuredImageWidth = ?, featuredImageHeight = ?, primaryKeyword = ?, tags = ?, faqs = ?, updatedAt = ?
         WHERE id = ?`,
        [...localeData, existingLocale.id]
      );
    } else {
      if (isD1()) {
        const result = await tx.execute(
          `INSERT INTO post_locales
           (postId, locale, slug, seoSlug, title, excerpt, content, contentRich, seoTitle, seoDescription, canonical, noindex,
            ogImageId, featuredImageId, featuredImageAlt, featuredImageWidth, featuredImageHeight, primaryKeyword, tags, faqs, createdAt, updatedAt)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [postId, ...localeData, now]
        );
        localeId = result.lastInsertId ?? null;
      } else {
        const createdLocale = await tx.queryOne<{ id: number }>(
          `INSERT INTO post_locales
           (postId, locale, slug, seoSlug, title, excerpt, content, contentRich, seoTitle, seoDescription, canonical, noindex,
            ogImageId, featuredImageId, featuredImageAlt, featuredImageWidth, featuredImageHeight, primaryKeyword, tags, faqs, createdAt, updatedAt)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
           RETURNING id`,
          [postId, ...localeData, now]
        );
        localeId = createdLocale?.id ?? null;
      }
    }
    if (!localeId) {
      throw new Error("Failed to persist locale.");
    }

    if (input.attachmentMediaIds) {
      await tx.execute(`DELETE FROM post_attachments WHERE postLocaleId = ?`, [
        localeId,
      ]);
      for (let index = 0; index < input.attachmentMediaIds.length; index += 1) {
        const mediaId = input.attachmentMediaIds[index];
        await tx.execute(
          `INSERT INTO post_attachments (postLocaleId, mediaId, sortOrder)
           VALUES (?, ?, ?)`,
          [localeId, mediaId, index]
        );
      }
    }

    if (
      slugChanged &&
      existingLocale &&
      input.confirmRedirect &&
      (status === "published" || status === "scheduled")
    ) {
      const redirectExisting = await tx.queryOne<{ id: number }>(
        `SELECT id FROM redirects WHERE locale = ? AND fromSlug = ?`,
        [locale, previousSlug as string]
      );
      if (redirectExisting) {
        await tx.execute(
          `UPDATE redirects SET toSlug = ?, createdAt = ? WHERE id = ?`,
          [slug, now, redirectExisting.id]
        );
      } else {
        await tx.execute(
          `INSERT INTO redirects (fromSlug, toSlug, locale, createdAt)
           VALUES (?, ?, ?, ?)`,
          [previousSlug as string, slug, locale, now]
        );
      }
    }
  });

  if (
    slugChanged &&
    existingLocale &&
    input.confirmRedirect &&
    (status === "published" || status === "scheduled")
  ) {
    await addRedirect(previousSlug as string, slug, locale);
  }

  await deleteOrphanedMedia(previousLocaleMediaIds);

  const refreshed = await getPostBySlugPreview(slug, locale, {
    includeLocales: true,
  });
  if (!refreshed) {
    throw new Error("Failed to load saved post.");
  }
  return refreshed;
}

export async function deletePostById(id: number) {
  await ensureDb();
  await db.execute(`DELETE FROM posts WHERE id = ?`, [id]);
}

export async function publishPostById(id: number, actorId?: number | null) {
  await ensureDb();
  const now = new Date();
  await db.execute(
    `UPDATE posts
     SET status = ?, publishedAt = ?, updatedAt = ?, updatedBy = ?
     WHERE id = ?`,
    ["published", now, now, actorId ?? null, id]
  );
  return db.queryOne<{ id: number }>(`SELECT id FROM posts WHERE id = ?`, [id]);
}

export async function setPostCategories(
  postId: number,
  categoryIds: number[],
  actorId?: number | null
) {
  await ensureDb();
  void actorId;
  const primaryCategoryId = categoryIds.find(Boolean) ?? null;
  await db.execute(
    `UPDATE posts
     SET categoryId = ?, updatedAt = ?, updatedBy = ?
     WHERE id = ?`,
    [primaryCategoryId, new Date(), actorId ?? null, postId]
  );
}

export async function isSlugAvailable(
  slug: string,
  locale: string,
  postId?: number | null
) {
  await ensureDb();
  void locale;
  const normalized = normalizePostSlug(slug);
  if (!normalized) return false;
  const candidates = buildPostSlugCandidates(normalized);
  const lowerCandidates = Array.from(
    new Set(candidates.map((entry) => entry.toLowerCase()))
  );
  if (candidates.length === 0) return false;
  const inPlaceholders = candidates.map(() => "?").join(", ");
  const lowerPlaceholders = lowerCandidates.map(() => "?").join(", ");
  const existing = await db.queryOne<{ postId: number }>(
    `SELECT postId
     FROM post_locales
     WHERE (
         slug IN (${inPlaceholders})
         OR LOWER(slug) IN (${lowerPlaceholders})
       )
     LIMIT 1`,
    [...candidates, ...lowerCandidates]
  );
  if (!existing) return true;
  if (postId && existing.postId === postId) return true;
  return false;
}
