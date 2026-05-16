"use client";

import { adminUi } from "@/app/admin/core/admin-ui";
import ConfirmDialog from "@/app/admin/core/ConfirmDialog";
import NewsPagination from "@/components/category/NewsPagination";
import type { RecruitPost } from "@/lib/services/recruit-posts";
import { Link } from "@/navigation";
import { useTranslations } from "@/utils/strings/client";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState, useTransition } from "react";

type Props = {
  posts: RecruitPost[];
  currentUser: { id: number; role: "superuser" | "author" };
};

export default function RecruitClient({ posts, currentUser }: Props) {
  const t = useTranslations("Admin.recruit");
  const tStatus = useTranslations("Admin.status");
  const tRole = useTranslations("Admin.roles");
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(0);
  const [archivePage, setArchivePage] = useState(0);
  const [isMobile, setIsMobile] = useState(false);
  const pageSize = 8;
  const normalized = query.trim().toLowerCase();

  const { activePosts, archivedPosts } = useMemo(() => {
    const matches = (post: RecruitPost) => {
      if (!normalized) return true;
      return (
        post.title.toLowerCase().includes(normalized) ||
        post.slug.toLowerCase().includes(normalized) ||
        post.status.toLowerCase().includes(normalized)
      );
    };
    const filtered = posts.filter(matches);
    return {
      activePosts: filtered.filter((post) => post.status !== "archived"),
      archivedPosts: filtered.filter((post) => post.status === "archived"),
    };
  }, [normalized, posts]);
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
  }, [normalized]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const media = window.matchMedia("(max-width: 640px)");
    const update = () => setIsMobile(media.matches);
    update();
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, []);

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_300px] lg:items-start">
      <div className={adminUi.grid}>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <label className="flex w-full max-w-full flex-col gap-2 text-sm font-semibold text-slate-700 sm:max-w-xs">
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
              className={`${adminUi.card} ${adminUi.cardBody} ${adminUi.cardRow}`}
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
                  <span className={`${adminUi.badge} ${adminUi.badgeMuted}`}>
                    {t(`type.${post.recruitType}`)}
                  </span>
                  <span>
                    {t("updated", {
                      date: new Date(post.updatedAt).toLocaleDateString(),
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
              <div className="flex flex-wrap items-center justify-end gap-2">
                {post.status !== "archived" && canEdit ? (
                  <Link
                    href={`/admin/editor/recruit?slug=${encodeURIComponent(
                      post.slug
                    )}`}
                    className={adminUi.buttonEdit}
                  >
                    {t("actions.edit")}
                  </Link>
                ) : null}
                {/* {canEdit ? (
                  <PublishButton
                    postId={post.id}
                    status={post.status}
                  />
                ) : null} */}
                {canEdit ? (
                  <PostActionsMenu
                    postId={post.id}
                    status={post.status}
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
      <aside
        className={`${adminUi.card} ${adminUi.cardBody} lg:sticky lg:top-6`}
      >
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
                  className="flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-3 py-3"
                >
                  <div className="min-w-0">
                    <div className="text-sm font-semibold text-slate-900 break-words">
                      {post.title}
                    </div>
                    <div className="mt-1">
                      <span
                        className={`${adminUi.badge} ${adminUi.badgeMuted}`}
                      >
                        {t(`type.${post.recruitType}`)}
                      </span>
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
                    <PostActionsMenu
                      postId={post.id}
                      status={post.status}
                      canDelete={canDelete}
                    />
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

function PublishButton({ postId, status }: { postId: number; status: string }) {
  const t = useTranslations("Admin.recruit.actions");
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  async function publish() {
    const response = await fetch("/api/admin/recruit-posts/publish", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: postId }),
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
  status,
  canDelete,
}: {
  postId: number;
  status: string;
  canDelete: boolean;
}) {
  const t = useTranslations("Admin.recruit.actions");
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
    const response = await fetch("/api/admin/recruit-posts/archive", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: postId, status: "archived" }),
    });
    if (response.ok) {
      startTransition(() => router.refresh());
    }
    setOpen(false);
  }

  async function restore() {
    const response = await fetch("/api/admin/recruit-posts/archive", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: postId, status: "draft" }),
    });
    if (response.ok) {
      startTransition(() => router.refresh());
    }
    setOpen(false);
  }

  async function remove() {
    setConfirmOpen(false);
    const response = await fetch("/api/admin/recruit-posts/delete", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: postId }),
    });
    if (response.ok) {
      startTransition(() => router.refresh());
    }
    setOpen(false);
  }

  return (
    <div className="relative" ref={menuRef}>
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
            onClick={status === "archived" ? restore : archive}
            disabled={pending}
            className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-70"
          >
            {status === "archived" ? t("restore") : t("archive")}
          </button>
          <PublishButton postId={postId} status={status} />
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
