type D1Database = {
  prepare(sql: string): {
    bind(...params: unknown[]): {
      all<T>(): Promise<{ results: T[] }>;
      run(): Promise<{ meta: { changes: number; last_row_id?: number } }>;
    };
  };
  exec(sql: string): Promise<unknown>;
};

type BetterSqliteStatement = {
  all: (params?: unknown) => unknown[];
  run: (params?: unknown) => {
    changes: number;
    lastInsertRowid?: number | bigint;
  };
  get: (params?: unknown) => unknown;
};

type BetterSqliteDatabase = {
  prepare: (sql: string) => BetterSqliteStatement;
  exec: (sql: string) => void;
  pragma: (value: string) => void;
};

type NodePath = {
  default?: {
    isAbsolute: (path: string) => boolean;
    dirname: (path: string) => string;
    join: (...parts: string[]) => string;
    relative: (from: string, to: string) => string;
  };
  isAbsolute: (path: string) => boolean;
  dirname: (path: string) => string;
  join: (...parts: string[]) => string;
  relative: (from: string, to: string) => string;
};

type NodeFs = {
  mkdir: (path: string, opts?: { recursive?: boolean }) => Promise<void>;
  readdir: (path: string) => Promise<string[]>;
  readFile: (path: string, encoding: string) => Promise<string>;
  stat: (path: string) => Promise<{ isFile: () => boolean; isDirectory: () => boolean }>;
};

const DEFAULT_DB_PATH = "data/dev.db";
let localDb: D1Database | null = null;
let initPromise: Promise<D1Database | null> | null = null;

function isErrnoException(error: unknown): error is { code?: string } {
  return typeof error === "object" && error !== null && "code" in error;
}

function isNodeRuntime() {
  return (
    process.env.NEXT_RUNTIME === "nodejs" ||
    process.env.NEXT_RUNTIME_OVERRIDE === "nodejs"
  );
}

async function importNodeModule<T>(specifier: string): Promise<T> {
  if (!isNodeRuntime()) {
    throw new Error("Node-only module import blocked in edge runtime.");
  }
  const importer = new Function("s", "return import(s)") as (s: string) => Promise<T>;
  return importer(specifier);
}

async function resolveDbPath() {
  const fs = await importNodeModule<NodeFs>("fs/promises");
  const path = await importNodeModule<NodePath>("path");
  const pathMod = path.default ?? path;
  const raw = process.env.LOCAL_DB_PATH?.trim() || DEFAULT_DB_PATH;
  if (pathMod.isAbsolute(raw)) return raw;

  const exists = async (candidate: string) => {
    try {
      await fs.stat(candidate);
      return true;
    } catch {
      return false;
    }
  };

  // Resolve relative paths from the repo root (directory containing api/db).
  let repoRoot = process.cwd();
  let dir = process.cwd();
  for (let i = 0; i < 10; i += 1) {
    const schemaCandidate = pathMod.join(dir, "api", "db", "schema.sql");
    if (await exists(schemaCandidate)) {
      repoRoot = dir;
      break;
    }
    const parent = pathMod.dirname(dir);
    if (parent === dir) break;
    dir = parent;
  }

  const resolved = pathMod.join(repoRoot, raw);
  const rel = pathMod.relative(repoRoot, resolved);
  const escapesRepo = rel.startsWith("..") || pathMod.isAbsolute(rel);
  if (escapesRepo) {
    return pathMod.join(repoRoot, DEFAULT_DB_PATH);
  }

  return resolved;
}

export async function getResolvedLocalDbPath(): Promise<string | null> {
  if (!isNodeRuntime()) return null;
  return resolveDbPath();
}

async function readSchemaSql() {
  const fs = await importNodeModule<NodeFs>("fs/promises");
  const path = await importNodeModule<NodePath>("path");
  const pathMod = path.default ?? path;

  const tried: string[] = [];
  let dir = process.cwd();

  for (let i = 0; i < 10; i += 1) {
    const candidates = [
      pathMod.join(dir, "db", "schema.sql"),
      pathMod.join(dir, "api", "db", "schema.sql"),
    ];

    for (const candidate of candidates) {
      tried.push(candidate);
      try {
        return await fs.readFile(candidate, "utf8");
      } catch (error) {
        if (isErrnoException(error) && error.code === "ENOENT") continue;
        throw error;
      }
    }

    const parent = pathMod.dirname(dir);
    if (parent === dir) break;
    dir = parent;
  }

  throw new Error(`schema.sql not found (tried ${tried.join(", ")}).`);
}

