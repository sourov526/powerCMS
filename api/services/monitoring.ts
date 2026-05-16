import { db } from "@/lib/db";
import { initCloudflareD1 } from "@/lib/db-cloudflare";

export async function logNotFoundEvent(input: {
  path: string;
  referrer?: string | null;
  userAgent?: string | null;
}) {
  await initCloudflareD1();
  await db.execute(
    `INSERT INTO not_found_events (path, referrer, userAgent, createdAt)
     VALUES (?, ?, ?, ?)`,
    [input.path, input.referrer ?? null, input.userAgent ?? null, new Date()],
  );
}
