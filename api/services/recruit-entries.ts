import { db } from "@/lib/db";
import { initCloudflareD1 } from "@/lib/db-cloudflare";
import { resolveMediaUrl } from "@/lib/media";
import { createNotification } from "@/lib/services/notifications";

export type RecruitEntry = {
  id: number;
  name: string;
  furigana: string;
  gender: "male" | "female" | "na";
  birthdate: string;
  email: string;
  phone: string;
  postalCode: string;
  address: string;
  apartment: string | null;
  resumeMediaId: number | null;
  workHistoryMediaId: number | null;
  notes: string | null;
  status: "new" | "reviewed" | "interview" | "rejected" | "hired";
  createdAt: string;
  updatedAt: string;
  createdBy: number | null;
  updatedBy: number | null;
};

export type RecruitEntryMedia = {
  id: number;
  provider: string;
  key: string;
  bucket?: string | null;
  url?: string | null;
  mimeType?: string | null;
  size?: number | null;
  signedUrl?: string;
};

export type RecruitEntryWithMedia = RecruitEntry & {
  resumeMedia?: RecruitEntryMedia | null;
  workHistoryMedia?: RecruitEntryMedia | null;
};

export async function createRecruitEntry(input: {
  name: string;
  furigana: string;
  gender: "male" | "female" | "na";
  birthdate: string;
  email: string;
  phone: string;
  postalCode: string;
  address: string;
  apartment?: string | null;
  resumeMediaId?: number | null;
  workHistoryMediaId?: number | null;
  notes?: string | null;
  actorId?: number | null;
}) {
  await initCloudflareD1();
  const now = new Date();
  const result = await db.execute(
    `INSERT INTO recruit_entries
      (name, furigana, gender, birthdate, email, phone, postalCode, address, apartment, resumeMediaId, workHistoryMediaId, notes, status, createdAt, updatedAt, createdBy, updatedBy)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      input.name,
      input.furigana,
      input.gender,
      input.birthdate,
      input.email,
      input.phone,
      input.postalCode,
      input.address,
      input.apartment ?? null,
      input.resumeMediaId ?? null,
      input.workHistoryMediaId ?? null,
      input.notes ?? null,
      "new",
      now,
      now,
      input.actorId ?? null,
      input.actorId ?? null,
    ]
  );

  const created = result.lastInsertId
    ? await db.queryOne<RecruitEntry>(
        `SELECT id, name, furigana, gender, birthdate, email, phone, postalCode, address, apartment, resumeMediaId, workHistoryMediaId,
                notes, status, createdAt, updatedAt, createdBy, updatedBy
         FROM recruit_entries
         WHERE id = ?
         LIMIT 1`,
        [result.lastInsertId]
      )
    : await db.queryOne<RecruitEntry>(
        `SELECT id, name, furigana, gender, birthdate, email, phone, postalCode, address, apartment, resumeMediaId, workHistoryMediaId,
                notes, status, createdAt, updatedAt, createdBy, updatedBy
         FROM recruit_entries
         WHERE email = ?
         ORDER BY id DESC
         LIMIT 1`,
        [input.email]
      );
  if (!created) {
    throw new Error("Failed to create recruit entry.");
  }

  await createNotification({
    type: "recruit_entry",
    title: "New recruit entry",
    message: `${created.name} • ${created.email}`,
    link: "/admin/entry",
    recipientRole: "superuser",
    actorId: input.actorId ?? null,
  });

  return created;
}

export async function listRecruitEntries(): Promise<RecruitEntryWithMedia[]> {
  await initCloudflareD1();
  const rows = await db.query<
    RecruitEntry & {
      resumeId?: number | null;
      resumeProvider?: string | null;
      resumeKey?: string | null;
      resumeBucket?: string | null;
      resumeUrl?: string | null;
      resumeMimeType?: string | null;
      resumeSize?: number | null;
      workId?: number | null;
      workProvider?: string | null;
      workKey?: string | null;
      workBucket?: string | null;
      workUrl?: string | null;
      workMimeType?: string | null;
      workSize?: number | null;
    }
  >(
    `SELECT re.id,
            re.name,
            re.furigana,
            re.gender,
            re.birthdate,
            re.email,
            re.phone,
            re.postalCode,
            re.address,
            re.apartment,
            re.resumeMediaId,
            re.workHistoryMediaId,
            re.notes,
            re.status,
            re.createdAt,
            re.updatedAt,
            re.createdBy,
            re.updatedBy,
            resume.id as resumeId,
            resume.provider as resumeProvider,
            resume.key as resumeKey,
            resume.bucket as resumeBucket,
            resume.url as resumeUrl,
            resume.mimeType as resumeMimeType,
            resume.size as resumeSize,
            work.id as workId,
            work.provider as workProvider,
            work.key as workKey,
            work.bucket as workBucket,
            work.url as workUrl,
            work.mimeType as workMimeType,
            work.size as workSize
     FROM recruit_entries re
     LEFT JOIN media resume ON resume.id = re.resumeMediaId
     LEFT JOIN media work ON work.id = re.workHistoryMediaId
     ORDER BY re.createdAt DESC`
  );

  return rows.map((row) => {
    const resumeMedia =
      row.resumeId && row.resumeProvider && row.resumeKey
        ? {
            id: row.resumeId,
            provider: row.resumeProvider,
            key: row.resumeKey,
            bucket: row.resumeBucket ?? null,
            url: row.resumeUrl ?? null,
            mimeType: row.resumeMimeType ?? null,
            size: row.resumeSize ?? null,
            signedUrl: resolveMediaUrl({
              provider: row.resumeProvider,
              key: row.resumeKey,
              bucket: row.resumeBucket ?? null,
              url: row.resumeUrl ?? null,
            }),
          }
        : null;
    const workHistoryMedia =
      row.workId && row.workProvider && row.workKey
        ? {
            id: row.workId,
            provider: row.workProvider,
            key: row.workKey,
            bucket: row.workBucket ?? null,
            url: row.workUrl ?? null,
            mimeType: row.workMimeType ?? null,
            size: row.workSize ?? null,
            signedUrl: resolveMediaUrl({
              provider: row.workProvider,
              key: row.workKey,
              bucket: row.workBucket ?? null,
              url: row.workUrl ?? null,
            }),
          }
        : null;

    return {
      ...row,
      resumeMedia,
      workHistoryMedia,
    };
  });
}

export async function deleteRecruitEntryById(id: number) {
  await initCloudflareD1();
  await db.execute(`DELETE FROM recruit_entries WHERE id = ?`, [id]);
}

export async function updateRecruitEntryStatus(
  id: number,
  status: RecruitEntry["status"],
  actorId?: number | null
) {
  await initCloudflareD1();
  const now = new Date();
  const result = await db.execute(
    `UPDATE recruit_entries SET status = ?, updatedAt = ?, updatedBy = ? WHERE id = ?`,
    [status, now, actorId ?? null, id]
  );
  // return result.changes > 0;
  return result.rowsAffected > 0;
}
