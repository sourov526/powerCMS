import { NextResponse } from "next/server";

import * as profile from "./profile/route";
import * as imageExists from "./image-exists/route";
import * as memberSections from "./member-sections/route";
import * as recruitPosts from "./recruit-posts/route";
import * as notFoundPing from "./404/route";

type RouteModule = Record<string, unknown>;
type RouteHandler = (request: Request, context?: unknown) => Response | Promise<Response>;

function getHandler(mod: RouteModule, method: string): RouteHandler | null {
  const handler = mod[method] as unknown;
  if (typeof handler !== "function") return null;
  return handler as RouteHandler;
}

function methodNotAllowed() {
  return NextResponse.json({ error: "Method not allowed." }, { status: 405 });
}

// Returns `null` when the path is not owned by the frontend API group.
export async function handleFrontendApiRequest(request: Request): Promise<Response | null> {
  const url = new URL(request.url);
  const pathname = url.pathname;
  const method = request.method.toUpperCase();

  if (pathname === "/api/contacts") {
    return NextResponse.json(
      { error: "Contact form endpoint is disabled." },
      { status: 410 },
    );
  }
  if (pathname === "/api/contacts/export") {
    return NextResponse.json(
      { error: "Contact export endpoint is disabled." },
      { status: 410 },
    );
  }
  if (pathname === "/api/profile") {
    const handler = getHandler(profile, method);
    return handler ? handler(request) : methodNotAllowed();
  }
  if (pathname === "/api/image-exists") {
    const handler = getHandler(imageExists, method);
    return handler ? handler(request) : methodNotAllowed();
  }
  if (pathname === "/api/member-sections") {
    const handler = getHandler(memberSections, method);
    return handler ? handler(request) : methodNotAllowed();
  }
  if (pathname === "/api/recruit-posts") {
    const handler = getHandler(recruitPosts, method);
    return handler ? handler(request) : methodNotAllowed();
  }
  if (pathname === "/api/recruit-entries") {
    return NextResponse.json(
      { error: "Apply form endpoint is disabled." },
      { status: 410 },
    );
  }
  if (pathname === "/api/recruit-entries/export") {
    return NextResponse.json(
      { error: "Apply form export endpoint is disabled." },
      { status: 410 },
    );
  }
  if (pathname === "/api/404") {
    const handler = getHandler(notFoundPing, method);
    return handler ? handler(request) : methodNotAllowed();
  }

  return null;
}
