import PostRail, { type PostRailItem } from "@/components/atoms/PostRail";
import ShareButtons from "@/components/news/sharebutton";
import { injectNewsInlineAds } from "@/lib/ad-inserter";
import { resolveMediaUrl } from "@/lib/media";
import type { MediaAsset, Post } from "@/lib/services/posts";
import { Link } from "@/navigation";

type Labels = {
  published: string;
  updated: string;
  category: string;
  tags: string;
  attachments: string;
  related: string;
  uncategorized: string;
  press: string;
  release: string;
  allCategoryBadge: string;
  followTitle: string;
  followSubtitle: string;
  backToReleases: string;
  popularPosts: string;
  recommendedPosts: string;
  details: string;
  pressReleaseBadge: string;
  facebook: string;
  x: string;
  bluesky: string;
  hatena: string;
  copy: string;
  copied: string;
  brandLogo: string;
  sidebarPromo: string;
  sidebarListOne: { line1: string; line2: string };
  sidebarListTwo: { line1: string; line2: string };
  socialIcons: string;
  prevArticle: string;
  nextArticle: string;
  backToTop: string;
  recommendTitle: string;
};

type Props = {
  post: Post;
  recommendedPosts: Post[];
  latestRailItems?: PostRailItem[];
  latestRailTitle?: string;
  baseUrl: string;
  shareUrl?: string;
  labels: Labels;
  locale: string;
};

function formatDate(value: string) {
  return new Date(value).toISOString().slice(0, 10);
}

function resolveShareImageUrl(post: Post, baseUrl: string) {
  const mediaCandidate = (post.ogImageMedia ?? post.featuredImageMedia) as
    | MediaAsset
    | null
    | undefined;
  if (mediaCandidate) {
    return resolveMediaUrl(mediaCandidate, baseUrl);
  }
  const candidate = post.ogImage ?? post.featuredImage;
  if (!candidate) return undefined;
  try {
    return new URL(candidate, baseUrl).toString();
  } catch {
    return undefined;
  }
}

