#!/usr/bin/env node
/* eslint-disable no-console */

const fs = require("fs");
const path = require("path");

const DEFAULT_DB_PATH = "data/dev.db";

function isTruthyFile(filePath) {
  try {
    const stat = fs.statSync(filePath);
    return stat.isFile() && stat.size > 0;
  } catch {
    return false;
  }
}

function getRepoRoot() {
  // scripts/ is at repo root; resolve relative to this file, not process.cwd().
  return path.resolve(__dirname, "..");
}

function resolveDbPath() {
  const repoRoot = getRepoRoot();
  const raw = String(process.env.LOCAL_DB_PATH || "").trim() || DEFAULT_DB_PATH;
  if (path.isAbsolute(raw)) return raw;

  const resolved = path.resolve(repoRoot, raw);
  const rel = path.relative(repoRoot, resolved);
  const escapesRepo = rel.startsWith("..") || path.isAbsolute(rel);
  if (escapesRepo) {
    // Prevent accidental writes outside the repo (e.g. LOCAL_DB_PATH=../data/dev.db).
    return path.join(repoRoot, DEFAULT_DB_PATH);
  }
  return resolved;
}

function listMigrationFiles(rootDir) {
  const migrationsDir = path.join(rootDir, "api", "db", "migrations");
  if (!fs.existsSync(migrationsDir)) return [];
  const entries = fs
    .readdirSync(migrationsDir)
    .filter((name) => /^\d+_.+\.sql$/i.test(name))
    .sort((a, b) => a.localeCompare(b));
  return entries.map((name) => path.join(migrationsDir, name));
}

function readFileUtf8(filePath) {
  return fs.readFileSync(filePath, "utf8");
}

function initDbIfMissing() {
  const dbPath = resolveDbPath();
  if (isTruthyFile(dbPath)) {
    console.log(`[db] Local DB exists: ${dbPath}`);
    return;
  }

  fs.mkdirSync(path.dirname(dbPath), { recursive: true });
  // eslint-disable-next-line global-require
  const BetterSqlite = require("better-sqlite3");
  const db = new BetterSqlite(dbPath);
  db.pragma("foreign_keys = ON");

  const migrationFiles = listMigrationFiles(getRepoRoot());
  if (migrationFiles.length === 0) {
    db.close();
    throw new Error(
      `[db] No migrations found (expected api/db/migrations/*.sql).`,
    );
  }

  console.log(`[db] Creating local DB: ${dbPath}`);
  for (const file of migrationFiles) {
    const sql = readFileUtf8(file);
    console.log(`[db] Applying migration: ${path.basename(file)}`);
    db.exec(sql);
  }

  db.close();
  console.log("[db] Local DB ready.");
}

try {
  initDbIfMissing();
} catch (error) {
  console.error(String(error?.stack || error?.message || error));
  process.exit(1);
}
