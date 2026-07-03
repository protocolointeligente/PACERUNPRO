/**
 * Server-side cache helpers using Next.js unstable_cache + Upstash Redis.
 * Provides typed wrappers with sensible revalidation defaults.
 */

import { unstable_cache as nextCache } from "next/cache";
import { Redis } from "@upstash/redis";

// ── Upstash Redis cache (falls back to pass-through when not configured) ──

function getRedis(): Redis | null {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) return null;
  return new Redis({ url, token });
}

const _redis = getRedis();

/**
 * Cache-aside helper backed by Upstash Redis.
 * Falls back to calling `fetcher` directly when Redis is not configured.
 *
 * @param key         Unique cache key (prefixed with `prp:` internally)
 * @param ttlSeconds  TTL in seconds
 * @param fetcher     Async function that produces the value on cache miss
 */
export async function withCache<T>(
  key: string,
  ttlSeconds: number,
  fetcher: () => Promise<T>,
): Promise<T> {
  if (!_redis) return fetcher();

  const cacheKey = `prp:${key}`;
  try {
    const cached = await _redis.get<T>(cacheKey);
    if (cached !== null && cached !== undefined) return cached;
  } catch { /* Redis read error — fall through */ }

  const value = await fetcher();

  try {
    await _redis.set(cacheKey, value, { ex: ttlSeconds });
  } catch { /* Redis write error — ignore */ }

  return value;
}

/** Invalidate a single cache key. */
export async function invalidateCache(key: string): Promise<void> {
  if (!_redis) return;
  try { await _redis.del(`prp:${key}`); } catch { /* ignore */ }
}

/** Invalidate all keys matching a prefix (uses SCAN, safe for large keyspaces). */
export async function invalidateCachePrefix(prefix: string): Promise<void> {
  if (!_redis) return;
  try {
    let cursor = 0;
    const pattern = `prp:${prefix}*`;
    do {
      const [nextCursor, keys] = await _redis.scan(cursor, { match: pattern, count: 100 });
      cursor = Number(nextCursor);
      if (keys.length > 0) await _redis.del(...(keys as [string, ...string[]]));
    } while (cursor !== 0);
  } catch { /* ignore */ }
}

type CacheOptions = {
  tags?: string[];
  revalidate?: number | false;
};

/**
 * Wrap any async function with Next.js data cache.
 * @param fn        — async function to cache
 * @param keyParts  — cache key segments (combined with fn body as cache key)
 * @param opts      — tags for on-demand revalidation, revalidate TTL in seconds
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function cached<T extends (...args: any[]) => Promise<any>>(
  fn: T,
  keyParts: string[],
  opts: CacheOptions = {},
): T {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return nextCache(fn as any, keyParts, {
    tags: opts.tags,
    revalidate: opts.revalidate ?? 60,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  }) as any as T;
}

/** Common cache tag builders */
export const cacheTags = {
  athlete: (id: string) => `athlete:${id}`,
  coach:   (id: string) => `coach:${id}`,
  workout: (id: string) => `workout:${id}`,
  plan:    (id: string) => `plan:${id}`,
  marketplace: ()       => "marketplace",
} as const;

/**
 * Standard HTTP cache headers for API routes.
 * Usage: return NextResponse.json(data, { headers: cacheHeaders.short() })
 */
export const cacheHeaders = {
  /** 60 seconds public cache, stale-while-revalidate 30s */
  short: () => new Headers({
    "Cache-Control": "public, s-maxage=60, stale-while-revalidate=30",
  }),
  /** 5 minutes */
  medium: () => new Headers({
    "Cache-Control": "public, s-maxage=300, stale-while-revalidate=60",
  }),
  /** 1 hour */
  long: () => new Headers({
    "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=300",
  }),
  /** No cache (for authenticated/personalized routes) */
  none: () => new Headers({
    "Cache-Control": "private, no-store",
  }),
};
