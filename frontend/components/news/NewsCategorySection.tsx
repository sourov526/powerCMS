import { getAllCategories, getAllPostsForAdmin } from "@/lib/services/posts";
import NewsCategoryTabs from "@/components/category/NewsCategoryTabs";

type Labels = {
  all: string;
  empty: string;
};

type Props = {
  activeSlug?: string;
  labels: Labels;
};

export default async function NewsCategorySection({ activeSlug, labels }: Props) {
  const [posts, categories] = await Promise.all([
    getAllPostsForAdmin().catch(() => []),
    getAllCategories().catch(() => []),
  ]);
  const visiblePosts = posts.filter((post) => post.status === "published" && !post.noindex);
  const activeCategory = activeSlug
    ? categories.find((category) => category.slug === activeSlug)
    : undefined;

  return (
    <NewsCategoryTabs
      posts={visiblePosts}
      categories={categories.map((category) => ({
        id: category.id,
        slug: category.slug,
        name: category.name,
      }))}
      initialActive={activeCategory ? activeCategory.slug : "all"}
      labels={labels}
    />
  );
}
