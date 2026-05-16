export const runtime = "nodejs";
import { NextResponse } from "next/server";
import { getSignedMediaUrl } from "@/lib/services/media";

async function proxyMedia(request: Request, method: "GET" | "HEAD") {
  const url = new URL(request.url);
  const key = url.searchParams.get("key");
  const bucket = url.searchParams.get("bucket");

  if (!key) {
    return NextResponse.json({ error: "Missing key." }, { status: 400 });
  }

  const signedUrl = await getSignedMediaUrl({ key, bucket });
  const upstream = await fetch(signedUrl, { method, cache: "no-store" });
  if (!upstream.ok) {
    return NextResponse.json(
      { error: `Upstream media fetch failed (${upstream.status}).` },
      { status: 502 },
    );
  }

  const headers = new Headers();
  const contentType = upstream.headers.get("content-type");
  const contentLength = upstream.headers.get("content-length");
  const etag = upstream.headers.get("etag");
  const lastModified = upstream.headers.get("last-modified");
  if (contentType) headers.set("Content-Type", contentType);
  if (contentLength) headers.set("Content-Length", contentLength);
  if (etag) headers.set("ETag", etag);
  if (lastModified) headers.set("Last-Modified", lastModified);
  headers.set("Cache-Control", "public, max-age=300, s-maxage=300");

  return new NextResponse(method === "HEAD" ? null : upstream.body, {
    status: 200,
    headers,
  });
}

export async function GET(request: Request) {
  try {
    return await proxyMedia(request, "GET");
  } catch (error) {
    console.error("[media] Signed URL failed", error);
    return NextResponse.json({ error: "Signed URL failed." }, { status: 500 });
  }
}

export async function HEAD(request: Request) {
  try {
    return await proxyMedia(request, "HEAD");
  } catch (error) {
    console.error("[media] Signed URL failed", error);
    return NextResponse.json({ error: "Signed URL failed." }, { status: 500 });
  }
}