async function readMigrationSql() {
  const fs = await importNodeModule<NodeFs>("fs/promises");
  const path = await importNodeModule<NodePath>("path");
  const pathMod = path.default ?? path;

  const tried: string[] = [];
  let dir = process.cwd();

  for (let i = 0; i < 10; i += 1) {
    const migrationsDir = pathMod.join(dir, "api", "db", "migrations");
    tried.push(migrationsDir);
    try {
      const entries = await fs.readdir(migrationsDir);
      const files = entries
        .filter((name) => /^\d+_.+\.sql$/i.test(name))
        .sort((a, b) => a.localeCompare(b))
        .map((name) => pathMod.join(migrationsDir, name));
      if (files.length === 0) {
        // Fall through to parent search.
      } else {
        const parts: string[] = [];
        for (const file of files) {
          parts.push(await fs.readFile(file, "utf8"));
        }
        return parts.join("\n\n");
      }
    } catch (error) {
      if (isErrnoException(error) && error.code === "ENOENT") {
        // Continue searching parents.
      } else {
        throw error;
      }
    }

    const parent = pathMod.dirname(dir);
    if (parent === dir) break;
    dir = parent;
  }

  throw new Error(`migrations dir not found (tried ${tried.join(", ")}).`);
}

async function ensureSchema(db: BetterSqliteDatabase) {
  const hasSchema = Boolean(
    db
      .prepare(
        "SELECT name FROM sqlite_master WHERE type='table' AND name='post_locales' LIMIT 1;",
      )
      .get(),
  );
  if (hasSchema) return;

  try {
    const migrations = await readMigrationSql();
    db.exec(migrations);
    return;
  } catch {
    const schema = await readSchemaSql();
    db.exec(schema);
  }
}

function createD1Adapter(db: BetterSqliteDatabase): D1Database {
  return {
    prepare(sql: string) {
      const stmt = db.prepare(sql);
      return {
        bind(...params: unknown[]) {
          const bound = params.length === 1 ? params[0] : params;
          return {
            all: async <T>() => ({ results: stmt.all(bound) as T[] }),
            run: async () => {
              const result = stmt.run(bound);
              const lastId = result.lastInsertRowid;
              return {
                meta: {
                  changes: result.changes ?? 0,
                  last_row_id:
                    typeof lastId === "bigint"
                      ? Number(lastId)
                      : typeof lastId === "number"
                        ? lastId
                        : undefined,
                },
              };
            },
          };
        },
      };
    },
    exec: async (sql: string) => {
      db.exec(sql);
      return undefined;
    },
  };
}

async function initLocalDb(): Promise<D1Database> {
  const BetterSqlite = await importNodeModule<
    typeof import("better-sqlite3") | { default: typeof import("better-sqlite3") }
  >("better-sqlite3");
  const fs = await importNodeModule<NodeFs>("fs/promises");
  const path = await importNodeModule<NodePath>("path");
  const pathMod = path.default ?? path;
  const dbPath = await resolveDbPath();
  await fs.mkdir(pathMod.dirname(dbPath), { recursive: true });
  const DatabaseCtor =
    "default" in BetterSqlite ? BetterSqlite.default : BetterSqlite;
  const db = new DatabaseCtor(dbPath) as unknown as BetterSqliteDatabase;
  db.pragma("foreign_keys = ON");
  await ensureSchema(db);
  return createD1Adapter(db);
}

export async function getLocalD1Database(): Promise<D1Database | null> {
  if (!isNodeRuntime()) return null;
  if (localDb) return localDb;
  if (!initPromise) {
    initPromise = initLocalDb()
      .then((db) => {
        localDb = db;
        return db;
      })
      .catch((error) => {
        initPromise = null;
        throw error;
      });
  }
  return initPromise;
}
