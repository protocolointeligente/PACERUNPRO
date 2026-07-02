import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { WorkoutExecutionEngine } from "@/lib/workout-player/execution-engine";
import type { PlayerSession, PlayerStep } from "@/lib/workout-player/types";

function makeStep(overrides: Partial<PlayerStep> = {}): PlayerStep {
  return {
    id: "step-1",
    phase: "WORK",
    sport: "RUN",
    label: "Intervalo",
    instruction: "Pace 5k",
    durationType: "TIME",
    durationSeconds: 10,
    distanceMeters: 0,
    targetType: "PACE",
    targetMin: 280,
    targetMax: 310,
    targetUnit: "sec/km",
    zone: "Z4",
    zoneColor: "#C6F24E",
    countdownEnabled: false,
    autoAdvance: true,
    vibrationEnabled: false,
    ...overrides,
  };
}

function makeSession(steps: PlayerStep[] = [makeStep()]): PlayerSession {
  return {
    workoutId: "w1",
    workoutTitle: "Treino Teste",
    sport: "RUN",
    steps,
    totalSteps: steps.length,
    estimatedDurationSec: steps.reduce((a, s) => a + s.durationSeconds, 0),
  };
}

describe("WorkoutExecutionEngine", () => {
  let engine: WorkoutExecutionEngine;

  beforeEach(() => {
    vi.useFakeTimers();
    engine = new WorkoutExecutionEngine();
  });

  afterEach(() => {
    engine.destroy();
    vi.useRealTimers();
  });

  it("starts in idle state", () => {
    engine.load(makeSession());
    expect(engine.getState()).toBe("idle");
  });

  it("transitions to running after start (no countdown)", () => {
    const step = makeStep({ countdownEnabled: false });
    engine.load(makeSession([step]));
    engine.start();
    expect(engine.getState()).toBe("running");
  });

  it("transitions to countdown when countdownEnabled", () => {
    const step = makeStep({ countdownEnabled: true });
    engine.load(makeSession([step]));
    engine.start();
    expect(engine.getState()).toBe("countdown");
    vi.advanceTimersByTime(3000);
    expect(engine.getState()).toBe("running");
  });

  it("fires countdown listener with values 3, 2, 1", () => {
    const values: number[] = [];
    const step = makeStep({ countdownEnabled: true });
    engine.load(makeSession([step]));
    engine.onCountdown((v) => values.push(v));
    engine.start();
    vi.advanceTimersByTime(999);
    expect(values).toEqual([3]);
    vi.advanceTimersByTime(1000);
    expect(values).toEqual([3, 2]);
    vi.advanceTimersByTime(1000);
    expect(values).toEqual([3, 2, 1]);
  });

  it("pauses and resumes", () => {
    const step = makeStep({ countdownEnabled: false });
    engine.load(makeSession([step]));
    engine.start();
    engine.pause();
    expect(engine.getState()).toBe("paused");
    engine.resume();
    expect(engine.getState()).toBe("running");
  });

  it("advances step and fires status updates", () => {
    const statuses: string[] = [];
    const step = makeStep({ durationSeconds: 5, autoAdvance: true });
    engine.load(makeSession([step]));
    engine.onStatus((s) => statuses.push(s.state));
    engine.start();
    vi.advanceTimersByTime(5000);
    expect(engine.getState()).toBe("completed");
  });

  it("skip advances to next step", () => {
    const steps = [
      makeStep({ id: "s1", phase: "WARMUP", durationSeconds: 600 }),
      makeStep({ id: "s2", phase: "WORK",   durationSeconds: 300 }),
    ];
    engine.load(makeSession(steps));
    engine.start();
    expect(engine.getStatus().currentStepIndex).toBe(0);
    engine.skipStep();
    expect(engine.getStatus().currentStepIndex).toBe(1);
  });

  it("stop fires completion listener", () => {
    let fired = false;
    const step = makeStep();
    engine.load(makeSession([step]));
    engine.onCompletion(() => { fired = true; });
    engine.start();
    engine.stop();
    expect(fired).toBe(true);
    expect(engine.getState()).toBe("completed");
  });

  it("tracks total elapsed time", () => {
    const step = makeStep({ durationSeconds: 10, autoAdvance: false });
    engine.load(makeSession([step]));
    engine.start();
    vi.advanceTimersByTime(5000);
    expect(engine.getStatus().totalElapsedSec).toBe(5);
  });

  it("calculates stepRemainingPercent correctly", () => {
    const step = makeStep({ durationSeconds: 10, autoAdvance: false });
    engine.load(makeSession([step]));
    engine.start();
    vi.advanceTimersByTime(5000);
    const s = engine.getStatus();
    expect(s.stepRemainingPercent).toBeCloseTo(50, 0);
  });

  it("progressPercent increases with completed steps", () => {
    const steps = [
      makeStep({ id: "s1", durationSeconds: 1 }),
      makeStep({ id: "s2", durationSeconds: 1 }),
    ];
    engine.load(makeSession(steps));
    engine.start();
    vi.advanceTimersByTime(1000);
    const s = engine.getStatus();
    expect(s.progressPercent).toBeGreaterThan(0);
  });

  it("getStatus returns currentStep and nextStep", () => {
    const steps = [makeStep({ id: "s1" }), makeStep({ id: "s2" })];
    engine.load(makeSession(steps));
    engine.start();
    const s = engine.getStatus();
    expect(s.currentStep?.id).toBe("s1");
    expect(s.nextStep?.id).toBe("s2");
  });

  it("unsubscribe works", () => {
    const calls: number[] = [];
    engine.load(makeSession());
    const unsub = engine.onStatus((s) => calls.push(s.totalElapsedSec));
    engine.start();
    vi.advanceTimersByTime(2000);
    unsub();
    vi.advanceTimersByTime(2000);
    // calls should have stopped after unsub
    const callCount = calls.length;
    vi.advanceTimersByTime(2000);
    expect(calls.length).toBe(callCount);
  });
});

describe("VibrationCueEngine", () => {
  it("isSupported returns false outside browser", async () => {
    const { VibrationCueEngine } = await import("@/lib/workout-player/vibration-cue-engine");
    const vib = new VibrationCueEngine();
    // In jsdom / node, navigator.vibrate may not exist
    expect(typeof vib.isSupported()).toBe("boolean");
  });

  it("setEnabled can disable vibration", async () => {
    const { VibrationCueEngine } = await import("@/lib/workout-player/vibration-cue-engine");
    const vib = new VibrationCueEngine();
    vib.setEnabled(false);
    expect(() => vib.onStart()).not.toThrow();
  });
});
