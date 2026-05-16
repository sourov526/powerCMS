type IndexNowPayload = {
  host: string;
  key: string;
  keyLocation?: string;
  urlList: string[];
};

export async function pingIndexNow(urls: string[], options?: { baseUrl?: string }) {
  const key = process.env.INDEXNOW_KEY;
  if (!key || urls.length === 0) return;

  const resolvedBaseUrl = (() => {
    if (options?.baseUrl) return options.baseUrl;
    try {
      return new URL(urls[0]).origin;
    } catch {
      return null;
    }
  })();
  if (!resolvedBaseUrl) return;
  const host = new URL(resolvedBaseUrl).host;
  const payload: IndexNowPayload = {
    host,
    key,
    keyLocation: `${resolvedBaseUrl}/admin/${key}.txt`,
    urlList: urls,
  };

  await fetch("https://api.indexnow.org/indexnow", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
}
