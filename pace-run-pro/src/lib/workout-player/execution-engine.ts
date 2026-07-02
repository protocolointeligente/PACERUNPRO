"use client";

import type {
  PlayerStep,
  PlayerSession,
  ExecutionState,
  ExecutionStatus,
  WorkoutCompletionData,
} from "./types";

type StatusListener = (status: ExecutionStatus) => void;
type CompletionListener = (data: WorkoutCompletionData) => void;
type CountdownListener = (value: 3 | 2 | 1) => void;
type StepChangeListener = (step: PlayerStep, index: number) => void;

export class WorkoutExecutionEngine {
  private session: PlayerSession | null = null;
  private state: ExecutionState = "idle";
  private currentStepIndex = 0;
  private stepElapsedSec = 0;
  private totalElapsedSec = 0;
  private countdownValue: number | null = null;
  private completedStepCount = 0;

  private tickInterval: ReturnType<typeof setInterval> | null = null;
  private countdownInterval: ReturnType<typeof setInterval> | null = null;

  private statusListeners: StatusListener[] = [];
  private completionListeners: CompletionListener[] = [];
  private countdownListeners: CountdownListener[] = [];
  private stepChangeListeners: StepChangeListener[] = [];

  // ── Lifecycle ─────────────────────────────────────────────────────────────

  load(session: PlayerSession): void {
    this.session = session;
    this.state = "idle";
    this.currentStepIndex = 0;
    this.stepElapsedSec = 0;
    this.totalElapsedSec = 0;
    this.completedStepCount = 0;
    this.countdownValue = null;
    this.emit();
  }

  start(): void {
    if (!this.session || this.state !== "idle") return;
    const step = this.currentStep();
    if (step?.countdownEnabled) {
      this.startCountdown(() => this.beginStep());
    } else {
      this.beginStep();
    }
  }

  pause(): void {
    if (this.state !== "running") return;
    this.state = "paused";
    this.stopTick();
    this.emit();
  }

  resume(): void {
    if (this.state !== "paused") return;
    this.state = "running";
    this.startTick();
    this.emit();
  }

  skipStep(): void {
    if (this.state !== "running" && this.state !== "paused") return;
    this.advanceStep();
  }

  stop(): void {
    this.state = "completed";
    this.stopTick();
    this.stopCountdown();
    this.fireCompletion();
    this.emit();
  }

  destroy(): void {
    this.stopTick();
    this.stopCountdown();
    this.statusListeners = [];
    this.completionListeners = [];
    this.countdownListeners = [];
    this.stepChangeListeners = [];
  }

  // ── Countdown ─────────────────────────────────────────────────────────────

  private startCountdown(onDone: () => void): void {
    this.state = "countdown";
    let n = 3;
    this.countdownValue = n;
    this.emit();
    this.countdownListeners.forEach((l) => l(n as 3 | 2 | 1));

    this.countdownInterval = setInterval(() => {
      n--;
      if (n > 0) {
        this.countdownValue = n;
        this.emit();
        this.countdownListeners.forEach((l) => l(n as 3 | 2 | 1));
      } else {
        this.countdownValue = null;
        this.stopCountdown();
        onDone();
      }
    }, 1000);
  }

  private stopCountdown(): void {
    if (this.countdownInterval) {
      clearInterval(this.countdownInterval);
      this.countdownInterval = null;
    }
  }

  // ── Step execution ─────────────────────────────────────────────────────────

  private beginStep(): void {
    if (!this.session) return;
    this.state = "running";
    this.stepElapsedSec = 0;
    const step = this.currentStep();
    if (step) this.stepChangeListeners.forEach((l) => l(step, this.currentStepIndex));
    this.startTick();
    this.emit();
  }

  private startTick(): void {
    this.stopTick();
    this.tickInterval = setInterval(() => {
      this.stepElapsedSec++;
      this.totalElapsedSec++;

      const step = this.currentStep();
      if (!step) { this.stop(); return; }

      // Auto-advance by time
      if (step.durationType === "TIME" && step.autoAdvance) {
        if (this.stepElapsedSec >= step.durationSeconds) {
          this.advanceStep();
          return;
        }
      }

      this.emit();
    }, 1000);
  }

  private stopTick(): void {
    if (this.tickInterval) {
      clearInterval(this.tickInterval);
      this.tickInterval = null;
    }
  }

  private advanceStep(): void {
    if (!this.session) return;
    this.completedStepCount++;
    const nextIndex = this.currentStepIndex + 1;

    if (nextIndex >= this.session.steps.length) {
      this.stop();
      return;
    }

    this.stopTick();
    this.currentStepIndex = nextIndex;
    this.stepElapsedSec = 0;

    const nextStep = this.currentStep();
    if (nextStep?.countdownEnabled) {
      this.state = "countdown";
      this.emit();
      this.startCountdown(() => this.beginStep());
    } else {
      this.beginStep();
    }
  }

  private fireCompletion(): void {
    if (!this.session) return;
    const data: WorkoutCompletionData = {
      workoutId: this.session.workoutId,
      durationSec: this.totalElapsedSec,
      completedSteps: this.completedStepCount,
      totalSteps: this.session.totalSteps,
    };
    this.completionListeners.forEach((l) => l(data));
  }

  // ── Status ─────────────────────────────────────────────────────────────────

  private currentStep(): PlayerStep | null {
    if (!this.session) return null;
    return this.session.steps[this.currentStepIndex] ?? null;
  }

  private emit(): void {
    const status = this.getStatus();
    this.statusListeners.forEach((l) => l(status));
  }

  getStatus(): ExecutionStatus {
    const step = this.currentStep();
    const nextStep = this.session?.steps[this.currentStepIndex + 1] ?? null;
    const totalSteps = this.session?.totalSteps ?? 0;
    const stepRemainingPercent =
      step && step.durationType === "TIME" && step.durationSeconds > 0
        ? Math.max(0, Math.min(100, (1 - this.stepElapsedSec / step.durationSeconds) * 100))
        : 0;
    const progressPercent =
      totalSteps > 0 ? Math.round((this.completedStepCount / totalSteps) * 100) : 0;

    return {
      state: this.state,
      currentStepIndex: this.currentStepIndex,
      currentStep: step,
      nextStep: nextStep ?? null,
      stepElapsedSec: this.stepElapsedSec,
      stepRemainingPercent,
      totalElapsedSec: this.totalElapsedSec,
      countdownValue: this.countdownValue,
      completedStepCount: this.completedStepCount,
      currentRep: (step?.repeatIndex ?? 0) + 1,
      totalReps: step?.repeatTotal ?? 1,
      progressPercent,
    };
  }

  getState(): ExecutionState { return this.state; }

  // ── Listeners ──────────────────────────────────────────────────────────────

  onStatus(listener: StatusListener): () => void {
    this.statusListeners.push(listener);
    return () => { this.statusListeners = this.statusListeners.filter((l) => l !== listener); };
  }

  onCompletion(listener: CompletionListener): () => void {
    this.completionListeners.push(listener);
    return () => { this.completionListeners = this.completionListeners.filter((l) => l !== listener); };
  }

  onCountdown(listener: CountdownListener): () => void {
    this.countdownListeners.push(listener);
    return () => { this.countdownListeners = this.countdownListeners.filter((l) => l !== listener); };
  }

  onStepChange(listener: StepChangeListener): () => void {
    this.stepChangeListeners.push(listener);
    return () => { this.stepChangeListeners = this.stepChangeListeners.filter((l) => l !== listener); };
  }
}
