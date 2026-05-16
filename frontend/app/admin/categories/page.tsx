import { getScopedTranslations } from "@/utils/strings/server";
import { requireRole, requireSessionUser } from "@/lib/auth/auth-server";
import { deleteCategoryById, getAllCategories, upsertCategory } from "@/lib/services/posts";
import { normalizeSlug } from "@/lib/utils/slug";
import { adminUi } from "@/app/admin/core/admin-ui";
import CategoryFormModal from "@/app/admin/categories/CategoryFormModal";
import CategoryList from "@/app/admin/categories/CategoryList";
import { revalidatePath } from "next/cache";

export const dynamic = "force-dynamic";

async function saveCategory(formData: FormData) {
  "use server";
  const user = await requireSessionUser();
  requireRole(user, ["superuser"]);

  const categoryId = Number(formData.get("categoryId"));
  const normalizedCategoryId =
    Number.isFinite(categoryId) && categoryId > 0 ? categoryId : null;
  const name = String(formData.get("name") ?? "").trim();
  const slugRaw = String(formData.get("slug") ?? "").trim();
  const intro = String(formData.get("intro") ?? "").trim();

  if (!name || !slugRaw) return;
  const slug = normalizeSlug(slugRaw);
  if (!slug) return;

  await upsertCategory({
    id: normalizedCategoryId,
    name,
    slug,
    intro: intro || null,
    actorId: user.id,
  });

  revalidatePath("/admin/categories");
  revalidatePath("/admin");
  revalidatePath("/category/news");
  revalidatePath(`/category/${encodeURIComponent(slug)}`);
  revalidatePath("/sitemap");
}

async function deleteCategory(formData: FormData) {
  "use server";
  const user = await requireSessionUser();
  requireRole(user, ["superuser"]);
  const id = Number(formData.get("categoryId"));
  if (!Number.isNaN(id)) {
    const categories = await getAllCategories();
    const category = categories.find((item) => item.id === id);
    await deleteCategoryById(id);
    revalidatePath("/admin/categories");
    revalidatePath("/admin");
    revalidatePath("/category/news");
    if (category?.slug) {
      revalidatePath(`/category/${encodeURIComponent(category.slug)}`);
    }
    revalidatePath("/sitemap");
  }
}

export default async function CategoriesPage() {
  const user = await requireSessionUser();
  requireRole(user, ["superuser", "author"]);
  const t = await getScopedTranslations("Admin.categories");
  const categories = await getAllCategories();

  return (
    <section className={adminUi.page}>
      <div>
        <h1 className={adminUi.title}>{t("title")}</h1>
        <p className={adminUi.subtitle}>{t("subtitle")}</p>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="text-sm text-slate-500">{t("count", { count: categories.length })}</div>
        {user.role === "superuser" ? <CategoryFormModal onSave={saveCategory} /> : null}
      </div>

      <CategoryList
        categories={categories}
        canEdit={user.role === "superuser"}
        canDelete={user.role === "superuser"}
        onSave={saveCategory}
        onDelete={deleteCategory}
      />
    </section>
  );
}
