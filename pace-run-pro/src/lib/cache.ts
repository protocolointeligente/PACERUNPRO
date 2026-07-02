/**
 * Server-side cache helpers using Next.js unstable_cache.
 * Provides typed wrappers with sensible revalidation defaults.
 */

import { unstable_cache as nextCache } from "next/cache";

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
