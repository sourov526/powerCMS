"use client";

import { getLocaleFontClasses } from "@/app/fonts";
import { useLocale, useTranslations } from "@/utils/strings/client";
import Script from "next/script";
import type { ChangeEvent, FormEvent } from "react";
import { useEffect, useRef, useState } from "react";
import { z } from "zod";

export const dynamic = "force-dynamic";

type FormValues = {
  companyName: string;
  name: string;
  contactNumber: string;
  inquiryType: string;
  email: string;
  inquiry: string;
  privacyAgreed: boolean;
};

type ContactApiSuccessResponse = {
  ok?: boolean;
  email?: {
    status?: "sent" | "failed" | "skipped";
    error?: string | null;
    autoReply?: {
      provider?: "app";
      status?: "sent" | "failed" | "skipped";
      error?: string | null;
    };
  };
};

const MAX_LENGTHS = {
  companyName: 40,
  name: 80,
  contactNumber: 40,
  email: 80,
  inquiry: 2000,
};

const createSchema = (v: ReturnType<typeof useTranslations>) =>
  z.object({
    companyName: z.string().max(MAX_LENGTHS.companyName),
    name: z
      .string()
      .min(1, v("name.required"))
      .max(MAX_LENGTHS.name, v("name.invalid")),
    contactNumber: z.string().max(MAX_LENGTHS.contactNumber),
    inquiryType: z.string().min(1, v("inquiryType.required")),
    email: z
      .string()
      .min(1, v("email.required"))
      .max(MAX_LENGTHS.email, v("email.invalid"))
      .email(v("email.invalid")),
    inquiry: z
      .string()
      .min(1, v("inquiry.required"))
      .max(MAX_LENGTHS.inquiry, v("inquiry.invalid")),
    privacyAgreed: z
      .boolean()
      .refine((value) => value, v("privacy.required")),
  });

const initialValues: FormValues = {
  companyName: "",
  name: "",
  contactNumber: "",
  inquiryType: "",
  email: "",
  inquiry: "",
  privacyAgreed: false,
};

const TRACK_PARAM_UTM_TERM = "utm_term";
const TRACK_PARAM_UTM_TERM_CAMEL = "utmTerm";
const TRACK_PARAM_UTM_SOURCE = "utm_source";
const TRACK_PARAM_UTM_MEDIUM = "utm_medium";
const TRACK_PARAM_UTM_CAMPAIGN = "utm_campaign";
const TRACK_PARAM_KWID = "kwid";
const TRACKING_STORAGE_KEY = "bc_tracking_params";
const PREVIOUS_PAGE_STORAGE_KEY = "bc_previous_page_url";
const EXTERNAL_REF_DIR_STORAGE_KEY = "bc_ext_ref_dir";
const EXTERNAL_REF_RELOAD_STORAGE_KEY = "bc_ext_ref_reload_seen";
/** Persisted referrer when user lands on contact from an external link (e.g. ランディングしたページのディレクトリ). */
const LANDING_REFERRER_STORAGE_KEY = "bc_landing_referrer";
/** Query param for explicit source URL when linking to contact (e.g. ?ref=https://example.com/page). */
const REF_PARAM = "ref";
const RECAPTCHA_SITE_KEY = process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY || "";
const CONTACT_WPCF7_META = {
  formId: "16669",
  version: "6.1.5",
  locale: "en_US",
  unitTag: "wpcf7-f16669-p16672-o2",
  containerPost: "16672",
} as const;

const toDirectoryPath = (pathname: string) => {
  const raw = (pathname || "").split("?")[0]?.split("#")[0] ?? "";
  if (!raw) return "/";
  if (raw.endsWith("/")) return raw;
  if (/\.[a-z0-9]+$/i.test(raw)) {
    const lastSlash = raw.lastIndexOf("/");
    return raw.slice(0, lastSlash + 1 || 1) || "/";
  }
  return `${raw}/`;
};

const toExternalDirectoryUrl = (input: string, currentOrigin: string) => {
  const raw = (input || "").trim();
  if (!raw) return "";
  try {
    const parsed = new URL(raw);
    if (parsed.origin === currentOrigin) return "";
    return `${parsed.origin}${toDirectoryPath(parsed.pathname)}`;
  } catch {
    return "";
  }
};

const normalizeUrlWithoutHash = (rawUrl: string) => {
  const value = (rawUrl || "").trim();
  if (!value) return "";
  try {
    const parsed = new URL(value);
    return `${parsed.origin}${parsed.pathname}${parsed.search}`;
  } catch {
    return value;
  }
};

