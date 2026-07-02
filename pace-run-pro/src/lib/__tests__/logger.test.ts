import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

// Mock Sentry before importing logger
vi.mock("@sentry/nextjs", () => ({
  captureException: vi.fn(),
}));

import { logger } from "@/lib/logger";
import * as Sentry from "@sentry/nextjs";

describe("logger", () => {
  let stdoutSpy: ReturnType<typeof vi.spyOn>;
  let stderrSpy: ReturnType<typeof vi.spyOn>;
  let consoleSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    vi.stubEnv("NODE_ENV", "production");
    stdoutSpy = vi.spyOn(process.stdout, "write").mockImplementation(() => true);
    stderrSpy = vi.spyOn(process.stderr, "write").mockImplementation(() => true);
    consoleSpy = vi.spyOn(console, "log").mockImplementation(() => {});
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
  });

  it("info writes JSON to stdout in production", () => {
    logger.info("test info", { key: "value" });
    expect(stdoutSpy).toHaveBeenCalled();
    const output = String(stdoutSpy.mock.calls[0][0]);
    const parsed = JSON.parse(output);
    expect(parsed.level).toBe("info");
    expect(parsed.message).toBe("test info");
    expect(parsed.key).toBe("value");
  });

  it("error writes JSON to stderr in production", () => {
    logger.error("something broke", { context: "test" });
    expect(stderrSpy).toHaveBeenCalled();
    const output = String(stderrSpy.mock.calls[0][0]);
    const parsed = JSON.parse(output);
    expect(parsed.level).toBe("error");
  });

  it("error calls Sentry.captureException", () => {
    logger.error("sentry test", { err: new Error("test error") });
    expect(Sentry.captureException).toHaveBeenCalled();
  });

  it("warn writes to stderr in production", () => {
    logger.warn("warning msg");
    expect(stderrSpy).toHaveBeenCalled();
  });

  it("includes timestamp in log output", () => {
    logger.info("ts test");
    const output = String(stdoutSpy.mock.calls[0][0]);
    const parsed = JSON.parse(output);
    expect(parsed.ts).toBeTruthy();
    expect(new Date(parsed.ts).getTime()).toBeGreaterThan(0);
  });

  it("debug writes to stdout in production", () => {
    logger.debug("debug msg", { x: 1 });
    expect(stdoutSpy).toHaveBeenCalled();
  });

  it("works in development mode (console output)", () => {
    vi.stubEnv("NODE_ENV", "development");
    const devConsoleSpy = vi.spyOn(console, "log").mockImplementation(() => {});
    logger.info("dev log");
    expect(devConsoleSpy).toHaveBeenCalled();
  });
});
