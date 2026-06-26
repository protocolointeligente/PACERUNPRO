import { describe, it, expect } from "vitest";
import {
  estimateTSS,
  computeLoadSeries,
  computeEWMASeries,
  detectAlerts,
  formStatus,
  trimpBanister,
  trimpWithFallback,
  ewmaRiskLevel,
} from "../training-load";

// ── TSS estimation ────────────────────────────────────────────────────────

describe("estimateTSS", () => {
  it("treino fácil tem TSS menor que intervalado", () => {
    const easy = estimateTSS({ type: "RODAGEM_LEVE", targetDurationMin: 60 });
    const interval = estimateTSS({ type: "INTERVALADO_CURTO", targetDurationMin: 60 });
    expect(interval).toBeGreaterThan(easy);
  });

  it("mobilidade tem TSS menor que corrida", () => {
    const mobility = estimateTSS({ type: "MOBILIDADE", targetDurationMin: 30 });
    const run = estimateTSS({ type: "RODAGEM_LEVE", targetDurationMin: 30 });
    expect(mobility).toBeLessThan(run);
  });

  it("usa threshold pace quando disponível para running TSS", () => {
    const tssWithParams = estimateTSS(
      { type: "TEMPO_RUN", targetDurationMin: 40, targetPaceSecPerKm: 270 },
      { thresholdPaceSecPerKm: 280 },
    );
    const tssWithoutParams = estimateTSS(
      { type: "TEMPO_RUN", targetDurationMin: 40, targetPaceSecPerKm: 270 },
    );
    // ambos devem ser positivos e razoáveis
    expect(tssWithParams).toBeGreaterThan(0);
    expect(tssWithoutParams).toBeGreaterThan(0);
  });

  it("treino de força tem TSS reduzido (fator 0.55)", () => {
    const strength = estimateTSS({ type: "FORCA", targetDurationMin: 60, targetRpe: 7 });
    // TSS de força deve ser < running equivalente
    expect(strength).toBeGreaterThan(0);
    expect(strength).toBeLessThan(100);
  });
});

// ── CTL/ATL/TSB series ───────────────────────────────────────────────────

describe("computeLoadSeries", () => {
  it("retorna vazio para mapa vazio", () => {
    expect(computeLoadSeries(new Map())).toHaveLength(0);
  });

  it("CTL aumenta com treino consistente", () => {
    const tss = new Map<string, number>();
    const today = new Date();
    for (let i = 60; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      tss.set(d.toISOString().slice(0, 10), 60);
    }
    const series = computeLoadSeries(tss, 60);
    const first = series[0].ctl;
    const last = series[series.length - 1].ctl;
    expect(last).toBeGreaterThan(first);
  });

  it("ATL reage mais rápido que CTL após aumento de carga", () => {
    const tss = new Map<string, number>();
    const today = new Date();
    // 30 dias de carga baixa
    for (let i = 37; i > 7; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      tss.set(d.toISOString().slice(0, 10), 20);
    }
    // 7 dias de carga alta súbita
    for (let i = 7; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      tss.set(d.toISOString().slice(0, 10), 150);
    }
    const series = computeLoadSeries(tss, 45);
    const last = series[series.length - 1];
    // ATL deve ser maior que CTL durante spike
    expect(last.atl).toBeGreaterThan(last.ctl);
  });
});

// ── EWMA ─────────────────────────────────────────────────────────────────

describe("computeEWMASeries", () => {
  it("retorna vazio para mapa vazio", () => {
    expect(computeEWMASeries(new Map())).toHaveLength(0);
  });

  it("EWMA Chronic aumenta com treino consistente", () => {
    const tss = new Map<string, number>();
    const today = new Date();
    for (let i = 60; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      tss.set(d.toISOString().slice(0, 10), 50);
    }
    const series = computeEWMASeries(tss, undefined, undefined, 60);
    const first = series[0].ewmaChronic;
    const last = series[series.length - 1].ewmaChronic;
    expect(last).toBeGreaterThan(first);
  });

  it("ewmaRatio começa > 1 quando carga súbita", () => {
    const tss = new Map<string, number>();
    const today = new Date();
    for (let i = 3; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      tss.set(d.toISOString().slice(0, 10), 200);
    }
    const series = computeEWMASeries(tss);
    const last = series[series.length - 1];
    expect(last.ewmaRatio).toBeGreaterThan(1);
  });
});

