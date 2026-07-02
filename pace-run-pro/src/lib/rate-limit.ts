/**
 * Sliding-window rate limiter (in-memory, per-process).
 *
 * For a single-instance deployment this is sufficient.
 * For multi-instance/serverless at scale, replace with Upstash Redis:
 * https://github.com/upstash/ratelimit-js
 *
 * Usage:
 *   const result = rateLimit(req, { limit: 5, windowMs: 60_000 });
 *   if (!result.ok) return NextResponse.json({ error: "Too many requests" }, { status: 429 });
 */

interface RateLimitOptions {
  /** Maximum requests allowed in the window. */
  limit: number;
  /** Window size in milliseconds. */
  windowMs: number;
  /** Optional key suffix to create separate buckets per endpoint. */
  key?: string;
}

interface RateLimitResult {
  ok: boolean;
  remaining: number;
  resetAt: number; // epoch ms when the window resets
}

// ip:key → array of request timestamps
const store = new Map<string, number[]>();

// Purge stale entries every 5 minutes to avoid unbounded growth
setInterval(() => {
  const now = Date.now();
  for (const [k, timestamps] of store) {
    // keep only last 10 minutes to be safe
    const fresh = timestamps.filter((t) => now - t < 600_000);
    if (fresh.length === 0) store.delete(k);
    else store.set(k, fresh);
  }
}, 300_000);

function getIp(req: Request): string {
  // Works in Next.js Edge / Node runtimes
  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();
  const realIp = req.headers.get("x-real-ip");
  return realIp ?? "unknown";
}

export function rateLimit(
  req: Request,
  { limit, windowMs, key = "" }: RateLimitOptions,
): RateLimitResult {
  const ip = getIp(req);
  const bucketKey = `${ip}:${key}`;
  const now = Date.now();
  const windowStart = now - windowMs;

  const timestamps = (store.get(bucketKey) ?? []).filter((t) => t > windowStart);
  timestamps.push(now);
  store.set(bucketKey, timestamps);

  const remaining = Math.max(0, limit - timestamps.length);
  const resetAt = (timestamps[0] ?? now) + windowMs;

  return { ok: timestamps.length <= limit, remaining, resetAt };
}

/** Returns a pre-configured rate limiter for a specific endpoint. */
export function createRateLimiter(opts: RateLimitOptions) {
  return (req: Request) => rateLimit(req, opts);
}

// Pre-configured limiters for each critical endpoint
export const authRegisterLimiter = createRateLimiter({
  limit: 5,
  windowMs: 15 * 60 * 1000, // 5 requests per 15 minutes
  key: "auth:register",
});

export const iaTreinadoraLimiter = createRateLimiter({
  limit: 20,
  windowMs: 60 * 1000, // 20 requests per minute
  key: "ia-treinadora",
});

export const checkoutLimiter = createRateLimiter({
  limit: 10,
  windowMs: 60 * 1000, // 10 requests per minute
  key: "checkout",
});

export const forgotPasswordLimiter = createRateLimiter({
  limit: 3,
  windowMs: 15 * 60 * 1000, // 3 requests per 15 minutes
  key: "auth:forgot-password",
});

export const voucherValidateLimiter = createRateLimiter({
  limit: 10,
  windowMs: 60 * 1000, // 10 requests per minute
  key: "voucher:validate",
});

export const resetPasswordLimiter = createRateLimiter({
  limit: 5,
  windowMs: 15 * 60 * 1000, // 5 requests per 15 minutes
  key: "auth:reset-password",
});

export const leadsLimiter = createRateLimiter({
  limit: 3,
  windowMs: 60 * 1000, // 3 lead submissions per minute per IP
  key: "leads",
});
