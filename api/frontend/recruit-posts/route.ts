export const runtime = "nodejs";
import { db } from "@/lib/db";
import { initCloudflareD1 } from "@/lib/db-cloudflare";
import { NextResponse } from "next/server";

type RecruitPostRow = {
  id: number;
  slug: string;
  title: string;
  recruitType: "external" | "internal";
  positionAvailable: string | null;
  jobDescription: string | null;
  requirements: string | null;
  location: string | null;
  workingHours: string | null;
  employmentType: string | null;
  salary: string | null;
  benefits: string | null;
  holidays: string | null;
  externalLink: string | null;
  department: string | null;
  jobSummary: string | null;
  applicationDeadLine: string | null;
  status: "draft" | "published" | "scheduled" | "archived";
  createdAt: string;
  updatedAt: string;
  publishedAt: string | null;
  createdBy: number | null;
  updatedBy: number | null;
};

export async function POST(request: Request) {
  await initCloudflareD1();
  const body = (await request.json()) as {
    recruitType: string;
    limit?: number;
    allFields?: boolean;
  };
  const allFields = body.allFields ?? false;
  const recruitType = body.recruitType;
  const posts = await db.query<RecruitPostRow>(
    `SELECT ${
      allFields
        ? "rp.*, rps.*"
        : "rp.id, rp.slug, rp.title, rp.recruitType, rp.status, rp.createdAt, rp.publishedAt, rps.externalLink"
    }
     FROM recruit_posts as rp
     LEFT JOIN recruit_post_sections as rps
       ON rps.recruitPostId = rp.id
     WHERE rp.status = 'published' AND rp.recruitType = '${recruitType}'
     ORDER BY rp.updatedAt DESC
     ${body.limit ? `LIMIT ${body.limit}` : ""}`
  );

  return NextResponse.json({ posts });
}
