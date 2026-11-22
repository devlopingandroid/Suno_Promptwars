/** Best-effort, per-process abuse protection for the single-instance demo. */
export function createRateLimiter({
  windowMs = 60_000,
  maxRequests = 120,
  maxBuckets = 10_000,
} = {}) {
  const buckets = new Map<string, { count: number; resetAt: number }>();
  let nextPruneAt = 0;
  return {
    consume(key: string, now = Date.now()): number {
      if (now >= nextPruneAt) {
        for (const [ip, bucket] of buckets) {
          if (now >= bucket.resetAt) buckets.delete(ip);
        }
        nextPruneAt = now + windowMs;
      }
      let bucket = buckets.get(key);
      if (!bucket || now >= bucket.resetAt) {
        // Refuse new buckets at capacity instead of evicting an active limit.
        if (!bucket && buckets.size >= maxBuckets)
          return Math.max(1, Math.ceil((nextPruneAt - now) / 1000));
        bucket = { count: 0, resetAt: now + windowMs };
        buckets.set(key, bucket);
      }
      bucket.count++;
      return bucket.count > maxRequests
        ? Math.max(1, Math.ceil((bucket.resetAt - now) / 1000))
        : 0;
    },
  };
}
