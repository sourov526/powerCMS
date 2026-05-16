import { adminUi } from "@/app/admin/core/admin-ui";
import { requireSessionUser } from "@/lib/auth/auth-server";
import { getScopedTranslations } from "@/utils/strings/server";
import { buildPostMetadata } from "@/lib/seo";
import {
  getInboundLinkCount,
  getInternalLinkSuggestions,
  getPostBySlug,
  getRedirectTarget,
  getRelatedPosts,
} from "@/lib/services/posts";
import { applyDraftOverlaysForAdmin } from "@/lib/services/post-drafts";
import { getDefaultOgImagePath } from "@/lib/services/default-og-media";
import { resolveSiteUrlFromHeaders } from "@/lib/site";
import { Link } from "@/navigation";
import { getLocale } from '@/utils/strings/server';
import Image from "next/image";
import { headers } from "next/headers";
import { notFound, permanentRedirect, redirect } from "next/navigation";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ slug: string }> };

function formatDate(value: string) {
  return new Date(value).toISOString().slice(0, 10);
}

function formatOgImageDisplay(url: string) {
  if (!url) return "";
  if (url.startsWith("data:") || url.startsWith("blob:")) {
    return `${url.slice(0, 32)}... (length ${url.length})`;
  }
  if (url.length > 200) return `${url.slice(0, 200)}...`;
  return url;
}

