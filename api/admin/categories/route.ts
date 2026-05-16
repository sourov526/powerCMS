export const runtime = "nodejs";
import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth/auth-server";
import { db } from "@/lib/db";
import { initCloudflareD1 } from "@/lib/db-cloudflare";
import { normalizeSlug } from "@/lib/utils/slug";

export async function GET() {
  await initCloudflareD1();
  const user = await getSessionUser();
  if (!user || (user.role !== "superuser" && user.role !== "author")) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const categories = await db.query<{
    id: number;
    name: string;
    slug: string;
    intro: string | null;
  }>(
    `SELECT id, name, slug, intro
     FROM categories
     ORDER BY name ASC`,
  );

  return NextResponse.json({ categories });
}

export async function POST(request: Request) {
  await initCloudflareD1();
  const user = await getSessionUser();
  if (!user || (user.role !== "superuser" && user.role !== "author")) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const body = (await request.json()) as {
    name?: string;
    slug?: string;
    intro?: string;
  };
  const name = (body.name ?? "").trim();
  const intro = (body.intro ?? "").trim() || null;
  const slugInput = body.slug ? body.slug.trim() : "";
  const slug = normalizeSlug(slugInput || name);

  if (!name || !slug) {
    return NextResponse.json({ error: "Missing required fields." }, { status: 400 });
  }

  const existing = await db.queryOne<{ id: number }>(
    `SELECT id FROM categories WHERE slug = ?`,
    [slug],
  );
  if (existing) {
    return NextResponse.json({ error: "Slug already exists." }, { status: 409 });
  }

  await db.execute(
    `INSERT INTO categories (name, slug, intro, createdAt, createdBy, updatedBy)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [name, slug, intro, new Date(), user.id, user.id],
  );
  const created = await db.queryOne<{
    id: number;
    name: string;
    slug: string;
    intro: string | null;
  }>(
    `SELECT id, name, slug, intro
     FROM categories
     WHERE slug = ?
     ORDER BY id DESC
     LIMIT 1`,
    [slug],
  );
  if (!created) {
    return NextResponse.json({ error: "Failed to create category." }, { status: 500 });
  }

  return NextResponse.json({ category: created });
}
