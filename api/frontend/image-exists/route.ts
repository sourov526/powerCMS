import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const src = request.nextUrl.searchParams.get("src") || "";
  if (!src.startsWith("/")) {
    return NextResponse.json({ exists: false }, { status: 200 });
  }

  let exists = false;
  try {
    const url = new URL(src, request.url);
    let response = await fetch(url, {
      method: "HEAD",
      cache: "no-store",
    });
    if (response.status === 405) {
      response = await fetch(url, {
        method: "GET",
        cache: "no-store",
      });
    }
    exists = response.ok;
  } catch {
    exists = false;
  }
  return NextResponse.json({ exists }, { status: 200 });
}
