"use client";

import { adminUi } from "@/app/admin/core/admin-ui";
import ConfirmDialog from "@/app/admin/core/ConfirmDialog";
import NewsPagination from "@/components/category/NewsPagination";
import type { Post } from "@/lib/services/posts";
import { Link } from "@/navigation";
import { useTranslations } from "@/utils/strings/client";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState, useTransition } from "react";

type PostsWithScore = Post & { seoScore?: number };
type Props = {
  posts: PostsWithScore[];
  currentUser: { id: number; role: "superuser" | "author" };
};

function getLatestActivityTs(post: Pick<Post, "createdAt" | "updatedAt">) {
  const createdTs = Date.parse(post.createdAt);
  const updatedTs = Date.parse(post.updatedAt);
  const safeCreated = Number.isNaN(createdTs) ? 0 : createdTs;
  const safeUpdated = Number.isNaN(updatedTs) ? 0 : updatedTs;
  return Math.max(safeCreated, safeUpdated);
}

function resolvePreviewBasePath(pathname: string, localeCode: string) {
  const segments = pathname.split("/").filter(Boolean);
  const adminIndex = segments.indexOf("admin");
  if (adminIndex === -1) return "";
  const hasLocaleBeforeAdmin =
    adminIndex > 0 && segments[adminIndex - 1] === localeCode;
  const baseSegments = hasLocaleBeforeAdmin
    ? segments.slice(0, adminIndex - 1)
    : segments.slice(0, adminIndex);
  return baseSegments.length > 0 ? `/${baseSegments.join("/")}` : "";
}

