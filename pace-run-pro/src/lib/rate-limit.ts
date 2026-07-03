/**
 * Distributed rate limiter backed by Upstash Redis.
 *
 * Set UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN in the Vercel
 * dashboard (or .env.local) to enable Redis-backed limiting across all
 * serverless instances.  When those vars are absent the module falls back
 * to the in-process Map, which is fine for local development but provides
 * no cross-instance protection.
 *
 * Upstash free tier: https://console.upstash.com/
 */

import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

// ── Redis client (lazy; null when env vars are missing) ───────────────────

function getRedis(): Redis | null {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) return null;
  return new Redis({ url, token });
}

const redis = getRedis();

// ── Upstash sliding-window limiters ──────────────────────────────────────

function makeUpstashLimiter(requests: number, windowSec: number, prefix: string) {
  if (!redis) return null;
  return new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(requests, `${windowSec} s`),
    prefix: `rl:${prefix}`,
    analytics: false,
  });
}

// ── In-memory fallback (dev only) ────────────────────────────────────────

interface RateLimitResult {
  ok: boolean;
  remaining: number;
  resetAt: number;
}

const store = new Map<string, number[]>();

// Purge stale entries every 5 minutes
if (typeof setInterval !== "undefined") {
  setInterval(() => {
    const now = Date.now();
    for (const [k, timestamps] of store) {
      const fresh = timestamps.filter((t) => now - t < 600_000);
      if (fresh.length === 0) store.delete(k);
      else store.set(k, fresh);
    }
  }, 300_000);
}

function getIp(req: Request): string {
  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();
  return req.headers.get("x-real-ip") ?? "unknown";
}

function inMemoryLimit(
  req: Request,
  limit: number,
  windowMs: number,
  key: string,
): RateLimitResult {
  const ip = getIp(req);
  const bucketKey = `${ip}:${key}`;
  const now = Date.now();
  const windowStart = now - windowMs;

  const timestamps = (store.get(bucketKey) ?? []).filter((t) => t > windowStart);
  timestamps.push(now);
  store.set(bucketKey, timestamps);

  return {
    ok: timestamps.length <= limit,
    remaining: Math.max(0, limit - timestamps.length),
    resetAt: (timestamps[0] ?? now) + windowMs,
  };
}

// ── Public factory ────────────────────────────────────────────────────────

interface LimiterOptions {
  /** Max requests per window */
  limit: number;
  /** Window in milliseconds */
  windowMs: number;
  /** Unique key for this endpoint */
  key: string;
}

export function createRateLimiter({ limit, windowMs, key }: LimiterOptions) {
  const windowSec = Math.round(windowMs / 1000);
  const upstash = makeUpstashLimiter(limit, windowSec, key);

  return async (req: Request): Promise<RateLimitResult> => {
    if (upstash) {
      const ip = getIp(req);
      const result = await upstash.limit(ip);
      return {
        ok: result.success,
        remaining: result.remaining,
        resetAt: result.reset,
      };
    }
    return inMemoryLimit(req, limit, windowMs, key);
  };
}

// ── Pre-configured limiters ───────────────────────────────────────────────

export const authRegisterLimiter = createRateLimiter({
  limit: 5,
  windowMs: 15 * 60 * 1000,
  key: "auth:register",
});

export const iaTreinadoraLimiter = createRateLimiter({
  limit: 20,
  windowMs: 60 * 1000,
  key: "ia-treinadora",
});

export const checkoutLimiter = createRateLimiter({
  limit: 10,
  windowMs: 60 * 1000,
  key: "checkout",
});

export const forgotPasswordLimiter = createRateLimiter({
  limit: 3,
  windowMs: 15 * 60 * 1000,
  key: "auth:forgot-password",
});

export const voucherValidateLimiter = createRateLimiter({
  limit: 10,
  windowMs: 60 * 1000,
  key: "voucher:validate",
});

export const resetPasswordLimiter = createRateLimiter({
  limit: 5,
  windowMs: 15 * 60 * 1000,
  key: "auth:reset-password",
});

export const leadsLimiter = createRateLimiter({
  limit: 3,
  windowMs: 60 * 1000,
  key: "leads",
});

export const loginLimiter = createRateLimiter({
  limit: 10,
  windowMs: 15 * 60 * 1000,
  key: "auth:login",
});
