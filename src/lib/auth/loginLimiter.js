const MAX_FAILS_BEFORE_LOCK = 5;
const LOCK_STEPS_MS = [30_000, 120_000, 600_000, 1_800_000];
const FAIL_WINDOW_MS = 60 * 60 * 1000;

const attempts = new Map();

function now() { return Date.now(); }

function getEntry(ip) {
  const e = attempts.get(ip);
  if (!e) return null;
  if (e.lastFailAt && now() - e.lastFailAt > FAIL_WINDOW_MS && (!e.lockUntil || now() >= e.lockUntil)) {
    attempts.delete(ip);
    schedulePersistRemove(ip);
    return null;
  }
  return e;
}

export function checkLock(ip) {
  const e = getEntry(ip);
  if (!e || !e.lockUntil) return { locked: false };
  const remaining = e.lockUntil - now();
  if (remaining <= 0) return { locked: false };
  return { locked: true, retryAfter: Math.ceil(remaining / 1000) };
}

export function recordFail(ip) {
  const e = getEntry(ip) || { fails: 0, lockUntil: 0, lockLevel: 0, lastFailAt: 0 };
  e.fails += 1;
  e.lastFailAt = now();
  if (e.fails >= MAX_FAILS_BEFORE_LOCK) {
    const step = LOCK_STEPS_MS[Math.min(e.lockLevel, LOCK_STEPS_MS.length - 1)];
    e.lockUntil = now() + step;
    e.lockLevel += 1;
    e.fails = 0;
  }
  attempts.set(ip, e);
  schedulePersist(ip, e);
  return { remainingBeforeLock: Math.max(0, MAX_FAILS_BEFORE_LOCK - e.fails) };
}

export function recordSuccess(ip) {
  attempts.delete(ip);
  schedulePersistRemove(ip);
}

export function getClientIp(request) {
  const realIp = request.headers.get("x-9r-real-ip");
  if (realIp) return realIp;
  if (process.env.TRUST_PROXY === "true") {
    const xff = request.headers.get("x-forwarded-for");
    if (xff) return xff.split(",")[0].trim();
  }
  return "unknown";
}

// ─── Persistence layer (fire-and-forget to SQLite) ──────────────────────

async function getDb() {
  try {
    const { getAdapter } = await import("@/lib/db/driver.js");
    return await getAdapter();
  } catch { return null; }
}

async function persistEntry(ip, entry) {
  const db = await getDb();
  if (!db) return;
  try {
    const value = JSON.stringify({ fails: entry.fails, lockUntil: entry.lockUntil, lockLevel: entry.lockLevel, lastFailAt: entry.lastFailAt });
    db.run(`INSERT INTO kv(scope, key, value) VALUES('loginLimiter', ?, ?) ON CONFLICT(scope, key) DO UPDATE SET value = excluded.value`, [ip, value]);
  } catch {}
}

async function removeEntry(ip) {
  const db = await getDb();
  if (!db) return;
  try {
    db.run(`DELETE FROM kv WHERE scope = 'loginLimiter' AND key = ?`, [ip]);
  } catch {}
}

const persistTimers = new Map();

function schedulePersist(ip, entry) {
  const key = `set:${ip}`;
  if (persistTimers.has(key)) clearTimeout(persistTimers.get(key));
  persistTimers.set(key, setTimeout(() => {
    persistTimers.delete(key);
    persistEntry(ip, entry);
  }, 200));
}

function schedulePersistRemove(ip) {
  const key = `del:${ip}`;
  if (persistTimers.has(key)) clearTimeout(persistTimers.get(key));
  persistTimers.set(key, setTimeout(() => {
    persistTimers.delete(key);
    removeEntry(ip);
  }, 200));
}

async function loadPersistedEntries() {
  const db = await getDb();
  if (!db) return;
  try {
    const rows = db.all(`SELECT key, value FROM kv WHERE scope = 'loginLimiter'`);
    const loaded = new Set();
    for (const r of rows) {
      try {
        const e = JSON.parse(r.value);
        if (e.lastFailAt && now() - e.lastFailAt > FAIL_WINDOW_MS) {
          removeEntry(r.key);
          continue;
        }
        attempts.set(r.key, e);
        loaded.add(r.key);
      } catch {}
    }
    if (loaded.size > 0) {
      console.log(`[loginLimiter] loaded ${loaded.size} persisted entries`);
    }
  } catch {}
}

loadPersistedEntries();
