import { PRAGMA_SQL } from "../schema.js";

// No module-level require of better-sqlite3 — only loaded when the function is called.
// This prevents turbopack from trying to resolve it at build time.

export function createBetterSqliteAdapter(filePath) {
  // Base64-hide module name from turbopack static analysis
  const modName = Buffer.from("YmV0dGVyLXNxbGl0ZTM=", "base64").toString();
  const Database = require(modName);
  const db = new Database(filePath);
  db.exec(PRAGMA_SQL);

  const stmtCache = new Map();

  function prepare(sql) {
    let stmt = stmtCache.get(sql);
    if (!stmt) {
      stmt = db.prepare(sql);
      stmtCache.set(sql, stmt);
    }
    return stmt;
  }

  // Periodic checkpoint to keep WAL file small
  const CHECKPOINT_INTERVAL_MS = 60 * 1000;
  const checkpointTimer = setInterval(() => {
    try { db.pragma("wal_checkpoint(TRUNCATE)"); } catch {}
  }, CHECKPOINT_INTERVAL_MS);
  if (typeof checkpointTimer.unref === "function") checkpointTimer.unref();

  function gracefulClose() {
    try { db.pragma("wal_checkpoint(TRUNCATE)"); } catch {}
    try { stmtCache.clear(); } catch {}
    try { db.close(); } catch {}
  }

  process.once("beforeExit", gracefulClose);
  process.once("SIGINT", () => { gracefulClose(); process.exit(0); });
  process.once("SIGTERM", () => { gracefulClose(); process.exit(0); });

  return {
    driver: "better-sqlite3",
    run(sql, params = []) { return prepare(sql).run(...params); },
    get(sql, params = []) { return prepare(sql).get(...params); },
    all(sql, params = []) { return prepare(sql).all(...params); },
    exec(sql) { return db.exec(sql); },
    transaction(fn) { return db.transaction(fn)(); },
    checkpoint() { try { db.pragma("wal_checkpoint(TRUNCATE)"); } catch {} },
    close() {
      clearInterval(checkpointTimer);
      gracefulClose();
    },
    raw: db,
  };
}
