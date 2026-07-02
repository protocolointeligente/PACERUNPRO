"use client";

const PATTERNS = {
  start:       [200],
  end_block:   [150, 100, 150],
  alert:       [300, 100, 300],
  complete:    [500],
  countdown:   [50],
  recovery:    [100, 50, 100],
};

export class VibrationCueEngine {
  private enabled: boolean = true;

  setEnabled(enabled: boolean): void {
    this.enabled = enabled;
  }

  isSupported(): boolean {
    return typeof window !== "undefined" && "vibrate" in navigator;
  }

  private vibrate(pattern: number[]): void {
    if (!this.enabled || !this.isSupported()) return;
    try {
      navigator.vibrate(pattern);
    } catch { /* desktop fallback — silent */ }
  }

  onStart(): void { this.vibrate(PATTERNS.start); }
  onEndBlock(): void { this.vibrate(PATTERNS.end_block); }
  onAlert(): void { this.vibrate(PATTERNS.alert); }
  onComplete(): void { this.vibrate(PATTERNS.complete); }
  onCountdown(): void { this.vibrate(PATTERNS.countdown); }
  onRecovery(): void { this.vibrate(PATTERNS.recovery); }
}
