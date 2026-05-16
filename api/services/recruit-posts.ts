import { db } from "@/lib/db";
import { initCloudflareD1 } from "@/lib/db-cloudflare";

export type RecruitPostStatus =
  | "draft"
  | "published"
  | "scheduled"
  | "archived";
export type RecruitPostType = "job" | "recruit";

type DbRecruitPostType = RecruitPostType | "internal" | "external";

type RecruitTypeMode = "job-recruit" | "internal-external";
let recruitTypeMode: RecruitTypeMode | null = null;
let recruitTypeModePromise: Promise<RecruitTypeMode> | null = null;

async function resolveRecruitTypeMode(): Promise<RecruitTypeMode> {
  if (recruitTypeMode) return recruitTypeMode;
  if (!recruitTypeModePromise) {
    recruitTypeModePromise = (async () => {
      try {
        const row = await db.queryOne<{ sql: string }>(
          "SELECT sql FROM sqlite_master WHERE type = 'table' AND name = 'recruit_posts' LIMIT 1",
        );
        const sql = row?.sql ?? "";
        if (sql.includes("recruitType IN ('internal', 'external')")) {
          return "internal-external" as const;
        }
      } catch {
        // ignore detection errors and fall back to new enum
      }
      return "job-recruit" as const;
    })().then((mode) => {
      recruitTypeMode = mode;
      return mode;
    });
  }
  return recruitTypeModePromise;
}

function normalizeRecruitType(value: DbRecruitPostType | null): RecruitPostType {
  if (value === "internal") return "job";
  if (value === "external") return "recruit";
  return value ?? "job";
}

async function resolveRecruitTypeForWrite(
  value: RecruitPostType,
): Promise<DbRecruitPostType> {
  const mode = await resolveRecruitTypeMode();
  if (mode === "internal-external") {
    return value === "recruit" ? "external" : "internal";
  }
  return value;
}

export type RecruitPostFields = {
  positionAvailable?: string | null;
  jobDescription?: string | null;
  requirements?: string | null;
  location?: string | null;
  workingHours?: string | null;
  employmentType?: string | null;
  salary?: string | null;
  benefits?: string | null;
  holidays?: string | null;
  externalLink?: string | null;
};

export type RecruitPost = {
  id: number;
  slug: string;
  title: string;
  department?: string | null;
  jobSummary?: string | null;
  applicationDeadLine?: string | null;
  recruitType: RecruitPostType;
  status: RecruitPostStatus;
  createdAt: string;
  updatedAt: string;
  publishedAt?: string | null;
  createdBy?: number | null;
  updatedBy?: number | null;
  createdByUser?: {
    id: number;
    name: string | null;
    email: string;
    role: string;
  } | null;
  fields?: RecruitPostFields;
};

type RecruitPostRow = {
  id: number;
  slug: string;
  title: string;
  department?: string | null;
  jobSummary?: string | null;
  applicationDeadLine?: string | null;
  recruitType: DbRecruitPostType;
  status: RecruitPostStatus;
  createdAt: string;
  updatedAt: string;
  publishedAt: string | null;
  createdBy: number | null;
  updatedBy: number | null;
  createdByUserId: number | null;
  createdByUserName: string | null;
  createdByUserEmail: string | null;
  createdByUserRole: string | null;
};

type RecruitPostSectionRow = {
  id: number;
  recruitPostId: number;
  department: string | null;
  jobSummary: string | null;
  applicationDeadLine: string | null;
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
};

export async function getAllRecruitPostsForAdmin(): Promise<RecruitPost[]> {
  await initCloudflareD1();
  const rows = await db.query<RecruitPostRow>(
    `SELECT jp.*, u.id as createdByUserId, u.name as createdByUserName, u.email as createdByUserEmail, u.role as createdByUserRole,
            rps.department as department, rps.jobSummary as jobSummary, rps.applicationDeadLine as applicationDeadLine
     FROM recruit_posts jp
     LEFT JOIN users u ON u.id = jp.createdBy
     LEFT JOIN recruit_post_sections rps
       ON rps.recruitPostId = jp.id
      AND rps.id = (
        SELECT MIN(id)
        FROM recruit_post_sections
        WHERE recruitPostId = jp.id
      )
     ORDER BY jp.updatedAt DESC`,
  );
  return rows.map((row) => ({
    id: row.id,
    slug: row.slug,
    title: row.title,
    department: row.department,
    jobSummary: row.jobSummary,
    applicationDeadLine: row.applicationDeadLine,
    recruitType: normalizeRecruitType(row.recruitType),
    status: row.status,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    publishedAt: row.publishedAt,
    createdBy: row.createdBy,
    updatedBy: row.updatedBy,
    createdByUser: row.createdByUserId
      ? {
          id: row.createdByUserId,
          name: row.createdByUserName,
          email: row.createdByUserEmail ?? "",
          role: row.createdByUserRole ?? "",
        }
      : null,
  }));
}

