import { getScopedTranslations } from "@/utils/strings/server";
import { Link } from "@/navigation";
import { requireRole, requireSessionUser } from "@/lib/auth/auth-server";
import { getAllPostsForAdmin } from "@/lib/services/posts";
import { applyDraftOverlaysForAdmin } from "@/lib/services/post-drafts";
import { buildPostMetadata } from "@/lib/seo";
import { getDefaultOgImagePath } from "@/lib/services/default-og-media";
import { adminUi } from "@/app/admin/core/admin-ui";
import PostsClient from "@/app/admin/posts/PostsClient";
import { getLocale } from '@/utils/strings/server';
import { headers } from "next/headers";
import { resolveSiteUrlFromHeaders } from "@/lib/site";

export const dynamic = "force-dynamic";

export default async function PostsPage() {
  const user = await requireSessionUser();
  requireRole(user, ["superuser", "author"]);
  const t = await getScopedTranslations("Admin.posts");
  const posts = await applyDraftOverlaysForAdmin(await getAllPostsForAdmin());
  const locale = await getLocale();
  const requestHeaders = await headers();
  const baseUrl = resolveSiteUrlFromHeaders((name) => requestHeaders.get(name));
  const defaultOgImage = await getDefaultOgImagePath(baseUrl);
  const postsWithScores = posts.map((post) => {
    const resolvedLocale = post.locale || locale;
    const { seoPreview } = buildPostMetadata(post, {
      stringsLanguage: resolvedLocale,
      locale: resolvedLocale,
      basePath: "/admin/posts",
      baseUrl,
      defaultOgImage,
    });
    return { ...post, seoScore: seoPreview.score };
  });

  return (
    <section className={adminUi.page}>
      <div className={adminUi.header}>
        <div>
          <h1 className={adminUi.title}>{t("title")}</h1>
          <p className={adminUi.subtitle}>{t("subtitle")}</p>
        </div>
        <Link href="/admin/editor" className={adminUi.buttonPrimary}>
          {t("newPost")}
        </Link>
      </div>
      <PostsClient posts={postsWithScores} currentUser={{ id: user.id, role: user.role }} />
    </section>
  );
}
