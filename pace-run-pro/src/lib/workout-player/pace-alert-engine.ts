export type PaceAlertType = "too_slow" | "too_fast" | "on_target";

export interface PaceAlert {
  type: PaceAlertType;
  currentPace: number;
  targetMin: number;
  targetMax: number;
  message: string;
}

export class PaceAlertEngine {
  private lastAlertTime: Record<PaceAlertType, number> = {
    too_slow: 0,
    too_fast: 0,
    on_target: 0,
  };
  private offTargetSince: Record<PaceAlertType, number> = {
    too_slow: 0,
    too_fast: 0,
    on_target: 0,
  };
  private readonly cooldownMs = 60_000;
  private readonly gracePeriodMs = 20_000;

  check(
    currentPace: number | null,
    targetMin: number,
    targetMax: number
  ): PaceAlert | null {
    if (!currentPace || targetMin <= 0 || targetMax <= 0) return null;
    const now = Date.now();

    let alertType: PaceAlertType | null = null;

    // In pace, HIGHER number = SLOWER (min/km)
    // too_slow = pace > targetMax (athlete is slower than allowed)
    // too_fast = pace < targetMin (athlete is faster than target range)
    if (currentPace > targetMax) {
      alertType = "too_slow";
    } else if (currentPace < targetMin) {
      alertType = "too_fast";
    } else {
      this.offTargetSince.too_slow = 0;
      this.offTargetSince.too_fast = 0;
      return null;
    }

    // Track when we first went off-target
    if (!this.offTargetSince[alertType]) {
      this.offTargetSince[alertType] = now;
      return null;
    }

    // Only alert after grace period
    const offDuration = now - this.offTargetSince[alertType];
    if (offDuration < this.gracePeriodMs) return null;

    // Check cooldown
    if (now - this.lastAlertTime[alertType] < this.cooldownMs) return null;

    this.lastAlertTime[alertType] = now;
    const other: PaceAlertType = alertType === "too_slow" ? "too_fast" : "too_slow";
    this.offTargetSince[other] = 0;

    return {
      type: alertType,
      currentPace,
      targetMin,
      targetMax,
      message:
        alertType === "too_slow"
          ? "Você está acima do ritmo alvo. Acelere levemente."
          : "Você está abaixo do ritmo alvo. Reduza levemente.",
    };
  }

  reset(): void {
    this.lastAlertTime = { too_slow: 0, too_fast: 0, on_target: 0 };
    this.offTargetSince = { too_slow: 0, too_fast: 0, on_target: 0 };
  }
}
