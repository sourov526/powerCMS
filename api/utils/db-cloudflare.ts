import { setD1Database } from "@/lib/db";

function isNodeRuntime() {
  return (
    process.env.NEXT_RUNTIME === "nodejs" ||
    process.env.NEXT_RUNTIME_OVERRIDE === "nodejs"
  );
}

async function tryInitLocalD1() {
  if (!isNodeRuntime()) return;
  const mod = await import("@/lib/db-local");
  if (process.env.DB_DEBUG === "1") {
    try {
      const path = await mod.getResolvedLocalDbPath?.();
      // eslint-disable-next-line no-console
      console.log(`[db] Local DB candidate: ${path ?? "(unknown)"}`);
    } catch {
      // ignore
    }
  }
  const localDb = await mod.getLocalD1Database();
  if (localDb) {
    setD1Database(localDb);
    if (process.env.DB_DEBUG === "1") {
      // eslint-disable-next-line no-console
      console.log("[db] Using local SQLite-backed DB (db-local).");
    }
  }
}

export async function initCloudflareD1() {
  await tryInitLocalD1();
}