export default async function PostPage({ params }: Props) {
  const user = await requireSessionUser();
  const t = await getScopedTranslations("Admin.postDetail");
  const locale = await getLocale();
  const requestHeaders = await headers();
  const baseUrl = resolveSiteUrlFromHeaders((name) => requestHeaders.get(name));
  const defaultOgImage = await getDefaultOgImagePath(baseUrl);
  const { slug } = await params;
  const basePost = await getPostBySlug(slug, locale);
  const post = (await applyDraftOverlaysForAdmin(basePost ? [basePost] : []))[0];
  if (!post) {
    const redirectTarget = await getRedirectTarget(slug, locale);
    if (redirectTarget) {
      permanentRedirect(`/admin/posts/${encodeURIComponent(redirectTarget)}`);
    }
    notFound();
  }
  if (user.role === "author" && post.createdBy !== user.id) {
    redirect("/admin/posts");
  }

  const { seoPreview } = buildPostMetadata(post, {
    stringsLanguage: locale,
    locale,
    basePath: "/admin/posts",
    baseUrl,
    defaultOgImage,
  });
  const relatedPosts = await getRelatedPosts(
    post.id,
    post.category?.id ?? null,
    post.locale
  );
  const inboundLinkCount = await getInboundLinkCount(post.slug, post.locale);
  const internalSuggestions = await getInternalLinkSuggestions(post);
  const html = post.contentRich || post.content || "";
  const ogImageDisplay = formatOgImageDisplay(seoPreview.ogImage);

  return (
    <article lang={post.locale ?? "en"} className={adminUi.page}>
      <nav
        aria-label={t("breadcrumb.ariaLabel")}
        className="text-xs text-slate-500"
      >
        <ol className="flex flex-wrap items-center gap-2">
          <li>
            <Link href="/admin" className={adminUi.link}>
              {t("breadcrumb.home")}
            </Link>
          </li>
          {post.category ? (
            <>
              <li>/</li>
              <li>
                <Link
                  href={`/admin/categories/${post.category.slug}`}
                  className={adminUi.link}
                >
                  {post.category.name}
                </Link>
              </li>
            </>
          ) : null}
          <li>/</li>
          <li aria-current="page" className="text-slate-700">
            {post.title}
          </li>
        </ol>
      </nav>

      <div>
        <h1 className={adminUi.title}>{post.title}</h1>
        <p className={adminUi.subtitle}>
          {t("meta.published", {
            date: formatDate(post.publishedAt ?? post.updatedAt),
          })}{" "}
          • {t("meta.updated", { date: formatDate(post.updatedAt) })}
        </p>
      </div>
      {post.author ? (
        <section className="flex flex-wrap items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
          <div>
            <div className="text-sm font-semibold text-slate-900">
              <Link
                href={`/admin/authors/${post.author.slug}`}
                rel="author"
                className={adminUi.link}
              >
                {post.author.name}
              </Link>
            </div>
            <div className="text-xs text-slate-500">{post.author.bio}</div>
          </div>
        </section>
      ) : null}

      {post.featuredImage ? (
        <figure className="mt-6">
          <Image
            src={post.featuredImage}
            alt={post.featuredImageAlt || post.title}
            width={post.featuredImageWidth || 1200}
            height={post.featuredImageHeight || 630}
            className="h-auto w-full rounded-2xl border border-slate-200"
          />
          {post.featuredImageAlt ? (
            <figcaption className="mt-2 text-xs text-slate-400">
              {post.featuredImageAlt}
            </figcaption>
          ) : null}
        </figure>
      ) : null}

      <section className={`${adminUi.card} ${adminUi.cardBody}`}>
        <h2 className={adminUi.sectionTitle}>{t("seo.title")}</h2>
        <div className="mt-3 space-y-1 text-sm text-slate-700">
          <div>
            <strong>{t("seo.score")}:</strong> {seoPreview.score}/100
          </div>
          <div>
            <strong>{t("seo.titleLabel")}:</strong> {seoPreview.title}{" "}
            <span className="text-slate-500">({seoPreview.titleSource})</span>
          </div>
          <div>
            <strong>{t("seo.description")}:</strong> {seoPreview.description}{" "}
            <span className="text-slate-500">
              ({seoPreview.descriptionSource})
            </span>
          </div>
          <div>
            <strong>{t("seo.canonical")}:</strong> {seoPreview.canonical}
          </div>
          <div>
            <strong>{t("seo.robots")}:</strong> index=
            {String(seoPreview.robots.index)} • follow=
            {String(seoPreview.robots.follow)}
          </div>
          <div>
            <strong>{t("seo.ogImage")}:</strong> {ogImageDisplay}{" "}
            <span className="text-slate-500">({seoPreview.ogImageSource})</span>
          </div>
          <div>
            <strong>{t("seo.twitter")}:</strong> card={seoPreview.twitterCard}
          </div>
          <div>
            <strong>{t("seo.wordCount")}:</strong> {seoPreview.wordCount}
          </div>
          <div>
            <strong>{t("seo.internalLinks")}:</strong>{" "}
            {seoPreview.internalLinkCount} •{" "}
            <strong>{t("seo.externalLinks")}:</strong>{" "}
            {seoPreview.externalLinkCount}
          </div>
          <div>
            <strong>{t("seo.inboundLinks")}:</strong> {inboundLinkCount}
          </div>
        </div>
        <div className="mt-3 text-xs text-slate-500">
          {seoPreview.scoreNotes.join(" ")}
        </div>
        {inboundLinkCount === 0 ? (
          <div className="mt-3 text-xs text-amber-700">
            {t("seo.noInbound")}
          </div>
        ) : null}
        <div className="mt-4">
          <strong className="text-sm text-slate-800">{t("seo.checks")}:</strong>
          <ul className="mt-2 list-disc pl-5 text-sm text-slate-600">
            {(seoPreview.checks ?? []).map((check) => (
              <li
                key={check.label}
                className={
                  check.status === "ok" ? "text-emerald-700" : "text-amber-700"
                }
              >
                {check.label}
              </li>
            ))}
          </ul>
        </div>
        {internalSuggestions.length > 0 ? (
          <div className="mt-4">
            <strong className="text-sm text-slate-800">
              {t("seo.suggestions")}:
            </strong>
            <ul className="mt-2 list-disc pl-5 text-sm text-slate-600">
              {internalSuggestions.map((suggested) => (
                <li key={suggested.slug}>
                  <Link
                    href={`/admin/posts/${encodeURIComponent(suggested.slug)}`}
                    className={adminUi.link}
                  >
                    {suggested.title}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ) : null}
      </section>

      <section
        className={`${adminUi.card} ${adminUi.cardBody} markdown-content [&>h2]:text-lg [&>h2]:font-semibold [&>h3]:text-base [&>h3]:font-semibold [&>a]:text-slate-800 [&>a]:underline [&>ul]:list-disc [&>ul]:pl-5 [&>ol]:list-decimal [&>ol]:pl-5 [&>p]:text-sm [&>p]:leading-7`}
        dangerouslySetInnerHTML={{ __html: html }}
      />

      <section className="text-sm text-slate-700">
        <strong className="text-slate-900">{t("meta.category")}:</strong>{" "}
        {post.category ? (
          <Link
            href={`/admin/categories/${post.category.slug}`}
            className={adminUi.link}
          >
            {post.category.name}
          </Link>
        ) : (
          t("meta.uncategorized")
        )}
      </section>
      {post.tags.length > 0 ? (
        <section className="text-sm text-slate-700">
          <strong className="text-slate-900">{t("meta.tags")}:</strong>{" "}
          {post.tags.join(", ")}
        </section>
      ) : null}

      {relatedPosts.length > 0 ? (
        <section className={`${adminUi.card} ${adminUi.cardBody}`}>
          <h2 className={adminUi.sectionTitle}>{t("related.title")}</h2>
          <ul className="mt-3 list-disc pl-5 text-sm text-slate-600">
            {relatedPosts.map((related) => (
              <li key={related.slug}>
                <Link
                  href={`/admin/posts/${encodeURIComponent(related.slug)}`}
                  className={adminUi.link}
                >
                  {related.title}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </article>
  );
}
