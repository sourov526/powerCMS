import { db } from "@/lib/db";
import { initCloudflareD1 } from "@/lib/db-cloudflare";
import { AwsClient, AwsV4Signer } from "aws4fetch";

function isNodeRuntime() {
  return process.env.NEXT_RUNTIME === "nodejs";
}

function normalizeKey(key: string) {
  return key.replace(/^\/+/, "");
}

type NodeFs = {
  mkdir: (path: string, opts?: { recursive?: boolean }) => Promise<void>;
  writeFile: (path: string, data: Uint8Array | string) => Promise<void>;
  readFile: (path: string) => Promise<Uint8Array>;
};

type NodePath = {
  default?: {
    join: (...parts: string[]) => string;
    posix: { join: (...parts: string[]) => string };
    extname: (path: string) => string;
    dirname: (path: string) => string;
  };
  join: (...parts: string[]) => string;
  posix: { join: (...parts: string[]) => string };
  extname: (path: string) => string;
  dirname: (path: string) => string;
};

type NodeCrypto = {
  randomUUID: () => string;
};

async function importNodeModule<T>(specifier: string): Promise<T> {
  if (!isNodeRuntime()) {
    throw new Error("Node-only module import blocked in edge runtime.");
  }
  const importer = new Function("s", "return import(s)") as (s: string) => Promise<T>;
  return importer(specifier);
}

async function getNodeFs() {
  if (!isNodeRuntime()) {
    throw new Error("Local file storage is only available in a Node runtime.");
  }
  const fs = await importNodeModule<NodeFs>("fs/promises");
  return fs;
}

async function getNodePath() {
  if (!isNodeRuntime()) {
    throw new Error("Path utilities are only available in a Node runtime.");
  }
  const path = await importNodeModule<NodePath>("path");
  return path.default ?? path;
}

async function getRandomUuid() {
  if (globalThis.crypto?.randomUUID) {
    return globalThis.crypto.randomUUID();
  }
  const crypto = await importNodeModule<NodeCrypto>("crypto");
  return crypto.randomUUID();
}

async function getLocalUploadDir() {
  const path = await getNodePath();
  return path.join(process.cwd(), "public", "uploads");
}

function getMediaProvider() {
  const explicit = process.env.MEDIA_PROVIDER;
  if (explicit === "r2" || explicit === "local") return explicit;
  return process.env.R2_BUCKET ? "r2" : "local";
}

function getR2Endpoint() {
  if (process.env.R2_ENDPOINT) return process.env.R2_ENDPOINT;
  if (process.env.R2_ACCOUNT_ID) {
    return `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`;
  }
  return undefined;
}

function getR2Client() {
  const endpoint = getR2Endpoint();
  if (!endpoint) {
    throw new Error("R2 endpoint not configured.");
  }
  if (!process.env.R2_ACCESS_KEY_ID || !process.env.R2_SECRET_ACCESS_KEY) {
    throw new Error("R2 credentials not configured.");
  }
  return new AwsClient({
    accessKeyId: process.env.R2_ACCESS_KEY_ID,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
    service: "s3",
    region: process.env.R2_REGION || "auto",
  });
}

export async function getSignedMediaUrl(input: { key: string; bucket?: string | null }) {
  const bucket = input.bucket || process.env.R2_BUCKET;
  if (!bucket) {
    throw new Error("R2 bucket not configured.");
  }
  const key = normalizeKey(input.key);
  const endpoint = getR2Endpoint();
  if (!endpoint) throw new Error("R2 endpoint not configured.");
  const base = endpoint.endsWith("/") ? endpoint : `${endpoint}/`;
  const url = new URL(`${bucket}/${key}`, base);
  url.searchParams.set("X-Amz-Expires", String(60 * 5));
  const signer = new AwsV4Signer({
    url: url.toString(),
    method: "GET",
    accessKeyId: process.env.R2_ACCESS_KEY_ID ?? "",
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY ?? "",
    service: "s3",
    region: process.env.R2_REGION || "auto",
    signQuery: true,
  });
  const { url: signedUrl } = await signer.sign();
  return signedUrl.toString();
}

function getFileExt(name: string) {
  const match = /\.([a-zA-Z0-9]+)$/.exec(name);
  return match ? `.${match[1].toLowerCase()}` : "";
}