export async function getPublishedRecruitPosts(): Promise<RecruitPost[]> {
  await initCloudflareD1();
  const now = new Date().toISOString();
  const rows = await db.query<RecruitPostRow>(
    `SELECT jp.*, u.id as createdByUserId, u.name as createdByUserName, u.email as createdByUserEmail, u.role as createdByUserRole,
            rps.department as department, rps.jobSummary as jobSummary, rps.applicationDeadLine as applicationDeadLine
     FROM recruit_posts jp
     LEFT JOIN users u ON u.id = jp.createdBy
     LEFT JOIN recruit_post_sections rps
       ON rps.recruitPostId = jp.id
      AND rps.id = (
        SELECT MIN(id)
        FROM recruit_post_sections
        WHERE recruitPostId = jp.id
      )
     WHERE jp.status = 'published'
       AND (jp.publishedAt <= ? OR jp.publishedAt IS NULL)
     ORDER BY COALESCE(jp.publishedAt, jp.updatedAt) DESC`,
    [now],
  );
  return rows.map((row) => ({
    id: row.id,
    slug: row.slug,
    title: row.title,
    department: row.department,
    jobSummary: row.jobSummary,
    applicationDeadLine: row.applicationDeadLine,
    recruitType: normalizeRecruitType(row.recruitType),
    status: row.status,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    publishedAt: row.publishedAt,
    createdBy: row.createdBy,
    updatedBy: row.updatedBy,
    createdByUser: row.createdByUserId
      ? {
          id: row.createdByUserId,
          name: row.createdByUserName,
          email: row.createdByUserEmail ?? "",
          role: row.createdByUserRole ?? "",
        }
      : null,
  }));
}

export async function getRecruitPostBySlug(
  slug: string,
): Promise<RecruitPost | undefined> {
  await initCloudflareD1();

  const queryBySlug = async (value: string) =>
    db.queryOne<RecruitPostRow>(
      `SELECT jp.*, u.id as createdByUserId, u.name as createdByUserName, u.email as createdByUserEmail, u.role as createdByUserRole
       FROM recruit_posts jp
       LEFT JOIN users u ON u.id = jp.createdBy
       WHERE jp.slug = ?
       LIMIT 1`,
      [value],
    );

  let row = await queryBySlug(slug);
  if (!row) {
    let alternate: string | null = null;
    if (slug.includes("%")) {
      try {
        alternate = decodeURIComponent(slug);
      } catch {
        alternate = null;
      }
    } else {
      const encoded = encodeURIComponent(slug);
      if (encoded !== slug) alternate = encoded;
    }
    if (alternate && alternate !== slug) {
      row = await queryBySlug(alternate);
    }
  }
  if (!row) return undefined;
  const sections = await db.query<RecruitPostSectionRow>(
    `SELECT id, recruitPostId, department, jobSummary, applicationDeadLine, positionAvailable, jobDescription, requirements, location,
            workingHours, employmentType, salary, benefits, holidays, externalLink
     FROM recruit_post_sections
     WHERE recruitPostId = ?
     ORDER BY id ASC`,
    [row.id],
  );
  const fields = sections[0]
    ? {
        positionAvailable: sections[0].positionAvailable,
        jobDescription: sections[0].jobDescription,
        requirements: sections[0].requirements,
        location: sections[0].location,
        workingHours: sections[0].workingHours,
        employmentType: sections[0].employmentType,
        salary: sections[0].salary,
        benefits: sections[0].benefits,
        holidays: sections[0].holidays,
        externalLink: sections[0].externalLink,
      }
    : undefined;
  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    department: sections[0]?.department ?? null,
    jobSummary: sections[0]?.jobSummary ?? null,
    applicationDeadLine: sections[0]?.applicationDeadLine ?? null,
    recruitType: normalizeRecruitType(row.recruitType),
    status: row.status,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    publishedAt: row.publishedAt,
    createdBy: row.createdBy,
    updatedBy: row.updatedBy,
    createdByUser: row.createdByUserId
      ? {
          id: row.createdByUserId,
          name: row.createdByUserName,
          email: row.createdByUserEmail ?? "",
          role: row.createdByUserRole ?? "",
        }
      : null,
    fields,
  };
}

