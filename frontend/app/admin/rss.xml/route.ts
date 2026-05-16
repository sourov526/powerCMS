export const runtime = "nodejs";

import { getPublishedPosts } from "@/lib/services/posts";
import { resolveSiteUrlFromHeaders, siteConfig } from "@/lib/site";
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
  const lastBuildDate = posts.length > 0
    ? new Date(posts[0].updatedAt).toUTCString()
    : new Date().toUTCString();

  const items = posts
    .map((post) => {
      const url = `${baseUrl}/${defaultLocale}/admin/posts/${encodeURIComponent(post.slug)}`;
      const title = post.seoTitle ?? post.title;
      const description = post.seoDescription ?? post.excerpt ?? "";
      const publishedAt = new Date(post.publishedAt ?? post.updatedAt).toUTCString();

      return `
        <item>
          <title>${escapeXml(title)}</title>
          <link>${url}</link>
          <guid>${url}</guid>
          <pubDate>${publishedAt}</pubDate>
          <description>${escapeXml(description)}</description>
        </item>
      `;
    })
    .join("");

  const rss = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${escapeXml(siteConfig.name)}</title>
    <link>${baseUrl}/${defaultLocale}/admin</link>
    <description>${escapeXml(siteConfig.description)}</description>
    <lastBuildDate>${lastBuildDate}</lastBuildDate>
    <atom:link href="${baseUrl}/${defaultLocale}/admin/rss.xml" rel="self" type="application/rss+xml" />
    ${items}
  </channel>
</rss>`;

  return new Response(rss, {
    headers: {
      "Content-Type": "application/rss+xml; charset=utf-8",
    },
  });
}
