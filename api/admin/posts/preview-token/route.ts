export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth/auth-server";
import { getPostByIdPreview } from "@/lib/services/posts";
import { createPreviewToken } from "@/lib/services/preview-token";
import { defaultLocale } from '@/utils/strings/config';

type PreviewTokenRequest = {
  postId?: number | string;
  locale?: string;
  slug?: string;
};

export async function POST(request: Request) {
  const user = await getSessionUser();
  if (!user || (user.role !== "superuser" && user.role !== "author") || user.status !== "active") {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const body = (await request.json().catch(() => null)) as PreviewTokenRequest | null;
  const postId = Number(body?.postId);
  const locale: typeof defaultLocale = defaultLocale;
  if (!postId) {
    return NextResponse.json({ error: "Invalid post id." }, { status: 400 });
  }

  const post = await getPostByIdPreview(postId, locale, { includeLocales: true });
  if (!post) {
    return NextResponse.json({ error: "Post not found." }, { status: 404 });
  }
  if (user.role !== "superuser" && post.createdBy && post.createdBy !== user.id) {
    return NextResponse.json({ error: "Forbidden." }, { status: 403 });
  }
  if (!post.createdBy && user.role !== "superuser") {
    return NextResponse.json({ error: "Forbidden." }, { status: 403 });
  }

  const requestedSlug = typeof body?.slug === "string" ? body.slug : "";
  const slug = requestedSlug || post.slug;
  const token = createPreviewToken({
    postId: post.id,
    locale,
    slug,
    userId: user.id,
  });

  return NextResponse.json({ ok: true, token });
}
