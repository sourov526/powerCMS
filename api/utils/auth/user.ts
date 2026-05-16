import { db } from "@/lib/db";
import { initCloudflareD1 } from "@/lib/db-cloudflare";
import { hashPassword } from "@/lib/auth/auth";

export const ROOT_USER_EMAIL = process.env.ROOT_USER_EMAIL ?? "admin@example.com";
const ROOT_USER_PASSWORD = process.env.ROOT_USER_PASSWORD ?? ROOT_USER_EMAIL;

export async function ensureRootUser() {
  await initCloudflareD1();
  const row = await db.queryOne<{ count: number }>(
    "SELECT COUNT(*) as count FROM users",
  );
  const count = row?.count ?? 0;

  const existingRoot = await db.queryOne<{ id: number }>(
    "SELECT id FROM users WHERE email = ? LIMIT 1",
    [ROOT_USER_EMAIL],
  );
  if (existingRoot) return;

  // Fresh DB: create root user.
  if (count === 0) {
    const passwordHash = hashPassword(ROOT_USER_PASSWORD);
    await db.execute(
      `INSERT INTO users (email, name, passwordHash, role, status, createdAt, updated_at, two_factor_enabled, auth_version)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        ROOT_USER_EMAIL,
        "Admin",
        passwordHash,
        "superuser",
        "active",
        new Date(),
        new Date(),
        0,
        0,
      ],
    );
    return;
  }

  // Local dev convenience: migrate the legacy default superuser to the configured root user.
  const legacy = await db.queryOne<{ id: number }>(
    "SELECT id FROM users WHERE email = ? AND role = ? LIMIT 1",
    ["admin@example.com", "superuser"],
  );
  if (legacy) {
    const passwordHash = hashPassword(ROOT_USER_PASSWORD);
    await db.execute(
      "UPDATE users SET email = ?, passwordHash = ? WHERE id = ?",
      [ROOT_USER_EMAIL, passwordHash, legacy.id],
    );
    return;
  }

  // Otherwise, create the configured root user (DB already has other users).
  const passwordHash = hashPassword(ROOT_USER_PASSWORD);
  await db.execute(
    `INSERT INTO users (email, name, passwordHash, role, status, createdAt, updated_at, two_factor_enabled, auth_version)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      ROOT_USER_EMAIL,
      "Admin",
      passwordHash,
      "superuser",
      "active",
      new Date(),
      new Date(),
      0,
      0,
    ],
  );
}