const getTrackingValues = () => {
  if (typeof window === "undefined") {
    return {
      utmSource: "",
      utmMedium: "",
      utmCampaign: "",
      utmTerm: "",
      kwid: "",
    };
  }
  const params = new URLSearchParams(window.location.search);
  const referrer = (document.referrer || "").trim();
  const hasExternalReferrerWithoutKwid = (() => {
    if (!referrer) return false;
    try {
      const refUrl = new URL(referrer);
      if (refUrl.origin === window.location.origin) return false;
      const kwidOnReferrer = (
        refUrl.searchParams.get(TRACK_PARAM_KWID) || ""
      ).trim();
      return !kwidOnReferrer;
    } catch {
      return false;
    }
  })();
  const readSessionTracking = () => {
    try {
      const raw = window.sessionStorage.getItem(TRACKING_STORAGE_KEY);
      if (!raw) return {} as Record<string, string>;
      return JSON.parse(raw) as Record<string, string>;
    } catch {
      return {} as Record<string, string>;
    }
  };
  const fromSession = readSessionTracking();
  const utmTermFromUrl =
    params.get(TRACK_PARAM_UTM_TERM) ?? params.get(TRACK_PARAM_UTM_TERM_CAMEL);
  const kwidFromUrl = params.get(TRACK_PARAM_KWID);
  const utmSourceFromUrl = params.get(TRACK_PARAM_UTM_SOURCE);
  const utmMediumFromUrl = params.get(TRACK_PARAM_UTM_MEDIUM);
  const utmCampaignFromUrl = params.get(TRACK_PARAM_UTM_CAMPAIGN);
  const utmTerm = (
    utmTermFromUrl ??
    fromSession[TRACK_PARAM_UTM_TERM] ??
    ""
  ).trim();
  const kwid =
    kwidFromUrl !== null
      ? kwidFromUrl.trim()
      : hasExternalReferrerWithoutKwid
        ? ""
        : (fromSession[TRACK_PARAM_KWID] ?? "").trim();
  const utmSource = (
    utmSourceFromUrl ??
    fromSession[TRACK_PARAM_UTM_SOURCE] ??
    ""
  ).trim();
  const utmMedium = (
    utmMediumFromUrl ??
    fromSession[TRACK_PARAM_UTM_MEDIUM] ??
    ""
  ).trim();
  const utmCampaign = (
    utmCampaignFromUrl ??
    fromSession[TRACK_PARAM_UTM_CAMPAIGN] ??
    ""
  ).trim();
  if (utmSource || utmMedium || utmCampaign || utmTerm || kwid) {
    try {
      const next = { ...fromSession };
      if (utmSource) next[TRACK_PARAM_UTM_SOURCE] = utmSource;
      if (utmMedium) next[TRACK_PARAM_UTM_MEDIUM] = utmMedium;
      if (utmCampaign) next[TRACK_PARAM_UTM_CAMPAIGN] = utmCampaign;
      if (utmTerm) next[TRACK_PARAM_UTM_TERM] = utmTerm;
      if (kwid) next[TRACK_PARAM_KWID] = kwid;
      else if (hasExternalReferrerWithoutKwid && TRACK_PARAM_KWID in next) {
        delete next[TRACK_PARAM_KWID];
      }
      window.sessionStorage.setItem(TRACKING_STORAGE_KEY, JSON.stringify(next));
    } catch {
      // Ignore storage failures.
    }
  }
  return {
    utmSource,
    utmMedium,
    utmCampaign,
    utmTerm,
    kwid,
  };
};

declare global {
  interface Window {
    grecaptcha?: {
      render: (
        container: HTMLElement,
        parameters: {
          sitekey: string;
          size?: "normal" | "compact" | "invisible";
          callback: (token: string) => void;
          "expired-callback": () => void;
        },
      ) => number;
      reset: (id?: number) => void;
    };
  }
}

