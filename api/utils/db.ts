export type SqlValue =
  | string
  | number
  | boolean
  | Date
  | null
  | Uint8Array;

export type QueryResult<T> = {
  rows: T[];
  rowsAffected: number;
  lastInsertId?: number;
};

export type DbClient = {
  query<T>(sql: string, params?: SqlValue[]): Promise<T[]>;
  queryOne<T>(sql: string, params?: SqlValue[]): Promise<T | null>;
  execute(sql: string, params?: SqlValue[]): Promise<QueryResult<never>>;
  transaction<T>(fn: (tx: DbClient) => Promise<T>): Promise<T>;
};

type D1Database = {
  prepare(sql: string): {
    bind(...params: unknown[]): {
      all<T>(): Promise<{ results: T[] }>;
      run(): Promise<{ meta: { changes: number; last_row_id?: number } }>;
    };
  };
  exec(sql: string): Promise<unknown>;
};

let d1Database: D1Database | null = null;

function normalizeParams(params: SqlValue[] = []) {
  return params.map((value) => {
    if (value instanceof Date) return value.toISOString();
    if (typeof value === "boolean") return value ? 1 : 0;
    return value;
  });
}

function getD1Database() {
  return d1Database;
}

export function setD1Database(db: D1Database) {
  d1Database = db;
}

export function isD1() {
  return Boolean(d1Database);
}


async function d1Query<T>(sql: string, params: SqlValue[] = []) {
  const prepared = getD1Database()?.prepare(sql);
  if (!prepared) {
    throw new Error("D1 database is not configured.");
  }
  const { results } = await prepared.bind(...normalizeParams(params)).all<T>();
  return results;
}

async function d1Execute(sql: string, params: SqlValue[] = []) {
  const prepared = getD1Database()?.prepare(sql);
  if (!prepared) {
    throw new Error("D1 database is not configured.");
  }
  const result = await prepared.bind(...normalizeParams(params)).run();
  return {
    rows: [],
    rowsAffected: result.meta.changes ?? 0,
    lastInsertId: result.meta.last_row_id,
  };
}

async function d1Transaction<T>(fn: (tx: DbClient) => Promise<T>) {
  const tx: DbClient = {
    query: d1Query,
    queryOne: async <T>(sql: string, params: SqlValue[] = []) => {
      const rows = await d1Query<T>(sql, params);
      return rows[0] ?? null;
    },
    execute: d1Execute,
    transaction: async <T>(inner: (innerTx: DbClient) => Promise<T>) =>
      inner(tx),
  };
  return fn(tx);
}

export const db: DbClient = {
  query: async <T>(sql: string, params: SqlValue[] = []) => {
    if (getD1Database()) {
      return d1Query<T>(sql, params);
    }
    throw new Error("Database is not configured.");
  },
  queryOne: async <T>(sql: string, params: SqlValue[] = []) => {
    const rows = await db.query<T>(sql, params);
    return rows[0] ?? null;
  },
  execute: async (sql: string, params: SqlValue[] = []) => {
    if (getD1Database()) {
      return d1Execute(sql, params);
    }
    throw new Error("Database is not configured.");
  },
  transaction: async <T>(fn: (tx: DbClient) => Promise<T>) => {
    if (getD1Database()) {
      return d1Transaction(fn);
    }
    throw new Error("Database is not configured.");
  },
};
