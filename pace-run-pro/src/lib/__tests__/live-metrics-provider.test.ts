import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { PaceAlertEngine } from "@/lib/workout-player/pace-alert-engine";

describe("PaceAlertEngine", () => {
  let engine: PaceAlertEngine;

  beforeEach(() => {
    engine = new PaceAlertEngine();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("returns null when pace is null", () => {
    expect(engine.check(null, 280, 310)).toBeNull();
  });

  it("returns null when on target", () => {
    expect(engine.check(295, 280, 310)).toBeNull();
  });

  it("returns null before grace period (20s) even when too slow", () => {
    const result = engine.check(350, 280, 310);
    expect(result).toBeNull();
  });

  it("returns too_slow alert after grace period", () => {
    // Simulate being off-target first
    engine.check(350, 280, 310);
    // Advance past grace period
    vi.advanceTimersByTime(21_000);
    // trigger again to check
    const result = engine.check(350, 280, 310);
    expect(result).not.toBeNull();
    expect(result?.type).toBe("too_slow");
  });

  it("returns too_fast alert after grace period", () => {
    engine.check(200, 280, 310);
    vi.advanceTimersByTime(21_000);
    const result = engine.check(200, 280, 310);
    expect(result?.type).toBe("too_fast");
  });

  it("respects 60s cooldown between alerts", () => {
    engine.check(350, 280, 310);
    vi.advanceTimersByTime(21_000);
    const first = engine.check(350, 280, 310);
    expect(first).not.toBeNull();
    // Try again immediately — should be null (cooldown)
    const second = engine.check(350, 280, 310);
    expect(second).toBeNull();
    // After 60s cooldown, should fire again
    vi.advanceTimersByTime(61_000);
    const third = engine.check(350, 280, 310);
    expect(third).not.toBeNull();
  });

  it("reset clears cooldown and off-target tracking", () => {
    engine.check(350, 280, 310);
    vi.advanceTimersByTime(21_000);
    engine.check(350, 280, 310); // fires first alert
    engine.reset();
    // After reset, grace period and cooldown are gone
    engine.check(350, 280, 310);
    vi.advanceTimersByTime(21_000);
    const result = engine.check(350, 280, 310);
    expect(result).not.toBeNull();
  });

  it("alert message mentions correct direction for too_slow", () => {
    engine.check(350, 280, 310);
    vi.advanceTimersByTime(21_000);
    const result = engine.check(350, 280, 310);
    expect(result?.message).toContain("Acelere");
  });

  it("alert message mentions correct direction for too_fast", () => {
    engine.check(200, 280, 310);
    vi.advanceTimersByTime(21_000);
    const result = engine.check(200, 280, 310);
    expect(result?.message).toContain("Reduza");
  });

  it("returns null when targetMin is 0", () => {
    engine.check(300, 0, 310);
    vi.advanceTimersByTime(21_000);
    expect(engine.check(300, 0, 310)).toBeNull();
  });
});
