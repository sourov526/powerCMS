"use client";

import { adminUi } from "@/app/admin/core/admin-ui";
import { RichTextArea } from "@/components/RichText";
import LoadingOverlay from "@/components/atoms/LoadingOverlay";
import Spinner from "@/components/atoms/Spinner";
import type {
  RecruitPost,
  RecruitPostFields,
  RecruitPostStatus,
  RecruitPostType,
} from "@/lib/services/recruit-posts";
import { normalizeSlug } from "@/lib/utils/slug";
import { Link, useRouter } from "@/navigation";
import { useLocale, useTranslations } from "@/utils/strings/client";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

const recruitFieldKeys: Array<keyof RecruitPostFields> = [
  "positionAvailable",
  "jobDescription",
  "requirements",
  "location",
  "workingHours",
  "employmentType",
  "salary",
  "benefits",
  "holidays",
];

type SlugStatus = "idle" | "checking" | "available" | "taken" | "invalid";

type SaveRecruitResponse = {
  recruitPost?: RecruitPost;
  error?: string;
};

export default function RecruitEditorForm({
  initialRecruit,
}: {
  initialRecruit?: RecruitPost | null;
}) {
  const t = useTranslations("Admin.editor");
  const locale = useLocale();
  const router = useRouter();

  const initialFields = useMemo<RecruitPostFields>(() => {
    return { ...(initialRecruit?.fields ?? {}) };
  }, [initialRecruit?.fields]);

  const [currentRecruitId, setCurrentRecruitId] = useState<number | null>(
    initialRecruit?.id ?? null
  );
  const [savedSlug, setSavedSlug] = useState(() => initialRecruit?.slug ?? "");
  const [slug, setSlug] = useState(() => initialRecruit?.slug ?? "");
  const [slugStatus, setSlugStatus] = useState<SlugStatus>("idle");
  const [isSlugEditing, setIsSlugEditing] = useState(false);
  const [hasCustomSlug, setHasCustomSlug] = useState(
    Boolean(initialRecruit?.slug)
  );
  const [title, setTitle] = useState(() => initialRecruit?.title ?? "");
  const [department, setDepartment] = useState(
    () => initialRecruit?.department ?? ""
  );
  const [jobSummary, setJobSummary] = useState(
    () => initialRecruit?.jobSummary ?? ""
  );
  const [applicationDeadLine, setApplicationDeadLine] = useState(
    () => initialRecruit?.applicationDeadLine ?? ""
  );
  const [recruitType, setRecruitType] = useState<RecruitPostType>(
    initialRecruit?.recruitType ?? "job"
  );
  const [fields, setFields] = useState<RecruitPostFields>(initialFields);
  const [saveMessage, setSaveMessage] = useState("");
  const [actionBusy, setActionBusy] = useState<null | "save" | "publish">(null);
  const [externalLinkError, setExternalLinkError] = useState("");
  const [requiredErrors, setRequiredErrors] = useState<
    Partial<Record<keyof RecruitPostFields, string>>
  >({});
  const [titleError, setTitleError] = useState("");
  const [slugError, setSlugError] = useState("");
  const [departmentError, setDepartmentError] = useState("");
  const [jobSummaryError, setJobSummaryError] = useState("");
  const applicationDeadLineRef = useRef<HTMLInputElement | null>(null);
  const slugInputRef = useRef<HTMLInputElement | null>(null);
  const slugAvailabilityRequestRef = useRef(0);

  const fieldKeys = useMemo(() => recruitFieldKeys, []);
  const departmentOptions = useMemo(
    () =>
      t.raw("recruit.departmentOptions") as { label: string; value: string }[],
    [t]
  );
  const generatedSlugFromTitle = useMemo(
    () => normalizeSlug(title || ""),
    [title]
  );
  const permalinkSlug = slug || generatedSlugFromTitle || t("defaults.slug");
  const permalinkPath = `/${locale}/recruit/job/${permalinkSlug}`;
  const shouldShowSlugStatus = isSlugEditing || !currentRecruitId;

  const updateField = useCallback(
    (key: keyof RecruitPostFields, value: string) => {
      setFields((prev) => ({ ...prev, [key]: value }));
      setRequiredErrors((prev) => {
        if (!prev[key]) return prev;
        const normalized = value.replace(/<[^>]*>/g, "").trim();
        if (!normalized) return prev;
        const next = { ...prev };
        delete next[key];
        return next;
      });
      if (key === "externalLink" && externalLinkError) {
        setExternalLinkError("");
      }
    },
    [externalLinkError]
  );

  useEffect(() => {
    if (currentRecruitId || isSlugEditing || hasCustomSlug) return;
    if (generatedSlugFromTitle === slug) return;
    setSlug(generatedSlugFromTitle);
    if (generatedSlugFromTitle && slugError) {
      setSlugError("");
    }
  }, [
    currentRecruitId,
    generatedSlugFromTitle,
    hasCustomSlug,
    isSlugEditing,
    slug,
    slugError,
  ]);

  const checkSlugAvailability = useCallback(
    async (slugToCheck: string) => {
      const normalized = normalizeSlug(slugToCheck || "");
      const requestId = slugAvailabilityRequestRef.current + 1;
      slugAvailabilityRequestRef.current = requestId;

      if (!normalized) {
        const nextStatus: SlugStatus = slugToCheck ? "invalid" : "idle";
        setSlugStatus(nextStatus);
        return nextStatus;
      }

      setSlugStatus("checking");
      try {
        const params = new URLSearchParams({
          slug: normalized,
          mode: "recruit",
        });
        if (currentRecruitId) {
          params.set("postId", String(currentRecruitId));
        }
        const response = await fetch(
          `/api/admin/slug-availability?${params.toString()}`
        );
        if (!response.ok) throw new Error("Failed");
        const data = (await response.json()) as { available?: boolean };
        const nextStatus: SlugStatus = data.available ? "available" : "taken";
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
    [currentRecruitId]
  );

  useEffect(() => {
    const handle = window.setTimeout(() => {
      void checkSlugAvailability(slug);
    }, 400);
    return () => window.clearTimeout(handle);
  }, [checkSlugAvailability, slug]);

  useEffect(() => {
    if (!isSlugEditing) return;
    slugInputRef.current?.focus();
    slugInputRef.current?.select();
  }, [isSlugEditing]);

  function handleStartSlugEdit() {
    setIsSlugEditing(true);
  }

  function handleFinishSlugEdit() {
    setIsSlugEditing(false);
  }

  function handleCancelSlugEdit() {
    if (currentRecruitId) {
      setSlug(savedSlug);
      setHasCustomSlug(true);
    } else {
      setSlug(generatedSlugFromTitle);
      setHasCustomSlug(false);
    }
    setSlugError("");
    setIsSlugEditing(false);
  }

  async function saveDraft(nextStatus?: RecruitPostStatus) {
    setExternalLinkError("");
    setRequiredErrors({});
    setTitleError("");
    setSlugError("");
    setDepartmentError("");
    setJobSummaryError("");
    setSaveMessage(t("messages.saving"));
    const normalizedSlug = normalizeSlug(slug || "");
    let hasError = false;
    if (!title.trim()) {
      setTitleError(t("recruit.validation.required"));
      hasError = true;
    }
    if (!normalizedSlug) {
      setSlugError(t("recruit.validation.required"));
      hasError = true;
    }
    const effectiveStatus = nextStatus ?? "draft";
    const externalLinkValue = (fields.externalLink ?? "").trim();
    if (recruitType === "recruit") {
      if (!externalLinkValue) {
        setExternalLinkError(t("recruit.validation.required"));
        hasError = true;
      }
      if (
        !externalLinkValue.startsWith("http:") &&
        !externalLinkValue.startsWith("https:")
      ) {
        setExternalLinkError(t("recruit.external.invalid"));
        hasError = true;
      }
    }
    if (recruitType === "job") {
      if (!department.trim()) {
        setDepartmentError(t("recruit.validation.required"));
        hasError = true;
      }
      if (!jobSummary.trim()) {
        setJobSummaryError(t("recruit.validation.required"));
        hasError = true;
      }
      const nextErrors: Partial<Record<keyof RecruitPostFields, string>> = {};
      fieldKeys.forEach((fieldKey) => {
        const value = String(fields[fieldKey] ?? "")
          .replace(/<[^>]*>/g, "")
          .trim();
        if (!value) {
          nextErrors[fieldKey] = t("recruit.validation.required");
        }
      });
      if (Object.keys(nextErrors).length > 0) {
        setRequiredErrors(nextErrors);
        hasError = true;
      }
    }
    if (!hasError && normalizedSlug) {
      const latestSlugStatus = await checkSlugAvailability(normalizedSlug);
      if (latestSlugStatus === "taken") {
        setSlugError(t("fields.slugTaken"));
        hasError = true;
      }
      if (latestSlugStatus === "invalid") {
        setSlugError(t("slugStatus.invalid"));
        hasError = true;
      }
    }
    if (hasError) {
      setSaveMessage("");
      return false;
    }

    const payload = {
      mode: "recruit",
      postId: currentRecruitId,
      slug: normalizedSlug,
      previousSlug: savedSlug || undefined,
      title: title.trim() || "Untitled recruit post",
      department: department.trim() || undefined,
      jobSummary: jobSummary.trim() || undefined,
      applicationDeadLine: applicationDeadLine.trim() || undefined,
      recruitType,
      status: effectiveStatus,
      recruitFields:
        recruitType === "recruit"
          ? { externalLink: externalLinkValue }
          : { ...fields, externalLink: null },
    };

    const response = await fetch("/api/drafts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const data = (await response
      .json()
      .catch(() => null)) as SaveRecruitResponse | null;

    if (!response.ok) {
      let message = t("messages.saveFailed");
      if (data?.error) {
        message = t("messages.saveFailedError", { error: data.error });
      }
      setSaveMessage(message);
      return false;
    }

    if (!data?.recruitPost) {
      setSaveMessage(t("messages.saveFailed"));
      return false;
    }

    const savedRecruit = data.recruitPost;
    setCurrentRecruitId(savedRecruit.id);
    setSavedSlug(savedRecruit.slug);
    setSlug(savedRecruit.slug);
    setHasCustomSlug(true);
    setIsSlugEditing(false);

    setSaveMessage(
      effectiveStatus === "published"
        ? t("messages.published")
        : t("messages.saved")
    );

    if (effectiveStatus !== "published") {
      router.replace(
        `/admin/editor/recruit?slug=${encodeURIComponent(savedRecruit.slug)}`
      );
    }

    return true;
  }

  async function publishPost() {
    setActionBusy("publish");
    const ok = await saveDraft("published");
    if (!ok) {
      setActionBusy(null);
      return;
    }
    router.push("/admin/recruit");
  }

  return (
    <main className={`${adminUi.page} mx-auto w-full `}>
      <LoadingOverlay
        show={actionBusy !== null}
        label={
          actionBusy === "publish"
            ? t("actions.publish")
            : actionBusy === "save"
            ? t("actions.saveDraft")
            : "Loading"
        }
      />
      <div className="flex flex-wrap items-center gap-3 text-sm">
        <Link href="/admin/recruit" className={adminUi.link}>
          {t("nav.back")}
        </Link>
      </div>
      <div>
        <h1 className={adminUi.title}>{t("recruit.recruitTitle")}</h1>
      </div>

      <div className="grid min-w-0 gap-4 lg:grid-cols-[minmax(0,1fr)_320px] lg:items-start">
        <div className="grid min-w-0 gap-4 lg:max-h-[calc(100vh-140px)] lg:overflow-y-auto lg:pr-2">
          <section className={`${adminUi.card} ${adminUi.cardBody} space-y-4`}>
            <h2 className={adminUi.sectionTitle}>{t("fields.title")}</h2>
            <label className="grid gap-1 text-sm font-semibold text-slate-700">
              <span>
                {t("fields.titleLabel")}
                <span className="ml-1 text-rose-600">*</span>
              </span>
              <input
                value={title}
                onChange={(event) => {
                  setTitle(event.target.value);
                  if (titleError) {
                    setTitleError("");
                  }
                }}
                className={adminUi.input}
              />
              {titleError ? (
                <span className="text-xs text-rose-600">{titleError}</span>
              ) : null}
            </label>
            <div className="grid min-w-0 gap-2 text-sm font-semibold text-slate-700">
              <span>{t("recruit.permalink.label")}</span>
              <div className="flex flex-wrap items-center gap-2 text-sm font-medium text-slate-600">
                <span className="min-w-0 break-all">{permalinkPath}</span>
                {!isSlugEditing ? (
                  <button
                    type="button"
                    onClick={handleStartSlugEdit}
                    className="inline-flex items-center rounded-md border border-slate-300 px-2 py-1 text-xs font-semibold text-slate-700 transition hover:border-slate-400 hover:bg-slate-50"
                  >
                    {t("recruit.permalink.edit")}
                  </button>
                ) : (
                  <>
                    <button
                      type="button"
                      onClick={handleFinishSlugEdit}
                      className="inline-flex items-center rounded-md border border-slate-300 px-2 py-1 text-xs font-semibold text-slate-700 transition hover:border-slate-400 hover:bg-slate-50"
                    >
                      {t("recruit.permalink.done")}
                    </button>
                    <button
                      type="button"
                      onClick={handleCancelSlugEdit}
                      className="inline-flex items-center rounded-md border border-transparent px-2 py-1 text-xs font-semibold text-slate-500 transition hover:bg-slate-100 hover:text-slate-700"
                    >
                      {t("recruit.permalink.cancel")}
                    </button>
                  </>
                )}
              </div>
              {isSlugEditing ? (
                <label className="grid min-w-0 gap-1 text-sm font-semibold text-slate-700">
                  <span>{t("fields.slug")}</span>
                  <input
                    ref={slugInputRef}
                    value={slug}
                    onChange={(event) => {
                      setHasCustomSlug(true);
                      setSlug(normalizeSlug(event.target.value));
                      if (slugError) {
                        setSlugError("");
                      }
                    }}
                    placeholder={t("fields.slugPlaceholder")}
                    className={`${adminUi.input} w-full`}
                  />
                </label>
              ) : null}
              {slugError ? (
                <span className="text-xs text-rose-600">{slugError}</span>
              ) : null}
              {shouldShowSlugStatus && slugStatus !== "idle" && !slugError ? (
                <span
                  className={
                    slugStatus === "available"
                      ? "text-xs text-emerald-700"
                      : slugStatus === "checking"
                      ? "text-xs text-slate-500"
                      : "text-xs text-rose-600"
                  }
                >
                  {t(`slugStatus.${slugStatus}`)}
                </span>
              ) : null}
            </div>
            <label className="grid gap-2 text-sm font-semibold text-slate-700">
              {t("recruit.type.label")}
              <div className="flex items-center gap-4 text-sm text-slate-700">
                {(["job", "recruit"] as RecruitPostType[]).map((option) => (
                  <label key={option} className="flex items-center gap-2">
                    <input
                      type="radio"
                      name="recruitType"
                      value={option}
                      checked={recruitType === option}
                      onChange={() => setRecruitType(option)}
                      className="h-4 w-4 rounded border-slate-300 text-slate-900 focus:ring-slate-300"
                    />
                    {t(`recruit.type.${option}`)}
                  </label>
                ))}
              </div>
            </label>
          </section>

          {recruitType === "recruit" ? (
            <section
              className={`${adminUi.card} ${adminUi.cardBody} space-y-4`}
            >
              <h2 className={adminUi.sectionTitle}>
                {t("recruit.external.title")}
              </h2>
              <label className="grid gap-2 text-sm font-semibold text-slate-700">
                <span>
                  {t("recruit.external.linkLabel")}
                  <span className="ml-1 text-rose-600">*</span>
                </span>
                <input
                  value={fields.externalLink ?? ""}
                  onChange={(event) =>
                    updateField("externalLink", event.target.value)
                  }
                  placeholder={t("recruit.external.placeholder")}
                  className={adminUi.input}
                />
                {externalLinkError && (
                  <span className="text-xs text-rose-600">
                    {externalLinkError}
                  </span>
                )}
              </label>
            </section>
          ) : (
            <section
              className={`${adminUi.card} ${adminUi.cardBody} space-y-4`}
            >
              <h2 className={adminUi.sectionTitle}>
                {t("recruit.sectionTitle")}
              </h2>
              <div className="grid gap-4">
                <label className="grid gap-1">
                  <span className="text-[16px] font-bold text-[#1B1B1B]">
                    {t("recruit.fields.department")}
                    <span className="ml-1 text-rose-600">*</span>
                  </span>
                  <select
                    value={department}
                    onChange={(event) => {
                      setDepartment(event.target.value);
                      if (departmentError) {
                        setDepartmentError("");
                      }
                    }}
                    className={`${adminUi.select} pr-10 appearance-none bg-no-repeat`}
                    style={{
                      backgroundImage:
                        "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 20 20' fill='none' stroke='%2394a3b8' stroke-width='2'%3E%3Cpath d='M6 8l4 4 4-4'/%3E%3C/svg%3E\")",
                      backgroundPosition: "right 8px center",
                      backgroundSize: "24px",
                    }}
                  >
                    <option value="">
                      {t("recruit.departmentPlaceholder")}
                    </option>
                    {departmentOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                  {departmentError ? (
                    <span className="text-xs text-rose-600">
                      {departmentError}
                    </span>
                  ) : null}
                </label>
                <label className="grid gap-1">
                  <span className="text-[16px] font-bold text-[#1B1B1B]">
                    {t("recruit.fields.jobSummary")}
                    <span className="ml-1 text-rose-600">*</span>
                  </span>
                  <input
                    value={jobSummary}
                    onChange={(event) => {
                      setJobSummary(event.target.value);
                      if (jobSummaryError) {
                        setJobSummaryError("");
                      }
                    }}
                    className={adminUi.input}
                  />
                  {jobSummaryError ? (
                    <span className="text-xs text-rose-600">
                      {jobSummaryError}
                    </span>
                  ) : null}
                </label>
                <label
                  className="grid cursor-pointer gap-2"
                  htmlFor="recruit-application-deadline"
                  onClick={() => {
                    const input = applicationDeadLineRef.current;
                    if (!input) return;
                    input.focus();
                    if (typeof input.showPicker === "function") {
                      input.showPicker();
                    }
                  }}
                >
                  <span className="text-[16px] font-bold text-[#1B1B1B]">
                    {t("recruit.fields.applicationDeadLine")}
                  </span>
                  <input
                    id="recruit-application-deadline"
                    ref={applicationDeadLineRef}
                    type="date"
                    value={applicationDeadLine}
                    onChange={(event) =>
                      setApplicationDeadLine(event.target.value)
                    }
                    className={adminUi.input}
                  />
                </label>
                {fieldKeys.map((fieldKey) => (
                  <div key={fieldKey} className="flex flex-col gap-2">
                    {fieldKey === "positionAvailable" ? (
                      <label className="grid gap-1">
                        <span className="text-[16px] font-bold text-[#1B1B1B]">
                          {t(`recruit.fields.${fieldKey}`)}
                          <span className="ml-1 text-rose-600">*</span>
                        </span>
                        <input
                          value={fields.positionAvailable ?? ""}
                          onChange={(event) =>
                            updateField(fieldKey, event.target.value)
                          }
                          className={adminUi.input}
                        />
                        {requiredErrors[fieldKey] ? (
                          <span className="text-xs text-rose-600">
                            {requiredErrors[fieldKey]}
                          </span>
                        ) : null}
                      </label>
                    ) : (
                      <RichTextArea
                        label={t(`recruit.fields.${fieldKey}`)}
                        name={fieldKey}
                        required
                        defaultValue={fields[fieldKey] ?? ""}
                        error={
                          requiredErrors[fieldKey]
                            ? { message: requiredErrors[fieldKey] }
                            : undefined
                        }
                        setValue={(_, value: string) =>
                          updateField(fieldKey, value)
                        }
                        onChange={(value) => updateField(fieldKey, value)}
                        placeholder={t("content.placeholder")}
                        isLabelBold
                        className="flex flex-col gap-0 pt-2"
                      />
                    )}
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>

        <aside
          className={`${adminUi.card} ${adminUi.cardBody} min-w-0 lg:sticky lg:top-6 lg:max-h-[calc(100vh-80px)] lg:overflow-y-auto`}
        >
          <div className="space-y-3">
            <h2 className={adminUi.sectionTitle}>{t("actions.title")}</h2>
            <div className="grid gap-3">
              <button
                type="button"
                disabled={actionBusy !== null}
                onClick={async () => {
                  setActionBusy("save");
                  try {
                    await saveDraft("draft");
                  } finally {
                    setActionBusy(null);
                  }
                }}
                className={[
                  adminUi.buttonPrimary,
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
                  "inline-flex items-center justify-center gap-2 rounded-lg bg-[#3BB978] px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-[#2EA766] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#3BB978]/30 cursor-pointer",
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
              <div className="text-xs text-slate-500">{saveMessage}</div>
            ) : null}
          </div>
        </aside>
      </div>
    </main>
  );
}
