import { requireRole, requireSessionUser } from "@/lib/auth/auth-server";
import {
  applyDraftDataToPost,
  getPostLocaleDraft,
} from "@/lib/services/post-drafts";
import { getPostByIdPreview, getPostBySlugPreview, Post } from "@/lib/services/posts";
import { getLocale } from '@/utils/strings/server';
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";
const postLocales = ["ja"] as const;

export default async function EditorPage({
  searchParams,
}: {
  searchParams?: Promise<{
    mode: unknown;
    slug?: string;
    locale?: string;
  }>;
}) {
  const user = await requireSessionUser();
  requireRole(user, ["superuser", "author"]);

  const resolvedSearchParams = await searchParams;
  const slug =
    typeof resolvedSearchParams?.slug === "string"
      ? resolvedSearchParams.slug
      : "";
  const mode =
    typeof resolvedSearchParams?.mode === "string"
      ? resolvedSearchParams.mode
      : "";
  const localeParam =
    typeof resolvedSearchParams?.locale === "string"
      ? resolvedSearchParams.locale
      : "";

  if (mode === "recruit") {
    const params = new URLSearchParams();
    if (slug) params.set("slug", slug);
    if (localeParam) params.set("locale", localeParam);
    const suffix = params.size > 0 ? `?${params.toString()}` : "";
    redirect(`/admin/editor/recruit${suffix}`);
  }

  const fallbackLocale = await getLocale();
  const locale = localeParam || fallbackLocale;
  let post: Post | null = null;
  if (slug) {
    post = (await getPostBySlugPreview(slug, locale, { includeLocales: true })) ?? null;
    if (!post) {
      for (const fallback of postLocales) {
        if (fallback === locale) continue;
        post = (await getPostBySlugPreview(slug, fallback, { includeLocales: true })) ?? null;
        if (post) break;
      }
    }
    if (post && post.locale !== locale) {
      const localeHydratedPost =
        (await getPostByIdPreview(post.id, locale, { includeLocales: true })) ?? null;
      post = localeHydratedPost ?? post;
    }
  }

  if (post && user.role === "author" && post.createdBy !== user.id) {
    redirect("/admin/posts");
  }

  if (post?.status === "published") {
    const draft =
      (await getPostLocaleDraft(post.id, locale)) ??
      (await getPostLocaleDraft(post.id, post.locale));
    if (draft) {
      post = applyDraftDataToPost(post, draft);
    }
  }

  const { default: EditorForm } = await import("@/app/admin/editor/EditorForm");
  return <EditorForm initialPost={post ?? undefined} />;
}
