import { describe, it, expect } from "vitest";
import { SCIENCE_DISCLAIMER, INJURY_RISK_DISCLAIMER, MEDICAL_DISCLAIMER, withDisclaimer } from "@/lib/sports-science/disclaimer";

describe("disclaimer constants", () => {
  it("SCIENCE_DISCLAIMER is a non-empty string", () => {
    expect(typeof SCIENCE_DISCLAIMER).toBe("string");
    expect(SCIENCE_DISCLAIMER.length).toBeGreaterThan(0);
  });

  it("INJURY_RISK_DISCLAIMER mentions profissional de saúde", () => {
    expect(INJURY_RISK_DISCLAIMER).toMatch(/profissional|treinador/i);
  });

  it("MEDICAL_DISCLAIMER does not claim to be a diagnóstico", () => {
    expect(MEDICAL_DISCLAIMER).toMatch(/não.*diagnóstico|não.*médico/i);
  });
});

describe("withDisclaimer", () => {
  it("appends science disclaimer by default", () => {
    const result = withDisclaimer("Carga ótima.");
    expect(result).toContain("Carga ótima.");
    expect(result).toContain(SCIENCE_DISCLAIMER);
  });

  it("appends injury risk disclaimer for level=warning", () => {
    const result = withDisclaimer("Carga elevada.", "warning");
    expect(result).toContain(INJURY_RISK_DISCLAIMER);
  });

  it("appends medical disclaimer for level=medical", () => {
    const result = withDisclaimer("TSB crítico.", "medical");
    expect(result).toContain(MEDICAL_DISCLAIMER);
  });

  it("separates recommendation and disclaimer with ' — '", () => {
    const result = withDisclaimer("Reduzir volume.", "info");
    expect(result).toContain(" — ");
  });
});
