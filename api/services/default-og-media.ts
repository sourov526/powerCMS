import { db } from "@/lib/db";
import { initCloudflareD1 } from "@/lib/db-cloudflare";
import { resolveMediaUrl } from "@/lib/media";
import { siteConfig } from "@/lib/site";

const DEFAULT_OG_MEDIA_TAG = "default_og";
const FALLBACK_DEFAULT_OG_IMAGE = siteConfig.ogImage;

type DefaultOgMediaRow = {
  provider: string;
  key: string;
  bucket: string | null;
  url: string | null;
};

export async function getDefaultOgImagePath(baseUrl?: string): Promise<string> {
  // Keep the application-wide OG default aligned with site config.
  if (siteConfig.ogImage?.trim()) {
    return new URL(siteConfig.ogImage, baseUrl ?? siteConfig.url).toString();
  }

  try {
    await initCloudflareD1();
    const media = await db.queryOne<DefaultOgMediaRow>(
      `SELECT provider, key, bucket, url
       FROM media
       WHERE tag = ?
       ORDER BY id DESC
       LIMIT 1`,
      [DEFAULT_OG_MEDIA_TAG],
    );
    if (!media) return FALLBACK_DEFAULT_OG_IMAGE;
    return resolveMediaUrl(media, baseUrl ?? siteConfig.url);
  } catch {
    return FALLBACK_DEFAULT_OG_IMAGE;
  }
}
