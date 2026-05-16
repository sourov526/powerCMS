import { defaultLocale } from '@/utils/strings/config';
import { db } from "@/lib/db";
import { initCloudflareD1 } from "@/lib/db-cloudflare";
import type { FAQItem, Post } from "@/lib/services/posts";

export type DraftAttachment = {
  id: number;
  url: string;
};

export type PostLocaleDraftData = {
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
  ogImageId?: number | null;
  ogImageUrl?: string | null;
  featuredImageId?: number | null;
  featuredImageUrl?: string | null;
  featuredImageAlt?: string | null;
  featuredImageWidth?: number | null;
  featuredImageHeight?: number | null;
  primaryKeyword?: string | null;
  tags?: string[];
  faqs?: FAQItem[];
  attachments?: DraftAttachment[];
  attachmentMediaIds?: number[];
  categoryIds?: number[];
  publishedAt?: string | null;
};

export type PostLocaleDraft = {
  postId: number;
  locale: string;
  data: PostLocaleDraftData;
  revision: number;
  baseUpdatedAt: string;
  updatedAt: string;
};

export class DraftStaleWriteError extends Error {
  constructor(message = "Draft is stale.") {
    super(message);
    this.name = "DraftStaleWriteError";
  }
}

function normalizeStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((item) => String(item ?? "").trim())
    .filter(Boolean);
}

function normalizeFaqs(value: unknown): FAQItem[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((item) => {
      if (!item || typeof item !== "object") return null;
      const faq = item as { question?: unknown; answer?: unknown };
      const question = typeof faq.question === "string" ? faq.question.trim() : "";
      const answer = typeof faq.answer === "string" ? faq.answer.trim() : "";
      if (!question || !answer) return null;
      return { question, answer };
    })
    .filter(Boolean) as FAQItem[];
}

function normalizeAttachments(value: unknown): DraftAttachment[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((item) => {
      if (!item || typeof item !== "object") return null;
      const raw = item as { id?: unknown; url?: unknown };
      const id = Number(raw.id);
      const url = typeof raw.url === "string" ? raw.url.trim() : "";
      if (!id || !url) return null;
      return { id, url };
    })
    .filter(Boolean) as DraftAttachment[];
}

function normalizeNumberArray(value: unknown): number[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((item) => Number(item))
    .filter((item) => Number.isFinite(item) && item > 0);
}

function normalizeDraftData(value: unknown): PostLocaleDraftData {
  const raw = value && typeof value === "object" ? (value as Record<string, unknown>) : {};
  const attachments = normalizeAttachments(raw.attachments);
  const attachmentMediaIds = normalizeNumberArray(raw.attachmentMediaIds);
  return {
    locale: typeof raw.locale === "string" ? raw.locale : defaultLocale,
    slug: typeof raw.slug === "string" ? raw.slug : "",
    seoSlug: typeof raw.seoSlug === "string" ? raw.seoSlug : null,
    title: typeof raw.title === "string" ? raw.title : "",
    excerpt: typeof raw.excerpt === "string" ? raw.excerpt : "",
    content: typeof raw.content === "string" ? raw.content : "",
    contentRich: typeof raw.contentRich === "string" ? raw.contentRich : null,
    seoTitle: typeof raw.seoTitle === "string" ? raw.seoTitle : null,
    seoDescription: typeof raw.seoDescription === "string" ? raw.seoDescription : null,
    canonical: typeof raw.canonical === "string" ? raw.canonical : null,
    noindex: Boolean(raw.noindex),
    ogImageId: Number(raw.ogImageId) || null,
    ogImageUrl: typeof raw.ogImageUrl === "string" ? raw.ogImageUrl : null,
    featuredImageId: Number(raw.featuredImageId) || null,
    featuredImageUrl: typeof raw.featuredImageUrl === "string" ? raw.featuredImageUrl : null,
    featuredImageAlt: typeof raw.featuredImageAlt === "string" ? raw.featuredImageAlt : null,
    featuredImageWidth: Number(raw.featuredImageWidth) || null,
    featuredImageHeight: Number(raw.featuredImageHeight) || null,
    primaryKeyword: typeof raw.primaryKeyword === "string" ? raw.primaryKeyword : null,
    tags: normalizeStringArray(raw.tags),
    faqs: normalizeFaqs(raw.faqs),
    attachments,
    attachmentMediaIds:
      attachmentMediaIds.length > 0 ? attachmentMediaIds : attachments.map((item) => item.id),
    categoryIds: normalizeNumberArray(raw.categoryIds),
    publishedAt:
      typeof raw.publishedAt === "string" || raw.publishedAt === null
        ? (raw.publishedAt as string | null)
        : null,
  };
}

