export const runtime = "nodejs";

import { getPublishedPosts } from "@/lib/services/posts";
import { resolveSiteUrlFromHeaders } from "@/lib/site";
import { defaultLocale } from '@/utils/strings/config';

export const dynamic = "force-dynamic";

function escapeXml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

export async function GET(request: Request) {
  const baseUrl = resolveSiteUrlFromHeaders((name) => request.headers.get(name));
  const posts = (await getPublishedPosts(defaultLocale)) ?? [];

  const urls = posts
    .filter((post) => Boolean(post.featuredImage))
    .map((post) => {
      const loc = `${baseUrl}/${defaultLocale}/admin/posts/${encodeURIComponent(post.slug)}`;
      const imageUrl = new URL(post.featuredImage as string, baseUrl).toString();
      const caption = post.featuredImageAlt || post.title;
      return `
        <url>
          <loc>${loc}</loc>
          <image:image>
            <image:loc>${imageUrl}</image:loc>
            <image:caption>${escapeXml(caption)}</image:caption>
          </image:image>
        </url>
      `;
    })
    .join("");

  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">
  ${urls}
</urlset>`;

  return new Response(sitemap, {
    headers: { "Content-Type": "application/xml; charset=utf-8" },
  });
}
