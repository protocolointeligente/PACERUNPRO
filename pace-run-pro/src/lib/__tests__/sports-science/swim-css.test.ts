import { describe, it, expect } from "vitest";
import {
  cssFrom400_200,
  cssFrom1000m,
  cssFrom30MinTest,
  swimTSS,
  getSwimZones,
  tPaceFromCSS,
  calculateSwolf,
  swolfDelta,
  formatSwimPace,
  swimPaceToMs,
  msToPace,
} from "@/lib/sports-science/swim-css";

describe("cssFrom400_200", () => {
  it("calcula CSS corretamente para 400m em 360s e 200m em 170s", () => {
    const result = cssFrom400_200(360, 170);
    // CSS = 200 / (360 - 170) = 200 / 190 ≈ 1.053 m/s
    expect(result.cssMetersPerSec).toBeCloseTo(1.053, 2);
    // pace ≈ 95 seg/100m
    expect(result.cssPacePer100m).toBeCloseTo(95, 0);
  });

  it("formata o pace como M:SS/100m", () => {
    const result = cssFrom400_200(360, 170);
    expect(result.cssPaceFormatted).toMatch(/\d:\d{2}\/100m/);
  });

  it("retorna zeros para entradas inválidas", () => {
    const r1 = cssFrom400_200(0, 170);
    expect(r1.cssMetersPerSec).toBe(0);

    const r2 = cssFrom400_200(170, 360); // tempo 400 < tempo 200 → inválido
    expect(r2.cssMetersPerSec).toBe(0);
  });

  it("CSS mais rápido = pace/100m menor (menor seg = mais rápido)", () => {
    const fast = cssFrom400_200(300, 140); // nadador rápido
    const slow = cssFrom400_200(480, 220); // nadador mais lento
    expect(fast.cssPacePer100m).toBeLessThan(slow.cssPacePer100m);
  });
});

describe("cssFrom1000m", () => {
  it("retorna CSS positivo para 1000m em 15min", () => {
    const result = cssFrom1000m(900);
    expect(result.cssMetersPerSec).toBeGreaterThan(0);
    expect(result.cssPacePer100m).toBeGreaterThan(0);
  });

  it("retorna zeros para entrada inválida", () => {
    expect(cssFrom1000m(0).cssMetersPerSec).toBe(0);
  });
});

describe("cssFrom30MinTest", () => {
  it("retorna CSS positivo para 1500m em 30min", () => {
    const result = cssFrom30MinTest(1500);
    expect(result.cssMetersPerSec).toBeGreaterThan(0);
  });

  it("mais metros = CSS maior (mais rápido)", () => {
    const slow = cssFrom30MinTest(1000);
    const fast = cssFrom30MinTest(1800);
    expect(fast.cssMetersPerSec).toBeGreaterThan(slow.cssMetersPerSec);
  });
});

describe("swimTSS", () => {
  it("retorna TSS positivo para entrada válida", () => {
    const tss = swimTSS(3600, 95, 95); // 1h @ CSS = 100
    expect(tss).toBeCloseTo(100, 0);
  });

  it("pace acima do CSS (mais lento) → TSS menor", () => {
    const tssAtCss    = swimTSS(3600, 95, 95);
    const tssAboveCss = swimTSS(3600, 110, 95); // nadando mais devagar
    expect(tssAboveCss).toBeLessThan(tssAtCss);
  });

  it("pace abaixo do CSS (mais rápido) → TSS maior", () => {
    const tssAtCss     = swimTSS(3600, 95, 95);
    const tssBelowCss  = swimTSS(3600, 85, 95); // nadando mais rápido que CSS
    expect(tssBelowCss).toBeGreaterThan(tssAtCss);
  });

  it("retorna 0 para entradas inválidas", () => {
    expect(swimTSS(0, 95, 95)).toBe(0);
    expect(swimTSS(3600, 0, 95)).toBe(0);
    expect(swimTSS(3600, 95, 0)).toBe(0);
  });
});

describe("getSwimZones", () => {
  it("retorna 5 zonas", () => {
    expect(getSwimZones(95)).toHaveLength(5);
  });

  it("zonas têm campos obrigatórios", () => {
    for (const z of getSwimZones(95)) {
      expect(z.number).toBeGreaterThan(0);
      expect(z.name).toBeTruthy();
      expect(z.color).toMatch(/^#/);
      expect(typeof z.pacePer100mMin).toBe("number");
      expect(typeof z.pacePer100mMax).toBe("number");
    }
  });

  it("Z4 (limiar) inclui pace CSS (95% = pace 100m no mesmo nível)", () => {
    const zones = getSwimZones(95);
    const z4 = zones.find((z) => z.number === 4);
    // Z4: 100–103% CSS → pacePer100mMax = cssPace×100% = 95
    expect(z4?.pacePer100mMax).toBeCloseTo(95, 0);
  });
});

describe("tPaceFromCSS", () => {
  it("arredonda para múltiplo de 5", () => {
    expect(tPaceFromCSS(97)).toBe(95);
    expect(tPaceFromCSS(93)).toBe(95);
    expect(tPaceFromCSS(90)).toBe(90);
  });
});

describe("calculateSwolf", () => {
  it("SWOLF = tempo + braçadas", () => {
    expect(calculateSwolf(30, 18)).toBe(48);
    expect(calculateSwolf(25, 14)).toBe(39);
  });
});

describe("swolfDelta", () => {
  it("detecta melhora quando SWOLF diminui", () => {
    const result = swolfDelta(42, 48); // melhorou de 48 para 42
    expect(result.improved).toBe(true);
    expect(result.delta).toBe(6);
    expect(result.pct).toBeGreaterThan(0);
  });

  it("detecta piora quando SWOLF aumenta", () => {
    const result = swolfDelta(50, 45);
    expect(result.improved).toBe(false);
    expect(result.delta).toBeLessThan(0);
  });

  it("delta = 0 quando SWOLF não muda", () => {
    const result = swolfDelta(45, 45);
    expect(result.delta).toBe(0);
    expect(result.improved).toBe(false);
  });
});

describe("formatSwimPace", () => {
  it("formata 95 seg como 1:35/100m", () => {
    expect(formatSwimPace(95)).toBe("1:35/100m");
  });

  it("formata 60 seg como 1:00/100m", () => {
    expect(formatSwimPace(60)).toBe("1:00/100m");
  });

  it("formata 0 como —", () => {
    expect(formatSwimPace(0)).toBe("—");
  });
});

describe("swimPaceToMs", () => {
  it("converte 100 seg/100m para 1.0 m/s", () => {
    expect(swimPaceToMs(100)).toBeCloseTo(1.0, 2);
  });

  it("retorna 0 para pace = 0", () => {
    expect(swimPaceToMs(0)).toBe(0);
  });
});

describe("msToPace", () => {
  it("converte 1.053 m/s para ~95 seg/100m", () => {
    expect(msToPace(1.053)).toBeCloseTo(95, 0);
  });

  it("retorna 0 para velocidade = 0", () => {
    expect(msToPace(0)).toBe(0);
  });

  it("swimPaceToMs e msToPace são inversas", () => {
    const pace = 95;
    expect(msToPace(swimPaceToMs(pace))).toBeCloseTo(pace, 0);
  });
});
