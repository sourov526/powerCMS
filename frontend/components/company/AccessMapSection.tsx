"use client";

import { Text } from "@/components/atoms/typography/Text";
import { useEffect, useRef, useState } from "react";

type AccessMapSectionProps = {
  withDetails?: boolean;
  roundedTop?: boolean;
  sectionBgClass?: string;
  contactLayout?: boolean;
  details?: {
    phone: string;
    email: string;
    address: string;
  };
};

export default function AccessMapSection({
  withDetails = false,
  roundedTop = false,
  sectionBgClass = "bg-brand-offwhite",
  contactLayout = false,
  details,
}: AccessMapSectionProps) {
  const mapViewportRef = useRef<HTMLDivElement | null>(null);
  const [shouldLoadMap, setShouldLoadMap] = useState(false);
  const [mapLoaded, setMapLoaded] = useState(false);
  const mapEmbedUrl =
    process.env.NEXT_PUBLIC_COMPANY_MAP_EMBED_URL ??
    "https://www.google.com/maps/embed?pb=!1m14!1m8!1m3!1d12965.79266859224!2d139.7574143!3d35.6659653!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x60188be969b6bd4b%3A0xbc455e31ccf2d19f!2z5pel5pys44CB44CSMTA1LTAwMDQg5p2x5Lqs6YO95riv5Yy65paw5qmL77yR5LiB55uu77yR77yT4oiS77yV!5e0!3m2!1sja!2sbd!4v1776682446266!5m2!1sja!2sbd";

  const wrapperClass = contactLayout
    ? "mx-auto w-full max-w-[1440px] px-4 pt-12 pb-12 md:px-8 md:pt-14 md:pb-16 lg:px-[120px] lg:pt-[80px] lg:pb-[120px] lg:min-h-[690px] lg:flex lg:flex-col lg:gap-[48px]"
    : "container py-8 md:py-20";
  const mapBlockClass = contactLayout ? "" : "mt-6 lg:mt-12";
  const detailBlockClass = contactLayout ? "mt-0" : "mt-4";
  const phoneHref = details?.phone
    ? `tel:${details.phone.replace(/\D/g, "")}`
    : "tel:";
  const emailHref = details?.email ? `mailto:${details.email}` : "mailto:";

  useEffect(() => {
    const target = mapViewportRef.current;
    if (!target || shouldLoadMap) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          setShouldLoadMap(true);
          observer.disconnect();
        }
      },
      { rootMargin: "320px 0px" },
    );
    observer.observe(target);
    return () => observer.disconnect();
  }, [shouldLoadMap]);

  return (
    <section
      className={[
        contactLayout ? "" : "",
        sectionBgClass,
        roundedTop ? "rounded-tl-[40px] rounded-tr-[40px]" : "",
      ].join(" ")}
    >
      <div className={wrapperClass}>
        <div>
          <div className="flex items-center gap-2">
            <span
              className="h-[2px] w-[20px] shrink-0 bg-[#1F8A5A]"
              aria-hidden="true"
            />
            <div className="font-inter text-[10px] font-bold uppercase leading-[1.6] tracking-[0.05em] text-[#1F8A5A] lg:text-[12px]">
              <Text text="ACCESS" />
            </div>
          </div>
          <div className="pt-2 lg:pt-3 font-noto-jp text-[20px] font-bold leading-[1.6] tracking-[0.05em] text-[#252422] lg:text-[30px]">
            <Text text="アクセス" />
          </div>
        </div>
        <div
          ref={mapViewportRef}
          className={`${mapBlockClass} relative mx-auto h-[154.548px] w-[342.152px] max-w-full rotate-[0.33deg] overflow-hidden rounded-[4px] bg-white lg:mx-0 lg:h-[326px] lg:w-[1200px] lg:rotate-0 lg:rounded-[8px]`}
        >
          {shouldLoadMap ? (
            <>
              {!mapLoaded ? (
                <div className="h-[154.548px] w-[342.152px] max-w-full animate-pulse bg-slate-200 lg:h-[326px] lg:w-full" />
              ) : null}
              <iframe
                title="Power CMS Access Map"
                src={mapEmbedUrl}
                width="100%"
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                onLoad={() => setMapLoaded(true)}
                className={`block h-[154.548px] w-[342.152px] max-w-full lg:h-[326px] lg:w-full ${
                  mapLoaded ? "opacity-100" : "absolute inset-0 opacity-0"
                }`}
              />
            </>
          ) : (
            <div className="h-[154.548px] w-[342.152px] max-w-full animate-pulse bg-slate-200 lg:h-[326px] lg:w-full" />
          )}
        </div>
        {withDetails && details ? (
          <div
            className={`${detailBlockClass} flex flex-col gap-3 text-[14px] tracking-[0.04em] text-ink/80 lg:flex-row lg:items-center lg:justify-between`}
          >
            <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
              <a
                href={phoneHref}
                className="inline-flex items-center gap-2 transition hover:text-brand-green-dark"
              >
                <span
                  aria-hidden
                  className="inline-flex min-w-[32px] justify-center rounded bg-brand-mist px-1.5 py-0.5 text-[11px] font-semibold tracking-[0.08em] text-brand-green-dark"
                >
                  <Text text="TEL" />
                </span>
                <Text text={details.phone} />
              </a>
              <a
                href={emailHref}
                className="inline-flex items-center gap-2 transition hover:text-brand-green-dark"
              >
                <span
                  aria-hidden
                  className="inline-flex min-w-[32px] justify-center rounded bg-brand-mist px-1.5 py-0.5 text-[11px] font-semibold tracking-[0.08em] text-brand-green-dark"
                >
                  <Text text="MAIL" />
                </span>
                <Text text={details.email} />
              </a>
            </div>
            <p className="text-[13px] text-ink/75">
              <Text text={details.address} />
            </p>
          </div>
        ) : null}
      </div>
    </section>
  );
}
