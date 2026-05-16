const GTM_ID_PATTERN = /^GTM-[A-Z0-9]+$/i;

function parseGoogleTagManagerIds(rawValue: string) {
  const ids = rawValue
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean)
    .filter((value) => GTM_ID_PATTERN.test(value));

  return Array.from(new Set(ids));
}

export function getGoogleTagManagerScriptIds() {
  return parseGoogleTagManagerIds(
    process.env.NEXT_PUBLIC_GTM_SCRIPT_IDS || process.env.NEXT_PUBLIC_GTM_IDS || "",
  );
}

export function getGoogleTagManagerNoscriptIds() {
  return parseGoogleTagManagerIds(
    process.env.NEXT_PUBLIC_GTM_NOSCRIPT_IDS ||
      process.env.NEXT_PUBLIC_GTM_SCRIPT_IDS ||
      process.env.NEXT_PUBLIC_GTM_IDS ||
      "",
  );
}

export function buildGoogleTagManagerBootstrap(
  containerId: string,
  dataLayerName = "dataLayer",
) {
  return `(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
})(window,document,'script','${dataLayerName}','${containerId}');`;
}

export function getGoogleTagManagerNoscriptUrl(containerId: string) {
  return `https://www.googletagmanager.com/ns.html?id=${encodeURIComponent(containerId)}`;
}