function buildDraftDataFromPost(post: Post): PostLocaleDraftData {
  const attachments = (post.attachments ?? [])
    .filter((item) => item.id && item.url)
    .map((item) => ({ id: item.id, url: item.url }));
  return {
    locale: post.locale,
    slug: post.slug,
    seoSlug: post.seoSlug ?? null,
    title: post.title,
    excerpt: post.excerpt,
    content: post.content,
    contentRich: post.contentRich ?? post.content,
    seoTitle: post.seoTitle ?? null,
    seoDescription: post.seoDescription ?? null,
    canonical: post.canonical ?? null,
    noindex: Boolean(post.noindex),
    ogImageId: post.ogImageMedia?.id ?? null,
    ogImageUrl: post.ogImage ?? null,
    featuredImageId: post.featuredImageMedia?.id ?? null,
    featuredImageUrl: post.featuredImage ?? null,
    featuredImageAlt: post.featuredImageAlt ?? null,
    featuredImageWidth: post.featuredImageWidth ?? null,
    featuredImageHeight: post.featuredImageHeight ?? null,
    primaryKeyword: post.primaryKeyword ?? null,
    tags: post.tags ?? [],
    faqs: post.faqs ?? [],
    attachments,
    attachmentMediaIds: attachments.map((item) => item.id),
    categoryIds:
      post.categories?.map((category) => category.id).filter(Boolean) ??
      (post.category?.id ? [post.category.id] : []),
    publishedAt: post.publishedAt ?? null,
  };
}

function parseDraftRow(
  row: {
    postId: number;
    locale: string;
    data: string;
    revision: number;
    baseUpdatedAt: string;
    updatedAt: string;
  } | null,
): PostLocaleDraft | null {
  if (!row) return null;
  const parsed = (() => {
    try {
      return JSON.parse(row.data);
    } catch {
      return {};
    }
  })();
  return {
    postId: row.postId,
    locale: row.locale,
    data: normalizeDraftData(parsed),
    revision: Number(row.revision) || 1,
    baseUpdatedAt: row.baseUpdatedAt,
    updatedAt: row.updatedAt,
  };
}

async function ensureDb() {
  await initCloudflareD1();
}

export async function getPostLocaleDraft(
  postId: number,
  locale: typeof defaultLocale = defaultLocale,
) {
  await ensureDb();
  const row = await db.queryOne<{
    postId: number;
    locale: string;
    data: string;
    revision: number;
    baseUpdatedAt: string;
    updatedAt: string;
  }>(
    `SELECT postId, locale, data, revision, baseUpdatedAt, updatedAt
     FROM post_locale_drafts
     WHERE postId = ? AND locale = ?
     LIMIT 1`,
    [postId, locale],
  );
  return parseDraftRow(row);
}

export async function ensurePostLocaleDraftForPublished(input: {
  post: Post;
  actorId?: number | null;
}) {
  await ensureDb();
  const { post, actorId } = input;
  const locale: typeof defaultLocale = defaultLocale;
  const existing = await getPostLocaleDraft(post.id, locale);
  if (existing && existing.baseUpdatedAt === post.updatedAt) {
    return existing;
  }
  const now = new Date().toISOString();
  const nextRevision = existing ? existing.revision + 1 : 1;
  const data = buildDraftDataFromPost(post);
  await db.execute(
    `INSERT INTO post_locale_drafts (postId, locale, data, revision, baseUpdatedAt, updatedAt, updatedBy)
     VALUES (?, ?, ?, ?, ?, ?, ?)
     ON CONFLICT(postId, locale)
     DO UPDATE SET
       data = excluded.data,
       revision = excluded.revision,
       baseUpdatedAt = excluded.baseUpdatedAt,
       updatedAt = excluded.updatedAt,
       updatedBy = excluded.updatedBy`,
    [post.id, locale, JSON.stringify(data), nextRevision, post.updatedAt, now, actorId ?? null],
  );
  const refreshed = await getPostLocaleDraft(post.id, locale);
  if (!refreshed) throw new Error("Failed to ensure post draft.");
  return refreshed;
}

