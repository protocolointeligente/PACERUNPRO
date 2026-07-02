import { describe, it, expect } from "vitest";
import {
  TYPE_COLORS,
  TYPE_LABELS,
  RUN_SUBTYPE_COLORS,
  getSubtypeColor,
} from "@/lib/workout-constants";

describe("TYPE_COLORS", () => {
  it("has color for corrida", () => {
    expect(TYPE_COLORS["corrida"]).toMatch(/^#/);
  });

  it("has color for forca", () => {
    expect(TYPE_COLORS["forca"]).toMatch(/^#/);
  });

  it("has color for all main types", () => {
    const types = ["corrida", "forca", "funcional", "mobilidade", "recuperacao", "prova"];
    for (const t of types) {
      expect(TYPE_COLORS[t]).toBeTruthy();
    }
  });
});

describe("TYPE_LABELS", () => {
  it("has label for corrida", () => {
    expect(TYPE_LABELS["corrida"]).toBe("Corrida");
  });

  it("has label for forca", () => {
    expect(TYPE_LABELS["forca"]).toBe("Força");
  });

  it("has label for all main types", () => {
    const types = ["corrida", "forca", "funcional", "mobilidade", "recuperacao", "prova"];
    for (const t of types) {
      expect(TYPE_LABELS[t]).toBeTruthy();
    }
  });
});

describe("RUN_SUBTYPE_COLORS", () => {
  it("has color for Regenerativo", () => {
    expect(RUN_SUBTYPE_COLORS["Regenerativo"]).toMatch(/^#/);
  });

  it("has color for Intervalado curto", () => {
    expect(RUN_SUBTYPE_COLORS["Intervalado curto"]).toMatch(/^#/);
  });

  it("has color for Longão", () => {
    expect(RUN_SUBTYPE_COLORS["Longão"]).toMatch(/^#/);
  });

  it("all colors start with #", () => {
    for (const color of Object.values(RUN_SUBTYPE_COLORS)) {
      expect(color).toMatch(/^#/);
    }
  });
});

describe("getSubtypeColor", () => {
  it("returns subtype color for corrida with known subtype", () => {
    const color = getSubtypeColor("corrida", "Regenerativo");
    expect(color).toMatch(/^#/);
    expect(color).toBe(RUN_SUBTYPE_COLORS["Regenerativo"]);
  });

  it("falls back to type color when subtype not found", () => {
    const color = getSubtypeColor("corrida", "unknown-subtype");
    expect(color).toBe(TYPE_COLORS["corrida"]);
  });

  it("falls back to type color when no subtype provided", () => {
    const color = getSubtypeColor("forca");
    expect(color).toBe(TYPE_COLORS["forca"]);
  });

  it("returns type color for non-corrida types regardless of subtype", () => {
    const color = getSubtypeColor("mobilidade", "any");
    expect(color).toBeTruthy();
  });

  it("returns a fallback for unknown type", () => {
    const color = getSubtypeColor("unknown");
    expect(typeof color).toBe("string");
  });
});
