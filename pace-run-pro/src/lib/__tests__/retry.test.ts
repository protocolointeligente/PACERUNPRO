import { describe, it, expect, vi } from "vitest";
import { withRetry } from "@/lib/retry";

describe("withRetry", () => {
  it("returns value on first success", async () => {
    const fn = vi.fn().mockResolvedValue("ok");
    expect(await withRetry(fn)).toBe("ok");
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it("retries on failure and succeeds on 2nd attempt", async () => {
    const fn = vi.fn()
      .mockRejectedValueOnce(new Error("fail"))
      .mockResolvedValue("ok");
    const result = await withRetry(fn, { retries: 3, baseDelayMs: 1 });
    expect(result).toBe("ok");
    expect(fn).toHaveBeenCalledTimes(2);
  });

  it("throws after exhausting all retries", async () => {
    const err = new Error("always fails");
    const fn = vi.fn().mockRejectedValue(err);
    await expect(withRetry(fn, { retries: 3, baseDelayMs: 1 })).rejects.toThrow("always fails");
    expect(fn).toHaveBeenCalledTimes(3);
  });

  it("calls onRetry with error and attempt number", async () => {
    const onRetry = vi.fn();
    const fn = vi.fn()
      .mockRejectedValueOnce(new Error("e1"))
      .mockResolvedValue("ok");
    await withRetry(fn, { retries: 3, baseDelayMs: 1, onRetry });
    expect(onRetry).toHaveBeenCalledWith(expect.any(Error), 1);
  });

  it("aborts immediately when shouldAbort returns true", async () => {
    const fn = vi.fn().mockRejectedValue(new Error("fatal"));
    await expect(
      withRetry(fn, { retries: 5, baseDelayMs: 1, shouldAbort: () => true })
    ).rejects.toThrow("fatal");
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it("does not abort when shouldAbort returns false", async () => {
    const fn = vi.fn()
      .mockRejectedValueOnce(new Error("nope"))
      .mockResolvedValue("done");
    const result = await withRetry(fn, { retries: 3, baseDelayMs: 1, shouldAbort: () => false });
    expect(result).toBe("done");
  });

  it("respects maxDelayMs cap", async () => {
    const fn = vi.fn().mockRejectedValue(new Error("x"));
    const start = Date.now();
    await withRetry(fn, { retries: 2, baseDelayMs: 5, maxDelayMs: 5 }).catch(() => {});
    // Should complete quickly even though retries > 1
    expect(Date.now() - start).toBeLessThan(200);
  });

  it("works with default options", async () => {
    let attempts = 0;
    const fn = async () => {
      attempts++;
      if (attempts < 3) throw new Error("retry");
      return "final";
    };
    const result = await withRetry(fn, { baseDelayMs: 1 });
    expect(result).toBe("final");
    expect(attempts).toBe(3);
  });
});
