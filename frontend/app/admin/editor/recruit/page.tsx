import RecruitEditorForm from "@/app/admin/editor/RecruitEditorForm";
import { requireRole, requireSessionUser } from "@/lib/auth/auth-server";
import { getRecruitPostBySlug } from "@/lib/services/recruit-posts";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function RecruitEditorPage({
  searchParams,
}: {
  searchParams?: Promise<{
    slug?: string;
    locale?: string;
  }>;
}) {
  const user = await requireSessionUser();
  requireRole(user, ["superuser", "author"]);

  const resolvedSearchParams = await searchParams;
  const slug =
    typeof resolvedSearchParams?.slug === "string"
      ? resolvedSearchParams.slug
      : "";

  const recruitPost = slug ? (await getRecruitPostBySlug(slug)) ?? null : null;

  if (recruitPost && user.role === "author" && recruitPost.createdBy !== user.id) {
    redirect("/admin/recruit");
  }

  return <RecruitEditorForm initialRecruit={recruitPost ?? undefined} />;
}
