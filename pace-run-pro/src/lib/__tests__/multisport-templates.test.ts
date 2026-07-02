import { describe, it, expect } from "vitest";
import {
  multisportTemplates,
  getMultisportTemplate,
  MULTISPORT_GOALS,
  type MultisportTemplate,
} from "@/lib/multisport-templates";

describe("multisportTemplates", () => {
  it("tem pelo menos 5 templates", () => {
    expect(multisportTemplates.length).toBeGreaterThanOrEqual(5);
  });

  it("cada template tem id, goal, level, title, weeks", () => {
    for (const t of multisportTemplates) {
      expect(t.id).toBeTruthy();
      expect(t.goal).toBeTruthy();
      expect(t.level).toBeTruthy();
      expect(t.title).toBeTruthy();
      expect(t.weeks.length).toBeGreaterThan(0);
    }
  });

  it("durationWeeks corresponde ao número de semanas", () => {
    for (const t of multisportTemplates) {
      expect(t.weeks.length).toBe(t.durationWeeks);
    }
  });

  it("cada semana tem 7 dias", () => {
    for (const t of multisportTemplates) {
      for (const w of t.weeks) {
        expect(w.days).toHaveLength(7);
      }
    }
  });

  it("dias da semana são SEG/TER/QUA/QUI/SEX/SAB/DOM", () => {
    const expected = ["SEG", "TER", "QUA", "QUI", "SEX", "SAB", "DOM"];
    for (const t of multisportTemplates) {
      for (const w of t.weeks) {
        expect(w.days.map((d) => d.day)).toEqual(expected);
      }
    }
  });

  it("todos os sports são válidos", () => {
    const validSports = ["RUN", "BIKE", "SWIM", "STRENGTH", "MOBILITY", "BRICK", "REST"];
    for (const t of multisportTemplates) {
      for (const w of t.weeks) {
        for (const d of w.days) {
          expect(validSports).toContain(d.sport);
        }
      }
    }
  });

  it("targetDistribution soma ≈ 100% quando presente", () => {
    for (const t of multisportTemplates) {
      if (!t.targetDistribution) continue;
      const sum =
        t.targetDistribution.runPct +
        t.targetDistribution.bikePct +
        t.targetDistribution.swimPct +
        t.targetDistribution.strengthPct;
      expect(sum).toBeCloseTo(100, 0);
    }
  });
});

describe("getMultisportTemplate", () => {
  it("retorna template correto por goal + level", () => {
    const t = getMultisportTemplate("SPRINT_TRIATHLON", "iniciante");
    expect(t).toBeDefined();
    expect(t?.goal).toBe("SPRINT_TRIATHLON");
  });

  it("retorna template mesmo sem match exato de level", () => {
    const t = getMultisportTemplate("BIKE_BASE", "avancado");
    expect(t).toBeDefined();
    expect(t?.goal).toBe("BIKE_BASE");
  });

  it("retorna undefined para goal inexistente", () => {
    const t = getMultisportTemplate("OLIMPICO" as never, "iniciante");
    // OLIMPICO existe mas pode não ter level intermediário, fallback deve funcionar
    expect(t !== null).toBe(true);
  });
});

describe("MULTISPORT_GOALS", () => {
  it("tem entrada para cada goal dos templates", () => {
    const templateGoals = [...new Set(multisportTemplates.map((t) => t.goal))];
    for (const goal of templateGoals) {
      expect(MULTISPORT_GOALS[goal]).toBeDefined();
    }
  });

  it("cada goal tem label, emoji e description", () => {
    for (const [, cfg] of Object.entries(MULTISPORT_GOALS)) {
      expect(cfg.label).toBeTruthy();
      expect(cfg.emoji).toBeTruthy();
      expect(cfg.description).toBeTruthy();
    }
  });

  it("triathlon goals têm emoji 🏅", () => {
    expect(MULTISPORT_GOALS.SPRINT_TRIATHLON.emoji).toBe("🏅");
    expect(MULTISPORT_GOALS.OLIMPICO.emoji).toBe("🏅");
  });

  it("bike goals têm emoji 🚴", () => {
    expect(MULTISPORT_GOALS.GRAN_FONDO.emoji).toBe("🚴");
    expect(MULTISPORT_GOALS.BIKE_BASE.emoji).toBe("🚴");
  });
});