export async function getPublishedRecruitPostBySlug(
  slug: string,
): Promise<RecruitPost | undefined> {
  const post = await getRecruitPostBySlug(slug);
  if (!post) return undefined;
  if (post.status !== "published") return undefined;
  if (post.publishedAt) {
    const publishedAt = new Date(post.publishedAt);
    if (Number.isFinite(publishedAt.getTime()) && publishedAt.getTime() > Date.now()) {
      return undefined;
    }
  }
  return post;
}

export async function getRecruitPostById(
  id: number,
): Promise<RecruitPost | undefined> {
  await initCloudflareD1();
  const row = await db.queryOne<{ slug: string }>(
    `SELECT slug FROM recruit_posts WHERE id = ? LIMIT 1`,
    [id],
  );
  if (!row?.slug) return undefined;
  return getRecruitPostBySlug(row.slug);
}

export async function isRecruitPostSlugAvailable(
  slug: string,
  excludeId?: number | null,
) {
  await initCloudflareD1();
  const row = await db.queryOne<{ id: number }>(
    `SELECT id FROM recruit_posts WHERE slug = ? LIMIT 1`,
    [slug],
  );
  if (!row) return true;
  if (excludeId && row.id === excludeId) return true;
  return false;
}

type UpsertRecruitPostInput = {
  postId?: number | null;
  slug: string;
  previousSlug?: string;
  title: string;
  department?: string | null;
  jobSummary?: string | null;
  applicationDeadLine?: string | null;
  recruitType: RecruitPostType;
  fields?: RecruitPostFields;
  status: RecruitPostStatus;
  publishedAt?: string | null;
  actorId: number;
};

