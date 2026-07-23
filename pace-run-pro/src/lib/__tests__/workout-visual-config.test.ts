import { describe, expect, it } from "vitest";
import { getWorkoutVisualConfig, WORKOUT_VISUAL_CONFIG } from "@/lib/workout-visual-config";

describe("workout visual configuration", () => {
  it("provides one complete visual definition for every supported workout type", () => {
    const types = [
      "REGENERATIVO", "RODAGEM_LEVE", "PROGRESSIVO", "LONGAO", "FARTLEK",
      "TECNICA", "SUBIDA", "TEMPO_RUN", "INTERVALADO_LONGO", "INTERVALADO_CURTO",
      "PROVA", "FORCA", "FUNCIONAL", "MOBILIDADE", "RECUPERACAO",
    ];

    for (const type of types) {
      const config = getWorkoutVisualConfig(type);
      expect(config.label).toBeTruthy();
      expect(config.short).toBeTruthy();
      expect(config.light.background).toMatch(/^#/);
      expect(config.dark.background).toMatch(/^#/);
      expect(config.modality).toBeTruthy();
    }
  });

  it("returns a safe fallback for unknown types", () => {
    expect(getWorkoutVisualConfig("UNKNOWN")).toEqual(WORKOUT_VISUAL_CONFIG.DEFAULT);
  });
});
