import { db } from "@/lib/db";
import { initCloudflareD1 } from "@/lib/db-cloudflare";
import type { UserRole, UserStatus } from "@/lib/auth/auth";

export type User = {
  id: number;
  email: string;
  name: string | null;
  passwordHash: string;
  role: UserRole;
  status: UserStatus;
  createdAt: Date;
  updatedAt: Date;
  otpHash: string | null;
  otpExpiresAt: Date | null;
  twoFactorEnabled: boolean;
  twoFactorOtpHash: string | null;
  twoFactorOtpExpiresAt: Date | null;
  authVersion: number;
};

function mapUser(row: User | null) {
  if (!row) return null;
  return {
    ...row,
    createdAt: row.createdAt ? new Date(row.createdAt) : row.createdAt,
    updatedAt: row.updatedAt ? new Date(row.updatedAt) : row.updatedAt,
    otpExpiresAt: row.otpExpiresAt ? new Date(row.otpExpiresAt) : null,
    twoFactorOtpExpiresAt: row.twoFactorOtpExpiresAt
      ? new Date(row.twoFactorOtpExpiresAt)
      : null,
    twoFactorEnabled: Boolean(row.twoFactorEnabled),
  };
}

export async function getUserByEmail(email: string) {
  await initCloudflareD1();
  const row = await db.queryOne<User>(
    `SELECT id,
            email,
            name,
            passwordHash,
            role,
            status,
            createdAt,
            updated_at as "updatedAt",
            otp_hash as "otpHash",
            otp_expires_at as "otpExpiresAt",
            two_factor_enabled as "twoFactorEnabled",
            two_factor_otp_hash as "twoFactorOtpHash",
            two_factor_otp_expires_at as "twoFactorOtpExpiresAt",
            auth_version as "authVersion"
     FROM users
     WHERE email = ?`,
    [email],
  );
  return mapUser(row);
}

export async function getUserById(id: number) {
  await initCloudflareD1();
  const row = await db.queryOne<User>(
    `SELECT id,
            email,
            name,
            passwordHash,
            role,
            status,
            createdAt,
            updated_at as "updatedAt",
            otp_hash as "otpHash",
            otp_expires_at as "otpExpiresAt",
            two_factor_enabled as "twoFactorEnabled",
            two_factor_otp_hash as "twoFactorOtpHash",
            two_factor_otp_expires_at as "twoFactorOtpExpiresAt",
            auth_version as "authVersion"
     FROM users
     WHERE id = ?`,
    [id],
  );
  return mapUser(row);
}

export async function createUser(input: {
  email: string;
  name?: string | null;
  passwordHash: string;
  role: UserRole;
  status: UserStatus;
}) {
  await initCloudflareD1();
  const now = new Date();
  await db.execute(
    `INSERT INTO users (email, name, passwordHash, role, status, createdAt, updated_at, two_factor_enabled, auth_version)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      input.email,
      input.name ?? null,
      input.passwordHash,
      input.role,
      input.status,
      now,
      now,
      0,
      0,
    ],
  );
  return getUserByEmail(input.email);
}

export async function listUsers() {
  await initCloudflareD1();
  const users = await db.query<User>(
    `SELECT id,
            email,
            name,
            passwordHash,
            role,
            status,
            createdAt,
            updated_at as "updatedAt",
            otp_hash as "otpHash",
            otp_expires_at as "otpExpiresAt",
            two_factor_enabled as "twoFactorEnabled",
            two_factor_otp_hash as "twoFactorOtpHash",
            two_factor_otp_expires_at as "twoFactorOtpExpiresAt",
            auth_version as "authVersion"
     FROM users
     ORDER BY createdAt DESC`,
  );
  return users.map((user) => {
    const mapped = mapUser(user) as User;
    return {
      ...mapped,
      role: mapped.role as UserRole,
      status: mapped.status as UserStatus,
    };
  });
}

export async function updateUserStatus(id: number, status: UserStatus) {
  await initCloudflareD1();
  await db.execute(
    `UPDATE users SET status = ?, updated_at = ? WHERE id = ?`,
    [status, new Date(), id],
  );
  return getUserById(id);
}

export async function updateUserRole(id: number, role: UserRole) {
  await initCloudflareD1();
  await db.execute(
    `UPDATE users SET role = ?, updated_at = ? WHERE id = ?`,
    [role, new Date(), id],
  );
  return getUserById(id);
}

export async function updateUserName(id: number, name: string | null) {
  await initCloudflareD1();
  await db.execute(
    `UPDATE users SET name = ?, updated_at = ? WHERE id = ?`,
    [name, new Date(), id],
  );
  return getUserById(id);
}

export async function setUserOtp(id: number, otpHash: string, otpExpiresAt: Date) {
  await initCloudflareD1();
  await db.execute(
    `UPDATE users
     SET otp_hash = ?, otp_expires_at = ?, updated_at = ?
     WHERE id = ?`,
    [otpHash, otpExpiresAt, new Date(), id],
  );
  return getUserById(id);
}

export async function clearUserOtp(id: number) {
  await initCloudflareD1();
  await db.execute(
    `UPDATE users
     SET otp_hash = NULL, otp_expires_at = NULL, updated_at = ?
     WHERE id = ?`,
    [new Date(), id],
  );
  return getUserById(id);
}

export async function setTwoFactorOtp(
  id: number,
  otpHash: string,
  otpExpiresAt: Date
) {
  await initCloudflareD1();
  await db.execute(
    `UPDATE users
     SET two_factor_otp_hash = ?, two_factor_otp_expires_at = ?, updated_at = ?
     WHERE id = ?`,
    [otpHash, otpExpiresAt, new Date(), id],
  );
  return getUserById(id);
}

export async function clearTwoFactorOtp(id: number) {
  await initCloudflareD1();
  await db.execute(
    `UPDATE users
     SET two_factor_otp_hash = NULL, two_factor_otp_expires_at = NULL, updated_at = ?
     WHERE id = ?`,
    [new Date(), id],
  );
  return getUserById(id);
}

export async function setTwoFactorEnabled(id: number, enabled: boolean) {
  await initCloudflareD1();
  await db.execute(
    `UPDATE users
     SET two_factor_enabled = ?, updated_at = ?
     WHERE id = ?`,
    [enabled ? 1 : 0, new Date(), id],
  );
  return getUserById(id);
}

export async function updateUserPassword(id: number, passwordHash: string) {
  await initCloudflareD1();
  await db.execute(
    `UPDATE users
     SET passwordHash = ?,
         otp_hash = NULL,
         otp_expires_at = NULL,
         auth_version = auth_version + 1,
         updated_at = ?
     WHERE id = ?`,
    [passwordHash, new Date(), id],
  );
  return getUserById(id);
}

export async function countUsers() {
  await initCloudflareD1();
  const row = await db.queryOne<{ count: number }>("SELECT COUNT(*) as count FROM users");
  return row?.count ?? 0;
}

export async function deleteUserById(id: number) {
  await initCloudflareD1();
  await db.execute(`DELETE FROM users WHERE id = ?`, [id]);
}
