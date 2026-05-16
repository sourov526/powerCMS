import type { MetadataRoute } from "next";
import { headers } from "next/headers";
import { resolveSiteUrlFromHeaders } from "@/lib/site";

export const dynamic = "force-dynamic";

export default async function robots(): Promise<MetadataRoute.Robots> {
  const requestHeaders = await headers();
  const baseUrl = resolveSiteUrlFromHeaders((name) =>
    requestHeaders.get(name),
  );

  return {
    rules: [
      {
        userAgent: "*",
        allow: "/admin",
        disallow: ["/api", "/admin/editor"],
      },
    ],
    sitemap: [
      `${baseUrl}/admin/sitemap.xml`,
      `${baseUrl}/admin/sitemap-images.xml`,
    ],
  };
}
