import { describe, it, expect, vi, afterEach } from "vitest";
import { rateLimit, createRateLimiter } from "@/lib/rate-limit";

function makeReq(ip = "1.2.3.4"): Request {
  return new Request("http://localhost/api/test", {
    headers: { "x-forwarded-for": ip },
  });
}

describe("rateLimit", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it("allows requests within limit", () => {
    const req = makeReq("10.0.0.1");
    const opts = { limit: 3, windowMs: 60_000, key: "test1" };
    expect(rateLimit(req, opts).ok).toBe(true);
    expect(rateLimit(req, opts).ok).toBe(true);
    expect(rateLimit(req, opts).ok).toBe(true);
  });

  it("blocks when limit is exceeded", () => {
    const req = makeReq("10.0.0.2");
    const opts = { limit: 2, windowMs: 60_000, key: "test2" };
    rateLimit(req, opts); // 1
    rateLimit(req, opts); // 2
    const result = rateLimit(req, opts); // 3 — over limit
    expect(result.ok).toBe(false);
    expect(result.remaining).toBe(0);
  });

  it("returns correct remaining count", () => {
    const req = makeReq("10.0.0.3");
    const opts = { limit: 5, windowMs: 60_000, key: "test3" };
    const r1 = rateLimit(req, opts);
    expect(r1.remaining).toBe(4);
    const r2 = rateLimit(req, opts);
    expect(r2.remaining).toBe(3);
  });

  it("returns resetAt in the future", () => {
    const req = makeReq("10.0.0.4");
    const result = rateLimit(req, { limit: 10, windowMs: 60_000, key: "test4" });
    expect(result.resetAt).toBeGreaterThan(Date.now());
  });

  it("isolates by key", () => {
    const req = makeReq("10.0.0.5");
    const r1 = rateLimit(req, { limit: 1, windowMs: 60_000, key: "keyA" });
    const r2 = rateLimit(req, { limit: 1, windowMs: 60_000, key: "keyB" });
    expect(r1.ok).toBe(true);
    expect(r2.ok).toBe(true);
  });

  it("isolates by IP", () => {
    const opts = { limit: 1, windowMs: 60_000, key: "testip" };
    const r1 = rateLimit(makeReq("1.1.1.1"), opts);
    const r2 = rateLimit(makeReq("2.2.2.2"), opts);
    expect(r1.ok).toBe(true);
    expect(r2.ok).toBe(true);
  });

  it("extracts IP from x-real-ip header", () => {
    const req = new Request("http://localhost/", {
      headers: { "x-real-ip": "9.9.9.9" },
    });
    const result = rateLimit(req, { limit: 5, windowMs: 60_000, key: "realip" });
    expect(result.ok).toBe(true);
  });
});

describe("createRateLimiter", () => {
  it("returns a function that applies the configured limits", () => {
    const limiter = createRateLimiter({ limit: 2, windowMs: 60_000, key: "cltest" });
    const req = makeReq("20.0.0.1");
    expect(limiter(req).ok).toBe(true);
    expect(limiter(req).ok).toBe(true);
    expect(limiter(req).ok).toBe(false);
  });
});
