export const runtime = "nodejs";
import { defaultLocale } from '@/utils/strings/config';
import { getSessionUser } from "@/lib/auth/auth-server";
import { getUserById } from "@/lib/auth/users";
import { buildPostMetadata } from "@/lib/seo";
import { pingIndexNow } from "@/lib/services/indexnow";
import { promoteMediaToR2 } from "@/lib/services/media";
import { createNotification } from "@/lib/services/notifications";
import {
  DraftStaleWriteError,
  deletePostLocaleDraft,
  ensurePostLocaleDraftForPublished,
  savePostLocaleDraft,
  type PostLocaleDraftData,
} from "@/lib/services/post-drafts";
import type { FAQItem, PostStatus } from "@/lib/services/posts";
import {
  deriveExcerpt,
  ensureAuthorForUser,
  getPostByIdPreview,
  getPostBySlugPreview,
  isSlugAvailable,
  upsertDraftPost,
} from "@/lib/services/posts";
import {
  getRecruitPostById,
  getRecruitPostBySlug,
  upsertRecruitPost,
} from "@/lib/services/recruit-posts";
import { resolveSiteUrlFromHeaders } from "@/lib/site";
import { normalizePostSlug, normalizeSlug } from "@/lib/utils/slug";
import { NextResponse } from "next/server";

type SaveIntent = "autosave" | "save" | "publish";

type DraftRequestBody = {
  jobSummary: string;
  mode?: string;
  postId?: number | string;
  locale?: string;
  slug?: string;
  status?: string;
  intent?: string;
  content?: string;
  contentRich?: string;
  previousSlug?: string;
  confirmRedirect?: boolean;
  seoSlug?: string;
  title?: string;
  seoTitle?: string;
  seoDescription?: string;
  ogImageId?: number | string;
  ogImageUrl?: string;
  canonical?: string;
  featuredImageId?: number | string;
  featuredImageUrl?: string;
  featuredImageAlt?: string;
  featuredImageWidth?: number | string;
  featuredImageHeight?: number | string;
  primaryKeyword?: string;
  tags?: unknown[];
  faqs?: unknown[];
  attachmentMediaIds?: unknown[];
  attachments?: unknown[];
  categoryIds?: unknown[];
  recruitFields?: Record<string, unknown>;
  department?: string;
  applicationDeadLine?: string;
  publishedAt?: string | null;
  noindex?: boolean;
  recruitType?: string;
  expectedUpdatedAt?: string;
  draftRevision?: number;
  basePostUpdatedAt?: string;
};

function parseTags(value: unknown) {
  return Array.isArray(value)
    ? value.filter((tag): tag is string => typeof tag === "string")
    : [];
}

function parseFaqs(value: unknown) {
  return Array.isArray(value) ? (value as FAQItem[]) : [];
}

function normalizePublishedAt(value?: string | null) {
  if (!value) return null;
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return null;
  return parsed.toISOString();
}

function parseIntent(value: unknown): SaveIntent {
  if (value === "autosave" || value === "publish") return value;
  return "save";
}

function parseStatus(value: unknown): PostStatus {
  if (value === "published" || value === "archived") return value;
  return "draft";
}

function toDraftPayload(
  body: DraftRequestBody,
  locale: string,
  slug: string,
): PostLocaleDraftData {
  const attachmentMediaIds = Array.isArray(body.attachmentMediaIds)
    ? body.attachmentMediaIds.map((id) => Number(id)).filter(Boolean)
    : [];
  const attachments = Array.isArray(body.attachments)
    ? (body.attachments
        .map((item) => {
          if (!item || typeof item !== "object") return null;
          const raw = item as { id?: unknown; url?: unknown };
          const id = Number(raw.id);
          const url = typeof raw.url === "string" ? raw.url : "";
          if (!id || !url) return null;
          return { id, url };
        })
        .filter(Boolean) as { id: number; url: string }[])
    : [];
  const normalizedContent = String(body.content || "");
  const normalizedContentRich = String(body.contentRich || body.content || "");
  return {
    locale,
    slug,
    seoSlug: body.seoSlug || null,
    title: body.title || "Untitled post",
    excerpt: deriveExcerpt({
      seoDescription:
        typeof body.seoDescription === "string" ? body.seoDescription : null,
      description: normalizedContentRich || normalizedContent,
    }),
    content: normalizedContent,
    contentRich: normalizedContentRich,
    seoTitle: body.seoTitle || null,
    seoDescription: body.seoDescription || null,
    canonical: body.canonical || null,
    noindex: Boolean(body.noindex),
    ogImageId: Number(body.ogImageId) || null,
    ogImageUrl: body.ogImageUrl || null,
    featuredImageId: Number(body.featuredImageId) || null,
    featuredImageUrl: body.featuredImageUrl || null,
    featuredImageAlt: body.featuredImageAlt || null,
    featuredImageWidth: Number(body.featuredImageWidth) || null,
    featuredImageHeight: Number(body.featuredImageHeight) || null,
    primaryKeyword: body.primaryKeyword || null,
    tags: parseTags(body.tags),
    faqs: parseFaqs(body.faqs),
    attachmentMediaIds,
    attachments,
    categoryIds: Array.isArray(body.categoryIds)
      ? body.categoryIds.map((id) => Number(id)).filter(Boolean)
      : [],
    publishedAt: normalizePublishedAt(body.publishedAt),
  };
}