export default function PostsClient({ posts, currentUser }: Props) {
  const t = useTranslations("Admin.posts");
  const tStatus = useTranslations("Admin.status");
  const tRole = useTranslations("Admin.roles");
  const [query, setQuery] = useState("");
  const [userFilter, setUserFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<
    "all" | "draft" | "published" | "scheduled" | "archived"
  >("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [page, setPage] = useState(0);
  const [archivePage, setArchivePage] = useState(0);
  const [isMobile, setIsMobile] = useState(false);
  const pageSize = 8;
  const normalized = query.trim().toLowerCase();
  const hasActiveFilters =
    query.trim().length > 0 ||
    statusFilter !== "all" ||
    userFilter !== "all" ||
    dateFrom !== "" ||
    dateTo !== "";
  const userOptions = useMemo(() => {
    const map = new Map<
      number,
      { id: number; name: string; role: "superuser" | "author" }
    >();
    for (const post of posts) {
      const id = post.createdBy;
      if (!id || !post.createdByUser) continue;
      if (!map.has(id)) {
        map.set(id, {
          id,
          name: post.createdByUser.name || "—",
          role: post.createdByUser.role as "superuser" | "author",
        });
      }
    }
    return Array.from(map.values()).sort((a, b) =>
      a.name.localeCompare(b.name)
    );
  }, [posts]);

  const { activePosts, archivedPosts } = useMemo(() => {
    const matches = (post: Post) => {
      if (!normalized) return true;
      return (
        post.title.toLowerCase().includes(normalized) ||
        post.slug.toLowerCase().includes(normalized) ||
        post.status.toLowerCase().includes(normalized)
      );
    };
    const fromTs = dateFrom ? Date.parse(`${dateFrom}T00:00:00`) : null;
    const toTs = dateTo ? Date.parse(`${dateTo}T23:59:59.999`) : null;
    const filtered = posts
      .filter(matches)
      .filter((post) =>
        statusFilter === "all" ? true : post.status === statusFilter
      )
      .filter((post) => {
        if (userFilter === "all") return true;
        return String(post.createdBy ?? "") === userFilter;
      })
      .filter((post) => {
        const activityTs = getLatestActivityTs(post);
        if (fromTs !== null && activityTs < fromTs) return false;
        if (toTs !== null && activityTs > toTs) return false;
        return true;
      })
      .sort((a, b) => getLatestActivityTs(b) - getLatestActivityTs(a));
    return {
      activePosts: filtered.filter((post) => post.status !== "archived"),
      archivedPosts: filtered.filter((post) => post.status === "archived"),
    };
  }, [normalized, posts, statusFilter, userFilter, dateFrom, dateTo]);
  const activePageCount = Math.max(1, Math.ceil(activePosts.length / pageSize));
  const archivePageCount = Math.max(
    1,
    Math.ceil(archivedPosts.length / pageSize)
  );
  const pagedActivePosts = useMemo(() => {
    const start = page * pageSize;
    return activePosts.slice(start, start + pageSize);
  }, [activePosts, page, pageSize]);
  const pagedArchivedPosts = useMemo(() => {
    const start = archivePage * pageSize;
    return archivedPosts.slice(start, start + pageSize);
  }, [archivedPosts, archivePage, pageSize]);

  useEffect(() => {
    setPage(0);
    setArchivePage(0);
  }, [normalized, statusFilter, userFilter, dateFrom, dateTo]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const media = window.matchMedia("(max-width: 640px)");
    const update = () => setIsMobile(media.matches);
    update();
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, []);

  const clearFilters = () => {
    setQuery("");
    setStatusFilter("all");
    setUserFilter("all");
    setDateFrom("");
    setDateTo("");
  };

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_300px] lg:items-start">
      <div className={adminUi.grid}>
        <div className="grid gap-3">
          <div className="grid grid-cols-1 gap-3 lg:grid-cols-2 lg:items-end">
            <label className="flex w-full min-w-0 flex-col gap-2 text-sm font-semibold text-slate-700">
              {t("filters.status")}
              <select
                value={statusFilter}
                onChange={(event) =>
                  setStatusFilter(
                    event.target.value as
                      | "all"
                      | "draft"
                      | "published"
                      | "scheduled"
                      | "archived"
                  )
                }
                className={adminUi.input}
              >
                <option value="all">{t("filters.all")}</option>
                <option value="published">{tStatus("published")}</option>
                <option value="draft">{tStatus("draft")}</option>
                <option value="scheduled">{tStatus("scheduled")}</option>
                <option value="archived">{tStatus("archived")}</option>
              </select>
            </label>
            <label className="flex w-full min-w-0 flex-col gap-2 text-sm font-semibold text-slate-700">
              {t("filters.user")}
              <select
                value={userFilter}
                onChange={(event) => setUserFilter(event.target.value)}
                className={adminUi.input}
              >
                <option value="all">{t("filters.allUsers")}</option>
                {userOptions.map((user) => (
                  <option key={user.id} value={String(user.id)}>
                    {user.name} ({tRole(user.role)})
                  </option>
                ))}
              </select>
            </label>
            <div className="flex w-full min-w-0 flex-col gap-2 text-sm font-semibold text-slate-700 lg:col-span-2">
              <span>{t("filters.dateRange")}</span>
              <div className="grid grid-cols-1 gap-2 md:grid-cols-2 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto]">
                <input
                  type="date"
                  value={dateFrom}
                  onChange={(event) => setDateFrom(event.target.value)}
                  className={`${adminUi.input} h-9 text-xs`}
                  aria-label={t("filters.from")}
                />
                <input
                  type="date"
                  value={dateTo}
                  onChange={(event) => setDateTo(event.target.value)}
                  className={`${adminUi.input} h-9 text-xs`}
                  aria-label={t("filters.to")}
                />
                <button
                  type="button"
                  onClick={clearFilters}
                  disabled={!hasActiveFilters}
                  className="inline-flex h-9 w-full items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-2.5 text-xs font-semibold text-slate-700 transition hover:border-slate-400 disabled:cursor-not-allowed disabled:opacity-50 lg:w-[110px]"
                >
                  <svg
                    className="h-4 w-4"
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                  >
                    <path
                      d="M6 6l12 12M18 6L6 18"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.8"
                      strokeLinecap="round"
                    />
                  </svg>
                  {t("filters.clear")}
                </button>
              </div>
            </div>
          </div>
          <label className="flex w-full flex-col gap-2 text-sm font-semibold text-slate-700">
            {t("search.label")}
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder={t("search.placeholder")}
              className={adminUi.input}
            />
          </label>
        </div>
        {pagedActivePosts.map((post) => {
          const canEdit =
            currentUser.role === "superuser" ||
            post.createdBy === currentUser.id;
          const canDelete = currentUser.role === "superuser";

          return (
            <div
              key={post.id}
              className={`${adminUi.card} ${adminUi.cardBody} flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between`}
            >
              <div className="min-w-0">
                <div className="text-base font-semibold text-slate-900 break-words">
                  {post.title}
                </div>
                <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-slate-500">
                  <span
                    className={`${adminUi.badge} ${
                      post.status === "published"
                        ? adminUi.badgePublished
                        : post.status === "scheduled"
                        ? adminUi.badgeScheduled
                        : adminUi.badgeDraft
                    }`}
                  >
                    {tStatus(
                      post.status as
                        | "draft"
                        | "published"
                        | "scheduled"
                        | "archived"
                    )}
                  </span>
                  <span>
                    {t("updated", {
                      date: new Date(
                        getLatestActivityTs(post)
                      ).toLocaleDateString(),
                    })}
                  </span>
                  {post.createdByUser ? (
                    <span className="text-slate-400">
                      {post.createdByUser.name || "—"} •{" "}
                      {tRole(post.createdByUser.role as "superuser" | "author")}
                    </span>
                  ) : null}
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-2 lg:ml-auto lg:justify-end">
                {post.status !== "archived" && canEdit ? (
                  <Link
                    href={`/admin/editor?slug=${encodeURIComponent(
                      post.slug
                    )}&locale=${post.locale}`}
                    className={adminUi.buttonEdit}
                  >
                    {t("actions.edit")}
                  </Link>
                ) : null}
                {/* {canEdit ? (
                  <PublishButton
                    postId={post.id}
                    status={post.status}
                    locale={post.locale}
                  />
                ) : null} */}
                {canEdit ? (
                  <PostActionsMenu
                    postId={post.id}
                    slug={post.slug}
                    status={post.status}
                    locale={post.locale}
                    canDelete={canDelete}
                  />
                ) : null}
              </div>
            </div>
          );
        })}
        {activePosts.length === 0 ? (
          <div className={adminUi.empty}>
            {posts.length === 0 && !normalized ? t("empty") : t("emptySearch")}
          </div>
        ) : null}
        <NewsPagination
          page={Math.min(page, activePageCount - 1)}
          pageCount={activePageCount}
          isMobile={isMobile}
          onPageChange={(selected) => setPage(selected)}
        />
      </div>
      <aside className={`${adminUi.card} ${adminUi.cardBody} lg:sticky lg:top-6`}>
        <div className="flex items-center justify-between">
          <h2 className={adminUi.sectionTitle}>{t("archive.title")}</h2>
          <span className="text-xs text-slate-400">{archivedPosts.length}</span>
        </div>
        {archivedPosts.length === 0 ? (
          <div className={`${adminUi.empty} mt-4`}>{t("archive.empty")}</div>
        ) : (
          <div className="mt-4 grid gap-3">
            {pagedArchivedPosts.map((post) => {
              const canEdit =
                currentUser.role === "superuser" ||
                post.createdBy === currentUser.id;
              const canDelete = currentUser.role === "superuser";

              return (
                <div
                  key={post.id}
                  className="flex flex-col gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-3 py-3 md:flex-row md:items-center md:justify-between lg:flex-row lg:items-center lg:justify-between"
                >
                  <div className="min-w-0">
                    <div className="text-sm font-semibold text-slate-900 break-words">
                      {post.title}
                    </div>
                    <div className="text-xs text-slate-500 break-all">{post.slug}</div>
                    {post.createdByUser ? (
                      <div className="text-[11px] text-slate-400">
                        {post.createdByUser.name || "—"} •{" "}
                        {tRole(
                          post.createdByUser.role as "superuser" | "author"
                        )}
                      </div>
                    ) : null}
                  </div>
                  {canEdit ? (
                    <div className="md:ml-auto lg:ml-auto">
                      <PostActionsMenu
                        postId={post.id}
                        slug={post.slug}
                        status={post.status}
                        locale={post.locale}
                        canDelete={canDelete}
                      />
                    </div>
                  ) : null}
                </div>
              );
            })}
          </div>
        )}
        <NewsPagination
          page={Math.min(archivePage, archivePageCount - 1)}
          pageCount={archivePageCount}
          isMobile={isMobile}
          onPageChange={(selected) => setArchivePage(selected)}
        />
      </aside>
    </div>
  );
}

