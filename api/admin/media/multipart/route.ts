export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { hmac } from "@noble/hashes/hmac";
import { sha256 } from "@noble/hashes/sha256";
import { bytesToHex } from "@noble/hashes/utils";
import { getSessionUser } from "@/lib/auth/auth-server";
import { db } from "@/lib/db";
import { initCloudflareD1 } from "@/lib/db-cloudflare";
import { resolveMediaUrl } from "@/lib/media";

type MultipartAction = "init" | "signPart" | "complete" | "abort";

type MultipartRequestBody = {
  action?: MultipartAction;
  fileName?: string;
  contentType?: string;
  size?: number;
  folder?: string;
  key?: string;
  uploadId?: string;
  partNumber?: number;
  parts?: Array<{ partNumber: number; eTag: string }>;
  expiresInSeconds?: number;
};

type WorkerJson = {
  ok?: boolean;
  error?: string;
  bucket?: string;
  key?: string;
  url?: string;
  size?: number;
  contentType?: string;
  uploadId?: string;
  partSize?: number;
  partCount?: number;
  uploadUrl?: string;
  partNumber?: number;
  expiresInSeconds?: number;
  details?: string;
};

function toBytes(input: string) {
  return new TextEncoder().encode(input);
}

function buildMailerSignature(input: {
  secret: string;
  method: string;
  pathWithQuery: string;
  timestamp: string;
  body: string;
}) {
  const canonical = [
    input.method.toUpperCase(),
    input.pathWithQuery,
    input.timestamp,
    input.body,
  ].join("\n");
  return bytesToHex(hmac(sha256, toBytes(input.secret), toBytes(canonical)));
}

async function callWorkerMultipart(payload: MultipartRequestBody) {
  const workerBaseUrl = process.env.MAILER_WORKER_URL?.trim() || "";
  const secret = process.env.MAILER_HMAC_SECRET?.trim() || "";
  if (!workerBaseUrl || !secret) {
    return {
      ok: false,
      status: 500,
      data: {
        ok: false,
        error: "MAILER_WORKER_URL or MAILER_HMAC_SECRET is missing.",
      } as WorkerJson,
    };
  }

  const endpoint = new URL("/filesupload/multipart", workerBaseUrl);
  const body = JSON.stringify(payload);
  const timestamp = String(Math.floor(Date.now() / 1000));
  const pathWithQuery = `${endpoint.pathname}${endpoint.search}`;
  const signature = buildMailerSignature({
    secret,
    method: "POST",
    pathWithQuery,
    timestamp,
    body,
  });

  try {
    const response = await fetch(endpoint.toString(), {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Mailer-Timestamp": timestamp,
        "X-Mailer-Signature": signature,
      },
      body,
    });
    const data = (await response.json().catch(() => null)) as WorkerJson | null;
    return {
      ok: response.ok,
      status: response.status,
      data: data || {
        ok: false,
        error: `Worker returned ${response.status} without JSON body.`,
      },
    };
  } catch (error) {
    return {
      ok: false,
      status: 502,
      data: {
        ok: false,
        error: error instanceof Error ? error.message : String(error),
      },
    };
  }
}

async function createR2MediaRecord(input: {
  key: string;
  bucket?: string;
  size?: number;
  contentType?: string;
  actorId: number;
}) {
  await initCloudflareD1();
  const bucket = input.bucket?.trim() || process.env.R2_BUCKET?.trim() || null;
  const mimeType = input.contentType?.trim() || "application/octet-stream";
  const size =
    typeof input.size === "number" && Number.isFinite(input.size)
      ? Math.max(0, Math.floor(input.size))
      : null;

  await db.execute(
    `INSERT INTO media (provider, key, bucket, mimeType, size, createdAt, createdBy)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    ["r2", input.key, bucket, mimeType, size, new Date(), input.actorId],
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
     WHERE provider = 'r2' AND key = ?
     ORDER BY id DESC
     LIMIT 1`,
    [input.key],
  );
  if (!created) {
    throw new Error("Failed to create media record after multipart complete.");
  }
  return created;
}

export async function POST(request: Request) {
  const user = await getSessionUser();
  if (!user || (user.role !== "superuser" && user.role !== "author")) {
    return NextResponse.json({ ok: false, error: "Unauthorized." }, { status: 401 });
  }

  let body: MultipartRequestBody;
  try {
    body = (await request.json()) as MultipartRequestBody;
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid JSON body." }, { status: 400 });
  }

  if (!body.action) {
    return NextResponse.json({ ok: false, error: "action is required." }, { status: 400 });
  }

  const workerResult = await callWorkerMultipart(body);
  if (!workerResult.ok || !workerResult.data?.ok) {
    return NextResponse.json(
      {
        ok: false,
        error: workerResult.data?.error || "Multipart worker request failed.",
        details: workerResult.data?.details,
      },
      { status: workerResult.status },
    );
  }

  if (body.action !== "complete") {
    return NextResponse.json(workerResult.data, { status: 200 });
  }

  const key = workerResult.data.key?.trim();
  if (!key) {
    return NextResponse.json(
      { ok: false, error: "Worker complete response missing key." },
      { status: 502 },
    );
  }

  try {
    const media = await createR2MediaRecord({
      key,
      bucket: workerResult.data.bucket,
      size: workerResult.data.size,
      contentType: workerResult.data.contentType,
      actorId: user.id,
    });
    return NextResponse.json(
      {
        ok: true,
        id: media.id,
        url: resolveMediaUrl(media),
        key: media.key,
        provider: media.provider,
        mimeType: media.mimeType,
        size: media.size,
        width: media.width,
        height: media.height,
      },
      { status: 200 },
    );
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error:
          error instanceof Error
            ? error.message
            : "Failed to save media record after multipart complete.",
      },
      { status: 500 },
    );
  }
}