export default function ContactForm() {
  const t = useTranslations("ContactPage");
  const v = useTranslations("jpInquaryValidation");
  const locale = useLocale();
  const [values, setValues] = useState<FormValues>(initialValues);
  const [errors, setErrors] = useState<
    Partial<Record<keyof FormValues, string>>
  >({});
  const [captchaChecked, setCaptchaChecked] = useState(false);
  const [captchaToken, setCaptchaToken] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [recaptchaReady, setRecaptchaReady] = useState(false);
  const [shouldLoadRecaptcha, setShouldLoadRecaptcha] = useState(false);
  const [recaptchaWidgetRendered, setRecaptchaWidgetRendered] = useState(false);
  const [currentPageUrl, setCurrentPageUrl] = useState("");
  const [previousPageUrl, setPreviousPageUrl] = useState("");
  const [externalRefDir, setExternalRefDir] = useState("");
  const [externalRefReloaded, setExternalRefReloaded] = useState(false);
  const [viewportWidth, setViewportWidth] = useState("");
  const [viewportHeight, setViewportHeight] = useState("");
  const [isInquiryTypeOpen, setIsInquiryTypeOpen] = useState(false);
  const [trackingValues, setTrackingValues] = useState({
    utmSource: "",
    utmMedium: "",
    utmCampaign: "",
    utmTerm: "",
    kwid: "",
  });
  const recaptchaContainerRef = useRef<HTMLDivElement | null>(null);
  const recaptchaViewportRef = useRef<HTMLDivElement | null>(null);
  const inquiryTypeDropdownRef = useRef<HTMLDivElement | null>(null);
  const recaptchaWidgetIdRef = useRef<number | null>(null);
  const privacyCheckboxClass =
    "appearance-none relative h-[24px] w-[24px] aspect-square shrink-0 rounded-[6px] border border-[#252422] bg-transparent cursor-pointer md:border-[#5A5955] checked:border-[#1F8A5A] checked:bg-[#1F8A5A] checked:after:absolute checked:after:left-1/2 checked:after:top-1/2 checked:after:h-[10px] checked:after:w-[6px] checked:after:border-[2px] checked:after:border-white checked:after:border-t-0 checked:after:border-l-0 checked:after:-translate-x-1/2 checked:after:-translate-y-[60%] checked:after:rotate-45 disabled:cursor-not-allowed disabled:opacity-60";
  const contactFormRowClass =
    "flex flex-col gap-3 md:flex-row md:items-center md:gap-0";
  const fieldHeaderClass =
    "flex items-center gap-[19px] bg-transparent px-0 py-0 md:w-[250px] md:shrink-0 md:px-0 md:py-0";
  const fieldLabelTextClass =
    "whitespace-nowrap font-noto-jp text-[14px] font-medium leading-[160%] tracking-[0.7px] text-[#252422] md:text-[18px] md:tracking-[0.9px]";
  const requiredBadgeClass =
    "inline-flex h-[29px] w-[60px] items-center justify-center gap-[10px] whitespace-nowrap rounded-[4px] bg-[#2BB673] px-[16px] py-[6px] font-noto-jp text-[12px] font-normal leading-none text-white md:text-[14px] md:font-medium";
  const requiredBadgeErrorClass =
    "inline-flex h-[29px] w-[60px] items-center justify-center gap-[10px] whitespace-nowrap rounded-[4px] bg-[#B91C1B] px-[16px] py-[6px] font-noto-jp text-[12px] font-normal leading-none text-white md:text-[14px] md:font-medium";
  const optionalBadgeClass =
    "inline-flex h-[29px] w-[60px] items-center justify-center gap-[10px] whitespace-nowrap rounded-[4px] bg-[#C8C7C2] px-[16px] py-[6px] font-noto-jp text-[12px] font-normal leading-none text-white md:text-[14px]";
  const fieldControlClass =
    "flex h-[50px] w-full items-center gap-[17px] rounded-[8px] border border-[#D1D5DC] bg-[#F9FAFB] px-[24px] py-[12px] text-[14px] font-medium text-ink placeholder:text-[14px] placeholder:text-ink/40 md:text-[15px]";
  const textareaControlClass =
    "flex h-[160px] w-full self-stretch rounded-[8px] border border-[#D1D5DC] bg-[#F9FAFB] px-[24px] py-[12px] text-[14px] font-medium text-ink placeholder:text-[14px] placeholder:text-ink/40 md:text-[15px]";
  const fieldBodyClass = "bg-transparent px-0 py-0 md:px-0 md:py-0";
  const fieldBodyDesktopWidthClass = "md:flex-1 lg:ml-auto lg:max-w-[950px]";
  const fieldErrorTextClass =
    "mt-2 font-noto-jp text-[14px] font-medium leading-[160%] tracking-[0.7px] text-[#B91C1B] md:text-[16px] md:tracking-[0.8px]";
  const fieldErrorBorderClass = "border-[#B91C1B]";
  const inquiryTypeControlClass =
    "flex w-full shrink-0 items-center gap-[16px] self-stretch rounded-[8px] border border-[#D1D5DC] bg-[#F9FAFB] px-[24px] py-[16px]";

  const { robotoOrZen } = getLocaleFontClasses(locale);
  const isEnglishLocale = locale.toLowerCase().startsWith("en");
  const recaptchaLocale = isEnglishLocale ? "en" : "ja";
  const submissionLocale = isEnglishLocale ? "en" : "ja";
  const defaultDepartment = isEnglishLocale ? "Marketing" : "人事・総務";
  const defaultSchedule = isEnglishLocale
    ? "I want to implement it within 3 months"
    : "3ヶ月以内に導入したい";
  const inquiryTypeOptions = isEnglishLocale
    ? [
        { label: "Products / Solutions", value: "Products / Solutions" },
        { label: "IR / Investors", value: "IR / Investors" },
        { label: "Recruitment", value: "Recruitment" },
        { label: "Other", value: "Other" },
      ]
    : [
        {
          label: "製品・ソリューションについて",
          value: "製品・ソリューションについて",
        },
        { label: "IR・投資家向け", value: "IR・投資家向け" },
        { label: "採用をお考えの方", value: "採用をお考えの方" },
        { label: "その他", value: "その他" },
      ];
  const inquiryTypeLabel = isEnglishLocale ? "Type" : "種別";
  const nameLabel = isEnglishLocale ? "Name" : "氏名";
  const companyLabel = isEnglishLocale ? "Company" : "会社名";
  const phoneLabel = isEnglishLocale ? "Phone" : "電話番号";
  const emailLabel = isEnglishLocale ? "Email Address" : "メールアドレス";
  const inquiryLabel = isEnglishLocale ? "Message" : "内容";
  const inquiryTypePlaceholder = isEnglishLocale
    ? "Please select from below"
    : "以下から選択してください";
  const fieldIds = {
    company: isEnglishLocale ? "companyen" : "company",
    lastName: isEnglishLocale ? "last_nameen" : "last_name",
    phone: isEnglishLocale ? "phoneen" : "phone",
    inquiryType: isEnglishLocale ? "inquiry_typeen" : "inquiry_type",
    email: isEnglishLocale ? "emailen" : "email",
    inquiry: isEnglishLocale ? "00NQ9000003YfQP" : "00NQ900000GOM6D",
    acceptance: isEnglishLocale ? "acceptance-bc" : "acceptance-53",
  } as const;
  const wpcf7Locale = isEnglishLocale ? "en" : "ja";
  const privacyPlainText = isEnglishLocale
    ? "I agree to the handling of personal information"
    : "個人情報の取り扱いに同意する";
  const canSubmit =
    captchaChecked &&
    Boolean(captchaToken) &&
    values.privacyAgreed &&
    !isSubmitting;

  const handleChange =
    (field: keyof FormValues) =>
    (
      event: ChangeEvent<
        HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
      >,
    ) => {
      const nextValue =
        event.target.type === "checkbox"
          ? (event.target as HTMLInputElement).checked
          : field === "contactNumber"
            ? event.target.value.replace(/\D/g, "")
            : event.target.value;
      setValues((prev) => ({ ...prev, [field]: nextValue }));
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    };
  const handleInquiryTypeSelect = (nextValue: string) => {
    setValues((prev) => ({ ...prev, inquiryType: nextValue }));
    setErrors((prev) => ({ ...prev, inquiryType: undefined }));
    setIsInquiryTypeOpen(false);
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (isSubmitting) return;
    setSubmitError(null);
    const schema = createSchema(v);
    const result = schema.safeParse(values);
    if (!result.success) {
      const fieldErrors = result.error.flatten().fieldErrors;
      setErrors({
        companyName: fieldErrors.companyName?.[0],
        name: fieldErrors.name?.[0],
        contactNumber: fieldErrors.contactNumber?.[0],
        inquiryType: fieldErrors.inquiryType?.[0],
        email: fieldErrors.email?.[0],
        inquiry: fieldErrors.inquiry?.[0],
        privacyAgreed: fieldErrors.privacyAgreed?.[0],
      });
      return;
    }
    setErrors({});
    setIsSubmitting(true);
    try {
      const requestPayload: Record<string, string | boolean> = {
        companyName: values.companyName,
        homePage: "",
        name: values.name,
        department: values.inquiryType || defaultDepartment,
        contactNumber: values.contactNumber,
        email: values.email,
        schedule: defaultSchedule,
        message: values.inquiry,
        privacyAgreed: values.privacyAgreed,
        locale: submissionLocale,
        utmSource: trackingValues.utmSource,
        utmMedium: trackingValues.utmMedium,
        utmCampaign: trackingValues.utmCampaign,
        utmTerm: trackingValues.utmTerm,
        kwid: trackingValues.kwid,
        vxUrl: currentPageUrl,
        previousPageUrl,
        extRefDir: externalRefDir,
        externalRefReloaded,
        captchaResponse: captchaToken,
      };
      console.info("[contact] submit_payload", requestPayload);
      const response = await fetch("/api/contacts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestPayload),
      });
      if (!response.ok) {
        const data = (await response.json().catch(() => null)) as {
          error?: unknown;
        } | null;
        const errorKey = typeof data?.error === "string" ? data.error : "";
        const errorMap: Record<string, string> = {
          required: v("inquiry.invalid"),
          terms: v("privacy.invalid"),
          email_invalid: v("email.invalid"),
          url_invalid: v("email.invalid"),
          number_invalid: v("name.invalid"),
          too_long: v("inquiry.invalid"),
          too_short: v("inquiry.invalid"),
          validation: v("inquiry.invalid"),
          spam: v("inquiry.invalid"),
          auto_reply_failed: t("form.submitError"),
        };
        setSubmitError(errorMap[errorKey] || t("form.submitError"));
        return;
      }

      const successData = (await response
        .json()
        .catch(() => null)) as ContactApiSuccessResponse | null;
      const emailMeta = successData?.email ?? null;
      const autoReplyProvider = emailMeta?.autoReply?.provider;
      const autoReplyStatus = emailMeta?.autoReply?.status;
      const autoReplyOk = autoReplyStatus === "sent";
      if (!autoReplyOk) {
        console.error("[contact] App auto-reply delivery not confirmed.", {
          mailStatus: emailMeta?.status ?? null,
          mailError: emailMeta?.error ?? null,
          autoReplyStatus: autoReplyStatus ?? null,
          autoReplyError: emailMeta?.autoReply?.error ?? null,
        });
        setSubmitError(t("form.submitError"));
        return;
      }
      console.info("[contact] Contact submitted successfully.", {
        mailStatus: emailMeta?.status ?? null,
        autoReplyProvider: emailMeta?.autoReply?.provider ?? null,
        autoReplyStatus: emailMeta?.autoReply?.status ?? null,
      });
      try {
        // Clear external attribution markers after a completed submission so
        // a later independent contact journey does not inherit stale external refs.
        window.sessionStorage.removeItem(EXTERNAL_REF_DIR_STORAGE_KEY);
        window.sessionStorage.removeItem(LANDING_REFERRER_STORAGE_KEY);
        window.sessionStorage.removeItem(EXTERNAL_REF_RELOAD_STORAGE_KEY);
      } catch {
        // Ignore storage failures.
      }
      window.location.assign("/contact/thank-you?message=success");
      return;
    } catch {
      setSubmitError(t("form.submitError"));
    } finally {
      setIsSubmitting(false);
    }
  };

  useEffect(() => {
    if (window.grecaptcha?.render) {
      setRecaptchaReady(true);
    }
  }, []);

  useEffect(() => {
    const syncMeta = () => {
      const locationUrl = new URL(window.location.href);
      const currentUrl = normalizeUrlWithoutHash(locationUrl.toString());
      setCurrentPageUrl(currentUrl);
      const fromReferrer = (document.referrer || "").trim();
      let fromSession = "";
      let fromExternalDirectory = "";
      let fromLandingReferrer = "";
      let fromExternalRefReloaded = false;
      try {
        fromSession = (
          window.sessionStorage.getItem(PREVIOUS_PAGE_STORAGE_KEY) || ""
        ).trim();
        fromExternalDirectory = (
          window.sessionStorage.getItem(EXTERNAL_REF_DIR_STORAGE_KEY) || ""
        ).trim();
        fromLandingReferrer = (
          window.sessionStorage.getItem(LANDING_REFERRER_STORAGE_KEY) || ""
        ).trim();
        fromExternalRefReloaded =
          (
            window.sessionStorage.getItem(EXTERNAL_REF_RELOAD_STORAGE_KEY) || ""
          ).trim() === "1";
        if (fromExternalRefReloaded) {
          window.sessionStorage.removeItem(EXTERNAL_REF_RELOAD_STORAGE_KEY);
        }
      } catch {
        fromSession = "";
        fromExternalDirectory = "";
        fromLandingReferrer = "";
        fromExternalRefReloaded = false;
      }
      const refParam = locationUrl.searchParams.get(REF_PARAM);
      let refUrl = "";
      if (refParam && refParam.startsWith("http")) {
        try {
          new URL(refParam);
          refUrl = refParam.trim();
        } catch {
          refUrl = "";
        }
      }
      const currentOrigin = locationUrl.origin;
      const navigationEntry = window.performance.getEntriesByType(
        "navigation",
      )[0] as PerformanceNavigationTiming | undefined;
      const navigationEntryUrl = normalizeUrlWithoutHash(
        navigationEntry?.name || "",
      );
      const isCurrentDocumentNavigation =
        Boolean(navigationEntryUrl) && navigationEntryUrl === currentUrl;
      const isExternalReferrer = (url: string) => {
        if (!url) return false;
        try {
          return new URL(url).origin !== currentOrigin;
        } catch {
          return false;
        }
      };
      if (refUrl) {
        try {
          window.sessionStorage.setItem(LANDING_REFERRER_STORAGE_KEY, refUrl);
        } catch {
          /* ignore */
        }
      } else if (
        fromReferrer &&
        isExternalReferrer(fromReferrer) &&
        !fromLandingReferrer
      ) {
        try {
          window.sessionStorage.setItem(
            LANDING_REFERRER_STORAGE_KEY,
            fromReferrer,
          );
        } catch {
          /* ignore */
        }
      }
      const normalizedReferrer =
        fromReferrer && fromReferrer !== locationUrl.toString()
          ? normalizeUrlWithoutHash(fromReferrer)
          : "";
      const normalizedSessionPrevious =
        fromSession && fromSession !== locationUrl.toString()
          ? normalizeUrlWithoutHash(fromSession)
          : "";
      const canTrustReferrerForCurrentRoute = isCurrentDocumentNavigation;
      const hasExternalReferrer = isExternalReferrer(fromReferrer);
      const hasRefParam = Boolean(refUrl);
      const isDirectContactEntryWithoutContext =
        !normalizedSessionPrevious && !hasExternalReferrer && !hasRefParam;
      if (isDirectContactEntryWithoutContext) {
        try {
          window.sessionStorage.removeItem(EXTERNAL_REF_DIR_STORAGE_KEY);
          window.sessionStorage.removeItem(LANDING_REFERRER_STORAGE_KEY);
          window.sessionStorage.removeItem(EXTERNAL_REF_RELOAD_STORAGE_KEY);
        } catch {
          // Ignore storage failures.
        }
        fromExternalDirectory = "";
        fromLandingReferrer = "";
        fromExternalRefReloaded = false;
      }
      const resolvedPrevious =
        // Always send the immediate previous page before contact:
        // 1) session-tracked previous page for SPA transitions, or
        // 2) browser referrer for hard navigations to this contact document.
        normalizedSessionPrevious ||
        (canTrustReferrerForCurrentRoute ? normalizedReferrer : "");
      setPreviousPageUrl(resolvedPrevious);
      const resolvedExternalDirectory =
        fromExternalDirectory ||
        toExternalDirectoryUrl(fromLandingReferrer, currentOrigin) ||
        toExternalDirectoryUrl(refUrl, currentOrigin) ||
        toExternalDirectoryUrl(fromReferrer, currentOrigin);
      setExternalRefDir(resolvedExternalDirectory);
      setExternalRefReloaded(fromExternalRefReloaded);
      setViewportWidth(String(window.innerWidth));
      setViewportHeight(String(window.innerHeight));
      setTrackingValues(getTrackingValues());
    };
    syncMeta();
    window.addEventListener("resize", syncMeta);
    return () => window.removeEventListener("resize", syncMeta);
  }, []);

  useEffect(() => {
    const target = recaptchaViewportRef.current;
    if (!target || shouldLoadRecaptcha) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          setShouldLoadRecaptcha(true);
          observer.disconnect();
        }
      },
      { rootMargin: "320px 0px" },
    );
    observer.observe(target);
    return () => observer.disconnect();
  }, [shouldLoadRecaptcha]);

  useEffect(() => {
    const siteKey = RECAPTCHA_SITE_KEY;
    const container = recaptchaContainerRef.current;
    if (!shouldLoadRecaptcha || !siteKey || !container) return;

    let cancelled = false;
    let retryTimer: number | null = null;

    const renderWidget = () => {
      if (cancelled) return;
      if (container.childElementCount > 0) return;
      if (!recaptchaReady || !window.grecaptcha?.render) {
        retryTimer = window.setTimeout(renderWidget, 150);
        return;
      }
      const widgetId = window.grecaptcha.render(container, {
        sitekey: siteKey,
        size: "normal",
        callback: (token) => {
          if (token) {
            setCaptchaChecked(true);
            setCaptchaToken(token);
          }
        },
        "expired-callback": () => {
          setCaptchaChecked(false);
          setCaptchaToken("");
        },
      });
      recaptchaWidgetIdRef.current = widgetId;
      setRecaptchaWidgetRendered(true);
    };

    renderWidget();
    return () => {
      cancelled = true;
      if (retryTimer !== null) {
        window.clearTimeout(retryTimer);
      }
    };
  }, [recaptchaReady, shouldLoadRecaptcha]);

  useEffect(() => {
    const handleOutsideClick = (event: MouseEvent) => {
      if (
        inquiryTypeDropdownRef.current &&
        !inquiryTypeDropdownRef.current.contains(event.target as Node)
      ) {
        setIsInquiryTypeOpen(false);
      }
    };
    document.addEventListener("mousedown", handleOutsideClick);
    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
    };
  }, []);

  return (
    <form
      action="/api/contacts"
      method="post"
      onSubmit={handleSubmit}
      className="bg-brand-offwhite user-contact-form"
      aria-label="Contact form"
      noValidate
      data-status="init"
    >
      <fieldset className="hidden-fields-container">
        <input type="hidden" name="_wpcf7" value={CONTACT_WPCF7_META.formId} />
        <input
          type="hidden"
          name="_wpcf7_version"
          value={CONTACT_WPCF7_META.version}
        />
        <input type="hidden" name="_wpcf7_locale" value={wpcf7Locale} />
        <input
          type="hidden"
          name="_wpcf7_unit_tag"
          value={CONTACT_WPCF7_META.unitTag}
        />
        <input
          type="hidden"
          name="_wpcf7_container_post"
          value={CONTACT_WPCF7_META.containerPost}
        />
        <input type="hidden" name="_wpcf7_posted_data_hash" value="" />
      </fieldset>
      <input type="hidden" name="vx_width" value={viewportWidth} />
      <input type="hidden" name="vx_height" value={viewportHeight} />
      <input type="hidden" name="vx_url" value={currentPageUrl} />
      {shouldLoadRecaptcha ? (
        <Script
          src={`https://www.google.com/recaptcha/api.js?render=explicit&hl=${recaptchaLocale}`}
          strategy="afterInteractive"
          onLoad={() => setRecaptchaReady(true)}
        />
      ) : null}
      <section className={` ${robotoOrZen} space-y-6`}>
        <div className={`flex flex-col ${contactFormRowClass}`}>
          <div className={fieldHeaderClass}>
            <span className={optionalBadgeClass}>{t("form.optional")}</span>
            <span className={fieldLabelTextClass}>{companyLabel}</span>
          </div>
          <div className={`${fieldBodyClass} ${fieldBodyDesktopWidthClass}`}>
            <input
              id={fieldIds.company}
              name="company"
              maxLength={40}
              value={values.companyName}
              onChange={handleChange("companyName")}
              className={fieldControlClass}
            />
            {errors.companyName ? (
              <p className="mt-2 text-xs text-danger">{errors.companyName}</p>
            ) : null}
          </div>
        </div>

        <div className={`flex flex-col ${contactFormRowClass}`}>
          <div className={fieldHeaderClass}>
            <span className={errors.name ? requiredBadgeErrorClass : requiredBadgeClass}>{t("form.required")}</span>
            <span className={fieldLabelTextClass}>{nameLabel}</span>
          </div>
          <div className={`${fieldBodyClass} ${fieldBodyDesktopWidthClass}`}>
            <input
              id={fieldIds.lastName}
              name="last_name"
              maxLength={80}
              value={values.name}
              onChange={handleChange("name")}
              className={`${fieldControlClass} ${errors.name ? fieldErrorBorderClass : ""}`}
              style={errors.name ? { borderColor: "#B91C1B" } : undefined}
            />
            {errors.name ? <p className={fieldErrorTextClass}>{errors.name}</p> : null}
          </div>
        </div>

        <div className={`flex flex-col ${contactFormRowClass}`}>
          <div className={fieldHeaderClass}>
            <span className={errors.email ? requiredBadgeErrorClass : requiredBadgeClass}>{t("form.required")}</span>
            <span className={fieldLabelTextClass}>{emailLabel}</span>
          </div>
          <div className={`${fieldBodyClass} ${fieldBodyDesktopWidthClass}`}>
            <input
              type="email"
              id={fieldIds.email}
              name="email"
              maxLength={80}
              value={values.email}
              onChange={handleChange("email")}
              className={`${fieldControlClass} ${errors.email ? fieldErrorBorderClass : ""}`}
              style={errors.email ? { borderColor: "#B91C1B" } : undefined}
            />
            {errors.email ? <p className={fieldErrorTextClass}>{errors.email}</p> : null}
          </div>
        </div>

        <div className={`flex flex-col ${contactFormRowClass}`}>
          <div className={fieldHeaderClass}>
            <span className={optionalBadgeClass}>{t("form.optional")}</span>
            <span className={fieldLabelTextClass}>{phoneLabel}</span>
          </div>
          <div className={`${fieldBodyClass} ${fieldBodyDesktopWidthClass}`}>
            <input
              type="tel"
              inputMode="numeric"
              pattern="[0-9]*"
              id={fieldIds.phone}
              name="phone"
              maxLength={40}
              value={values.contactNumber}
              onChange={handleChange("contactNumber")}
              className={fieldControlClass}
            />
            {errors.contactNumber ? (
              <p className="mt-2 text-xs text-danger">{errors.contactNumber}</p>
            ) : null}
          </div>
        </div>

        <div className={`flex flex-col ${contactFormRowClass}`}>
          <div className={fieldHeaderClass}>
            <span className={errors.inquiryType ? requiredBadgeErrorClass : requiredBadgeClass}>{t("form.required")}</span>
            <span className={fieldLabelTextClass}>{inquiryTypeLabel}</span>
          </div>
          <div className={`${fieldBodyClass} ${fieldBodyDesktopWidthClass}`}>
            <div className="relative" ref={inquiryTypeDropdownRef}>
              <input
                type="hidden"
                id={fieldIds.inquiryType}
                name="inquiry_type"
                value={values.inquiryType}
              />
              <button
                type="button"
                className={`${inquiryTypeControlClass} text-left ${errors.inquiryType ? fieldErrorBorderClass : ""}`}
                style={errors.inquiryType ? { borderColor: "#B91C1B" } : undefined}
                aria-haspopup="listbox"
                aria-expanded={isInquiryTypeOpen}
                onClick={() => setIsInquiryTypeOpen((prev) => !prev)}
              >
                <span
                  className={`flex h-[20px] flex-1 items-center justify-between font-noto-jp text-[14px] font-normal leading-none tracking-[0.7px] md:text-[16px] md:tracking-[0.8px] ${
                    values.inquiryType ? "text-ink" : "text-[#5A5955]"
                  }`}
                >
                  {values.inquiryType || inquiryTypePlaceholder}
                </span>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 20 20"
                  fill="none"
                  stroke="#5A5955"
                  strokeWidth="1.5"
                  strokeLinecap="square"
                  className={[
                    "h-[18px] w-[18px] md:h-[20px] md:w-[20px] transition-transform",
                    isInquiryTypeOpen ? "rotate-180" : "",
                  ].join(" ")}
                  aria-hidden="true"
                >
                  <path d="M5 7.5 10 12.5 15 7.5" />
                </svg>
              </button>

              {isInquiryTypeOpen ? (
                <div className="absolute left-0 right-0 top-[calc(100%+12px)] z-30 overflow-hidden rounded-[8px] border border-[#D1D5DC] bg-[#F9FAFB] shadow-[0_10px_24px_rgba(0,0,0,0.12)] md:top-[calc(100%+16px)]">
                  <ul
                    role="listbox"
                    className="flex max-h-64 flex-col gap-4 overflow-y-auto px-[24px] py-[16px]"
                  >
                    {inquiryTypeOptions.map((option) => (
                      <li key={option.value}>
                        <button
                          type="button"
                          className={[
                            "flex w-full items-center gap-[16px] bg-transparent p-0 text-left font-noto-jp text-[14px] font-normal leading-none tracking-[0.7px] text-[#5A5955] transition hover:opacity-80 md:text-[16px] md:tracking-[0.8px]",
                          ].join(" ")}
                          onClick={() => handleInquiryTypeSelect(option.value)}
                        >
                          {option.label}
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}
            </div>
            {errors.inquiryType ? <p className={fieldErrorTextClass}>{errors.inquiryType}</p> : null}
          </div>
        </div>

        <div
          className={`flex flex-col ${contactFormRowClass} mb-6 md:border-b-0 md:mb-10`}
        >
          <div className={fieldHeaderClass}>
            <span className={errors.inquiry ? requiredBadgeErrorClass : requiredBadgeClass}>{t("form.required")}</span>
            <span className={fieldLabelTextClass}>{inquiryLabel}</span>
          </div>
          <div className={`${fieldBodyClass} ${fieldBodyDesktopWidthClass}`}>
            <textarea
              id={fieldIds.inquiry}
              name="inquiry"
              value={values.inquiry}
              onChange={handleChange("inquiry")}
              rows={6}
              className={`${textareaControlClass} ${errors.inquiry ? fieldErrorBorderClass : ""}`}
              style={errors.inquiry ? { borderColor: "#B91C1B" } : undefined}
            />
            {errors.inquiry ? <p className={fieldErrorTextClass}>{errors.inquiry}</p> : null}
          </div>
        </div>
      </section>

      <div
        ref={recaptchaViewportRef}
        className={`mx-auto flex w-full max-w-[950px] flex-col items-center ${robotoOrZen}`}
      >
        <div className="mx-auto flex w-full flex-col items-center">
          <label className="flex w-full items-center justify-center gap-[10px] cursor-pointer">
            <input
              type="checkbox"
              id={fieldIds.acceptance}
              name={fieldIds.acceptance}
              checked={values.privacyAgreed}
              onChange={handleChange("privacyAgreed")}
              className={`${privacyCheckboxClass} bcacceptance`}
            />
            <span className="inline-flex items-baseline whitespace-nowrap font-noto-jp text-[14px] font-normal leading-[160%] tracking-[0.7px] text-[#252422] md:text-[16px] md:tracking-[0.8px] md:text-[#5A5955]">
              <span>{privacyPlainText}</span>
            </span>
          </label>
          <div
            ref={recaptchaContainerRef}
            className={`mt-4 flex w-full items-center justify-center md:mt-6 ${
              recaptchaWidgetRendered
                ? ""
                : "animate-pulse rounded-md border border-slate-200 bg-slate-100/90"
            }`}
          />
        </div>
        {errors.privacyAgreed ? <p className={fieldErrorTextClass}>{errors.privacyAgreed}</p> : null}
      </div>

      <div
        className={`mx-auto mt-4 flex w-full flex-col items-center md:mt-6 ${robotoOrZen}`}
      >
        {submitError ? (
          <p className="mb-2 text-center text-sm text-danger">{submitError}</p>
        ) : null}
        <button
          type="submit"
          disabled={!canSubmit}
          className={`mx-auto inline-flex h-[44px] w-full max-w-none items-center justify-center gap-[10px] self-stretch whitespace-nowrap rounded-[4px] border border-[#1F8A5A] bg-[#1F8A5A] px-[24px] py-[16px] font-noto-jp text-center text-[14px] font-bold leading-[160%] tracking-[0.7px] text-white transition md:h-auto md:w-[208px] md:max-w-none md:text-[16px] md:tracking-[0.8px] ${
            canSubmit
              ? "cursor-pointer bg-[#1F8A5A] hover:border-[#18724A] hover:bg-[#18724A] active:border-[#145E3D] active:bg-[#145E3D]"
              : "cursor-not-allowed bg-[#1F8A5A] text-white/80"
          }`}
        >
          {isSubmitting ? t("form.submitting") : `${t("form.submit")} →`}
        </button>
      </div>
    </form>
  );
}