function PublishButton({
  postId,
  status,
  locale,
}: {
  postId: number;
  status: string;
  locale: string;
}) {
  const t = useTranslations("Admin.posts.actions");
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  async function publish() {
    const response = await fetch("/api/admin/posts/publish", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: postId, locale }),
    });
    if (response.ok) {
      startTransition(() => router.refresh());
    }
  }

  return (
    <button
      type="button"
      disabled={pending || status === "published"}
      onClick={publish}
      className={`flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm  text-emerald-700 disabled:cursor-not-allowed disabled:opacity-70 ${
        status === "published" ? "hidden" : "hover:bg-emerald-50"
      }`}
    >
      {status === "published"
        ? t("published")
        : pending
        ? t("publishing")
        : t("publish")}
    </button>
  );
}

function PostActionsMenu({
  postId,
  slug,
  status,
  locale,
  canDelete,
}: {
  postId: number;
  slug: string;
  status: string;
  locale: string;
  canDelete: boolean;
}) {
  const t = useTranslations("Admin.posts.actions");
  const tCommon = useTranslations("Admin.common");
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handleClick = (event: MouseEvent) => {
      if (!menuRef.current) return;
      if (!menuRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  async function archive() {
    const response = await fetch("/api/admin/posts/archive", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: postId, status: "archived", locale }),
    });
    if (response.ok) {
      startTransition(() => router.refresh());
    }
    setOpen(false);
  }

  async function restore() {
    const response = await fetch("/api/admin/posts/archive", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: postId, status: "draft", locale }),
    });
    if (response.ok) {
      startTransition(() => router.refresh());
    }
    setOpen(false);
  }

  async function remove() {
    setConfirmOpen(false);
    const response = await fetch("/api/admin/posts/delete", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: postId }),
    });
    if (response.ok) {
      startTransition(() => router.refresh());
    }
    setOpen(false);
  }

  async function preview() {
    try {
      const response = await fetch("/api/admin/posts/preview-token", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          postId,
          locale,
          slug,
        }),
      });
      if (!response.ok) return;
      const data = (await response.json().catch(() => null)) as {
        token?: string;
      } | null;
      if (!data?.token || typeof window === "undefined") return;
      const basePath = resolvePreviewBasePath(window.location.pathname, locale);
      const baseUrl = window.location.origin;
      const url = new URL(
        `${basePath}/${locale}/${encodeURIComponent(slug)}`,
        baseUrl
      );
      url.searchParams.set("preview", "1");
      url.searchParams.set("token", data.token);
      window.open(url.toString(), "_blank", "noopener,noreferrer");
      setOpen(false);
    } catch {
      // Ignore preview request failures in the menu.
    }
  }

  return (
    <div className="relative" ref={menuRef}>
      {/* {canEdit ? ( */}
      {/* ) : null} */}
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="inline-flex h-10 w-10 items-center justify-center rounded-[10px] border border-[#e1dfdc] bg-white text-[#1b1b1b] shadow-[0_6px_16px_rgba(0,0,0,0.06)] transition hover:border-[#1b1b1b]"
        aria-label={t("menu")}
      >
        <svg className="h-5 w-5" viewBox="0 0 24 24">
          <circle cx="12" cy="5" r="1.6" fill="currentColor" />
          <circle cx="12" cy="12" r="1.6" fill="currentColor" />
          <circle cx="12" cy="19" r="1.6" fill="currentColor" />
        </svg>
      </button>
      {open ? (
        <div className="absolute right-0 top-12 z-20 w-[180px] rounded-xl border border-slate-200 bg-white p-2 shadow-[0_12px_30px_rgba(0,0,0,0.12)]">
          <button
            type="button"
            onClick={preview}
            disabled={pending}
            className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-70"
          >
            {t("preview")}
          </button>
          <button
            type="button"
            onClick={status === "archived" ? restore : archive}
            disabled={pending}
            className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-70"
          >
            {status === "archived" ? t("restore") : t("archive")}
          </button>
          <PublishButton postId={postId} status={status} locale={locale} />

          {canDelete ? (
            <button
              type="button"
              onClick={() => {
                setOpen(false);
                setConfirmOpen(true);
              }}
              disabled={pending}
              className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-rose-700 hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {pending ? t("deleting") : t("delete")}
            </button>
          ) : null}
        </div>
      ) : null}
      {canDelete ? (
        <ConfirmDialog
          open={confirmOpen}
          title={t("delete")}
          description={t("confirmDelete")}
          confirmLabel={pending ? t("deleting") : t("delete")}
          cancelLabel={tCommon("cancel")}
          busy={pending}
          onConfirm={remove}
          onCancel={() => setConfirmOpen(false)}
        />
      ) : null}
    </div>
  );
}
