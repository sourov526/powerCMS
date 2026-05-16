import Image from "next/image";
import Link from "next/link";
import { PostItem } from "./NewsCategoryTabs";

type Props = {
  posts: PostItem[];
  labels: {
    empty: string;
    all: string;
  };
  className?: string;
};

const FALLBACK_THUMBNAIL =
  "data:image/svg+xml;charset=utf-8," +
  encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="240" height="160" viewBox="0 0 240 160">
      <defs>
        <linearGradient id="g" x1="0" x2="1" y1="0" y2="1">
          <stop offset="0" stop-color="#F0F7F7"/>
          <stop offset="1" stop-color="#E4E3DF"/>
        </linearGradient>
      </defs>
      <rect width="240" height="160" rx="18" fill="url(#g)"/>
      <rect x="26" y="34" width="188" height="92" rx="12" fill="#F4F4F2" stroke="#E4E3DF"/>
      <path d="M52 104l34-32 26 24 34-30 42 38H52z" fill="#E4E3DF"/>
      <circle cx="92" cy="66" r="10" fill="#E4E3DF"/>
    </svg>`
  );

function formatDate(value?: string | null) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}/${month}/${day}`;
}

export default function NewsList({ posts, labels, className }: Props) {
  return (
    <>
      {posts.length === 0 ? (
        <div className="mt-[32px] flex min-h-[420px] w-full max-w-none items-center justify-center md:min-h-[520px] lg:min-h-[560px]">
          <p className="block w-full text-center font-noto-jp text-[#5A5955] text-[14px] font-medium leading-[1.6] tracking-[0.7px] min-[1220px]:text-[24px] min-[1220px]:tracking-[1.2px]">
            {labels.empty}
          </p>
        </div>
      ) : (
        <div className={className ?? ""}>
          <div className="space-y-[24px] lg:space-y-[40px]">
            {posts.map((post) => {
              const categoryLabel =
                post.category?.name ?? post.categories?.[0]?.name;
              const dateLabel = formatDate(post.publishedAt ?? post.updatedAt);
              const href = `/${post.slug}`;
              const thumbSrc = post.featuredImage || FALLBACK_THUMBNAIL;
              const thumbAlt =
                post.featuredImageAlt || post.title || "News thumbnail";

              return (
                <article key={post.id}>
                  <Link
                    href={href}
                    className="group mx-auto flex w-full max-w-[343px] items-center gap-[12px] rounded-[8px] bg-white p-4 md:max-w-none md:items-start md:gap-[24px] md:rounded-xl md:pt-4 md:pr-6 md:pb-4 md:pl-4 lg:max-w-none lg:items-start lg:gap-[24px] lg:rounded-xl lg:pt-4 lg:pr-6 lg:pb-4 lg:pl-4 shadow-[0_0_0_1px_rgba(0,0,0,0.05)] transition hover:shadow-[0_0_0_1px_rgba(14,106,109,0.25)]"
                  >
                    <div className="h-[99.81px] w-[100px] flex-none overflow-hidden rounded-[8px] bg-[#F4F4F2] md:h-[79.81px] md:w-[120px] lg:h-[79.81px] lg:w-[120px]">
                      <div className="relative h-full w-full">
                        <Image
                          src={thumbSrc}
                          alt={thumbAlt}
                          fill
                          unoptimized
                          sizes="(max-width: 767px) 100px, 120px"
                          className="object-cover"
                        />
                      </div>
                    </div>

                    <div className="min-w-0 flex-1 flex flex-col md:grid md:grid-cols-[minmax(0,1fr)_auto] md:gap-x-[25px] lg:grid lg:grid-cols-[minmax(0,1fr)_auto] lg:gap-x-[25px]">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="inline-flex items-center justify-center gap-[10px] rounded-[100px] bg-brand-green px-[12px] py-[4px] text-center font-noto-jp text-[10px] font-bold leading-[1.6] tracking-[0.5px] text-white md:px-3 md:py-1 md:text-[14px] md:tracking-[0.7px] lg:px-3 lg:py-1 lg:text-[14px] lg:tracking-[0.7px]">
                            {categoryLabel ?? labels.all}
                          </span>
                          <span className="font-noto-jp text-[12px] font-normal leading-[1.6] tracking-[0.6px] text-[#5A5955] md:text-[16px] md:tracking-[0.8px] lg:text-[16px] lg:tracking-[0.8px]">
                            {dateLabel}
                          </span>
                        </div>
                        <h2 className="mt-2 mb-2 min-w-0 font-noto-jp text-[14px] font-normal leading-[1.6] tracking-[0.7px] text-[#252422] md:mt-[20px] md:mb-0 md:text-[16px] md:tracking-[0.8px] lg:mt-[20px] lg:mb-0 lg:text-[16px] lg:tracking-[0.8px]">
                          {post.title}
                        </h2>
                      </div>
                      <span className="mt-0 inline-flex items-center whitespace-nowrap text-left font-noto-jp text-[14px] font-bold leading-[1.6] tracking-[0.7px] text-[#1F8A5A] md:row-span-2 md:mt-0 md:self-center md:text-right md:py-[25px] md:text-[16px] md:tracking-[0.8px] lg:row-span-2 lg:mt-0 lg:self-center lg:text-right lg:py-[25px] lg:text-[16px] lg:tracking-[0.8px]">
                        詳しく見る →
                      </span>
                    </div>
                  </Link>
                </article>
              );
            })}
          </div>
        </div>
      )}
    </>
  );
}
