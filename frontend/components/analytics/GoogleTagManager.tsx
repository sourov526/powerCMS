"use client";

import {
  buildGoogleTagManagerBootstrap,
  getGoogleTagManagerNoscriptIds,
  getGoogleTagManagerScriptIds,
  getGoogleTagManagerNoscriptUrl,
} from "@/lib/google-tag-manager";

type GoogleTagManagerProps = {
  ids?: string[];
};

export function GoogleTagManagerScripts({
  ids = getGoogleTagManagerScriptIds(),
}: GoogleTagManagerProps) {
  if (ids.length === 0) return null;

  return (
    <>
      {/* Google Tag Manager */}
      {ids.map((id) => (
        <script
          key={id}
          id={`google-tag-manager-${id}`}
          dangerouslySetInnerHTML={{
            __html: buildGoogleTagManagerBootstrap(id),
          }}
        />
      ))}
      {/* End Google Tag Manager */}
    </>
  );
}

export function GoogleTagManagerNoscript({
  ids = getGoogleTagManagerNoscriptIds(),
}: GoogleTagManagerProps) {
  if (ids.length === 0) return null;

  return (
    <>
      {/* Google Tag Manager (noscript) */}
      {ids.map((id) => (
        <noscript key={id}>
          <iframe
            src={getGoogleTagManagerNoscriptUrl(id)}
            height="0"
            width="0"
            style={{ display: "none", visibility: "hidden" }}
          />
        </noscript>
      ))}
      {/* End Google Tag Manager (noscript) */}
    </>
  );
}
