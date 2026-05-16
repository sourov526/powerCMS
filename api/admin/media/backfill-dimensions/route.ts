export const runtime = "nodejs";
import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth/auth-server";
import { db } from "@/lib/db";
import { initCloudflareD1 } from "@/lib/db-cloudflare";
import { resolveMediaUrl } from "@/lib/media";
import { detectImageDimensions } from "@/lib/services/media";

type MediaRow = {
  id: number;
  provider: string;
  key: string;
  bucket: string | null;
  url: string | null;
  mimeType: string | null;
  width: number | null;
  height: number | null;
};

export async function POST(request: Request) {
  const user = await getSessionUser();
  if (!user || user.role !== "superuser") {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  await initCloudflareD1();
  const { searchParams } = new URL(request.url);
  const limitParam = Number(searchParams.get("limit") ?? "20");
  const limit = Number.isFinite(limitParam) && limitParam > 0 ? Math.min(limitParam, 100) : 20;

  const rows = await db.query<MediaRow>(
    `SELECT id, provider, key, bucket, url, mimeType, width, height
     FROM media
     WHERE (width IS NULL OR height IS NULL)
       AND mimeType LIKE 'image/%'
     ORDER BY id DESC
     LIMIT ?`,
    [limit],
  );

  const results: Array<{ id: number; width?: number; height?: number; error?: string }> = [];
  let updated = 0;

  for (const media of rows) {
    try {
      const imageUrl = resolveMediaUrl(media);
      const response = await fetch(imageUrl, { method: "GET" });
      if (!response.ok) {
        results.push({
          id: media.id,
          error: `fetch_failed_${response.status}`,
        });
        continue;
      }
      const buffer = new Uint8Array(await response.arrayBuffer());
      const dimensions = detectImageDimensions(buffer, media.mimeType ?? "");
      if (!dimensions?.width || !dimensions?.height) {
        results.push({ id: media.id, error: "dimensions_not_found" });
        continue;
      }
      await db.execute(
        `UPDATE media SET width = ?, height = ? WHERE id = ?`,
        [dimensions.width, dimensions.height, media.id],
      );
      updated += 1;
      results.push({ id: media.id, width: dimensions.width, height: dimensions.height });
    } catch (error) {
      results.push({ id: media.id, error: error instanceof Error ? error.message : "unknown" });
    }
  }

  return NextResponse.json({ scanned: rows.length, updated, results });
}
