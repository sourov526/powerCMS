export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth/auth-server";
import { getDefaultOgImagePath } from "@/lib/services/default-og-media";
import { resolveSiteUrlFromHeaders } from "@/lib/site";

export async function GET(request: Request) {
  const user = await getSessionUser();
  if (!user || (user.role !== "superuser" && user.role !== "author")) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const baseUrl = resolveSiteUrlFromHeaders((name) =>
    request.headers.get(name),
  );
  const url = await getDefaultOgImagePath(baseUrl);
  return NextResponse.json({ url });
}
