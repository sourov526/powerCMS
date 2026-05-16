import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

const AUTH_COOKIE_NAME = "corp_auth";
const ADMIN_AUTH_ROUTES = new Set([
  "/admin/login",
  "/admin/register",
  "/admin/forgot-password",
  "/admin/reset-password",
]);

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname === "/admin" || pathname.startsWith("/admin/")) {
    if (!ADMIN_AUTH_ROUTES.has(pathname)) {
      const token = request.cookies.get(AUTH_COOKIE_NAME)?.value;
      if (!token) {
        const url = request.nextUrl.clone();
        url.pathname = "/admin/login";
        return NextResponse.redirect(url);
      }
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next|api|__nextjs(?:_original-stack-frames)?|.*\\..*).*)"],
};
