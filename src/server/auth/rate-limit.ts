import "server-only";

export const LOGIN_LIMIT = 10;
export const LOGIN_WINDOW_MS = 60_000;

type Bucket = { count: number; resetAt: number };

/** In-memory fixed-window limiter. Per-process only; swap for a shared store if scaled out. */
export function createRateLimiter(
  limit: number,
  windowMs: number,
  now: () => number = Date.now
) {
  const buckets = new Map<string, Bucket>();
  return {
    /** Records an attempt; returns false once the key exceeds the limit. */
    attempt(key: string): boolean {
      const t = now();
      if (buckets.size > 10_000) {
        buckets.forEach((b, k) => {
          if (b.resetAt <= t) buckets.delete(k);
        });
      }
      const bucket = buckets.get(key);
      if (!bucket || bucket.resetAt <= t) {
        buckets.set(key, { count: 1, resetAt: t + windowMs });
        return true;
      }
      bucket.count += 1;
      return bucket.count <= limit;
    },
  };
}

const globalForLimiter = globalThis as unknown as {
  __loginLimiter?: ReturnType<typeof createRateLimiter>;
};

export function loginLimiter() {
  globalForLimiter.__loginLimiter ??= createRateLimiter(
    LOGIN_LIMIT,
    LOGIN_WINDOW_MS
  );
  return globalForLimiter.__loginLimiter;
}

export function clientKey(headers: Headers): string {
  const first = headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  return first || "unknown";
}
