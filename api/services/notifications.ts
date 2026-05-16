import { db } from "@/lib/db";
import { initCloudflareD1 } from "@/lib/db-cloudflare";

export type Notification = {
  id: number;
  type: string;
  title: string;
  message: string | null;
  link: string | null;
  metadata: unknown;
  readAt: Date | null;
  createdAt: Date;
  actorId: number | null;
  recipientRole: string | null;
  recipientUserId: number | null;
};

function mapNotification(row: Notification) {
  let parsedMetadata: unknown = null;
  if (row.metadata) {
    if (typeof row.metadata === "string") {
      try {
        parsedMetadata = JSON.parse(row.metadata as string);
      } catch {
        parsedMetadata = null;
      }
    } else {
      parsedMetadata = row.metadata;
    }
  }
  return {
    ...row,
    createdAt: new Date(row.createdAt),
    readAt: row.readAt ? new Date(row.readAt) : null,
    metadata: parsedMetadata,
  };
}

export async function createNotification(input: {
  type: string;
  title: string;
  message?: string | null;
  link?: string | null;
  metadata?: unknown;
  actorId?: number | null;
  recipientRole?: "superuser" | "author" | null;
  recipientUserId?: number | null;
}) {
  await initCloudflareD1();
  const metadata =
    input.metadata === undefined ? null : JSON.stringify(input.metadata);
  await db.execute(
    `INSERT INTO notifications
      (type, title, message, link, metadata, readAt, createdAt, actorId, recipientRole, recipientUserId)
     VALUES (?, ?, ?, ?, ?, NULL, ?, ?, ?, ?)`,
    [
      input.type,
      input.title,
      input.message ?? null,
      input.link ?? null,
      metadata,
      new Date(),
      input.actorId ?? null,
      input.recipientRole ?? null,
      input.recipientUserId ?? null,
    ],
  );
  const created = await db.queryOne<Notification>(
    `SELECT id,
            type,
            title,
            message,
            link,
            metadata,
            readAt,
            createdAt,
            actorId,
            recipientRole,
            recipientUserId
     FROM notifications
     ORDER BY id DESC
     LIMIT 1`,
  );
  if (!created) {
    throw new Error("Failed to create notification.");
  }
  return mapNotification(created);
}

export async function listNotificationsForUser(input: {
  userId: number;
  role: "superuser" | "author";
  limit?: number;
}) {
  await initCloudflareD1();
  const limit = input.limit ?? 20;
  const rows = await db.query<Notification>(
    `SELECT id,
            type,
            title,
            message,
            link,
            metadata,
            readAt,
            createdAt,
            actorId,
            recipientRole,
            recipientUserId
     FROM notifications
     ${input.role === "superuser" ? "" : "WHERE recipientUserId = ?"}
     ORDER BY createdAt DESC
     LIMIT ?`,
    input.role === "superuser" ? [limit] : [input.userId, limit],
  );
  return rows.map(mapNotification);
}

export async function countUnreadNotificationsForUser(input: {
  userId: number;
  role: "superuser" | "author";
}) {
  await initCloudflareD1();
  const row = await db.queryOne<{ count: number }>(
    `SELECT COUNT(*) as count
     FROM notifications
     WHERE readAt IS NULL
     ${input.role === "superuser" ? "" : "AND recipientUserId = ?"}`,
    input.role === "superuser" ? [] : [input.userId],
  );
  return row?.count ?? 0;
}

export async function markAllNotificationsReadForUser(input: {
  userId: number;
  role: "superuser" | "author";
}) {
  await initCloudflareD1();
  await db.execute(
    `UPDATE notifications
     SET readAt = ?
     WHERE readAt IS NULL
     ${input.role === "superuser" ? "" : "AND recipientUserId = ?"}`,
    input.role === "superuser" ? [new Date()] : [new Date(), input.userId],
  );
}

export async function deleteNotificationForUser(input: {
  id: number;
  userId: number;
  role: "superuser" | "author";
}) {
  await initCloudflareD1();
  const existing = await db.queryOne<{ id: number }>(
    `SELECT id
     FROM notifications
     WHERE id = ?
     ${input.role === "superuser" ? "" : "AND recipientUserId = ?"}`,
    input.role === "superuser" ? [input.id] : [input.id, input.userId],
  );
  if (!existing) return false;
  await db.execute(`DELETE FROM notifications WHERE id = ?`, [existing.id]);
  return true;
}