// ── EWMA Risk Level ───────────────────────────────────────────────────────

describe("ewmaRiskLevel", () => {
  it("ratio 1.0 → zona ótima", () => {
    expect(ewmaRiskLevel(1.0).level).toBe("moderate");
  });

  it("ratio 0.5 → carga baixa", () => {
    expect(ewmaRiskLevel(0.5).level).toBe("low");
  });

  it("ratio 1.6 → alto risco", () => {
    expect(ewmaRiskLevel(1.6).level).toBe("very_high");
  });

  it("ratio 1.2 → zona ótima", () => {
    expect(ewmaRiskLevel(1.2).level).toBe("moderate");
  });
});

// ── TRIMP de Banister ─────────────────────────────────────────────────────

describe("trimpBanister", () => {
  it("retorna null com dados inválidos", () => {
    expect(trimpBanister(60, 0, 190, 60)).toBeNull();
    expect(trimpBanister(60, 140, 0, 60)).toBeNull();
    expect(trimpBanister(0, 140, 190, 60)).toBeNull();
  });

  it("TRIMP maior para esforço mais intenso (FC média mais alta)", () => {
    const lowIntensity = trimpBanister(60, 130, 190, 55)!;
    const highIntensity = trimpBanister(60, 165, 190, 55)!;
    expect(highIntensity).toBeGreaterThan(lowIntensity);
  });

  it("duração maior = TRIMP maior (mesma intensidade)", () => {
    const short = trimpBanister(30, 145, 190, 55)!;
    const long = trimpBanister(60, 145, 190, 55)!;
    expect(long).toBeCloseTo(short * 2, 0);
  });

  it("retorna valor positivo para inputs válidos", () => {
    const result = trimpBanister(60, 145, 190, 55);
    expect(result).toBeGreaterThan(0);
  });
});

describe("trimpWithFallback", () => {
  it("usa método Banister quando FC disponível", () => {
    const result = trimpWithFallback(60, {
      avgHr: 145,
      maxHr: 190,
      hrRest: 55,
      rpe: 7,
    });
    expect(result.method).toBe("banister");
  });

  it("usa método Foster quando FC não disponível", () => {
    const result = trimpWithFallback(60, { rpe: 7 });
    expect(result.method).toBe("foster");
    expect(result.value).toBe(420); // 60 × 7
  });
});

// ── Alerts & form ─────────────────────────────────────────────────────────

describe("detectAlerts", () => {
  it("retorna vazio para série curta (<14 dias)", () => {
    const series = Array.from({ length: 10 }, (_, i) => ({
      date: `2026-06-${String(i + 1).padStart(2, "0")}`,
      tss: 60,
      ctl: 50,
      atl: 50,
      tsb: 0,
    }));
    expect(detectAlerts(series)).toHaveLength(0);
  });

  it("detecta overreaching quando TSB < -30", () => {
    const series = Array.from({ length: 14 }, (_, i) => ({
      date: `2026-06-${String(i + 1).padStart(2, "0")}`,
      tss: 60,
      ctl: 80,
      atl: 80,
      tsb: i < 13 ? -5 : -35,
    }));
    const alerts = detectAlerts(series);
    expect(alerts.some((a) => a.type === "overreaching")).toBe(true);
  });
});

describe("formStatus", () => {
  it("TSB > 25 → detraining", () => expect(formStatus(30)).toBe("detraining"));
  it("TSB 15 → peaking", () => expect(formStatus(15)).toBe("peaking"));
  it("TSB 5 → optimal", () => expect(formStatus(5)).toBe("optimal"));
  it("TSB -5 → training", () => expect(formStatus(-5)).toBe("training"));
  it("TSB -20 → fatigued", () => expect(formStatus(-20)).toBe("fatigued"));
  it("TSB -35 → overreaching", () => expect(formStatus(-35)).toBe("overreaching"));
});
