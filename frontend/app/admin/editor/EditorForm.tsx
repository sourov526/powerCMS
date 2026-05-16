"use client";

import { adminUi } from "@/app/admin/core/admin-ui";
import { RichTextArea } from "@/components/RichText";
import LoadingOverlay from "@/components/atoms/LoadingOverlay";
import Spinner from "@/components/atoms/Spinner";
import { buildPostMetadata } from "@/lib/seo";
import type { Post } from "@/lib/services/posts";
import { normalizePostSlug } from "@/lib/utils/slug";
import { useRouter } from "@/navigation";
import { useLocale, useTranslations } from "@/utils/strings/client";
import Image from "next/image";
import { useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

type PostStatus = "draft" | "published" | "archived";
type SaveIntent = "autosave" | "save" | "publish";
type SlugStatus = "idle" | "checking" | "available" | "taken" | "invalid";

const localeOptions = ["ja"] as const;
type LocaleCode = string;
const EDITOR_DRAFT_STORAGE_KEY = "admin-editor-draft";
const SOCIAL_IMAGE_WIDTH = 1200;
const SOCIAL_IMAGE_HEIGHT = 630;
const MAX_SLUG_LENGTH = 50;
const MIRRORED_LOCALE_FIELDS: Array<keyof LocaleDraft> = [
  "title",
  "contentRich",
  "seoTitle",
  "seoDescription",
  "ogImageUrl",
  "ogImageMediaId",
  "featuredImageUrl",
  "featuredImageMediaId",
  "featuredImageAlt",
  "featuredImageWidth",
  "featuredImageHeight",
  "primaryKeyword",
  "tagsText",
  "noindex",
];

type CategoryOption = {
  id: number;
  name: string;
  slug: string;
  intro?: string | null;
};

type LocaleDraft = {
  slug: string;
  title: string;
  contentRich: string;
  seoTitle: string;
  seoDescription: string;
  ogImageUrl: string;
  ogImageMediaId?: number | null;
  featuredImageUrl: string;
  featuredImageMediaId?: number | null;
  featuredImageAlt: string;
  featuredImageWidth: string;
  featuredImageHeight: string;
  primaryKeyword: string;
  tagsText: string;
  noindex: boolean;
};

type SaveMessageTone = "neutral" | "success" | "warning";

type PendingNavigation =
  | { type: "route"; href: string }
  | { type: "back" }
  | null;

type FieldLabelWithHelpProps = {
  label: string;
  helperText: string;
};

function parseTags(input: string) {
  return input
    .split(",")
    .map((tag) => tag.trim())
    .filter(Boolean);
}

function normalizePublishedAt(value?: string | null) {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date.toISOString();
}

function stripHtmlToText(value: string) {
  return value
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function deriveExcerpt(seoDescription: string, contentRich: string) {
  const MAX_EXCERPT_LENGTH = 160;
  const ELLIPSIS = "...";
  const seo = seoDescription.trim();
  if (seo) return seo;
  const description = stripHtmlToText(contentRich);
  if (!description) return "";
  if (description.length <= MAX_EXCERPT_LENGTH) return description;
  const maxWithoutEllipsis = MAX_EXCERPT_LENGTH - ELLIPSIS.length;
  return `${description.slice(0, maxWithoutEllipsis).trimEnd()}${ELLIPSIS}`;
}

function buildLocaleDraft(locale: LocaleCode, base: Post | null | undefined) {
  const existingLocale = base?.locales?.find(
    (entry) => entry.locale === locale
  );
  const slugValue = existingLocale?.slug ?? "";
  return {
    slug: slugValue,
    title: existingLocale?.title ?? "",
    contentRich: existingLocale?.contentRich ?? existingLocale?.content ?? "",
    seoTitle: existingLocale?.seoTitle ?? "",
    seoDescription: existingLocale?.seoDescription ?? "",
    ogImageUrl: existingLocale?.ogImage ?? "",
    ogImageMediaId: existingLocale?.ogImageMedia?.id ?? null,
    featuredImageUrl: existingLocale?.featuredImage ?? "",
    featuredImageMediaId: existingLocale?.featuredImageMedia?.id ?? null,
    featuredImageAlt: existingLocale?.featuredImageAlt ?? "",
    featuredImageWidth: String(existingLocale?.featuredImageWidth ?? 1200),
    featuredImageHeight: String(existingLocale?.featuredImageHeight ?? 630),
    primaryKeyword: existingLocale?.primaryKeyword ?? "",
    tagsText: existingLocale?.tags?.length
      ? existingLocale.tags.join(", ")
      : "",
    noindex: Boolean(existingLocale?.noindex),
  } as LocaleDraft;
}

function buildInitialLocaleDrafts(base: Post | null | undefined) {
  return Object.fromEntries(
    localeOptions.map((entry) => [entry, buildLocaleDraft(entry, base)])
  ) as Record<LocaleCode, LocaleDraft>;
}

function buildInitialLocaleSlugMap(base: Post | null | undefined) {
  const drafts = buildInitialLocaleDrafts(base);
  return Object.fromEntries(
    localeOptions.map((entry) => [entry, normalizePostSlug(drafts[entry].slug)])
  ) as Record<LocaleCode, string>;
}

function buildInitialLocaleBooleanMap(value = false) {
  return Object.fromEntries(
    localeOptions.map((entry) => [entry, value])
  ) as Record<LocaleCode, boolean>;
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

function extractFileName(value?: string | null) {
  if (!value) return "";
  try {
    const parsed = new URL(value, "http://localhost");
    const parts = parsed.pathname.split("/").filter(Boolean);
    return decodeURIComponent(parts[parts.length - 1] ?? "");
  } catch {
    return "";
  }
}

function limitSlugLength(slug: string, maxLength = MAX_SLUG_LENGTH) {
  const normalized = normalizePostSlug(slug);
  if (!normalized) return "";
  if (normalized.length <= maxLength) return normalized;
  return normalized.slice(0, maxLength).replace(/-+$/g, "");
}

function FieldLabelWithHelp({ label, helperText }: FieldLabelWithHelpProps) {
  return (
    <span className="flex items-center justify-between gap-2">
      <span>{label}</span>
      <span className="group relative inline-flex items-center">
        <button
          type="button"
          className="inline-flex h-4 w-4 items-center justify-center rounded-full border border-slate-300 text-[10px] font-bold leading-none text-slate-500"
          aria-label={helperText}
          title={helperText}
        >
          i
        </button>
        <span className="pointer-events-none absolute right-0 top-full z-20 hidden w-64 translate-y-1 rounded-lg border border-slate-200 bg-white px-2 py-1 text-[11px] font-medium leading-snug text-slate-600 shadow-lg group-hover:block group-focus-within:block">
          {helperText}
        </span>
      </span>
    </span>
  );
}

export default function EditorForm({
  initialPost,
}: {
  initialPost?: Post | null;
}) {
  const t = useTranslations("Admin.editor");
  const router = useRouter();
  const locale = useLocale() as LocaleCode;
  const searchParams = useSearchParams();

  const localeParam = searchParams.get("locale");
  const resolvedLocale =
    localeParam === "ja" ? "ja" : (initialPost?.locale as LocaleCode) ?? locale;
  const activeLocale = resolvedLocale;
  const [currentPostId, setCurrentPostId] = useState<number | null>(
    initialPost?.editingPostId ?? initialPost?.id ?? null
  );
  const [localeDrafts, setLocaleDrafts] = useState<
    Record<LocaleCode, LocaleDraft>
  >(() => buildInitialLocaleDrafts(initialPost ?? null));
  const [slugEditModes, setSlugEditModes] = useState<
    Record<LocaleCode, boolean>
  >(() => buildInitialLocaleBooleanMap());
  const savedLocaleSlugsRef = useRef<Record<LocaleCode, string>>(
    buildInitialLocaleSlugMap(initialPost ?? null)
  );

  const [categories, setCategories] = useState<CategoryOption[]>([]);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [newCategorySlug, setNewCategorySlug] = useState("");
  const [newCategoryIntro, setNewCategoryIntro] = useState("");
  const [categorySaveMessage, setCategorySaveMessage] = useState("");
  const [categoryIds, setCategoryIds] = useState<number[]>(() => {
    const ids =
      initialPost?.draftCategoryIds ??
      initialPost?.categories?.map((category) => category.id) ??
      (initialPost?.category?.id ? [initialPost.category.id] : []);
    return (ids ?? [])
      .map((id) => Number(id))
      .filter(Boolean)
      .slice(0, 1);
  });

  const [status, setStatus] = useState<PostStatus>(
    initialPost?.status === "published" || initialPost?.status === "archived"
      ? initialPost.status
      : "draft"
  );

  const [saveMessage, setSaveMessage] = useState("");
  const [saveMessageTone, setSaveMessageTone] =
    useState<SaveMessageTone>("neutral");
  const [slugStatus, setSlugStatus] = useState<SlugStatus>("idle");
  const [resolvedTitleSlug, setResolvedTitleSlug] = useState("");
  const [featuredMediaMessage, setFeaturedMediaMessage] = useState("");
  const [featuredUploadProgress, setFeaturedUploadProgress] = useState<
    number | null
  >(null);
  const [ogMediaMessage, setOgMediaMessage] = useState("");
  const [ogUploadProgress, setOgUploadProgress] = useState<number | null>(null);
  const [featuredFileName, setFeaturedFileName] = useState("");
  const [ogFileName, setOgFileName] = useState("");
  const [defaultOgImageUrl, setDefaultOgImageUrl] = useState("");
  const [previewBaseUrl, setPreviewBaseUrl] = useState<string | undefined>(
    undefined
  );
  const [isDirty, setIsDirty] = useState(false);
  const [leaveModalOpen, setLeaveModalOpen] = useState(false);
  const [pendingNavigation, setPendingNavigation] =
    useState<PendingNavigation>(null);
  const [actionBusy, setActionBusy] = useState<
    null | "preview" | "save" | "publish"
  >(null);

  const requestSeqRef = useRef(0);
  const latestAppliedSeqRef = useRef(0);
  const slugAvailabilityRequestRef = useRef(0);
  const currentPostIdRef = useRef<number | null>(
    initialPost?.editingPostId ?? initialPost?.id ?? null
  );
  const saveInFlightRef = useRef(false);
  const serverUpdatedAtRef = useRef<string | null>(
    initialPost?.updatedAt ?? null
  );
  const draftRevisionRef = useRef<number | null>(
    initialPost?.draftRevision ?? null
  );
  const draftBaseUpdatedAtRef = useRef<string | null>(
    initialPost?.draftBaseUpdatedAt ?? null
  );
  const lastSavedFingerprintRef = useRef("");
  const allowLeaveRef = useRef(false);
  const slugInputRef = useRef<HTMLInputElement | null>(null);

  const activeDraft = localeDrafts[activeLocale];
  const isSlugEditing = slugEditModes[activeLocale];
  const savedSlug = normalizePostSlug(
    savedLocaleSlugsRef.current[activeLocale] || ""
  );
  const currentExplicitSlug = limitSlugLength(activeDraft.slug || "");
  const clearStoredEditorDraft = useCallback(() => {
    if (typeof window === "undefined") return;
    const draftKeys = [
      `${EDITOR_DRAFT_STORAGE_KEY}:new`,
      `${EDITOR_DRAFT_STORAGE_KEY}:${initialPost?.id ?? "new"}`,
      `${EDITOR_DRAFT_STORAGE_KEY}:${currentPostId ?? ""}`,
    ];
    for (const key of draftKeys) {
      try {
        window.sessionStorage.removeItem(key);
      } catch {
        // Ignore cleanup failures.
      }
    }
  }, [currentPostId, initialPost?.id]);
  const generatedSlugFromTitle = useMemo(
    () => limitSlugLength(activeDraft.title || ""),
    [activeDraft.title]
  );
  const permalinkSlug =
    currentExplicitSlug ||
    savedSlug ||
    resolvedTitleSlug ||
    generatedSlugFromTitle ||
    t("defaults.slugFallback");
  const permalinkUrl = `${(previewBaseUrl ?? "").replace(
    /\/$/,
    ""
  )}/${activeLocale}/${permalinkSlug}`;
  const shouldShowSlugStatus =
    isSlugEditing || !currentPostId || (!savedSlug && !currentExplicitSlug);

  const updateLocaleDraft = useCallback(
    (localeCode: LocaleCode, updates: Partial<LocaleDraft>) => {
      const mirroredUpdates = Object.fromEntries(
        Object.entries(updates).filter(([key]) =>
          MIRRORED_LOCALE_FIELDS.includes(key as keyof LocaleDraft)
        )
      ) as Partial<LocaleDraft>;

      setLocaleDrafts((prev) => {
        const next = {} as Record<LocaleCode, LocaleDraft>;
        localeOptions.forEach((entry) => {
          const baseDraft = prev[entry] ?? buildLocaleDraft(entry, initialPost);
          next[entry] =
            entry === localeCode
              ? {
                  ...baseDraft,
                  ...updates,
                }
              : {
                  ...baseDraft,
                  ...mirroredUpdates,
                };
        });
        return next;
      });
    },
    [initialPost]
  );

  useEffect(() => {
    let cancelled = false;
    async function loadCategories() {
      try {
        const response = await fetch("/api/admin/categories");
        if (!response.ok) return;
        const data = (await response.json()) as {
          categories?: CategoryOption[];
        };
        if (!cancelled && Array.isArray(data.categories)) {
          setCategories(data.categories);
        }
      } catch {
        // Ignore category load failures.
      }
    }
    loadCategories();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    async function loadDefaultOgImage() {
      try {
        const response = await fetch("/api/media/default-og");
        if (!response.ok) return;
        const data = (await response.json()) as { url?: string };
        if (!cancelled && typeof data.url === "string") {
          setDefaultOgImageUrl(data.url);
        }
      } catch {
        // Ignore failures; preview will fall back to current behavior.
      }
    }
    void loadDefaultOgImage();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const focusHandle = window.setTimeout(() => {
      if (!isSlugEditing) return;
      slugInputRef.current?.focus();
      slugInputRef.current?.select();
    }, 0);
    return () => window.clearTimeout(focusHandle);
  }, [activeLocale, isSlugEditing]);

  const fetchSlugAvailability = useCallback(
    async (slugToCheck: string) => {
      const normalized = limitSlugLength(slugToCheck);
      if (!normalized) return false;
      const params = new URLSearchParams({
        slug: normalized,
        locale: activeLocale,
        mode: "post",
      });
      if (currentPostId) {
        params.set("postId", String(currentPostId));
      }
      const response = await fetch(
        `/api/admin/slug-availability?${params.toString()}`
      );
      if (!response.ok) throw new Error("Failed");
      const data = (await response.json()) as { available?: boolean };
      return Boolean(data.available);
    },
    [activeLocale, currentPostId]
  );

  const checkSlugAvailability = useCallback(
    async (slugToCheck: string) => {
      const normalized = limitSlugLength(slugToCheck);
      const requestId = slugAvailabilityRequestRef.current + 1;
      slugAvailabilityRequestRef.current = requestId;

      if (!normalized) {
        const nextStatus: SlugStatus = slugToCheck ? "invalid" : "idle";
        setSlugStatus(nextStatus);
        return nextStatus;
      }

      setSlugStatus("checking");
      try {
        const available = await fetchSlugAvailability(normalized);
        const nextStatus: SlugStatus = available ? "available" : "taken";
        if (slugAvailabilityRequestRef.current === requestId) {
          setSlugStatus(nextStatus);
        }
        return nextStatus;
      } catch {
        if (slugAvailabilityRequestRef.current === requestId) {
          setSlugStatus("invalid");
        }
        return "invalid" as const;
      }
    },
    [fetchSlugAvailability]
  );

  useEffect(() => {
    const shouldValidateExplicitSlug =
      Boolean(currentExplicitSlug) &&
      (isSlugEditing || !currentPostId || !savedSlug);

    if (shouldValidateExplicitSlug) {
      setResolvedTitleSlug("");
      const handle = window.setTimeout(() => {
        void checkSlugAvailability(currentExplicitSlug);
      }, 350);
      return () => window.clearTimeout(handle);
    }

    if (savedSlug) {
      setSlugStatus("idle");
      setResolvedTitleSlug("");
      return;
    }

    if (!generatedSlugFromTitle) {
      setSlugStatus(activeDraft.title.trim() ? "invalid" : "idle");
      setResolvedTitleSlug("");
      return;
    }

    const requestId = slugAvailabilityRequestRef.current + 1;
    slugAvailabilityRequestRef.current = requestId;
    const handle = window.setTimeout(async () => {
      setSlugStatus("checking");
      try {
        const baseAvailable = await fetchSlugAvailability(
          generatedSlugFromTitle
        );
        if (slugAvailabilityRequestRef.current !== requestId) return;
        if (baseAvailable) {
          setSlugStatus("available");
          setResolvedTitleSlug(generatedSlugFromTitle);
          return;
        }
        let uniqueSuggestion = "";
        for (let i = 0; i < 5; i += 1) {
          const suffix =
            typeof crypto !== "undefined" &&
            typeof crypto.randomUUID === "function"
              ? crypto.randomUUID().slice(0, 8)
              : Math.random().toString(36).slice(2, 10);
          const baseMaxLength = MAX_SLUG_LENGTH - (suffix.length + 1);
          const base = limitSlugLength(generatedSlugFromTitle, baseMaxLength);
          const candidate = `${base}-${suffix}`;
          const available = await fetchSlugAvailability(candidate);
          if (slugAvailabilityRequestRef.current !== requestId) return;
          if (available) {
            uniqueSuggestion = candidate;
            break;
          }
        }
        if (uniqueSuggestion) {
          setResolvedTitleSlug(uniqueSuggestion);
          setSlugStatus("available");
          return;
        }
        setResolvedTitleSlug(generatedSlugFromTitle);
        setSlugStatus("taken");
      } catch {
        if (slugAvailabilityRequestRef.current !== requestId) return;
        setSlugStatus("invalid");
        setResolvedTitleSlug(generatedSlugFromTitle);
      }
    }, 350);
    return () => window.clearTimeout(handle);
  }, [
    activeLocale,
    activeDraft.title,
    checkSlugAvailability,
    currentExplicitSlug,
    currentPostId,
    fetchSlugAvailability,
    generatedSlugFromTitle,
    isSlugEditing,
    savedSlug,
  ]);

  function setSlugEditMode(localeCode: LocaleCode, nextValue: boolean) {
    setSlugEditModes((prev) => ({
      ...prev,
      [localeCode]: nextValue,
    }));
  }

  function handleStartSlugEdit() {
    if (!currentExplicitSlug && !savedSlug) {
      const fallbackSlug = resolvedTitleSlug || generatedSlugFromTitle;
      if (fallbackSlug) {
        updateLocaleDraft(activeLocale, { slug: fallbackSlug });
      }
    }
    setSlugEditMode(activeLocale, true);
  }

  function handleFinishSlugEdit() {
    if (!currentExplicitSlug && savedSlug) {
      updateLocaleDraft(activeLocale, { slug: savedSlug });
    }
    setSlugEditMode(activeLocale, false);
  }

  function handleCancelSlugEdit() {
    updateLocaleDraft(activeLocale, { slug: savedSlug });
    setSlugEditMode(activeLocale, false);
  }

  const handleCreateCategory = useCallback(async () => {
    setCategorySaveMessage("");
    const payload = {
      name: newCategoryName.trim(),
      slug: newCategorySlug.trim(),
      intro: newCategoryIntro.trim(),
    };
    if (!payload.name) {
      setCategorySaveMessage(t("fields.categoryEmpty"));
      return;
    }
    try {
      const response = await fetch("/api/admin/categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!response.ok) {
        const data = (await response.json()) as { error?: string };
        setCategorySaveMessage(
          data.error || t("messages.createCategoryFailed")
        );
        return;
      }
      const data = (await response.json()) as { category?: CategoryOption };
      const createdCategory = data.category;
      if (createdCategory) {
        setCategories((prev) =>
          [...prev, createdCategory].sort((a, b) =>
            a.name.localeCompare(b.name)
          )
        );
        setCategoryIds((prev) =>
          prev.includes(createdCategory.id)
            ? prev
            : [createdCategory.id, ...prev]
        );
        setShowCategoryModal(false);
        setNewCategoryName("");
        setNewCategorySlug("");
        setNewCategoryIntro("");
      }
    } catch {
      setCategorySaveMessage(t("messages.createCategoryFailed"));
    }
  }, [newCategoryIntro, newCategoryName, newCategorySlug, t]);

  async function uploadFeaturedImage(file: File) {
    setFeaturedMediaMessage(t("media.uploading"));
    setFeaturedUploadProgress(0);
    setFeaturedFileName(file.name);
    const previousMediaId = activeDraft.featuredImageMediaId ?? null;

    const formData = new FormData();
    formData.append("file", file);

    const uploaded = await new Promise<{ id: number; url: string } | null>(
      (resolve) => {
        const xhr = new XMLHttpRequest();
        xhr.open("POST", "/api/media/upload");

        xhr.upload.onprogress = (event) => {
          if (!event.lengthComputable) return;
          const next = Math.min(
            100,
            Math.round((event.loaded / event.total) * 100)
          );
          setFeaturedUploadProgress(next);
        };

        xhr.onerror = () => resolve(null);
        xhr.onload = () => {
          if (xhr.status < 200 || xhr.status >= 300) {
            resolve(null);
            return;
          }
          try {
            resolve(
              JSON.parse(xhr.responseText) as { id: number; url: string }
            );
          } catch {
            resolve(null);
          }
        };

        xhr.send(formData);
      }
    );

    if (!uploaded) {
      setFeaturedMediaMessage(t("media.uploadFailed"));
      setFeaturedUploadProgress(null);
      return;
    }

    updateLocaleDraft(activeLocale, {
      featuredImageMediaId: uploaded.id,
      featuredImageUrl: uploaded.url,
      featuredImageWidth: String(SOCIAL_IMAGE_WIDTH),
      featuredImageHeight: String(SOCIAL_IMAGE_HEIGHT),
    });
    if (previousMediaId && previousMediaId !== uploaded.id) {
      void deleteMediaIfOrphaned(previousMediaId);
    }
    setFeaturedUploadProgress(100);
    setFeaturedMediaMessage(t("media.uploaded"));
    window.setTimeout(() => setFeaturedUploadProgress(null), 800);
  }

  async function uploadOgImage(file: File) {
    setOgMediaMessage(t("media.uploading"));
    setOgUploadProgress(0);
    setOgFileName(file.name);
    const previousMediaId = activeDraft.ogImageMediaId ?? null;

    const formData = new FormData();
    formData.append("file", file);

    const uploaded = await new Promise<{ id: number; url: string } | null>(
      (resolve) => {
        const xhr = new XMLHttpRequest();
        xhr.open("POST", "/api/media/upload");

        xhr.upload.onprogress = (event) => {
          if (!event.lengthComputable) return;
          const next = Math.min(
            100,
            Math.round((event.loaded / event.total) * 100)
          );
          setOgUploadProgress(next);
        };

        xhr.onerror = () => resolve(null);
        xhr.onload = () => {
          if (xhr.status < 200 || xhr.status >= 300) {
            resolve(null);
            return;
          }
          try {
            resolve(
              JSON.parse(xhr.responseText) as { id: number; url: string }
            );
          } catch {
            resolve(null);
          }
        };

        xhr.send(formData);
      }
    );

    if (!uploaded) {
      setOgMediaMessage(t("media.uploadFailed"));
      setOgUploadProgress(null);
      return;
    }

    updateLocaleDraft(activeLocale, {
      ogImageMediaId: uploaded.id,
      ogImageUrl: uploaded.url,
    });
    if (previousMediaId && previousMediaId !== uploaded.id) {
      void deleteMediaIfOrphaned(previousMediaId);
    }
    setOgUploadProgress(100);
    setOgMediaMessage(t("media.uploaded"));
    window.setTimeout(() => setOgUploadProgress(null), 800);
  }

  async function deleteMediaIfOrphaned(mediaId?: number | null) {
    if (!mediaId) return;
    try {
      await fetch("/api/media/delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: mediaId }),
      });
    } catch {
      // Ignore delete failures; backend save cleanup will retry orphan deletion.
    }
  }

  const stateFingerprint = useMemo(
    () =>
      JSON.stringify({
        localeDrafts,
        categoryIds,
        status,
      }),
    [localeDrafts, categoryIds, status]
  );

  useEffect(() => {
    if (!lastSavedFingerprintRef.current) {
      lastSavedFingerprintRef.current = stateFingerprint;
      setIsDirty(false);
      return;
    }
    setIsDirty(lastSavedFingerprintRef.current !== stateFingerprint);
  }, [stateFingerprint]);

  useEffect(() => {
    setFeaturedFileName(extractFileName(activeDraft.featuredImageUrl));
  }, [activeDraft.featuredImageUrl]);

  useEffect(() => {
    setOgFileName(extractFileName(activeDraft.ogImageUrl));
  }, [activeDraft.ogImageUrl]);

  const buildResolvedSlug = useCallback(() => {
    if (currentExplicitSlug) return currentExplicitSlug;
    if (savedSlug) return savedSlug;
    const fromTitle = normalizePostSlug(activeDraft.title || "");
    if (fromTitle) return resolvedTitleSlug || fromTitle;
    return "";
  }, [activeDraft.title, currentExplicitSlug, resolvedTitleSlug, savedSlug]);

  const draftPayload = useMemo(() => {
    const resolvedSlug = buildResolvedSlug();
    return {
      locale: activeLocale,
      slug: resolvedSlug,
      title: activeDraft.title.trim(),
      excerpt: deriveExcerpt(
        activeDraft.seoDescription,
        activeDraft.contentRich
      ),
      content: activeDraft.contentRich,
      contentRich: activeDraft.contentRich,
      status,
      publishedAt: status === "published" ? new Date().toISOString() : null,
      updatedAt: new Date().toISOString(),
      seoTitle: activeDraft.seoTitle.trim() || undefined,
      seoDescription: activeDraft.seoDescription.trim() || undefined,
      ogImageId: activeDraft.ogImageMediaId ?? undefined,
      ogImageUrl: activeDraft.ogImageUrl.trim() || undefined,
      featuredImage: activeDraft.featuredImageUrl.trim() || undefined,
      featuredImageId: activeDraft.featuredImageMediaId ?? undefined,
      featuredImageUrl: activeDraft.featuredImageUrl.trim() || undefined,
      featuredImageAlt: activeDraft.featuredImageAlt.trim() || undefined,
      featuredImageWidth: SOCIAL_IMAGE_WIDTH,
      featuredImageHeight: SOCIAL_IMAGE_HEIGHT,
      primaryKeyword: activeDraft.primaryKeyword.trim() || undefined,
      tags: parseTags(activeDraft.tagsText),
      faqs: [],
      categoryIds,
      noindex: activeDraft.noindex,
      attachmentMediaIds: [],
      locales: localeOptions
        .map((entry) => ({
          locale: entry,
          slug:
            entry === activeLocale
              ? resolvedSlug
              : normalizePostSlug(localeDrafts[entry]?.slug ?? ""),
        }))
        .filter((entry) => Boolean(entry.slug)),
    };
  }, [
    activeDraft,
    activeLocale,
    buildResolvedSlug,
    categoryIds,
    localeDrafts,
    status,
  ]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    setPreviewBaseUrl(window.location.origin);
  }, []);

  const seoPreview = useMemo(() => {
    try {
      return buildPostMetadata(draftPayload, {
        stringsLanguage: locale,
        locale: activeLocale,
        basePath: "/post",
        baseUrl: previewBaseUrl,
        preferSignedOgImage: true,
      }).seoPreview;
    } catch {
      return {
        title: draftPayload.title || "(untitled)",
        description: draftPayload.excerpt,
        canonical: permalinkUrl,
        robots: { index: false, follow: false },
        ogImage: activeDraft.ogImageUrl || defaultOgImageUrl,
        twitterCard: "summary_large_image",
        titleSource: "title",
        descriptionSource: "excerpt",
        ogImageSource: activeDraft.ogImageUrl ? "ogImage" : "default",
        score: 0,
        scoreNotes: [],
        checks: [],
        wordCount: 0,
        internalLinkCount: 0,
        externalLinkCount: 0,
      };
    }
  }, [
    activeDraft.ogImageUrl,
    activeLocale,
    defaultOgImageUrl,
    draftPayload,
    locale,
    permalinkUrl,
    previewBaseUrl,
  ]);

  const syncEditorUrl = useCallback(
    (nextSlug: string) => {
      if (typeof window === "undefined" || !nextSlug) return;
      const params = new URLSearchParams(window.location.search);
      params.set("slug", nextSlug);
      params.set("locale", activeLocale);
      const nextUrl = `${window.location.pathname}?${params.toString()}`;
      window.history.replaceState({ __editorGuard: true }, "", nextUrl);
    },
    [activeLocale]
  );

  const saveDraft = useCallback(
    async (
      intent: SaveIntent,
      options?: {
        status?: PostStatus;
        silent?: boolean;
      }
    ): Promise<boolean> => {
      if (saveInFlightRef.current && intent === "autosave") return true;
      saveInFlightRef.current = true;

      if (!options?.silent) {
        setSaveMessageTone("neutral");
        setSaveMessage(t("messages.saving"));
      }

      const nextStatus = options?.status ?? status;
      const resolvedSlug = buildResolvedSlug();
      const previousSlug = normalizePostSlug(
        savedLocaleSlugsRef.current[activeLocale] || ""
      );
      const slugChanged = Boolean(
        previousSlug && previousSlug !== resolvedSlug
      );

      if (!resolvedSlug) {
        if (!options?.silent) {
          setSaveMessageTone("warning");
          setSaveMessage(t("messages.slugNotReady"));
        }
        saveInFlightRef.current = false;
        return false;
      }

      const latestSlugStatus = await checkSlugAvailability(resolvedSlug);
      if (latestSlugStatus === "taken" || latestSlugStatus === "invalid") {
        if (!options?.silent) {
          setSaveMessageTone("warning");
          setSaveMessage(
            latestSlugStatus === "taken"
              ? t("fields.slugTaken")
              : t("slugStatus.invalid")
          );
        }
        saveInFlightRef.current = false;
        return false;
      }

      const payload = {
        ...draftPayload,
        slug: resolvedSlug,
        previousSlug: previousSlug || undefined,
        confirmRedirect: intent === "publish" && slugChanged,
        postId: currentPostIdRef.current ?? undefined,
        intent,
        status: nextStatus,
        publishedAt:
          nextStatus === "published"
            ? normalizePublishedAt(new Date().toISOString())
            : null,
        expectedUpdatedAt: serverUpdatedAtRef.current ?? undefined,
        draftRevision: draftRevisionRef.current ?? undefined,
        basePostUpdatedAt: draftBaseUpdatedAtRef.current ?? undefined,
      };

      const requestSeq = ++requestSeqRef.current;
      let response: Response;
      let data: {
        post?: {
          id?: number;
          updatedAt?: string;
          slug?: string;
          status?: string;
        };
        draft?: {
          revision?: number;
          updatedAt?: string;
          baseUpdatedAt?: string;
        };
        error?: string;
      } | null = null;
      try {
        response = await fetch("/api/drafts", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        data = (await response.json().catch(() => null)) as {
          post?: {
            id?: number;
            updatedAt?: string;
            slug?: string;
            status?: string;
          };
          draft?: {
            revision?: number;
            updatedAt?: string;
            baseUpdatedAt?: string;
          };
          error?: string;
        } | null;
      } catch {
        if (!options?.silent) {
          setSaveMessageTone("warning");
          setSaveMessage(t("messages.saveFailed"));
        }
        saveInFlightRef.current = false;
        return false;
      }

      if (!response.ok) {
        if (!options?.silent) {
          setSaveMessageTone("warning");
          setSaveMessage(
            data?.error
              ? t("messages.saveFailedError", { error: data.error })
              : t("messages.saveFailed")
          );
        }
        saveInFlightRef.current = false;
        return false;
      }

      if (requestSeq < latestAppliedSeqRef.current) {
        saveInFlightRef.current = false;
        return true;
      }
      latestAppliedSeqRef.current = requestSeq;

      if (typeof data?.post?.updatedAt === "string") {
        serverUpdatedAtRef.current = data.post.updatedAt;
      }
      if (typeof data?.post?.id === "number") {
        currentPostIdRef.current = data.post.id;
        setCurrentPostId(data.post.id);
      }
      if (typeof data?.post?.slug === "string") {
        const normalizedSavedSlug = normalizePostSlug(data.post.slug);
        savedLocaleSlugsRef.current[activeLocale] = normalizedSavedSlug;
        updateLocaleDraft(activeLocale, {
          slug: normalizedSavedSlug,
        });
        if (intent !== "publish") {
          syncEditorUrl(normalizedSavedSlug);
        }
      }
      if (typeof data?.draft?.revision === "number") {
        draftRevisionRef.current = data.draft.revision;
      }
      if (typeof data?.draft?.updatedAt === "string") {
        serverUpdatedAtRef.current = data.draft.updatedAt;
      }
      if (typeof data?.draft?.baseUpdatedAt === "string") {
        draftBaseUpdatedAtRef.current = data.draft.baseUpdatedAt;
      }

      setStatus(nextStatus);
      setSaveMessageTone("success");
      setSaveMessage(
        nextStatus === "published"
          ? t("messages.published")
          : t("messages.saved")
      );
      lastSavedFingerprintRef.current = stateFingerprint;
      setIsDirty(false);
      saveInFlightRef.current = false;
      return true;
    },
    [
      activeLocale,
      buildResolvedSlug,
      checkSlugAvailability,
      draftPayload,
      stateFingerprint,
      status,
      syncEditorUrl,
      t,
      updateLocaleDraft,
    ]
  );

  const openPublicPreview = useCallback(async () => {
    setActionBusy("preview");
    try {
      const saved = await saveDraft("save", { silent: true });
      const previewPostId = currentPostIdRef.current;
      if (!previewPostId) return;

      const slug = saved
        ? buildResolvedSlug() || savedSlug || ""
        : savedSlug || buildResolvedSlug() || "";
      if (!slug) {
        setSaveMessageTone("warning");
        setSaveMessage(t("messages.slugNotReady"));
        return;
      }

      const tokenResponse = await fetch("/api/admin/posts/preview-token", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          postId: previewPostId,
          locale: activeLocale,
          slug,
        }),
      });
      if (!tokenResponse.ok) {
        setSaveMessageTone("warning");
        setSaveMessage(t("messages.saveFailed"));
        return;
      }
      const tokenData = (await tokenResponse.json().catch(() => null)) as {
        token?: string;
      } | null;
      if (!tokenData?.token || typeof window === "undefined") {
        setSaveMessageTone("warning");
        setSaveMessage(t("messages.saveFailed"));
        return;
      }

      const basePath = resolvePreviewBasePath(
        window.location.pathname,
        activeLocale
      );
      const baseUrl = window.location.origin;
      const previewUrl = new URL(
        `${basePath}/${activeLocale}/${encodeURIComponent(slug)}`,
        baseUrl
      );
      previewUrl.searchParams.set("preview", "1");
      previewUrl.searchParams.set("token", tokenData.token);
      window.open(previewUrl.toString(), "_blank", "noopener,noreferrer");
      setSaveMessageTone("neutral");
      setSaveMessage("");
    } catch {
      setSaveMessageTone("warning");
      setSaveMessage(t("messages.saveFailed"));
    } finally {
      setActionBusy(null);
    }
  }, [activeLocale, buildResolvedSlug, saveDraft, savedSlug, t]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const key = `${EDITOR_DRAFT_STORAGE_KEY}:${initialPost?.id ?? "new"}`;
    const raw = window.sessionStorage.getItem(key);
    if (!raw) return;
    try {
      const parsed = JSON.parse(raw) as {
        localeDrafts?: Record<string, Partial<LocaleDraft>>;
        categoryIds?: number[];
        status?: PostStatus;
      };
      const isNewEditor = !initialPost?.id;
      if (isNewEditor && parsed.status && parsed.status !== "draft") {
        window.sessionStorage.removeItem(key);
        return;
      }
      if (parsed.localeDrafts) {
        setLocaleDrafts((prev) => {
          const next = { ...prev };
          localeOptions.forEach((localeOption) => {
            const savedDraft = parsed.localeDrafts?.[localeOption];
            if (!savedDraft) return;
            next[localeOption] = { ...next[localeOption], ...savedDraft };
          });
          return next;
        });
      }
      if (Array.isArray(parsed.categoryIds)) {
        setCategoryIds(
          parsed.categoryIds
            .map((id) => Number(id))
            .filter(Boolean)
            .slice(0, 1)
        );
      }
      if (
        parsed.status === "draft" ||
        parsed.status === "published" ||
        parsed.status === "archived"
      ) {
        setStatus(parsed.status);
      }
    } catch {
      // Ignore draft restore errors.
    }
  }, [initialPost?.id]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const key = `${EDITOR_DRAFT_STORAGE_KEY}:${initialPost?.id ?? "new"}`;
    const isNewEditor = !initialPost?.id;
    if (isNewEditor && status !== "draft") {
      try {
        window.sessionStorage.removeItem(key);
      } catch {
        // Ignore storage cleanup failures.
      }
      return;
    }
    const payload = {
      localeDrafts,
      categoryIds,
      status,
      updatedAt: Date.now(),
    };
    try {
      window.sessionStorage.setItem(key, JSON.stringify(payload));
    } catch {
      // Ignore draft persistence failures.
    }
  }, [localeDrafts, categoryIds, status, initialPost?.id]);

  const requestLeave = useCallback(
    (next: PendingNavigation) => {
      if (!isDirty) {
        if (next?.type === "route") {
          router.push(next.href);
          return;
        }
        if (next?.type === "back" && typeof window !== "undefined") {
          window.history.back();
        }
        return;
      }
      setPendingNavigation(next);
      setLeaveModalOpen(true);
    },
    [isDirty, router]
  );

  useEffect(() => {
    if (typeof window === "undefined") return;

    const onDocumentClickCapture = (event: MouseEvent) => {
      const target = event.target as Element | null;
      const anchor = target?.closest("a[href]") as HTMLAnchorElement | null;
      if (!anchor) return;
      if (anchor.target === "_blank" || anchor.hasAttribute("download")) return;
      const href = anchor.getAttribute("href");
      if (!href) return;
      if (
        href.startsWith("#") ||
        href.startsWith("mailto:") ||
        href.startsWith("tel:") ||
        href.startsWith("javascript:")
      ) {
        return;
      }

      const currentUrl = new URL(window.location.href);
      const nextUrl = new URL(anchor.href, window.location.href);
      if (nextUrl.href === currentUrl.href) return;

      if (!isDirty) return;
      event.preventDefault();
      event.stopPropagation();
      requestLeave({
        type: "route",
        href: `${nextUrl.pathname}${nextUrl.search}${nextUrl.hash}`,
      });
    };

    const onBeforeUnload = (event: BeforeUnloadEvent) => {
      if (!isDirty || allowLeaveRef.current) return;
      event.preventDefault();
      event.returnValue = "";
    };

    const onPopState = () => {
      if (!isDirty || allowLeaveRef.current) return;
      window.history.pushState(
        { __editorGuard: true },
        "",
        window.location.href
      );
      requestLeave({ type: "back" });
    };

    const onPageHide = () => {
      if (!isDirty || allowLeaveRef.current) return;
      clearStoredEditorDraft();
    };

    window.history.pushState({ __editorGuard: true }, "", window.location.href);
    document.addEventListener("click", onDocumentClickCapture, true);
    window.addEventListener("beforeunload", onBeforeUnload);
    window.addEventListener("popstate", onPopState);
    window.addEventListener("pagehide", onPageHide);

    return () => {
      document.removeEventListener("click", onDocumentClickCapture, true);
      window.removeEventListener("beforeunload", onBeforeUnload);
      window.removeEventListener("popstate", onPopState);
      window.removeEventListener("pagehide", onPageHide);
    };
  }, [clearStoredEditorDraft, isDirty, requestLeave]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "s") {
        event.preventDefault();
        void saveDraft("save");
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [saveDraft]);

  async function publishPost() {
    setActionBusy("publish");
    const ok = await saveDraft("publish", {
      status: "published",
    });
    if (!ok) {
      setActionBusy(null);
      return;
    }
    clearStoredEditorDraft();
    allowLeaveRef.current = true;
    if (typeof window !== "undefined") {
      window.location.assign("/admin/posts");
      return;
    }
    router.push("/admin/posts");
  }

  function leaveNow() {
    const next = pendingNavigation;
    setLeaveModalOpen(false);
    setPendingNavigation(null);
    clearStoredEditorDraft();
    allowLeaveRef.current = true;

    if (next?.type === "route") {
      router.push(next.href);
      return;
    }
    if (next?.type === "back" && typeof window !== "undefined") {
      window.history.back();
      return;
    }
    router.push("/admin/posts");
  }

  return (
    <main className={`${adminUi.page} mx-auto w-full  overflow-x-hidden`}>
      <LoadingOverlay
        show={actionBusy !== null}
        label={
          actionBusy === "preview"
            ? t("actions.preview")
            : actionBusy === "publish"
            ? t("actions.publish")
            : actionBusy === "save"
            ? t("actions.saveDraft")
            : "Loading"
        }
      />
      <div className="flex flex-wrap items-center gap-3 text-sm">
        <button
          type="button"
          onClick={() => requestLeave({ type: "route", href: "/admin/posts" })}
          className={`${adminUi.link} bg-transparent p-0`}
        >
          {t("nav.back")}
        </button>
        <button
          type="button"
          onClick={() => void openPublicPreview()}
          className={`${adminUi.link} bg-transparent p-0`}
        >
          {t("nav.preview")}
        </button>
      </div>

      <div>
        <h1 className={adminUi.title}>{t("title")}</h1>
        <p className={adminUi.subtitle}>{t("subtitle")}</p>
      </div>

      <div className="grid min-w-0 gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(320px,360px)] lg:items-start">
        <div className="grid min-w-0 gap-4">
          <section className={`${adminUi.card} ${adminUi.cardBody} space-y-4`}>
            <h2 className={adminUi.sectionTitle}>{t("fields.title")}</h2>

            <label className="grid gap-2 text-sm font-semibold text-slate-700">
              <span>{t("fields.titleLabel")}</span>
              <input
                value={activeDraft.title}
                onChange={(event) =>
                  updateLocaleDraft(activeLocale, { title: event.target.value })
                }
                placeholder={t("fields.titlePlaceholder")}
                className={adminUi.input}
              />
            </label>
            <div className="grid min-w-0 gap-2 text-sm font-semibold text-slate-700">
              <span>{t("permalink.label")}</span>
              <div className="flex flex-wrap items-center gap-2 text-sm font-medium text-slate-600">
                <span className="min-w-0 break-all">{permalinkUrl}</span>
                {!isSlugEditing ? (
                  <button
                    type="button"
                    onClick={handleStartSlugEdit}
                    className="inline-flex items-center rounded-md border border-slate-300 px-2 py-1 text-xs font-semibold text-slate-700 transition hover:border-slate-400 hover:bg-slate-50"
                  >
                    {t("permalink.edit")}
                  </button>
                ) : (
                  <>
                    <button
                      type="button"
                      onClick={handleFinishSlugEdit}
                      className="inline-flex items-center rounded-md border border-slate-300 px-2 py-1 text-xs font-semibold text-slate-700 transition hover:border-slate-400 hover:bg-slate-50"
                    >
                      {t("permalink.done")}
                    </button>
                    <button
                      type="button"
                      onClick={handleCancelSlugEdit}
                      className="inline-flex items-center rounded-md border border-transparent px-2 py-1 text-xs font-semibold text-slate-500 transition hover:bg-slate-100 hover:text-slate-700"
                    >
                      {t("permalink.cancel")}
                    </button>
                  </>
                )}
              </div>
              {isSlugEditing ? (
                <label className="grid min-w-0 gap-1 text-sm font-semibold text-slate-700">
                  <span>{t("fields.slug")}</span>
                  <input
                    ref={slugInputRef}
                    value={activeDraft.slug}
                    onChange={(event) =>
                      updateLocaleDraft(activeLocale, {
                        slug: limitSlugLength(event.target.value),
                      })
                    }
                    placeholder={t("fields.slugPlaceholder")}
                    className={adminUi.input}
                  />
                </label>
              ) : null}
              {shouldShowSlugStatus && slugStatus !== "idle" ? (
                <div
                  className={
                    slugStatus === "available"
                      ? "text-xs text-emerald-700"
                      : slugStatus === "checking"
                      ? "text-xs text-slate-500"
                      : "text-xs text-rose-600"
                  }
                >
                  {t(`slugStatus.${slugStatus}`)}
                </div>
              ) : null}
            </div>

            <RichTextArea
              label={t("content.title")}
              name="contentRich"
              defaultValue={activeDraft.contentRich}
              onChange={(value) => {
                updateLocaleDraft(activeLocale, { contentRich: value });
              }}
              placeholder={t("content.placeholder")}
              isLabelBold
            />

            <label className="grid gap-2 text-sm font-semibold text-slate-700">
              <FieldLabelWithHelp
                label={t("fields.primaryKeyword")}
                helperText={t("fields.primaryKeywordHelp")}
              />
              <input
                value={activeDraft.primaryKeyword}
                onChange={(event) =>
                  updateLocaleDraft(activeLocale, {
                    primaryKeyword: event.target.value,
                  })
                }
                placeholder={t("fields.primaryKeywordPlaceholder")}
                className={adminUi.input}
              />
            </label>

            <label className="grid gap-2 text-sm font-semibold text-slate-700">
              <span className="flex items-center gap-2">
                {t("fields.category")}
                <button
                  type="button"
                  onClick={() => {
                    setCategorySaveMessage("");
                    setShowCategoryModal(true);
                  }}
                  className="inline-flex h-7 w-7 items-center justify-center rounded-full border border-slate-200 bg-white text-sm text-slate-700 hover:bg-slate-50"
                  aria-label={t("fields.addCategory")}
                >
                  +
                </button>
              </span>
              <div className="grid gap-2 rounded-2xl border border-slate-200 bg-white p-3">
                {categories.map((category) => {
                  const checked = categoryIds[0] === category.id;
                  return (
                    <label
                      key={category.id}
                      className="flex items-center gap-2 text-xs text-slate-700"
                    >
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={(event) => {
                          const nextChecked = event.target.checked;
                          setCategoryIds(nextChecked ? [category.id] : []);
                        }}
                        className="h-4 w-4 rounded border-slate-300 text-slate-900 focus:ring-slate-300"
                      />
                      <span>{category.name}</span>
                    </label>
                  );
                })}
              </div>
              {categories.length === 0 ? (
                <span className="text-xs text-slate-500">
                  {t("fields.categoryEmpty")}
                </span>
              ) : null}
            </label>
          </section>

          <section className="grid gap-4">
            <div className={`${adminUi.card} ${adminUi.cardBody} space-y-4`}>
              <h2 className={adminUi.sectionTitle}>{t("seoFields.title")}</h2>
              <label className="grid gap-2 text-sm font-semibold text-slate-700">
                <FieldLabelWithHelp
                  label={t("seoFields.seoTitle")}
                  helperText={t("seoFields.seoTitleHelp")}
                />
                <input
                  value={activeDraft.seoTitle}
                  onChange={(event) =>
                    updateLocaleDraft(activeLocale, {
                      seoTitle: event.target.value,
                    })
                  }
                  placeholder={t("seoFields.seoTitlePlaceholder")}
                  className={adminUi.input}
                />
              </label>
              <label className="grid gap-2 text-sm font-semibold text-slate-700">
                <FieldLabelWithHelp
                  label={t("seoFields.seoDescription")}
                  helperText={t("seoFields.seoDescriptionHelp")}
                />
                <textarea
                  value={activeDraft.seoDescription}
                  onChange={(event) =>
                    updateLocaleDraft(activeLocale, {
                      seoDescription: event.target.value,
                    })
                  }
                  placeholder={t("seoFields.seoDescriptionPlaceholder")}
                  className={`${adminUi.textarea} min-h-[96px]`}
                />
              </label>

              <label className="grid gap-2 text-sm font-semibold text-slate-700">
                {t("seoFields.importImage")}
                <div className="flex items-center gap-3 rounded-xl border border-slate-200 p-3">
                  <label className="relative inline-flex cursor-pointer items-center rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800">
                    {t("media.chooseFile")}
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(event) => {
                        const file = event.target.files?.[0];
                        if (!file) return;
                        void uploadFeaturedImage(file);
                      }}
                      className="absolute inset-0 cursor-pointer opacity-0"
                    />
                  </label>
                </div>
                {activeDraft.featuredImageUrl ? (
                  <div className="relative h-16 w-16 overflow-hidden rounded-lg border border-slate-200">
                    <Image
                      src={activeDraft.featuredImageUrl}
                      alt={
                        activeDraft.featuredImageAlt ||
                        t("seoFields.previewAlt")
                      }
                      fill
                      unoptimized
                      className="object-cover"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        void deleteMediaIfOrphaned(
                          activeDraft.featuredImageMediaId
                        );
                        updateLocaleDraft(activeLocale, {
                          featuredImageMediaId: null,
                          featuredImageUrl: "",
                          featuredImageAlt: "",
                        });
                        setFeaturedFileName("");
                      }}
                      aria-label={t("seoFields.removeAttachment")}
                      title={t("seoFields.removeAttachment")}
                      className="absolute right-1 top-1 inline-flex h-5 w-5 items-center justify-center rounded-full border border-rose-200 bg-white text-xs font-bold leading-none text-rose-700 hover:bg-rose-50"
                    >
                      ×
                    </button>
                  </div>
                ) : null}
                {featuredFileName ? (
                  <div className="text-xs font-normal text-slate-500">
                    {featuredFileName}
                  </div>
                ) : null}
              </label>
              {featuredUploadProgress !== null ? (
                <div className="space-y-1">
                  <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
                    <div
                      className="h-full rounded-full bg-slate-900 transition-all"
                      style={{ width: `${featuredUploadProgress}%` }}
                    />
                  </div>
                  <div className="text-xs text-slate-500">
                    {featuredUploadProgress}%
                  </div>
                </div>
              ) : null}
              {featuredMediaMessage ? (
                <div className="text-xs text-slate-500">
                  {featuredMediaMessage}
                </div>
              ) : null}

              <label className="grid gap-2 text-sm font-semibold text-slate-700">
                <FieldLabelWithHelp
                  label={t("seoFields.featuredAlt")}
                  helperText={t("seoFields.featuredAltHelp")}
                />
                <input
                  value={activeDraft.featuredImageAlt}
                  onChange={(event) =>
                    updateLocaleDraft(activeLocale, {
                      featuredImageAlt: event.target.value,
                    })
                  }
                  placeholder={t("seoFields.featuredAltPlaceholder")}
                  className={adminUi.input}
                />
              </label>

              <label className="grid gap-2 text-sm font-semibold text-slate-700">
                {t("seoFields.ogUpload")}
                <div className="flex items-center gap-3 rounded-xl border border-slate-200 p-3">
                  <label className="relative inline-flex cursor-pointer items-center rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800">
                    {t("media.chooseFile")}
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(event) => {
                        const file = event.target.files?.[0];
                        if (!file) return;
                        void uploadOgImage(file);
                      }}
                      className="absolute inset-0 cursor-pointer opacity-0"
                    />
                  </label>
                </div>
                {activeDraft.ogImageUrl ? (
                  <div className="relative h-16 w-16 overflow-hidden rounded-lg border border-slate-200">
                    <Image
                      src={activeDraft.ogImageUrl}
                      alt={t("seoFields.ogImage")}
                      fill
                      unoptimized
                      className="object-cover"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        void deleteMediaIfOrphaned(activeDraft.ogImageMediaId);
                        updateLocaleDraft(activeLocale, {
                          ogImageMediaId: null,
                          ogImageUrl: "",
                        });
                        setOgFileName("");
                      }}
                      aria-label={t("seoFields.removeAttachment")}
                      title={t("seoFields.removeAttachment")}
                      className="absolute right-1 top-1 inline-flex h-5 w-5 items-center justify-center rounded-full border border-rose-200 bg-white text-xs font-bold leading-none text-rose-700 hover:bg-rose-50"
                    >
                      ×
                    </button>
                  </div>
                ) : null}
                {ogFileName ? (
                  <div className="text-xs font-normal text-slate-500">
                    {ogFileName}
                  </div>
                ) : null}
              </label>
              {ogUploadProgress !== null ? (
                <div className="space-y-1">
                  <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
                    <div
                      className="h-full rounded-full bg-slate-900 transition-all"
                      style={{ width: `${ogUploadProgress}%` }}
                    />
                  </div>
                  <div className="text-xs text-slate-500">
                    {ogUploadProgress}%
                  </div>
                </div>
              ) : null}
              {ogMediaMessage ? (
                <div className="text-xs text-slate-500">{ogMediaMessage}</div>
              ) : null}
            </div>

            <div className={`${adminUi.card} ${adminUi.cardBody} space-y-4`}>
              <h2 className={adminUi.sectionTitle}>{t("seoPreview.title")}</h2>
              <div className="rounded-2xl border border-slate-200 bg-white p-4">
                <div className="text-xs uppercase text-slate-400">
                  {t("seoPreview.titleLabel")}
                </div>
                <div className="text-base font-semibold text-slate-900">
                  {seoPreview.title}
                </div>
                <div className="mt-2 text-xs uppercase text-slate-400">
                  {t("seoPreview.descriptionLabel")}
                </div>
                <div className="mt-2 text-sm text-slate-700">
                  {seoPreview.description}
                </div>
                {activeDraft.ogImageUrl || defaultOgImageUrl ? (
                  <div className="mt-3">
                    <div className="text-xs uppercase text-slate-400">
                      {t("seoPreview.imageLabel")}
                    </div>
                    <Image
                      src={activeDraft.ogImageUrl || defaultOgImageUrl}
                      alt={seoPreview.title}
                      width={1200}
                      height={630}
                      unoptimized
                      className="mt-2 h-auto w-full rounded-xl border border-slate-200"
                    />
                  </div>
                ) : null}
              </div>
            </div>
          </section>
        </div>

        <aside
          className={`${adminUi.card} ${adminUi.cardBody} min-w-0 lg:sticky lg:top-6`}
        >
          <div className="space-y-3">
            <h2 className={adminUi.sectionTitle}>{t("actions.title")}</h2>
            <div className="grid gap-3">
              <button
                type="button"
                onClick={() => void openPublicPreview()}
                disabled={actionBusy !== null}
                className={[
                  "inline-flex items-center justify-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-300",
                  actionBusy ? "cursor-not-allowed opacity-70" : "",
                ].join(" ")}
              >
                {actionBusy === "preview" ? (
                  <Spinner size={16} label={t("actions.preview")} />
                ) : null}
                <span>{t("actions.preview")}</span>
              </button>
              <button
                type="button"
                disabled={actionBusy !== null}
                onClick={async () => {
                  setActionBusy("save");
                  try {
                    await saveDraft("save");
                  } finally {
                    setActionBusy(null);
                  }
                }}
                className={[
                  "inline-flex items-center justify-center gap-2 rounded-lg border border-amber-300 bg-amber-50 px-4 py-2 text-sm font-semibold text-amber-800 shadow-sm transition hover:bg-amber-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-300",
                  actionBusy ? "cursor-not-allowed opacity-70" : "",
                ].join(" ")}
              >
                {actionBusy === "save" ? (
                  <Spinner size={16} label={t("actions.saveDraft")} />
                ) : null}
                <span>{t("actions.saveDraft")}</span>
              </button>
              <button
                type="button"
                onClick={publishPost}
                disabled={actionBusy !== null}
                className={[
                  adminUi.buttonPrimary,
                  actionBusy ? "cursor-not-allowed opacity-70" : "",
                ].join(" ")}
              >
                {actionBusy === "publish" ? (
                  <Spinner size={16} label={t("actions.publish")} />
                ) : null}
                <span>{t("actions.publish")}</span>
              </button>
            </div>
            {saveMessage ? (
              <div
                className={
                  saveMessageTone === "warning"
                    ? "text-base font-bold text-rose-700"
                    : saveMessageTone === "success"
                    ? "text-sm font-semibold text-emerald-700"
                    : "text-xs text-slate-500"
                }
              >
                {saveMessage}
              </div>
            ) : null}
            <div className="text-xs text-slate-500">
              {isDirty
                ? t("messages.unsavedChanges")
                : t("messages.allChangesSaved")}
            </div>
          </div>

        </aside>
      </div>

      {showCategoryModal ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-5 shadow-[0_20px_60px_rgba(0,0,0,0.2)]">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-semibold text-slate-900">
                {t("categoryModal.title")}
              </h3>
              <button
                type="button"
                onClick={() => setShowCategoryModal(false)}
                className="rounded-full border border-slate-200 px-3 py-1 text-xs text-slate-600 hover:bg-slate-50"
              >
                {t("categoryModal.close")}
              </button>
            </div>
            <div className="mt-4 grid gap-3">
              <label className="grid gap-1 text-xs font-semibold text-slate-600">
                {t("categoryModal.name")}
                <input
                  value={newCategoryName}
                  onChange={(event) => setNewCategoryName(event.target.value)}
                  className={adminUi.input}
                />
              </label>
              <label className="grid gap-1 text-xs font-semibold text-slate-600">
                {t("categoryModal.slugOptional")}
                <input
                  value={newCategorySlug}
                  onChange={(event) => setNewCategorySlug(event.target.value)}
                  className={adminUi.input}
                />
              </label>
              <label className="grid gap-1 text-xs font-semibold text-slate-600">
                {t("categoryModal.introOptional")}
                <textarea
                  value={newCategoryIntro}
                  onChange={(event) => setNewCategoryIntro(event.target.value)}
                  className={`${adminUi.textarea} min-h-[72px]`}
                />
              </label>
              {categorySaveMessage ? (
                <div className="text-xs text-rose-600">
                  {categorySaveMessage}
                </div>
              ) : null}
            </div>
            <div className="mt-4 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowCategoryModal(false)}
                className="rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
              >
                {t("categoryModal.cancel")}
              </button>
              <button
                type="button"
                onClick={handleCreateCategory}
                className="rounded-full bg-slate-900 px-4 py-2 text-xs font-semibold text-white hover:bg-slate-800"
              >
                {t("categoryModal.create")}
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {leaveModalOpen ? (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/45 px-4">
          <div className="w-full max-w-sm rounded-2xl bg-white p-5 shadow-[0_20px_60px_rgba(0,0,0,0.25)]">
            <h3 className="text-base font-semibold text-slate-900">
              {t("leaveModal.title")}
            </h3>
            <p className="mt-2 text-sm text-slate-600">
              {t("leaveModal.body")}
            </p>
            <div className="mt-5 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => {
                  setLeaveModalOpen(false);
                  setPendingNavigation(null);
                }}
                className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
              >
                {t("leaveModal.stay")}
              </button>
              <button
                type="button"
                onClick={leaveNow}
                className="rounded-lg bg-rose-600 px-4 py-2 text-sm font-semibold text-white hover:bg-rose-700"
              >
                {t("leaveModal.leave")}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </main>
  );
}
