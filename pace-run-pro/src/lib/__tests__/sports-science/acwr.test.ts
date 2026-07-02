import { describe, it, expect } from "vitest";
import { computeACWR, acwrRisk, ACWR_RISK_LABELS } from "@/lib/sports-science/acwr";

function buildDailyTss(entries: { daysAgo: number; tss: number }[]): Map<string, number> {
  const map = new Map<string, number>();
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  for (const { daysAgo, tss } of entries) {
    const d = new Date(today);
    d.setDate(d.getDate() - daysAgo);
    map.set(d.toISOString().slice(0, 10), tss);
  }
  return map;
}

describe("computeACWR", () => {
  it("returns ratio 1 when map is empty (chronic = 0, acute = 0)", () => {
    const result = computeACWR(new Map());
    expect(result.ratio).toBe(1);
    expect(result.risk).toBe("optimal");
  });

  it("ratio is acute/chronic in steady state", () => {
    // 100 TSS every day for 28 days → acute=700, chronic=700, ratio=1.0
    const entries = Array.from({ length: 28 }, (_, i) => ({ daysAgo: i, tss: 100 }));
    const result = computeACWR(buildDailyTss(entries));
    expect(result.ratio).toBeCloseTo(1.0, 1);
    expect(result.risk).toBe("optimal");
  });

  it("spike in acute week → ratio > 1", () => {
    // Last 7 days: 200 TSS; previous 21 days: 100 TSS
    const entries = [
      ...Array.from({ length: 7 }, (_, i) => ({ daysAgo: i, tss: 200 })),
      ...Array.from({ length: 21 }, (_, i) => ({ daysAgo: i + 7, tss: 100 })),
    ];
    const result = computeACWR(buildDailyTss(entries));
    expect(result.ratio).toBeGreaterThan(1);
    expect(result.acute).toBeCloseTo(1400, 0);
  });

  it("no training in acute week → ratio 0 → undertrained", () => {
    // Only loads 8-28 days ago
    const entries = Array.from({ length: 21 }, (_, i) => ({ daysAgo: i + 7, tss: 100 }));
    const result = computeACWR(buildDailyTss(entries));
    expect(result.acute).toBe(0);
    expect(result.ratio).toBeCloseTo(0, 1);
    expect(result.risk).toBe("undertrained");
  });

  it("ratio > 1.5 → danger", () => {
    // Huge acute spike
    const entries = [
      ...Array.from({ length: 7 }, (_, i) => ({ daysAgo: i, tss: 500 })),
      ...Array.from({ length: 21 }, (_, i) => ({ daysAgo: i + 7, tss: 50 })),
    ];
    const result = computeACWR(buildDailyTss(entries));
    expect(result.risk).toBe("danger");
  });
});

describe("acwrRisk", () => {
  it("< 0.8 → undertrained", () => expect(acwrRisk(0.7)).toBe("undertrained"));
  it("0.8-1.3 → optimal", () => {
    expect(acwrRisk(0.8)).toBe("optimal");
    expect(acwrRisk(1.0)).toBe("optimal");
    expect(acwrRisk(1.3)).toBe("optimal");
  });
  it("1.31-1.5 → caution", () => expect(acwrRisk(1.4)).toBe("caution"));
  it("> 1.5 → danger", () => expect(acwrRisk(1.6)).toBe("danger"));
});

describe("ACWR_RISK_LABELS", () => {
  it("all risk levels have label and color", () => {
    const risks = ["undertrained", "optimal", "caution", "danger"] as const;
    for (const r of risks) {
      expect(ACWR_RISK_LABELS[r].label).toBeTruthy();
      expect(ACWR_RISK_LABELS[r].color).toMatch(/^#/);
      expect(ACWR_RISK_LABELS[r].recommendation).toBeTruthy();
    }
  });
});

describe("computeACWR edge cases", () => {
  it("training only in the acute window → ratio = 4 (acute >> chronic average)", () => {
    // 7 days × 100 TSS: acute=700, chronicTotal=700, chronic=700/4=175, ratio=4
    const map = buildDailyTss(
      Array.from({ length: 7 }, (_, i) => ({ daysAgo: i, tss: 100 }))
    );
    const result = computeACWR(map);
    expect(result.ratio).toBeCloseTo(4, 1);
    expect(result.risk).toBe("danger");
  });
});
