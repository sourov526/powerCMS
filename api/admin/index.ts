import { NextResponse } from "next/server";

import * as trpcRoute from "./trpc/[trpc]/route";

import * as authSession from "./auth/session/route";
import * as authLogin from "./auth/login/route";
import * as authLoginVerify from "./auth/login/verify/route";
import * as authLogout from "./auth/logout/route";
import * as authRegister from "./auth/register/route";
import * as authForgotPassword from "./auth/forgot-password/route";
import * as authResetPassword from "./auth/reset-password/route";
import * as authResetPasswordVerify from "./auth/reset-password/verify/route";
import * as authChangePassword from "./auth/change-password/route";
import * as authChangePasswordVerify from "./auth/change-password/verify/route";
import * as auth2faEnable from "./auth/2fa/enable/route";
import * as auth2faDisable from "./auth/2fa/disable/route";
import * as auth2faVerify from "./auth/2fa/verify/route";

import * as drafts from "./drafts/route";

import * as adminCategories from "./categories/route";
import * as adminSlugAvailability from "./slug-availability/route";
import * as adminUsersRole from "./users/role/route";
import * as adminUsersStatus from "./users/status/route";

import * as adminPostsPublish from "./posts/publish/route";
import * as adminPostsArchive from "./posts/archive/route";
import * as adminPostsDelete from "./posts/delete/route";
import * as adminPostsPreviewToken from "./posts/preview-token/route";

import * as adminRecruitPostsPublish from "./recruit-posts/publish/route";
import * as adminRecruitPostsArchive from "./recruit-posts/archive/route";
import * as adminRecruitPostsDelete from "./recruit-posts/delete/route";

import * as adminNotifications from "./notifications/route";
import * as adminNotificationsReadAll from "./notifications/read/route";
import * as adminNotificationRead from "./notifications/[id]/read/route";
import * as adminNotificationDelete from "./notifications/[id]/route";

import * as adminMediaDefaultOg from "./media/default-og/route";
import * as adminMediaUpload from "./media/upload/route";
import * as adminMediaDelete from "./media/delete/route";
import * as adminMediaSigned from "./media/signed/route";
import * as adminMediaMultipart from "./media/multipart/route";
import * as adminMediaMultipartPart from "./media/multipart/part/route";
import * as adminMediaBackfillDimensions from "./media/backfill-dimensions/route";

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

function extractId(pathname: string, prefix: string, suffix: string) {
  if (!pathname.startsWith(prefix) || !pathname.endsWith(suffix)) return null;
  const idPart = pathname.slice(prefix.length, pathname.length - suffix.length);
  if (!idPart) return null;
  if (!/^\d+$/.test(idPart)) return null;
  return idPart;
}