export default async function NewsBlogPost({
  post,
  latestRailItems,
  latestRailTitle,
  baseUrl,
  shareUrl,
  labels,
  locale,
}: Props) {
  const html = post.contentRich || post.content || "";
  const htmlWithInlineAds = injectNewsInlineAds(html, locale);
  const sharePath = `/${encodeURIComponent(post.slug)}`;
  const computedShareUrl = shareUrl ?? new URL(sharePath, baseUrl).toString();
  const shareImageUrl = resolveShareImageUrl(post, baseUrl);
  const publishedDate = formatDate(post.publishedAt ?? post.updatedAt);
  const categoryLabel =
    post.category?.name ?? post.categories?.[0]?.name ?? labels.uncategorized;

  return (
    <section className="mx-auto w-full max-w-[1440px] py-6 md:py-8 lg:pt-[80px] lg:pb-[120px] max-[767px]:py-0 max-[767px]:mb-[40px]">
      <article className="w-full px-4 md:px-10 lg:px-[120px] max-[767px]:px-[16px] max-[767px]:pt-[32px] max-[767px]:pb-[64px]">
        <header>
          <h2 className="break-words font-noto-jp text-[24px] font-bold leading-[1.7] tracking-[1.2px] text-[#252422] max-[767px]:text-[16px] max-[767px]:tracking-[0.8px]">
            {post.title}
          </h2>
          <div className="mt-[24px] flex flex-wrap items-center gap-3 max-[767px]:mt-[16px] max-[767px]:gap-[16px]">
            <span className="inline-flex w-[129px] items-center justify-center rounded-[4px] bg-brand-green px-[12px] py-[4px] font-noto-jp text-[14px] font-bold leading-[1.6] tracking-[0.7px] text-white max-[767px]:w-[113px] max-[767px]:text-[12px] max-[767px]:tracking-[0.6px]">
              {categoryLabel}
            </span>
            <span className="flex h-[25px] flex-[1_0_0] flex-col justify-center font-noto-jp text-[16px] font-normal leading-[1.6] tracking-[0.8px] text-[#252422] max-[767px]:text-[14px] max-[767px]:tracking-[0.7px]">
              {publishedDate.replaceAll("-", "/")}
            </span>
          </div>
        </header>

        <section
          className="mt-[24px] min-w-0 overflow-hidden break-words font-noto-jp markdown-content text-[#5A5955] max-[767px]:mt-[16px] [&_a]:break-all [&_a]:text-brand-green-dark [&_a]:underline [&_figure]:mx-0 [&_figure]:my-[24px] max-[767px]:[&_figure]:my-[16px] [&_figure]:max-w-full [&_h2]:mt-8 [&_h2]:text-[18px] [&_h2]:font-black [&_h3]:mt-6 [&_h3]:text-[16px] [&_h3]:font-bold [&_iframe]:max-w-full [&_img]:h-auto [&_img]:max-w-full [&_img]:rounded-[8px] max-[767px]:[&_img]:h-[200px] max-[767px]:[&_img]:w-[343px] max-[767px]:[&_img]:object-cover lg:[&_img]:h-[500px] lg:[&_img]:w-[1200px] lg:[&_img]:object-cover [&_li]:leading-[1.7] [&_ol]:list-decimal [&_ol]:pl-6 [&_p]:text-[16px] [&_p]:font-normal [&_p]:leading-[1.7] [&_p]:tracking-[0.8px] max-[767px]:[&_p]:text-[14px] max-[767px]:[&_p]:tracking-[0.7px] [&_pre]:overflow-x-auto [&_table]:block [&_table]:max-w-full [&_table]:overflow-x-auto [&_ul]:list-disc [&_ul]:pl-6"
          dangerouslySetInnerHTML={{ __html: htmlWithInlineAds }}
        />

        <section className="mt-[24px] max-[767px]:mt-[16px]">
          <ShareButtons
            shareUrl={computedShareUrl}
            title={post.title}
            mediaUrl={shareImageUrl}
          />
        </section>

        {latestRailItems && latestRailItems.length > 0 ? (
          <div className="mt-[80px] w-full overflow-hidden max-[767px]:mt-[64px]">
            <PostRail
              title={latestRailTitle ?? "Latest News"}
              items={latestRailItems}
              showTitle={false}
            />
          </div>
        ) : null}

        <section className="mt-[48px] flex flex-col items-center justify-center gap-3 max-[767px]:mt-[24px] max-[767px]:gap-[16px] lg:flex-row">
          <Link
            href="/category/news"
            className="inline-flex h-[56px] w-full items-center justify-center gap-[12px] rounded-[4px] border border-[#878785] bg-white px-[24px] py-[12px] text-center font-noto-jp text-[16px] font-bold leading-[1.6] tracking-[1.6px] text-[#5A5955] transition hover:bg-[#F4F4F2] active:bg-[#E9E8E4] max-[767px]:h-[44px] max-[767px]:gap-[8px] max-[767px]:text-[14px] max-[767px]:tracking-[1.4px] lg:w-auto"
          >
            ニュース一覧へ
          </Link>

          <Link
            href="/contact"
            className="inline-flex h-[56px] w-full items-center justify-center gap-[10px] rounded-[4px] border border-[#1F8A5A] bg-[#1F8A5A] px-[24px] py-[16px] text-center font-noto-jp text-[16px] font-bold leading-[1.6] tracking-[0.8px] text-white transition hover:border-[#18724A] hover:bg-[#18724A] active:border-[#145E3D] active:bg-[#145E3D] max-[767px]:h-[44px] max-[767px]:text-[14px] max-[767px]:tracking-[0.7px] lg:w-auto"
          >
            お問い合わせへ
          </Link>
        </section>
      </article>
    </section>
  );
}
