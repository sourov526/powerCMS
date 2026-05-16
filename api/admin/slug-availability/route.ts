export const runtime = "nodejs";
import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth/auth-server";
import { isSlugAvailable } from "@/lib/services/posts";
import { isRecruitPostSlugAvailable } from "@/lib/services/recruit-posts";
import { defaultLocale } from '@/utils/strings/config';
import { normalizePostSlug, normalizeSlug } from "@/lib/utils/slug";

export async function GET(request: Request) {
  const user = await getSessionUser();
  if (!user || (user.role !== "superuser" && user.role !== "author")) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const rawSlug = searchParams.get("slug") || "";
  const locale: typeof defaultLocale = defaultLocale;
  const postId = Number(searchParams.get("postId"));
  const mode = searchParams.get("mode");
  const slug =
    mode === "recruit" ? normalizeSlug(rawSlug) : normalizePostSlug(rawSlug);
  if (!slug) {
    return NextResponse.json({ available: false, slug: "" });
  }

  if (mode === "recruit") {
    const available = await isRecruitPostSlugAvailable(
      slug,
      Number.isNaN(postId) ? null : postId
    );
    return NextResponse.json({ available, slug });
  }

  const available = await isSlugAvailable(slug, locale, Number.isNaN(postId) ? null : postId);
  return NextResponse.json({ available, slug });
}
