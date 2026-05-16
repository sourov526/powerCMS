import type { Post } from "@/lib/services/posts";
import type { PostRailItem } from "@/components/atoms/PostRail";

export function normalizeNewsPostToRailItem(post: Post): PostRailItem {
  const category = post.category ?? post.categories?.[0] ?? null;

  return {
    id: post.id,
    type: "news",
    href: `/${post.slug}`,
    title: post.title,
    date: post.publishedAt ?? post.updatedAt,
    excerpt: post.excerpt || null,
    category: category
      ? { name: category.name ?? null, slug: category.slug ?? null }
      : null,
    featuredImage: post.featuredImage
      ? {
          url: post.featuredImage,
          alt: post.featuredImageAlt ?? post.title,
        }
      : null,
  };
}