function normalizeContent(rawContent: string, rawContentRich: string) {
  const trimmedRich = String(rawContentRich || "").trim();
  const singleUrl = /^https?:\/\/\S+$/i.test(trimmedRich);
  const normalizedContentRich = singleUrl
    ? `![Image](${trimmedRich})`
    : rawContentRich;
  const normalizedContent = rawContent || normalizedContentRich;
  return { normalizedContent, normalizedContentRich };
}

async function createPublishNotifications(input: {
  user: { id: number; role: "superuser" | "author" };
  saved: Awaited<ReturnType<typeof getPostBySlugPreview>>;
  existingUpdatedAt?: string;
  locale: string;
  baseUrl: string;
}) {
  const { user, saved, existingUpdatedAt, locale, baseUrl } = input;
  if (!saved) return;

  const mediaIds = new Set<number>();
  if (saved.ogImageMedia?.id) mediaIds.add(saved.ogImageMedia.id);
  if (saved.featuredImageMedia?.id) mediaIds.add(saved.featuredImageMedia.id);
  (saved.attachments ?? []).forEach((attachment) => {
    if (attachment.id) mediaIds.add(attachment.id);
  });
  await promoteMediaToR2(Array.from(mediaIds));

  const updatedAtChanged =
    !existingUpdatedAt || saved.updatedAt !== existingUpdatedAt;
  if (!updatedAtChanged) return;

  const encodedSlug = encodeURIComponent(saved.slug);
  const postUrl = `${baseUrl}/${locale}/post/${encodedSlug}`;
  await pingIndexNow([postUrl, `${baseUrl}/admin`], { baseUrl });

  await createNotification({
    type: "post_published",
    title: "Post published",
    message: saved.title,
    link: `/admin/posts/${encodedSlug}`,
    actorId: user.id,
    recipientRole: user.role === "superuser" ? "superuser" : undefined,
    recipientUserId: user.role === "author" ? user.id : undefined,
  });

  const { seoPreview } = buildPostMetadata({
    locale,
    slug: saved.slug,
    seoSlug: saved.seoSlug ?? undefined,
    title: saved.title,
    excerpt: saved.excerpt,
    content: saved.content,
    status: saved.status,
    publishedAt: saved.publishedAt,
    updatedAt: saved.updatedAt,
    seoTitle: saved.seoTitle,
    seoDescription: saved.seoDescription,
    ogImage: saved.ogImage,
    noindex: saved.noindex,
    canonical: saved.canonical,
    featuredImage: saved.featuredImage,
    featuredImageAlt: saved.featuredImageAlt,
    featuredImageWidth: saved.featuredImageWidth,
    featuredImageHeight: saved.featuredImageHeight,
    primaryKeyword: saved.primaryKeyword,
    tags: saved.tags,
    author: saved.author
      ? { slug: saved.author.slug, name: saved.author.name }
      : null,
    category: saved.category
      ? { slug: saved.category.slug, name: saved.category.name }
      : null,
    locales:
      saved.locales?.map((entry) => ({
        locale: entry.locale,
        slug: entry.slug,
      })) ?? null,
  }, { baseUrl });

  if (seoPreview.score < 70) {
    await createNotification({
      type: "seo_warning",
      title: "SEO needs attention",
      message: `${saved.title} • score ${seoPreview.score}/100`,
      link: `/admin/posts/${encodedSlug}`,
      actorId: user.id,
      recipientRole: user.role === "superuser" ? "superuser" : undefined,
      recipientUserId: user.role === "author" ? user.id : undefined,
      metadata: { score: seoPreview.score, notes: seoPreview.scoreNotes },
    });
  }
}