export async function upsertRecruitPost(
  input: UpsertRecruitPostInput,
): Promise<RecruitPost> {
  await initCloudflareD1();
  const now = new Date().toISOString();
  const fields = input.fields ?? {};
  const department = input.department ?? null;
  const jobSummary = input.jobSummary ?? null;
  const applicationDeadLine = input.applicationDeadLine ?? null;
  const normalizedRecruitType = input.recruitType ?? "job";
  const recruitType = await resolveRecruitTypeForWrite(normalizedRecruitType);

  return db.transaction(async (tx) => {
    const existing =
      (input.postId
        ? await tx.queryOne<{
            id: number;
            createdBy: number | null;
            slug: string;
          }>(
            `SELECT id, createdBy, slug FROM recruit_posts WHERE id = ? LIMIT 1`,
            [input.postId],
          )
        : null) ??
      (await tx.queryOne<{
        id: number;
        createdBy: number | null;
        slug: string;
      }>(
        `SELECT id, createdBy, slug FROM recruit_posts WHERE slug = ? LIMIT 1`,
        [input.slug],
      )) ??
      (input.previousSlug
        ? await tx.queryOne<{
            id: number;
            createdBy: number | null;
            slug: string;
          }>(
            `SELECT id, createdBy, slug FROM recruit_posts WHERE slug = ? LIMIT 1`,
            [input.previousSlug],
          )
        : null);

    let recruitPostId = existing?.id ?? null;

    if (recruitPostId) {
      if (existing?.slug && existing.slug !== input.slug) {
        await tx.execute(`UPDATE recruit_posts SET slug = ? WHERE id = ?`, [
          input.slug,
          recruitPostId,
        ]);
      }
      await tx.execute(
        `UPDATE recruit_posts
         SET status = ?, title = ?, recruitType = ?, updatedAt = ?, publishedAt = ?, updatedBy = ?
         WHERE id = ?`,
        [
          input.status,
          input.title,
          recruitType,
          now,
          input.publishedAt ?? null,
          input.actorId,
          recruitPostId,
        ],
      );
    } else {
      await tx.execute(
        `INSERT INTO recruit_posts
         (status, slug, title, recruitType, createdAt, publishedAt, updatedAt, createdBy, updatedBy)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          input.status,
          input.slug,
          input.title,
          recruitType,
          now,
          input.publishedAt ?? null,
          now,
          input.actorId,
          input.actorId,
        ],
      );
      const created = await tx.queryOne<{ id: number }>(
        `SELECT id FROM recruit_posts WHERE slug = ? LIMIT 1`,
        [input.slug],
      );
      recruitPostId = created?.id ?? null;
    }

    if (!recruitPostId) {
      throw new Error("Failed to save recruit post.");
    }

    const existingFields = recruitPostId
      ? await tx.queryOne<RecruitPostSectionRow>(
          `SELECT department, jobSummary, applicationDeadLine, positionAvailable, jobDescription, requirements, location, workingHours,
                    employmentType, salary, benefits, holidays, externalLink
             FROM recruit_post_sections
             WHERE recruitPostId = ?
             LIMIT 1`,
          [recruitPostId],
        )
      : null;
    const mergedFields =
      normalizedRecruitType === "recruit"
        ? {
            positionAvailable: null,
            jobDescription: null,
            requirements: null,
            location: null,
            workingHours: null,
            employmentType: null,
            salary: null,
            benefits: null,
            holidays: null,
            externalLink:
              fields.externalLink ?? existingFields?.externalLink ?? null,
          }
        : {
            positionAvailable:
              fields.positionAvailable ??
              existingFields?.positionAvailable ??
              null,
            jobDescription:
              fields.jobDescription ?? existingFields?.jobDescription ?? null,
            requirements:
              fields.requirements ?? existingFields?.requirements ?? null,
            location: fields.location ?? existingFields?.location ?? null,
            workingHours:
              fields.workingHours ?? existingFields?.workingHours ?? null,
            employmentType:
              fields.employmentType ?? existingFields?.employmentType ?? null,
            salary: fields.salary ?? existingFields?.salary ?? null,
            benefits: fields.benefits ?? existingFields?.benefits ?? null,
            holidays: fields.holidays ?? existingFields?.holidays ?? null,
            externalLink: null,
          };
    const resolvedDepartment = department ?? existingFields?.department ?? null;
    const resolvedJobSummary = jobSummary ?? existingFields?.jobSummary ?? null;
    const resolvedApplicationDeadLine =
      applicationDeadLine ?? existingFields?.applicationDeadLine ?? null;

    await tx.execute(
      `DELETE FROM recruit_post_sections WHERE recruitPostId = ?`,
      [recruitPostId],
    );
    await tx.execute(
      `INSERT INTO recruit_post_sections
       (recruitPostId, department, jobSummary, applicationDeadLine, positionAvailable, jobDescription, requirements, location, workingHours,
        employmentType, salary, benefits, holidays, externalLink, createdAt, updatedAt)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        recruitPostId,
        resolvedDepartment,
        resolvedJobSummary,
        resolvedApplicationDeadLine,
        mergedFields.positionAvailable,
        mergedFields.jobDescription,
        mergedFields.requirements,
        mergedFields.location,
        mergedFields.workingHours,
        mergedFields.employmentType,
        mergedFields.salary,
        mergedFields.benefits,
        mergedFields.holidays,
        mergedFields.externalLink,
        now,
        now,
      ],
    );

    const saved = await tx.queryOne<RecruitPostRow>(
      `SELECT jp.*, u.id as createdByUserId, u.name as createdByUserName, u.email as createdByUserEmail, u.role as createdByUserRole
       FROM recruit_posts jp
       LEFT JOIN users u ON u.id = jp.createdBy
       WHERE jp.id = ?
       LIMIT 1`,
      [recruitPostId],
    );

    if (!saved) {
      throw new Error("Failed to load saved recruit post.");
    }

    return {
      id: saved.id,
      slug: saved.slug,
      title: saved.title,
      department: resolvedDepartment,
      jobSummary: resolvedJobSummary,
      applicationDeadLine: resolvedApplicationDeadLine,
      recruitType: normalizeRecruitType(saved.recruitType),
      status: saved.status,
      createdAt: saved.createdAt,
      updatedAt: saved.updatedAt,
      publishedAt: saved.publishedAt,
      createdBy: saved.createdBy,
      updatedBy: saved.updatedBy,
      createdByUser: saved.createdByUserId
        ? {
            id: saved.createdByUserId,
            name: saved.createdByUserName,
            email: saved.createdByUserEmail ?? "",
            role: saved.createdByUserRole ?? "",
          }
        : null,
      fields: mergedFields,
    };
  });
}

export async function updateRecruitPostStatus(input: {
  id: number;
  status: RecruitPostStatus;
  actorId: number;
  publishedAt?: string | null;
}) {
  await initCloudflareD1();
  const now = new Date().toISOString();
  await db.execute(
    `UPDATE recruit_posts SET status = ?, updatedAt = ?, publishedAt = ?, updatedBy = ? WHERE id = ?`,
    [input.status, now, input.publishedAt ?? null, input.actorId, input.id],
  );
}

export async function deleteRecruitPostById(id: number) {
  await initCloudflareD1();
  await db.execute(`DELETE FROM recruit_posts WHERE id = ?`, [id]);
}
