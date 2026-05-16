import { db } from "@/lib/db";
import { initCloudflareD1 } from "@/lib/db-cloudflare";
import { resolveMediaUrl } from "@/lib/media";
import type { MediaAsset } from "@/lib/services/posts";

export type IntroductoryVideoStatus = "draft" | "published" | "archived";
export type IntroductoryVideoType = "company" | "employee";

export type IntroductoryVideo = {
  id: number;
  status: IntroductoryVideoStatus;
  titleEn?: string | null;
  titleJP?: string | null;
  videoType: IntroductoryVideoType;
  videoFileId?: number | null;
  videoFileMedia?: MediaAsset | null;
  videoLink?: string | null;
  thumbnailId?: number | null;
  thumbnailMedia?: MediaAsset | null;
  createdAt: string;
  updatedAt: string;
};

type IntroductoryVideoRow = {
  id: number;
  status: IntroductoryVideoStatus;
  titleEn: string | null;
  titleJP: string | null;
  videoType: IntroductoryVideoType;
  videoFile: number | null;
  videoLink: string | null;
  thumbnail: number | null;
  createdAt: string;
  updatedAt: string;
};

type MediaRow = {
  id: number;
  provider: string;
  key: string;
  bucket: string | null;
  url: string | null;
  mimeType: string | null;
  size: number | null;
  width: number | null;
  height: number | null;
} | null;

type IntroductoryVideoMediaRow = IntroductoryVideoRow & {
  videoFileId: number | null;
  videoFileProvider: string | null;
  videoFileKey: string | null;
  videoFileBucket: string | null;
  videoFileUrl: string | null;
  videoFileMimeType: string | null;
  videoFileSize: number | null;
  videoFileWidth: number | null;
  videoFileHeight: number | null;
  thumbnailId: number | null;
  thumbnailProvider: string | null;
  thumbnailKey: string | null;
  thumbnailBucket: string | null;
  thumbnailUrl: string | null;
  thumbnailMimeType: string | null;
  thumbnailSize: number | null;
  thumbnailWidth: number | null;
  thumbnailHeight: number | null;
};

function mapMedia(media: MediaRow): MediaAsset | null {
  if (!media) return null;
  const resolvedUrl = resolveMediaUrl(media);
  const isRemote = media.provider === "r2" || media.provider === "s3";
  return {
    id: media.id,
    provider: isRemote ? "r2" : "local",
    key: media.key,
    bucket: media.bucket,
    url: resolvedUrl,
    mimeType: media.mimeType,
    size: media.size,
    width: media.width,
    height: media.height,
  };
}

export async function getAllIntroductoryVideosForAdmin(): Promise<
  IntroductoryVideo[]
> {
  await initCloudflareD1();
  const rows = await db.query<IntroductoryVideoRow>(
    `SELECT * FROM introductory_video ORDER BY updatedAt DESC`,
  );
  return rows.map((row) => ({
    id: row.id,
    status: row.status,
    titleEn: row.titleEn,
    titleJP: row.titleJP,
    videoType: row.videoType,
    videoFileId: row.videoFile,
    videoLink: row.videoLink,
    thumbnailId: row.thumbnail,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  }));
}

