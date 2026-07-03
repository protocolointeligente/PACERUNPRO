import { describe, it, expect, afterEach, vi } from "vitest";
import { createRateLimiter } from "@/lib/rate-limit";

function makeReq(ip = "1.2.3.4"): Request {
  return new Request("http://localhost/api/test", {
    headers: { "x-forwarded-for": ip },
  });
}

// Tests exercise the in-memory fallback path (UPSTASH_REDIS_REST_URL not set).
describe("createRateLimiter (in-memory fallback)", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it("allows requests within limit", async () => {
    const limiter = createRateLimiter({ limit: 3, windowMs: 60_000, key: "test1" });
    const req = makeReq("10.0.0.1");
    expect((await limiter(req)).ok).toBe(true);
    expect((await limiter(req)).ok).toBe(true);
    expect((await limiter(req)).ok).toBe(true);
  });

  it("blocks when limit is exceeded", async () => {
    const limiter = createRateLimiter({ limit: 2, windowMs: 60_000, key: "test2" });
    const req = makeReq("10.0.0.2");
    await limiter(req); // 1
    await limiter(req); // 2
    const result = await limiter(req); // 3 — over limit
    expect(result.ok).toBe(false);
    expect(result.remaining).toBe(0);
  });

  it("returns correct remaining count", async () => {
    const limiter = createRateLimiter({ limit: 5, windowMs: 60_000, key: "test3" });
    const req = makeReq("10.0.0.3");
    const r1 = await limiter(req);
    expect(r1.remaining).toBe(4);
    const r2 = await limiter(req);
    expect(r2.remaining).toBe(3);
  });

  it("returns resetAt in the future", async () => {
    const limiter = createRateLimiter({ limit: 10, windowMs: 60_000, key: "test4" });
    const req = makeReq("10.0.0.4");
    const result = await limiter(req);
    expect(result.resetAt).toBeGreaterThan(Date.now());
  });

  it("isolates by key", async () => {
    const l1 = createRateLimiter({ limit: 1, windowMs: 60_000, key: "keyA" });
    const l2 = createRateLimiter({ limit: 1, windowMs: 60_000, key: "keyB" });
    const req = makeReq("10.0.0.5");
    expect((await l1(req)).ok).toBe(true);
    expect((await l2(req)).ok).toBe(true);
  });

  it("isolates by IP", async () => {
    const limiter = createRateLimiter({ limit: 1, windowMs: 60_000, key: "testip" });
    expect((await limiter(makeReq("1.1.1.1"))).ok).toBe(true);
    expect((await limiter(makeReq("2.2.2.2"))).ok).toBe(true);
  });

  it("extracts IP from x-real-ip header", async () => {
    const limiter = createRateLimiter({ limit: 5, windowMs: 60_000, key: "realip" });
    const req = new Request("http://localhost/", { headers: { "x-real-ip": "9.9.9.9" } });
    expect((await limiter(req)).ok).toBe(true);
  });
});
