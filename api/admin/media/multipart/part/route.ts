export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { hmac } from "@noble/hashes/hmac";
import { sha256 } from "@noble/hashes/sha256";
import { bytesToHex } from "@noble/hashes/utils";
import { getSessionUser } from "@/lib/auth/auth-server";

type WorkerSignPartResponse = {
  ok?: boolean;
  error?: string;
  uploadUrl?: string;
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

async function requestSignedPartUrl(input: {
  key: string;
  uploadId: string;
  partNumber: number;
}) {
  const workerBaseUrl = process.env.MAILER_WORKER_URL?.trim() || "";
  const secret = process.env.MAILER_HMAC_SECRET?.trim() || "";
  if (!workerBaseUrl || !secret) {
    return {
      ok: false,
      status: 500,
      error: "MAILER_WORKER_URL or MAILER_HMAC_SECRET is missing.",
      uploadUrl: "",
    };
  }

  const endpoint = new URL("/filesupload/multipart", workerBaseUrl);
  const body = JSON.stringify({
    action: "signPart",
    key: input.key,
    uploadId: input.uploadId,
    partNumber: input.partNumber,
  });
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
    const data = (await response.json().catch(() => null)) as
      | WorkerSignPartResponse
      | null;
    if (!response.ok || !data?.ok || !data.uploadUrl) {
      return {
        ok: false,
        status: response.status || 502,
        error: data?.error || "Failed to get signed part upload URL.",
        uploadUrl: "",
      };
    }
    return { ok: true, status: 200, error: "", uploadUrl: data.uploadUrl };
  } catch (error) {
    return {
      ok: false,
      status: 502,
      error: error instanceof Error ? error.message : String(error),
      uploadUrl: "",
    };
  }
}

export async function POST(request: Request) {
  const user = await getSessionUser();
  if (!user || (user.role !== "superuser" && user.role !== "author")) {
    return NextResponse.json({ ok: false, error: "Unauthorized." }, { status: 401 });
  }

  const formData = await request.formData();
  const key = String(formData.get("key") || "").trim();
  const uploadId = String(formData.get("uploadId") || "").trim();
  const partNumber = Number(String(formData.get("partNumber") || "0"));
  const file = formData.get("file");
  const contentType = String(formData.get("contentType") || "").trim();

  if (!key || !uploadId || !Number.isInteger(partNumber) || partNumber < 1 || partNumber > 10000) {
    return NextResponse.json(
      {
        ok: false,
        error: "key, uploadId and valid partNumber (1-10000) are required.",
      },
      { status: 400 },
    );
  }
  if (!(file instanceof File)) {
    return NextResponse.json({ ok: false, error: "file is required." }, { status: 400 });
  }

  const signed = await requestSignedPartUrl({ key, uploadId, partNumber });
  if (!signed.ok) {
    return NextResponse.json({ ok: false, error: signed.error }, { status: signed.status });
  }

  const uploadResponse = await fetch(signed.uploadUrl, {
    method: "PUT",
    body: file,
    headers: {
      "Content-Type": contentType || file.type || "application/octet-stream",
    },
  });

  if (!uploadResponse.ok) {
    const details = (await uploadResponse.text().catch(() => "")).slice(0, 300);
    return NextResponse.json(
      {
        ok: false,
        error: `Part upload failed (${uploadResponse.status}).`,
        details: details || undefined,
      },
      { status: 502 },
    );
  }

  const eTag = uploadResponse.headers.get("etag")?.trim();
  if (!eTag) {
    return NextResponse.json(
      { ok: false, error: "Missing ETag in part upload response." },
      { status: 502 },
    );
  }

  return NextResponse.json({
    ok: true,
    partNumber,
    eTag,
  });
}