export async function savePostLocaleDraft(input: {
  postId: number;
  locale?: typeof defaultLocale;
  data: PostLocaleDraftData;
  expectedRevision?: number;
  expectedBaseUpdatedAt?: string;
  actorId?: number | null;
}) {
  await ensureDb();
  const locale = input.locale ?? defaultLocale;
  const existing = await getPostLocaleDraft(input.postId, locale);
  if (!existing) {
    throw new Error("Draft not found.");
  }
  if (
    typeof input.expectedRevision === "number" &&
    Number.isFinite(input.expectedRevision) &&
    input.expectedRevision > 0 &&
    input.expectedRevision !== existing.revision
  ) {
    throw new DraftStaleWriteError("Draft revision mismatch.");
  }
  if (
    input.expectedBaseUpdatedAt &&
    input.expectedBaseUpdatedAt !== existing.baseUpdatedAt
  ) {
    throw new DraftStaleWriteError("Published source changed. Refresh required.");
  }

  const now = new Date().toISOString();
  const nextRevision = existing.revision + 1;
  const normalized = normalizeDraftData(input.data);

  await db.execute(
    `UPDATE post_locale_drafts
     SET data = ?, revision = ?, updatedAt = ?, updatedBy = ?
     WHERE postId = ? AND locale = ?`,
    [
      JSON.stringify(normalized),
      nextRevision,
      now,
      input.actorId ?? null,
      input.postId,
      locale,
    ],
  );

  return {
    postId: input.postId,
    locale,
    data: normalized,
    revision: nextRevision,
    baseUpdatedAt: existing.baseUpdatedAt,
    updatedAt: now,
  } as PostLocaleDraft;
}

export async function deletePostLocaleDraft(
  postId: number,
  locale: typeof defaultLocale = defaultLocale,
) {
  await ensureDb();
  await db.execute(
    `DELETE FROM post_locale_drafts WHERE postId = ? AND locale = ?`,
    [postId, locale],
  );
}

export function applyDraftDataToPost(post: Post, draft: PostLocaleDraft): Post {
  const data = draft.data;
  return {
    ...post,
    status: "draft",
    locale: data.locale,
    slug: data.slug,
    seoSlug: data.seoSlug ?? null,
    title: data.title,
    excerpt: data.excerpt,
    content: data.content,
    contentRich: data.contentRich ?? data.content,
    updatedAt: draft.updatedAt,
    seoTitle: data.seoTitle ?? null,
    seoDescription: data.seoDescription ?? null,
    canonical: data.canonical ?? null,
    noindex: Boolean(data.noindex),
    ogImage: data.ogImageUrl ?? null,
    featuredImage: data.featuredImageUrl ?? null,
    featuredImageAlt: data.featuredImageAlt ?? null,
    featuredImageWidth: data.featuredImageWidth ?? null,
    featuredImageHeight: data.featuredImageHeight ?? null,
    primaryKeyword: data.primaryKeyword ?? null,
    tags: data.tags ?? [],
    faqs: data.faqs ?? [],
    attachments: data.attachments?.map((item) => ({
      id: item.id,
      url: item.url,
      key: "",
      provider: "local",
      bucket: null,
      mimeType: null,
      size: null,
      width: null,
      height: null,
    })) ?? [],
    draftRevision: draft.revision,
    draftUpdatedAt: draft.updatedAt,
    draftBaseUpdatedAt: draft.baseUpdatedAt,
    editingPostId: post.id,
    draftCategoryIds: data.categoryIds ?? [],
  };
}

export async function applyDraftOverlaysForAdmin(posts: Post[]): Promise<Post[]> {
  if (posts.length === 0) return posts;
  await ensureDb();
  const postIds = Array.from(new Set(posts.map((post) => post.id).filter(Boolean)));
  if (postIds.length === 0) return posts;
  const placeholders = postIds.map(() => "?").join(", ");
  const rows = await db.query<{
    postId: number;
    locale: string;
    data: string;
    revision: number;
    baseUpdatedAt: string;
    updatedAt: string;
  }>(
    `SELECT postId, locale, data, revision, baseUpdatedAt, updatedAt
     FROM post_locale_drafts
     WHERE postId IN (${placeholders})`,
    postIds,
  );
  const draftMap = new Map<string, PostLocaleDraft>();
  rows.forEach((row) => {
    const parsed = parseDraftRow(row);
    if (!parsed) return;
    draftMap.set(`${parsed.postId}:${parsed.locale}`, parsed);
  });

  return posts.map((post) => {
    if (post.status !== "published") return post;
    const draft = draftMap.get(`${post.id}:${post.locale}`);
    if (!draft) return post;
    const merged = applyDraftDataToPost(post, draft);
    return {
      ...merged,
      status: post.status,
      slug: post.slug,
    };
  });
}
