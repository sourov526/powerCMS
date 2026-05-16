export const runtime = "nodejs";

import type { MetadataRoute } from "next";
import {
  getAllAuthors,
  getAllCategories,
  getAllTags,
  getPostsByAuthorSlug,
  getPostsByCategorySlug,
  getPublishedPosts,
} from "@/lib/services/posts";
import { defaultLocale } from '@/utils/strings/config';
import { headers } from "next/headers";
import { resolveSiteUrlFromHeaders } from "@/lib/site";

export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const requestHeaders = await headers();
  const baseUrl = resolveSiteUrlFromHeaders((name) =>
    requestHeaders.get(name),
  );
  const posts = (await getPublishedPosts(defaultLocale)) ?? [];

  const categories = (await getAllCategories()) ?? [];
  const categoryEntries = (
    await Promise.all(
      categories.map(async (category) => {
        if (!category.intro) return null;
        const categoryPosts = (await getPostsByCategorySlug(category.slug, defaultLocale)) ?? [];
        if (categoryPosts.length < 2) return null;
        return {
          url: `${baseUrl}/${defaultLocale}/admin/categories/${category.slug}`,
          lastModified: new Date(),
          changeFrequency: "weekly" as const,
          priority: 0.5,
        };
      })
    )
  ).filter((entry): entry is Exclude<typeof entry, null> => entry !== null);

  const authors = (await getAllAuthors()) ?? [];
  const authorEntries = (
    await Promise.all(
      authors.map(async (author) => {
        if (!author.bio) return null;
        const authorPosts = (await getPostsByAuthorSlug(author.slug, defaultLocale)) ?? [];
        if (authorPosts.length < 2) return null;
        return {
          url: `${baseUrl}/${defaultLocale}/admin/authors/${author.slug}`,
          lastModified: new Date(),
          changeFrequency: "monthly" as const,
          priority: 0.4,
        };
      })
    )
  ).filter((entry): entry is Exclude<typeof entry, null> => entry !== null);

  const tags = ((await getAllTags(defaultLocale)) ?? []).filter((tag) => tag.count >= 2).map((tag) => ({
      url: `${baseUrl}/${defaultLocale}/admin/tags/${tag.slug}`,
      lastModified: new Date(),
      changeFrequency: "weekly" as const,
      priority: 0.4,
    }));

  return [
    {
      url: `${baseUrl}/${defaultLocale}/admin`,
      lastModified: new Date(),
    },
    ...categoryEntries,
    ...authorEntries,
    ...tags,
    ...posts.map((p) => ({
      url: `${baseUrl}/${defaultLocale}/admin/posts/${encodeURIComponent(p.slug)}`,
      lastModified: new Date(p.updatedAt),
      changeFrequency: "weekly" as const,
      priority: 0.7,
    })),
  ];
}