export async function getIntroductoryVideoById(
  id: number,
): Promise<IntroductoryVideo | undefined> {
  await initCloudflareD1();
  const row = await db.queryOne<IntroductoryVideoMediaRow>(
    `SELECT iv.*,
            vf.id as videoFileId, vf.provider as videoFileProvider, vf.key as videoFileKey, vf.bucket as videoFileBucket, vf.url as videoFileUrl,
            vf.mimeType as videoFileMimeType, vf.size as videoFileSize, vf.width as videoFileWidth, vf.height as videoFileHeight,
            tn.id as thumbnailId, tn.provider as thumbnailProvider, tn.key as thumbnailKey, tn.bucket as thumbnailBucket, tn.url as thumbnailUrl,
            tn.mimeType as thumbnailMimeType, tn.size as thumbnailSize, tn.width as thumbnailWidth, tn.height as thumbnailHeight
     FROM introductory_video iv
     LEFT JOIN media vf ON vf.id = iv.videoFile
     LEFT JOIN media tn ON tn.id = iv.thumbnail
     WHERE iv.id = ?
     LIMIT 1`,
    [id],
  );
  if (!row) return undefined;

  return {
    id: row.id,
    status: row.status,
    titleEn: row.titleEn,
    titleJP: row.titleJP,
    videoType: row.videoType,
    videoFileId: row.videoFile,
    videoFileMedia: mapMedia(
      row.videoFileId
        ? {
            id: row.videoFileId,
            provider: row.videoFileProvider ?? "local",
            key: row.videoFileKey ?? "",
            bucket: row.videoFileBucket,
            url: row.videoFileUrl,
            mimeType: row.videoFileMimeType,
            size: row.videoFileSize,
            width: row.videoFileWidth,
            height: row.videoFileHeight,
          }
        : null,
    ),
    videoLink: row.videoLink,
    thumbnailId: row.thumbnail,
    thumbnailMedia: mapMedia(
      row.thumbnailId
        ? {
            id: row.thumbnailId,
            provider: row.thumbnailProvider ?? "local",
            key: row.thumbnailKey ?? "",
            bucket: row.thumbnailBucket,
            url: row.thumbnailUrl,
            mimeType: row.thumbnailMimeType,
            size: row.thumbnailSize,
            width: row.thumbnailWidth,
            height: row.thumbnailHeight,
          }
        : null,
    ),
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

export async function getPublishedIntroductoryVideos(
  videoType?: IntroductoryVideoType,
): Promise<IntroductoryVideo[]> {
  await initCloudflareD1();
  const rows = await db.query<IntroductoryVideoMediaRow>(
    `SELECT iv.*,
            vf.id as videoFileId, vf.provider as videoFileProvider, vf.key as videoFileKey, vf.bucket as videoFileBucket, vf.url as videoFileUrl,
            vf.mimeType as videoFileMimeType, vf.size as videoFileSize, vf.width as videoFileWidth, vf.height as videoFileHeight,
            tn.id as thumbnailId, tn.provider as thumbnailProvider, tn.key as thumbnailKey, tn.bucket as thumbnailBucket, tn.url as thumbnailUrl,
            tn.mimeType as thumbnailMimeType, tn.size as thumbnailSize, tn.width as thumbnailWidth, tn.height as thumbnailHeight
     FROM introductory_video iv
     LEFT JOIN media vf ON vf.id = iv.videoFile
     LEFT JOIN media tn ON tn.id = iv.thumbnail
     WHERE iv.status = 'published'
     ${videoType ? "AND iv.videoType = ?" : ""}
     ORDER BY iv.updatedAt DESC`,
    videoType ? [videoType] : [],
  );

  return rows.map((row) => ({
    id: row.id,
    status: row.status,
    titleEn: row.titleEn,
    titleJP: row.titleJP,
    videoType: row.videoType,
    videoFileId: row.videoFile,
    videoFileMedia: mapMedia(
      row.videoFileId
        ? {
            id: row.videoFileId,
            provider: row.videoFileProvider ?? "local",
            key: row.videoFileKey ?? "",
            bucket: row.videoFileBucket,
            url: row.videoFileUrl,
            mimeType: row.videoFileMimeType,
            size: row.videoFileSize,
            width: row.videoFileWidth,
            height: row.videoFileHeight,
          }
        : null,
    ),
    videoLink: row.videoLink,
    thumbnailId: row.thumbnail,
    thumbnailMedia: mapMedia(
      row.thumbnailId
        ? {
            id: row.thumbnailId,
            provider: row.thumbnailProvider ?? "local",
            key: row.thumbnailKey ?? "",
            bucket: row.thumbnailBucket,
            url: row.thumbnailUrl,
            mimeType: row.thumbnailMimeType,
            size: row.thumbnailSize,
            width: row.thumbnailWidth,
            height: row.thumbnailHeight,
          }
        : null,
    ),
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  }));
}

type UpsertIntroductoryVideoInput = {
  id?: number | null;
  status: IntroductoryVideoStatus;
  titleEn?: string | null;
  titleJP?: string | null;
  videoType: IntroductoryVideoType;
  videoFileId?: number | null;
  videoLink?: string | null;
  thumbnailId?: number | null;
};

export async function upsertIntroductoryVideo(
  input: UpsertIntroductoryVideoInput,
): Promise<IntroductoryVideo> {
  await initCloudflareD1();
  const now = new Date().toISOString();
  const titleEn = input.titleEn?.trim() || null;
  const titleJP = input.titleJP?.trim() || null;
  const videoLink = input.videoLink?.trim() || null;
  const videoFileId = typeof input.videoFileId === "number" ? input.videoFileId : null;
  const thumbnailId =
    typeof input.thumbnailId === "number" ? input.thumbnailId : null;

  const existing = input.id
    ? await db.queryOne<{ id: number }>(
        `SELECT id FROM introductory_video WHERE id = ? LIMIT 1`,
        [input.id],
      )
    : null;

  if (existing?.id) {
    await db.execute(
      `UPDATE introductory_video
       SET status = ?, titleEn = ?, titleJP = ?, videoType = ?, videoFile = ?, videoLink = ?, thumbnail = ?, updatedAt = ?
       WHERE id = ?`,
      [
        input.status,
        titleEn,
        titleJP,
        input.videoType,
        videoFileId,
        videoLink,
        thumbnailId,
        now,
        existing.id,
      ],
    );
  } else {
    await db.execute(
      `INSERT INTO introductory_video
       (status, titleEn, titleJP, videoType, videoFile, videoLink, thumbnail, createdAt, updatedAt)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        input.status,
        titleEn,
        titleJP,
        input.videoType,
        videoFileId,
        videoLink,
        thumbnailId,
        now,
        now,
      ],
    );
  }

  const saved = await db.queryOne<IntroductoryVideoRow>(
    `SELECT * FROM introductory_video
     WHERE id = COALESCE(?, (SELECT id FROM introductory_video ORDER BY id DESC LIMIT 1))
     LIMIT 1`,
    [existing?.id ?? null],
  );

  if (!saved) {
    throw new Error("Failed to save introductory video.");
  }

  return {
    id: saved.id,
    status: saved.status,
    titleEn: saved.titleEn,
    titleJP: saved.titleJP,
    videoType: saved.videoType,
    videoFileId: saved.videoFile,
    videoLink: saved.videoLink,
    thumbnailId: saved.thumbnail,
    createdAt: saved.createdAt,
    updatedAt: saved.updatedAt,
  };
}

export async function updateIntroductoryVideoStatus(input: {
  id: number;
  status: IntroductoryVideoStatus;
}) {
  await initCloudflareD1();
  const now = new Date().toISOString();
  await db.execute(
    `UPDATE introductory_video SET status = ?, updatedAt = ? WHERE id = ?`,
    [input.status, now, input.id],
  );
}

export async function deleteIntroductoryVideoById(id: number) {
  await initCloudflareD1();
  await db.execute(`DELETE FROM introductory_video WHERE id = ?`, [id]);
}