// Returns `null` when the path is not owned by the admin API group.
export async function handleAdminApiRequest(request: Request): Promise<Response | null> {
  const url = new URL(request.url);
  const pathname = url.pathname;
  const method = request.method.toUpperCase();

  // tRPC (catch-all)
  if (pathname === "/api/trpc" || pathname.startsWith("/api/trpc/")) {
    const handler = getHandler(trpcRoute, method);
    return handler ? handler(request) : methodNotAllowed();
  }

  // Auth
  if (pathname === "/api/auth/session") {
    const handler = getHandler(authSession, method);
    return handler ? handler(request) : methodNotAllowed();
  }
  if (pathname === "/api/auth/login") {
    const handler = getHandler(authLogin, method);
    return handler ? handler(request) : methodNotAllowed();
  }
  if (pathname === "/api/auth/login/verify") {
    const handler = getHandler(authLoginVerify, method);
    return handler ? handler(request) : methodNotAllowed();
  }
  if (pathname === "/api/auth/logout") {
    const handler = getHandler(authLogout, method);
    return handler ? handler(request) : methodNotAllowed();
  }
  if (pathname === "/api/auth/register") {
    const handler = getHandler(authRegister, method);
    return handler ? handler(request) : methodNotAllowed();
  }
  if (pathname === "/api/auth/forgot-password") {
    const handler = getHandler(authForgotPassword, method);
    return handler ? handler(request) : methodNotAllowed();
  }
  if (pathname === "/api/auth/reset-password") {
    const handler = getHandler(authResetPassword, method);
    return handler ? handler(request) : methodNotAllowed();
  }
  if (pathname === "/api/auth/reset-password/verify") {
    const handler = getHandler(authResetPasswordVerify, method);
    return handler ? handler(request) : methodNotAllowed();
  }
  if (pathname === "/api/auth/change-password") {
    const handler = getHandler(authChangePassword, method);
    return handler ? handler(request) : methodNotAllowed();
  }
  if (pathname === "/api/auth/change-password/verify") {
    const handler = getHandler(authChangePasswordVerify, method);
    return handler ? handler(request) : methodNotAllowed();
  }
  if (pathname === "/api/auth/2fa/enable") {
    const handler = getHandler(auth2faEnable, method);
    return handler ? handler(request) : methodNotAllowed();
  }
  if (pathname === "/api/auth/2fa/disable") {
    const handler = getHandler(auth2faDisable, method);
    return handler ? handler(request) : methodNotAllowed();
  }
  if (pathname === "/api/auth/2fa/verify") {
    const handler = getHandler(auth2faVerify, method);
    return handler ? handler(request) : methodNotAllowed();
  }

  // Admin (legacy root paths)
  if (pathname === "/api/drafts") {
    const handler = getHandler(drafts, method);
    return handler ? handler(request) : methodNotAllowed();
  }

  // Admin routes (/api/admin/*)
  if (pathname === "/api/admin/categories") {
    const handler = getHandler(adminCategories, method);
    return handler ? handler(request) : methodNotAllowed();
  }
  if (pathname === "/api/admin/slug-availability") {
    const handler = getHandler(adminSlugAvailability, method);
    return handler ? handler(request) : methodNotAllowed();
  }
  if (pathname === "/api/admin/users/role") {
    const handler = getHandler(adminUsersRole, method);
    return handler ? handler(request) : methodNotAllowed();
  }
  if (pathname === "/api/admin/users/status") {
    const handler = getHandler(adminUsersStatus, method);
    return handler ? handler(request) : methodNotAllowed();
  }

  if (pathname === "/api/admin/posts/publish") {
    const handler = getHandler(adminPostsPublish, method);
    return handler ? handler(request) : methodNotAllowed();
  }
  if (pathname === "/api/admin/posts/archive") {
    const handler = getHandler(adminPostsArchive, method);
    return handler ? handler(request) : methodNotAllowed();
  }
  if (pathname === "/api/admin/posts/delete") {
    const handler = getHandler(adminPostsDelete, method);
    return handler ? handler(request) : methodNotAllowed();
  }
  if (pathname === "/api/admin/posts/preview-token") {
    const handler = getHandler(adminPostsPreviewToken, method);
    return handler ? handler(request) : methodNotAllowed();
  }

  if (pathname === "/api/admin/recruit-posts/publish") {
    const handler = getHandler(adminRecruitPostsPublish, method);
    return handler ? handler(request) : methodNotAllowed();
  }
  if (pathname === "/api/admin/recruit-posts/archive") {
    const handler = getHandler(adminRecruitPostsArchive, method);
    return handler ? handler(request) : methodNotAllowed();
  }
  if (pathname === "/api/admin/recruit-posts/delete") {
    const handler = getHandler(adminRecruitPostsDelete, method);
    return handler ? handler(request) : methodNotAllowed();
  }

  if (pathname === "/api/admin/notifications") {
    const handler = getHandler(adminNotifications, method);
    return handler ? handler(request) : methodNotAllowed();
  }
  if (pathname === "/api/admin/notifications/read") {
    const handler = getHandler(adminNotificationsReadAll, method);
    return handler ? handler(request) : methodNotAllowed();
  }
  {
    const id = extractId(pathname, "/api/admin/notifications/", "/read");
    if (id) {
      const handler = getHandler(adminNotificationRead, method);
      return handler
        ? handler(request, { params: Promise.resolve({ id }) })
        : methodNotAllowed();
    }
  }
  {
    const id = extractId(pathname, "/api/admin/notifications/", "");
    if (id) {
      const handler = getHandler(adminNotificationDelete, method);
      return handler
        ? handler(request, { params: Promise.resolve({ id }) })
        : methodNotAllowed();
    }
  }

  // Media (legacy root paths)
  if (pathname === "/api/media/default-og") {
    const handler = getHandler(adminMediaDefaultOg, method);
    return handler ? handler(request) : methodNotAllowed();
  }
  if (pathname === "/api/media/upload") {
    const handler = getHandler(adminMediaUpload, method);
    return handler ? handler(request) : methodNotAllowed();
  }
  if (pathname === "/api/media/delete") {
    const handler = getHandler(adminMediaDelete, method);
    return handler ? handler(request) : methodNotAllowed();
  }
  if (pathname === "/api/media/signed") {
    const handler = getHandler(adminMediaSigned, method);
    return handler ? handler(request) : methodNotAllowed();
  }
  if (pathname === "/api/media/multipart") {
    const handler = getHandler(adminMediaMultipart, method);
    return handler ? handler(request) : methodNotAllowed();
  }
  if (pathname === "/api/media/multipart/part") {
    const handler = getHandler(adminMediaMultipartPart, method);
    return handler ? handler(request) : methodNotAllowed();
  }
  if (pathname === "/api/admin/media/backfill-dimensions") {
    const handler = getHandler(adminMediaBackfillDimensions, method);
    return handler ? handler(request) : methodNotAllowed();
  }

  return null;
}
