import { NextResponse } from "next/server";
import { handleAdminApiRequest } from "./admin";
import { handleFrontendApiRequest } from "./frontend";

function notFound() {
  return NextResponse.json({ error: "Not found." }, { status: 404 });
}

export async function handleApiRequest(request: Request): Promise<Response> {
  const url = new URL(request.url);
  const pathname = url.pathname;
  const method = request.method.toUpperCase();

  if (method === "OPTIONS") {
    return new Response(null, { status: 204 });
  }

  if (!pathname.startsWith("/api")) {
    return notFound();
  }

  const adminResponse = await handleAdminApiRequest(request);
  if (adminResponse) return adminResponse;

  const frontendResponse = await handleFrontendApiRequest(request);
  if (frontendResponse) return frontendResponse;

  return notFound();
}