export async function POST(request: Request) {
  const user = await getSessionUser();
  if (!user || user.status !== "active") {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  if (user.role !== "superuser" && user.role !== "author") {
    return NextResponse.json({ error: "Forbidden." }, { status: 403 });
  }

  const body = (await request.json().catch(() => ({}))) as DraftRequestBody;
  const baseUrl = resolveSiteUrlFromHeaders((name) => request.headers.get(name));
  const mode = typeof body.mode === "string" ? body.mode : undefined;

  const intent = parseIntent(body.intent);
  const locale: typeof defaultLocale = defaultLocale;
  const slug =
    mode === "recruit"
      ? normalizeSlug(body.slug || "")
      : normalizePostSlug(body.slug || "");
  if (!slug) {
    return NextResponse.json({ error: "Slug is required." }, { status: 400 });
  }

  const postId = Number(body.postId) || null;
  let previousSlug = body.previousSlug
    ? mode === "recruit"
      ? normalizeSlug(body.previousSlug)
      : normalizePostSlug(body.previousSlug)
    : undefined;

  if (mode === "recruit") {
    const recruitFields =
      typeof body.recruitFields === "object" && body.recruitFields
        ? {
            positionAvailable:
              typeof body.recruitFields.positionAvailable === "string"
                ? body.recruitFields.positionAvailable
                : undefined,
            jobDescription:
              typeof body.recruitFields.jobDescription === "string"
                ? body.recruitFields.jobDescription
                : undefined,
            requirements:
              typeof body.recruitFields.requirements === "string"
                ? body.recruitFields.requirements
                : undefined,
            location:
              typeof body.recruitFields.location === "string"
                ? body.recruitFields.location
                : undefined,
            workingHours:
              typeof body.recruitFields.workingHours === "string"
                ? body.recruitFields.workingHours
                : undefined,
            employmentType:
              typeof body.recruitFields.employmentType === "string"
                ? body.recruitFields.employmentType
                : undefined,
            salary:
              typeof body.recruitFields.salary === "string"
                ? body.recruitFields.salary
                : undefined,
            benefits:
              typeof body.recruitFields.benefits === "string"
                ? body.recruitFields.benefits
                : undefined,
            holidays:
              typeof body.recruitFields.holidays === "string"
                ? body.recruitFields.holidays
                : undefined,
            externalLink:
              typeof body.recruitFields.externalLink === "string"
                ? body.recruitFields.externalLink
                : undefined,
          }
        : undefined;
    const recruitType =
      body.recruitType === "recruit" || body.recruitType === "job"
        ? body.recruitType
        : "job";
    const status = parseStatus(body.status);
    const existingRecruit =
      (postId ? await getRecruitPostById(postId) : undefined) ??
      (previousSlug && previousSlug !== slug
        ? await getRecruitPostBySlug(previousSlug)
        : await getRecruitPostBySlug(slug));
    if (
      existingRecruit &&
      user.role === "author" &&
      existingRecruit.createdBy !== user.id
    ) {
      return NextResponse.json(
        { error: "You can only edit your own recruit posts." },
        { status: 403 },
      );
    }

    const saved = await upsertRecruitPost({
      postId,
      slug,
      previousSlug,
      title: body.title || "Untitled recruit post",
      recruitType,
      fields: recruitFields,
      department:
        typeof body.department === "string"
          ? body.department.trim()
          : undefined,
      jobSummary:
        typeof body.jobSummary === "string" ? body.jobSummary.trim() : undefined,
      applicationDeadLine:
        typeof body.applicationDeadLine === "string"
          ? body.applicationDeadLine.trim()
          : undefined,
      status,
      publishedAt:
        status === "draft"
          ? null
          : body.publishedAt || new Date().toISOString(),
      actorId: user.id,
    });

    if (status === "draft" && !existingRecruit) {
      await createNotification({
        type: "recruit_draft_created",
        title: "Recruit draft created",
        message: saved.title,
        link: `/admin/editor?slug=${encodeURIComponent(saved.slug)}&mode=recruit`,
        actorId: user.id,
        recipientRole: user.role === "superuser" ? "superuser" : undefined,
        recipientUserId: user.role === "author" ? user.id : undefined,
      });
    }

    if (status === "published" && existingRecruit?.status !== "published") {
      await createNotification({
        type: "recruit_published",
        title: "Recruit published",
        message: saved.title,
        link: `/admin/editor?slug=${encodeURIComponent(saved.slug)}&mode=recruit`,
        actorId: user.id,
        recipientRole: user.role === "superuser" ? "superuser" : undefined,
        recipientUserId: user.role === "author" ? user.id : undefined,
      });
    }

    return NextResponse.json({ recruitPost: saved });
  }
  const existingById = postId
    ? await getPostByIdPreview(postId, locale, { includeLocales: true })
    : undefined;

  const existing =
    existingById ??
    (previousSlug && previousSlug !== slug
      ? await getPostBySlugPreview(previousSlug, locale, {
          includeLocales: true,
        })
      : await getPostBySlugPreview(slug, locale, { includeLocales: true }));

  const slugOwnerPostId = existing?.id ?? postId;
  const available = await isSlugAvailable(slug, locale, slugOwnerPostId);
  if (!available) {
    return NextResponse.json(
      { error: "Slug already exists." },
      { status: 409 },
    );
  }

  if (existing && user.role === "author" && existing.createdBy !== user.id) {
    return NextResponse.json(
      { error: "You can only edit your own posts." },
      { status: 403 },
    );
  }

  if (existing?.status === "published" && existing.locale === locale) {
    previousSlug = existing.slug;
  }

  const userRecord = await getUserById(user.id);
  const author = await ensureAuthorForUser({
    userId: user.id,
    name: userRecord?.name ?? null,
    email: user.email,
  });

  const rawContent = body.content || "";
  const rawContentRich = body.contentRich || rawContent;
  const { normalizedContent, normalizedContentRich } = normalizeContent(
    rawContent,
    rawContentRich,
  );

  if (existing?.status === "published") {
    const seed = await ensurePostLocaleDraftForPublished({
      post: existing,
      actorId: user.id,
    });
    const draftPayload = toDraftPayload(
      {
        ...body,
        content: normalizedContent,
        contentRich: normalizedContentRich,
      },
      locale,
      slug,
    );

    let savedDraft;
    try {
      savedDraft = await savePostLocaleDraft({
        postId: existing.id,
        locale,
        data: draftPayload,
        expectedRevision:
          typeof body.draftRevision === "number"
            ? body.draftRevision
            : seed.revision,
        expectedBaseUpdatedAt: body.basePostUpdatedAt || seed.baseUpdatedAt,
        actorId: user.id,
      });
    } catch (error) {
      if (error instanceof DraftStaleWriteError) {
        return NextResponse.json({ error: error.message }, { status: 409 });
      }
      throw error;
    }

    if (intent !== "publish") {
      // Keep the published post published; store edits as a separate locale draft.
      return NextResponse.json({
        ok: true,
        post: {
          id: existing.id,
          updatedAt: existing.updatedAt,
          status: existing.status,
        },
        draft: {
          revision: savedDraft.revision,
          updatedAt: savedDraft.updatedAt,
          baseUpdatedAt: savedDraft.baseUpdatedAt,
        },
      });
    }

    const slugChanged = Boolean(
      previousSlug && previousSlug !== savedDraft.data.slug,
    );
    if (slugChanged && !body.confirmRedirect) {
      return NextResponse.json(
        { error: "Slug changed. Confirm redirect creation before publishing." },
        { status: 400 },
      );
    }

    const published = await upsertDraftPost({
      postId: existing.id,
      locale,
      slug: savedDraft.data.slug,
      seoSlug: savedDraft.data.seoSlug ?? undefined,
      title: savedDraft.data.title,
      excerpt: deriveExcerpt({
        seoDescription: savedDraft.data.seoDescription ?? null,
        description: savedDraft.data.contentRich ?? savedDraft.data.content,
      }),
      content: savedDraft.data.content,
      contentRich: savedDraft.data.contentRich ?? savedDraft.data.content,
      seoTitle: savedDraft.data.seoTitle ?? undefined,
      seoDescription: savedDraft.data.seoDescription ?? undefined,
      ogImageId: savedDraft.data.ogImageId ?? undefined,
      ogImageUrl: savedDraft.data.ogImageUrl ?? undefined,
      canonical: savedDraft.data.canonical ?? undefined,
      featuredImageId: savedDraft.data.featuredImageId ?? undefined,
      featuredImageUrl: savedDraft.data.featuredImageUrl ?? undefined,
      featuredImageAlt: savedDraft.data.featuredImageAlt ?? undefined,
      featuredImageWidth: savedDraft.data.featuredImageWidth ?? undefined,
      featuredImageHeight: savedDraft.data.featuredImageHeight ?? undefined,
      primaryKeyword: savedDraft.data.primaryKeyword ?? undefined,
      tags: savedDraft.data.tags ?? [],
      faqs: savedDraft.data.faqs ?? [],
      attachmentMediaIds: savedDraft.data.attachmentMediaIds,
      authorSlug: author.slug,
      categoryIds: savedDraft.data.categoryIds,
      status: "published",
      publishedAt: savedDraft.data.publishedAt ?? existing.publishedAt ?? null,
      noindex: Boolean(savedDraft.data.noindex),
      previousSlug: slugChanged ? previousSlug : undefined,
      confirmRedirect: Boolean(body.confirmRedirect),
      actorId: user.id,
      baseUrl,
    });

    await deletePostLocaleDraft(existing.id, locale);
    await createPublishNotifications({
      user,
      saved: published,
      existingUpdatedAt: existing.updatedAt,
      locale,
      baseUrl,
    });

    return NextResponse.json({ ok: true, post: published });
  }

  if (
    existing?.updatedAt &&
    body.expectedUpdatedAt &&
    existing.updatedAt !== body.expectedUpdatedAt
  ) {
    return NextResponse.json(
      { error: "Post was updated by another request." },
      { status: 409 },
    );
  }

  const requestedStatus = parseStatus(body.status);
  const resolvedStatus: PostStatus =
    intent === "publish"
      ? "published"
      : requestedStatus === "archived"
        ? "archived"
        : "draft";

  const slugChanged = Boolean(previousSlug && previousSlug !== slug);
  const requiresRedirect = slugChanged && resolvedStatus === "published";
  if (requiresRedirect && !body.confirmRedirect) {
    return NextResponse.json(
      { error: "Slug changed. Confirm redirect creation before publishing." },
      { status: 400 },
    );
  }

  const existingUpdatedAt = existing?.updatedAt;

  const saved = await upsertDraftPost({
    postId: existing?.id ?? postId,
    locale,
    slug,
    seoSlug: body.seoSlug || undefined,
    title: body.title || "Untitled post",
    excerpt: deriveExcerpt({
      seoDescription:
        typeof body.seoDescription === "string" ? body.seoDescription : null,
      description: normalizedContentRich || normalizedContent,
    }),
    content: normalizedContent,
    contentRich: normalizedContentRich,
    seoTitle: body.seoTitle || undefined,
    seoDescription: body.seoDescription || undefined,
    ogImageId: Number(body.ogImageId) || undefined,
    ogImageUrl: body.ogImageUrl || undefined,
    canonical: body.canonical || undefined,
    featuredImageId: Number(body.featuredImageId) || undefined,
    featuredImageUrl: body.featuredImageUrl || undefined,
    featuredImageAlt: body.featuredImageAlt || undefined,
    featuredImageWidth: Number(body.featuredImageWidth) || undefined,
    featuredImageHeight: Number(body.featuredImageHeight) || undefined,
    primaryKeyword: body.primaryKeyword || undefined,
    tags: parseTags(body.tags),
    faqs: parseFaqs(body.faqs),
    attachmentMediaIds: Array.isArray(body.attachmentMediaIds)
      ? body.attachmentMediaIds.map((id: unknown) => Number(id)).filter(Boolean)
      : undefined,
    authorSlug: author.slug,
    categoryIds: Array.isArray(body.categoryIds)
      ? body.categoryIds.map((id: unknown) => Number(id)).filter(Boolean)
      : undefined,
    status: resolvedStatus,
    publishedAt: normalizePublishedAt(body.publishedAt),
    noindex: Boolean(body.noindex),
    previousSlug,
    confirmRedirect: Boolean(body.confirmRedirect),
    actorId: user.id,
    baseUrl,
  });

  if (!existing && resolvedStatus === "draft") {
    await createNotification({
      type: "draft_created",
      title: "Draft created",
      message: saved.title,
      link: `/admin/editor?slug=${encodeURIComponent(saved.slug)}&locale=${locale}`,
      actorId: user.id,
      recipientRole: user.role === "superuser" ? "superuser" : undefined,
      recipientUserId: user.role === "author" ? user.id : undefined,
    });
  }

  if (resolvedStatus === "published") {
    await createPublishNotifications({
      user,
      saved,
      existingUpdatedAt,
      locale,
      baseUrl,
    });
  }

  return NextResponse.json({ ok: true, post: saved });
}
