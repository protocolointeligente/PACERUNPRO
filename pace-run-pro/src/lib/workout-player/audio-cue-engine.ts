"use client"; // This is browser-only

export class AudioCueEngine {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private volume: number = 0.8;

  activate(): void {
    // Called on first user interaction. Creates AudioContext.
    if (typeof window === "undefined" || this.ctx) return;
    try {
      this.ctx = new (window.AudioContext || (window as unknown as {webkitAudioContext: typeof AudioContext}).webkitAudioContext)();
      this.masterGain = this.ctx.createGain();
      this.masterGain.connect(this.ctx.destination);
      this.masterGain.gain.value = this.volume;
    } catch { /* silent fail */ }
  }

  setVolume(vol: number): void {
    this.volume = Math.max(0, Math.min(1, vol));
    if (this.masterGain) this.masterGain.gain.value = this.volume;
  }

  private beep(frequency: number, duration: number, startTime: number = 0, type: OscillatorType = "sine"): void {
    // Plays a single beep. Uses this.ctx to schedule.
    if (!this.ctx || !this.masterGain) return;
    const oscillator = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    oscillator.connect(gain);
    gain.connect(this.masterGain);
    oscillator.type = type;
    oscillator.frequency.value = frequency;
    const now = this.ctx.currentTime + startTime;
    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(0.3, now + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.001, now + duration);
    oscillator.start(now);
    oscillator.stop(now + duration);
  }

  // countdown_beep: low beep for 3, 2 — higher for 1
  playCountdown(value: 3 | 2 | 1): void {
    if (!this.ctx) return;
    const freq = value === 1 ? 880 : 440;
    const dur = value === 1 ? 0.3 : 0.15;
    this.beep(freq, dur, 0, "sine");
  }

  // start_block: ascending two-tone
  playStartBlock(): void {
    if (!this.ctx) return;
    this.beep(523, 0.1, 0);
    this.beep(659, 0.2, 0.12);
  }

  // end_block: descending two-tone
  playEndBlock(): void {
    if (!this.ctx) return;
    this.beep(659, 0.1, 0);
    this.beep(523, 0.15, 0.12);
  }

  // recovery_start: soft low tone
  playRecoveryStart(): void {
    if (!this.ctx) return;
    this.beep(330, 0.3, 0, "sine");
  }

  // workout_complete: celebratory ascending tones
  playWorkoutComplete(): void {
    if (!this.ctx) return;
    [523, 659, 784, 1047].forEach((freq, i) => {
      this.beep(freq, 0.25, i * 0.15);
    });
  }

  // off_target alerts
  playOffTargetSlow(): void {
    if (!this.ctx) return;
    this.beep(220, 0.2, 0, "square");
    this.beep(220, 0.2, 0.25, "square");
  }

  playOffTargetFast(): void {
    if (!this.ctx) return;
    this.beep(880, 0.1, 0, "square");
    this.beep(880, 0.1, 0.15, "square");
  }

  // halfway: single mid tone
  playHalfway(): void {
    if (!this.ctx) return;
    this.beep(440, 0.2, 0);
  }

  // final_minute: triple beep
  playFinalMinute(): void {
    if (!this.ctx) return;
    [0, 0.15, 0.3].forEach((t) => this.beep(660, 0.1, t));
  }

  isActive(): boolean {
    return this.ctx !== null;
  }

  destroy(): void {
    this.ctx?.close();
    this.ctx = null;
    this.masterGain = null;
  }
}