export function detectImageDimensions(bytes: Uint8Array, mimeType: string) {
  try {
    const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
    const readString = (offset: number, length: number) =>
      String.fromCharCode(...bytes.slice(offset, offset + length));

    if (mimeType === "image/png" && bytes.length >= 24) {
      const signature = readString(0, 8);
      if (signature === "\x89PNG\r\n\x1a\n") {
        const width = view.getUint32(16, false);
        const height = view.getUint32(20, false);
        return { width, height };
      }
    }

    if (mimeType === "image/jpeg" && bytes.length >= 4) {
      if (bytes[0] === 0xff && bytes[1] === 0xd8) {
        let offset = 2;
        while (offset + 9 < bytes.length) {
          if (bytes[offset] !== 0xff) break;
          const marker = bytes[offset + 1];
          const length = view.getUint16(offset + 2, false);
          if (length < 2) break;
          const isSOF =
            (marker >= 0xc0 && marker <= 0xc3) ||
            (marker >= 0xc5 && marker <= 0xc7) ||
            (marker >= 0xc9 && marker <= 0xcb) ||
            (marker >= 0xcd && marker <= 0xcf);
          if (isSOF && offset + 7 < bytes.length) {
            const height = view.getUint16(offset + 5, false);
            const width = view.getUint16(offset + 7, false);
            return { width, height };
          }
          offset += 2 + length;
        }
      }
    }

    if (mimeType === "image/gif" && bytes.length >= 10) {
      const signature = readString(0, 6);
      if (signature === "GIF87a" || signature === "GIF89a") {
        const width = view.getUint16(6, true);
        const height = view.getUint16(8, true);
        return { width, height };
      }
    }

    if (mimeType === "image/webp" && bytes.length >= 30) {
      const riff = readString(0, 4);
      const webp = readString(8, 4);
      if (riff === "RIFF" && webp === "WEBP") {
        const chunkType = readString(12, 4);
        if (chunkType === "VP8X" && bytes.length >= 30) {
          const width =
            (view.getUint8(24) | (view.getUint8(25) << 8) | (view.getUint8(26) << 16)) + 1;
          const height =
            (view.getUint8(27) | (view.getUint8(28) << 8) | (view.getUint8(29) << 16)) + 1;
          return { width, height };
        }
        if (chunkType === "VP8L" && bytes.length >= 25) {
          const b0 = view.getUint8(21);
          const b1 = view.getUint8(22);
          const b2 = view.getUint8(23);
          const b3 = view.getUint8(24);
          const width = (b0 | ((b1 & 0x3f) << 8)) + 1;
          const height = (((b1 & 0xc0) >> 6) | (b2 << 2) | ((b3 & 0x0f) << 10)) + 1;
          return { width, height };
        }
        if (chunkType === "VP8 " && bytes.length >= 30) {
          const start = 20;
          if (
            bytes[start + 3] === 0x9d &&
            bytes[start + 4] === 0x01 &&
            bytes[start + 5] === 0x2a
          ) {
            const width = view.getUint16(start + 6, true) & 0x3fff;
            const height = view.getUint16(start + 8, true) & 0x3fff;
            return { width, height };
          }
        }
      }
    }
  } catch {
    return null;
  }
  return null;
}

async function getUploadKey(filename: string) {
  const ext = getFileExt(filename);
  const safeName = filename.replace(/[^a-zA-Z0-9._-]+/g, "-");
  const dated = new Date().toISOString().slice(0, 10);
  const uuid = await getRandomUuid();
  const finalName = `${uuid}-${safeName}${ext ? "" : ".bin"}`;
  return `uploads/${dated}/${finalName}`.replace(/\/+/g, "/");
}

export async function ensureMediaFromUrl(url: string, actorId?: number | null) {
  await initCloudflareD1();
  const existing = await db.queryOne<{
    id: number;
    provider: string;
    key: string;
    bucket: string | null;
    url: string | null;
    mimeType: string | null;
    size: number | null;
    width: number | null;
    height: number | null;
    createdAt: string;
    createdBy: number | null;
  }>(
    `SELECT id, provider, key, bucket, url, mimeType, size, width, height, createdAt, createdBy
     FROM media
     WHERE url = ?
     ORDER BY id DESC
     LIMIT 1`,
    [url],
  );
  if (existing) return existing;
  await db.execute(
    `INSERT INTO media (provider, key, url, createdAt, createdBy)
     VALUES (?, ?, ?, ?, ?)`,
    ["local", url, url, new Date(), actorId ?? null],
  );
  const created = await db.queryOne<{
    id: number;
    provider: string;
    key: string;
    bucket: string | null;
    url: string | null;
    mimeType: string | null;
    size: number | null;
    width: number | null;
    height: number | null;
    createdAt: string;
    createdBy: number | null;
  }>(
    `SELECT id, provider, key, bucket, url, mimeType, size, width, height, createdAt, createdBy
     FROM media
     WHERE url = ?
     ORDER BY id DESC
     LIMIT 1`,
    [url],
  );
  if (!created) throw new Error("Failed to create media.");
  return created;
}

