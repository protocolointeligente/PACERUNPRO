import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock next/cache before importing cache.ts
vi.mock("next/cache", () => ({
  unstable_cache: vi.fn((fn, _keyParts, _opts) => fn),
}));

import * as nextCache from "next/cache";
import { cached, cacheTags, cacheHeaders } from "@/lib/cache";

const unstable_cache = nextCache.unstable_cache as ReturnType<typeof vi.fn>;

describe("cached()", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset the mock to passthrough (return fn unchanged)
    unstable_cache.mockImplementation((fn: unknown) => fn);
  });

  it("returns a function", () => {
    const fn = async () => 42;
    const result = cached(fn, ["key"]);
    expect(typeof result).toBe("function");
  });

  it("returned function calls the original async function", async () => {
    const fn = vi.fn(async (x: number) => x * 2);
    unstable_cache.mockImplementation((f: unknown) => f);
    const cachedFn = cached(fn, ["double"]);
    const val = await cachedFn(5);
    expect(val).toBe(10);
    expect(fn).toHaveBeenCalledWith(5);
  });

  it("passes keyParts to unstable_cache", () => {
    const fn = async () => "data";
    cached(fn, ["user", "123"]);
    expect(unstable_cache).toHaveBeenCalledWith(
      expect.any(Function),
      ["user", "123"],
      expect.objectContaining({ revalidate: 60 }),
    );
  });

  it("uses custom revalidate when provided", () => {
    const fn = async () => "data";
    cached(fn, ["k"], { revalidate: 300 });
    expect(unstable_cache).toHaveBeenCalledWith(
      expect.any(Function),
      ["k"],
      expect.objectContaining({ revalidate: 300 }),
    );
  });

  it("passes tags to unstable_cache", () => {
    const fn = async () => "data";
    cached(fn, ["k"], { tags: ["athlete:1"] });
    expect(unstable_cache).toHaveBeenCalledWith(
      expect.any(Function),
      ["k"],
      expect.objectContaining({ tags: ["athlete:1"] }),
    );
  });

  it("defaults revalidate to 60 when not provided", () => {
    const fn = async () => null;
    cached(fn, ["k"]);
    const call = unstable_cache.mock.calls[0];
    expect(call[2].revalidate).toBe(60);
  });

  it("accepts revalidate: false (no revalidation)", () => {
    const fn = async () => "static";
    cached(fn, ["k"], { revalidate: false });
    const call = unstable_cache.mock.calls[0];
    expect(call[2].revalidate).toBe(false);
  });
});

describe("cacheTags", () => {
  it("athlete tag includes id", () => {
    expect(cacheTags.athlete("abc")).toBe("athlete:abc");
  });

  it("coach tag includes id", () => {
    expect(cacheTags.coach("xyz")).toBe("coach:xyz");
  });

  it("workout tag includes id", () => {
    expect(cacheTags.workout("w1")).toBe("workout:w1");
  });

  it("plan tag includes id", () => {
    expect(cacheTags.plan("p1")).toBe("plan:p1");
  });

  it("marketplace returns fixed tag", () => {
    expect(cacheTags.marketplace()).toBe("marketplace");
  });

  it("different ids produce different tags", () => {
    expect(cacheTags.athlete("a")).not.toBe(cacheTags.athlete("b"));
  });
});

describe("cacheHeaders", () => {
  it("short() returns 60s Cache-Control", () => {
    const h = cacheHeaders.short();
    expect(h.get("Cache-Control")).toContain("s-maxage=60");
    expect(h.get("Cache-Control")).toContain("stale-while-revalidate");
  });

  it("medium() returns 300s Cache-Control", () => {
    const h = cacheHeaders.medium();
    expect(h.get("Cache-Control")).toContain("s-maxage=300");
  });

  it("long() returns 3600s Cache-Control", () => {
    const h = cacheHeaders.long();
    expect(h.get("Cache-Control")).toContain("s-maxage=3600");
  });

  it("none() returns private, no-store", () => {
    const h = cacheHeaders.none();
    expect(h.get("Cache-Control")).toContain("private");
    expect(h.get("Cache-Control")).toContain("no-store");
  });

  it("all methods return Headers instances", () => {
    expect(cacheHeaders.short()).toBeInstanceOf(Headers);
    expect(cacheHeaders.medium()).toBeInstanceOf(Headers);
    expect(cacheHeaders.long()).toBeInstanceOf(Headers);
    expect(cacheHeaders.none()).toBeInstanceOf(Headers);
  });

  it("short stale-while-revalidate is 30s", () => {
    const h = cacheHeaders.short();
    expect(h.get("Cache-Control")).toContain("stale-while-revalidate=30");
  });
});
