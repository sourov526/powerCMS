"use client";

import { useEffect } from "react";
import {
  buildGoogleAdsBootstrap,
  getGoogleAdsIds,
  getGoogleAdsLoaderUrl,
  getLandingHubScriptUrl,
  getMierucaScriptId,
  getMierucaScriptUrl,
} from "@/lib/marketing-head-scripts";

type LandingHubDispatcherScriptProps = {
  src: string;
};

function LandingHubDispatcherScript({ src }: LandingHubDispatcherScriptProps) {
  useEffect(() => {
    const existingScript = document.head.querySelector<HTMLScriptElement>(
      `script[data-landinghub="dispatcher-tag"][src="${src}"]`,
    );
    if (existingScript) return;

    const script = document.createElement("script");
    script.async = true;
    script.src = src;
    script.setAttribute("data-landinghub", "dispatcher-tag");
    script.referrerPolicy = "strict-origin";
    document.head.appendChild(script);
  }, [src]);

  return null;
}

export function MarketingHeadScripts() {
  const mierucaScriptUrl = getMierucaScriptUrl();
  const mierucaScriptId = getMierucaScriptId();
  const landingHubScriptUrl = getLandingHubScriptUrl();
  const googleAdsIds = getGoogleAdsIds();

  if (!mierucaScriptUrl && !landingHubScriptUrl && googleAdsIds.length === 0) {
    return null;
  }

  return (
    <>
      {landingHubScriptUrl ? (
        <>
          {/* LandingHub Dispatcher */}
          <LandingHubDispatcherScript src={landingHubScriptUrl} />
          {/* End LandingHub Dispatcher */}
        </>
      ) : null}

      {mierucaScriptUrl ? (
        <>
          {/* Mieruca */}
          <script
            async
            {...(mierucaScriptId ? { id: mierucaScriptId } : {})}
            src={mierucaScriptUrl}
            type="text/javascript"
          />
          {/* End Mieruca */}
        </>
      ) : null}

      {googleAdsIds.length > 0 ? (
        <>
          {/* Google Ads (gtag.js) */}
          {googleAdsIds.map((id) => (
            <script
              key={`google-ads-loader-${id}`}
              async
              src={getGoogleAdsLoaderUrl(id)}
            />
          ))}
          <script
            dangerouslySetInnerHTML={{
              __html: buildGoogleAdsBootstrap(googleAdsIds),
            }}
          />
          {/* End Google Ads (gtag.js) */}
        </>
      ) : null}
    </>
  );
}