export async function storeUploadedFile(
  file: File,
  actorId?: number | null,
  options?: { mode?: "local" | "r2" | "auto" }
) {
  await initCloudflareD1();
  const provider = options?.mode === "local" || options?.mode === "r2"
    ? options.mode
    : getMediaProvider();
  const arrayBuffer = await file.arrayBuffer();
  const buffer = new Uint8Array(arrayBuffer);
  const body = buffer.slice();
  const key = await getUploadKey(file.name || "upload");
  const size = buffer.length;
  const mimeType = file.type || "application/octet-stream";
  const dimensions = detectImageDimensions(buffer, mimeType);
  const width = dimensions?.width ?? null;
  const height = dimensions?.height ?? null;

  if (provider === "r2") {
    const bucket = process.env.R2_BUCKET;
    if (!bucket) {
      throw new Error("R2 bucket not configured.");
    }
    const endpoint = getR2Endpoint();
    if (!endpoint) throw new Error("R2 endpoint not configured.");
    const base = endpoint.endsWith("/") ? endpoint : `${endpoint}/`;
    const url = new URL(`${bucket}/${key}`, base).toString();
    const client = getR2Client();
    try {
      const response = await client.fetch(url, {
        method: "PUT",
        body,
        headers: {
          "Content-Type": mimeType,
          "Content-Length": String(size),
        },
      });
      if (!response.ok) {
        const text = await response.text().catch(() => "");
        throw new Error(`R2 upload failed (${response.status}): ${text}`);
      }
      console.log(`[media] R2 upload success: ${bucket}/${key}`);
    } catch (error) {
      console.error(`[media] R2 upload failed: ${bucket}/${key}`);
      console.error(error);
      throw error;
    }

    await db.execute(
      `INSERT INTO media (provider, key, bucket, mimeType, size, width, height, createdAt, createdBy)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      ["r2", key, bucket, mimeType, size, width, height, new Date(), actorId ?? null],
    );
    const created = await db.queryOne<{
      id: number;
      provider: string;
      key: string;
      bucket: string | null;
      url: string | null;
      mimeType: string | null;
      size: number | null;
      width: number | null;
      height: number | null;
      createdAt: string;
      createdBy: number | null;
    }>(
      `SELECT id, provider, key, bucket, url, mimeType, size, width, height, createdAt, createdBy
       FROM media
       WHERE key = ?
       ORDER BY id DESC
       LIMIT 1`,
      [key],
    );
    if (!created) throw new Error("Failed to create media.");
    return created;
  }

  const fs = await getNodeFs();
  const path = await getNodePath();
  const localUploadDir = await getLocalUploadDir();
  await fs.mkdir(path.dirname(path.join(localUploadDir, key.replace(/^uploads\//, ""))), {
    recursive: true,
  });
  await fs.writeFile(path.join(localUploadDir, key.replace(/^uploads\//, "")), buffer);

  await db.execute(
    `INSERT INTO media (provider, key, mimeType, size, width, height, createdAt, createdBy)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    ["local", key, mimeType, size, width, height, new Date(), actorId ?? null],
  );
  const created = await db.queryOne<{
    id: number;
    provider: string;
    key: string;
    bucket: string | null;
    url: string | null;
    mimeType: string | null;
    size: number | null;
    width: number | null;
    height: number | null;
    createdAt: string;
    createdBy: number | null;
  }>(
    `SELECT id, provider, key, bucket, url, mimeType, size, width, height, createdAt, createdBy
     FROM media
     WHERE key = ?
     ORDER BY id DESC
     LIMIT 1`,
    [key],
  );
  if (!created) throw new Error("Failed to create media.");
  return created;
}

function shouldPromoteToR2() {
  const explicit = process.env.MEDIA_PROVIDER;
  if (explicit === "local") return false;
  if (!isNodeRuntime()) return false;
  return Boolean(process.env.R2_BUCKET);
}

async function uploadLocalMediaToR2(media: {
  id: number;
  key: string;
  mimeType: string | null;
  size: number | null;
}) {
  await initCloudflareD1();
  const bucket = process.env.R2_BUCKET;
  if (!bucket) {
    throw new Error("R2 bucket not configured.");
  }
  if (!isNodeRuntime()) {
    throw new Error("Local media promotion requires Node runtime.");
  }
  const endpoint = getR2Endpoint();
  if (!endpoint) throw new Error("R2 endpoint not configured.");
  const base = endpoint.endsWith("/") ? endpoint : `${endpoint}/`;
  const url = new URL(`${bucket}/${media.key}`, base).toString();
  const client = getR2Client();
  const fs = await getNodeFs();
  const path = await getNodePath();
  const localUploadDir = await getLocalUploadDir();
  const localPath = path.join(localUploadDir, media.key.replace(/^uploads\//, ""));
  const buffer = await fs.readFile(localPath);
  const body = buffer.slice().buffer;
  const mimeType = media.mimeType || "application/octet-stream";
  const size = media.size ?? buffer.length;

  try {
    const response = await client.fetch(url, {
      method: "PUT",
      body,
      headers: {
        "Content-Type": mimeType,
        "Content-Length": String(size),
      },
    });
    if (!response.ok) {
      const text = await response.text().catch(() => "");
      throw new Error(`R2 publish upload failed (${response.status}): ${text}`);
    }
    console.log(`[media] R2 publish upload success: ${bucket}/${media.key}`);
  } catch (error) {
    console.error(`[media] R2 publish upload failed: ${bucket}/${media.key}`);
    console.error(error);
    throw error;
  }

  await db.execute(
    `UPDATE media
     SET provider = ?, bucket = ?, key = ?, mimeType = ?, size = ?, url = NULL
     WHERE id = ?`,
    ["r2", bucket, media.key, mimeType, size, media.id],
  );
}

export async function promoteMediaToR2(mediaIds: number[]) {
  await initCloudflareD1();
  if (!shouldPromoteToR2()) return;
  const uniqueIds = Array.from(new Set(mediaIds)).filter(Boolean);
  if (uniqueIds.length === 0) return;

  const placeholders = uniqueIds.map(() => "?").join(", ");
  const mediaRecords = await db.query<{
    id: number;
    provider: string;
    key: string;
    bucket: string | null;
    mimeType: string | null;
    size: number | null;
  }>(
    `SELECT id, provider, key, bucket, mimeType, size
     FROM media
     WHERE id IN (${placeholders})`,
    uniqueIds,
  );

  for (const media of mediaRecords) {
    if (media.provider === "r2" || media.provider === "s3") continue;
    if (media.provider !== "local") continue;
    if (!media.key.startsWith("uploads/")) continue;
    await uploadLocalMediaToR2({
      id: media.id,
      key: media.key,
      mimeType: media.mimeType,
      size: media.size,
    });
    console.log(`[media] R2 promote success: ${media.id} (${media.key})`);
  }
}

async function isMediaReferenced(mediaId: number) {
  await initCloudflareD1();
  const [localeRow, attachmentRow, introductoryVideoRow] = await Promise.all([
    db.queryOne<{ count: number }>(
      `SELECT COUNT(*) as count
       FROM post_locales
       WHERE ogImageId = ? OR featuredImageId = ?`,
      [mediaId, mediaId],
    ),
    db.queryOne<{ count: number }>(
      `SELECT COUNT(*) as count FROM post_attachments WHERE mediaId = ?`,
      [mediaId],
    ),
    db.queryOne<{ count: number }>(
      `SELECT COUNT(*) as count
       FROM introductory_video
       WHERE videoFile = ? OR thumbnail = ?`,
      [mediaId, mediaId],
    ),
  ]);
  return (
    (localeRow?.count ?? 0) > 0 ||
    (attachmentRow?.count ?? 0) > 0 ||
    (introductoryVideoRow?.count ?? 0) > 0
  );
}

async function deleteR2Object(media: { key: string; bucket: string | null }) {
  const bucket = media.bucket || process.env.R2_BUCKET;
  if (!bucket) {
    throw new Error("R2 bucket not configured.");
  }
  const endpoint = getR2Endpoint();
  if (!endpoint) throw new Error("R2 endpoint not configured.");
  const base = endpoint.endsWith("/") ? endpoint : `${endpoint}/`;
  const url = new URL(`${bucket}/${normalizeKey(media.key)}`, base).toString();
  const client = getR2Client();
  try {
    const response = await client.fetch(url, { method: "DELETE" });
    if (!response.ok) {
      const text = await response.text().catch(() => "");
      throw new Error(`R2 delete failed (${response.status}): ${text}`);
    }
    console.log(`[media] R2 delete success: ${bucket}/${media.key}`);
    return true;
  } catch (error) {
    console.error(`[media] R2 delete failed: ${bucket}/${media.key}`);
    console.error(error);
    return false;
  }
}

export async function deleteOrphanedMedia(mediaIds: number[]) {
  await initCloudflareD1();
  const uniqueIds = Array.from(new Set(mediaIds)).filter(Boolean);
  if (uniqueIds.length === 0) return;

  const placeholders = uniqueIds.map(() => "?").join(", ");
  const mediaRecords = await db.query<{
    id: number;
    provider: string;
    key: string;
    bucket: string | null;
  }>(
    `SELECT id, provider, key, bucket
     FROM media
     WHERE id IN (${placeholders})`,
    uniqueIds,
  );

  for (const media of mediaRecords) {
    const referenced = await isMediaReferenced(media.id);
    if (referenced) continue;
    if (media.provider === "r2" || media.provider === "s3") {
      const deleted = await deleteR2Object({ key: media.key, bucket: media.bucket });
      if (!deleted) continue;
      console.log(`[media] R2 delete success: ${media.id} (${media.key})`);
    }
    await db.execute(`DELETE FROM media WHERE id = ?`, [media.id]);
  }
}
