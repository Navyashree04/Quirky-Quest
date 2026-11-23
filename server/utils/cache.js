/**
 * Minimal in-memory TTL cache.
 *
 * This satisfies the "cache leaderboard reads to reduce DB load" requirement
 * for a single-instance dev/demo deployment. In production behind an
 * auto-scaling group with multiple instances, replace this with Redis
 * (ioredis) so cache state is shared across instances — the get/set/del
 * interface below is intentionally Redis-compatible-ish to make that swap
 * a small diff rather than a rewrite.
 */
class TtlCache {
  constructor() {
    this.store = new Map(); // key -> { value, expiresAt }
  }

  get(key) {
    const entry = this.store.get(key);
    if (!entry) return undefined;
    if (Date.now() > entry.expiresAt) {
      this.store.delete(key);
      return undefined;
    }
    return entry.value;
  }

  set(key, value, ttlMs) {
    this.store.set(key, { value, expiresAt: Date.now() + ttlMs });
  }

  /** Deletes all keys starting with the given prefix (e.g. invalidate all pages of a leaderboard). */
  delByPrefix(prefix) {
    for (const key of this.store.keys()) {
      if (key.startsWith(prefix)) this.store.delete(key);
    }
  }
}

module.exports = new TtlCache();
