import { describe, it, expect } from "vitest";
import {
  ftpFrom20Min,
  ftpFromRampTest,
  calculateCriticalPower,
  calculateNP,
  calculateIF,
  bikeTSS,
  bikeTSSFromIF,
  getBikePowerZones,
  ftpPerKg,
} from "@/lib/sports-science/cycling-ftp";

describe("ftpFrom20Min", () => {
  it("retorna FTP = potência × 0.95", () => {
    expect(ftpFrom20Min(300)).toBe(285);
    expect(ftpFrom20Min(250)).toBe(238);
  });

  it("retorna 0 para potência inválida", () => {
    expect(ftpFrom20Min(0)).toBe(0);
    expect(ftpFrom20Min(-1)).toBe(0);
  });

  it("FTP menor que potência de 20 min", () => {
    const p20 = 320;
    expect(ftpFrom20Min(p20)).toBeLessThan(p20);
  });
});

describe("ftpFromRampTest", () => {
  it("retorna FTP = bestPower1min × 0.75", () => {
    expect(ftpFromRampTest(400)).toBe(300);
    expect(ftpFromRampTest(300)).toBe(225);
  });

  it("retorna 0 para entrada inválida", () => {
    expect(ftpFromRampTest(0)).toBe(0);
    expect(ftpFromRampTest(-5)).toBe(0);
  });
});

describe("calculateCriticalPower", () => {
  it("calcula CP e W' a partir de dois testes", () => {
    // 5 min @ 350W e 20 min @ 280W
    const result = calculateCriticalPower(350, 300, 280, 1200);
    expect(result.cp).toBeGreaterThan(0);
    expect(result.wPrime).toBeGreaterThan(0);
  });

  it("CP deve ser menor que a potência do teste curto", () => {
    const result = calculateCriticalPower(400, 300, 290, 1200);
    expect(result.cp).toBeLessThan(400);
  });

  it("retorna zeros para durações iguais", () => {
    const result = calculateCriticalPower(300, 600, 300, 600);
    expect(result.cp).toBe(0);
    expect(result.wPrime).toBe(0);
  });

  it("ordem dos testes não importa (aceita t1 < t2)", () => {
    const r1 = calculateCriticalPower(280, 1200, 350, 300);
    const r2 = calculateCriticalPower(350, 300, 280, 1200);
    expect(r1.cp).toBe(r2.cp);
  });
});

describe("calculateNP", () => {
  it("retorna 0 para menos de 30 pontos", () => {
    expect(calculateNP([200, 220, 210])).toBe(0);
  });

  it("retorna valor positivo para 60+ pontos", () => {
    const data = Array.from({ length: 60 }, (_, i) => 200 + (i % 10) * 20);
    expect(calculateNP(data)).toBeGreaterThan(0);
  });

  it("NP de série constante ≈ potência constante", () => {
    const data = Array.from({ length: 120 }, () => 250);
    const np = calculateNP(data);
    expect(np).toBeCloseTo(250, 0);
  });

  it("NP de série variável > média simples (penaliza variabilidade)", () => {
    // Blocks of 60s: first 60 at 100W, then 60 at 400W — mean=250, but NP > 250
    const variable = Array.from({ length: 120 }, (_, i) => i < 60 ? 100 : 400);
    const constant = Array.from({ length: 120 }, () => 250);
    expect(calculateNP(variable)).toBeGreaterThan(calculateNP(constant));
  });
});

describe("calculateIF", () => {
  it("IF = NP / FTP", () => {
    expect(calculateIF(280, 300)).toBeCloseTo(0.933, 2);
  });

  it("retorna 0 para FTP = 0", () => {
    expect(calculateIF(280, 0)).toBe(0);
  });

  it("IF = 1.0 quando NP = FTP", () => {
    expect(calculateIF(300, 300)).toBeCloseTo(1.0, 2);
  });
});

describe("bikeTSS", () => {
  it("TSS positivo para entrada válida", () => {
    const tss = bikeTSS(3600, 285, 300);
    expect(tss).toBeGreaterThan(0);
  });

  it("1h a IF=1.0 = TSS ~100", () => {
    const tss = bikeTSS(3600, 300, 300);
    expect(tss).toBeCloseTo(100, 0);
  });

  it("retorna 0 para FTP=0", () => {
    expect(bikeTSS(3600, 285, 0)).toBe(0);
  });

  it("treino mais longo → TSS maior", () => {
    const short = bikeTSS(3600, 280, 300);
    const long  = bikeTSS(7200, 280, 300);
    expect(long).toBeGreaterThan(short);
  });

  it("intensidade maior → TSS maior para mesma duração", () => {
    const low  = bikeTSS(3600, 200, 300);
    const high = bikeTSS(3600, 300, 300);
    expect(high).toBeGreaterThan(low);
  });
});

describe("bikeTSSFromIF", () => {
  it("2h a IF 0.75 = TSS ~112-113", () => {
    const tss = bikeTSSFromIF(7200, 0.75);
    // 2h × 0.75² × 100 = 112.5
    expect(tss).toBeGreaterThanOrEqual(112);
    expect(tss).toBeLessThanOrEqual(113);
  });

  it("retorna 0 para duração = 0", () => {
    expect(bikeTSSFromIF(0, 0.8)).toBe(0);
  });
});

describe("getBikePowerZones", () => {
  it("retorna 7 zonas", () => {
    expect(getBikePowerZones(300)).toHaveLength(7);
  });

  it("zonas têm campos obrigatórios", () => {
    const zones = getBikePowerZones(300);
    for (const z of zones) {
      expect(z.number).toBeGreaterThan(0);
      expect(z.name).toBeTruthy();
      expect(z.color).toMatch(/^#/);
      expect(z.minWatts).toBeGreaterThanOrEqual(0);
    }
  });

  it("Z4 (limiar) inclui FTP (100%)", () => {
    const zones = getBikePowerZones(300);
    const z4 = zones.find((z) => z.number === 4);
    expect(z4?.minWatts).toBeLessThanOrEqual(300);
    expect(z4?.maxWatts).toBeGreaterThanOrEqual(300);
  });

  it("FTP maior → zonas em watts maiores", () => {
    const zones200 = getBikePowerZones(200);
    const zones300 = getBikePowerZones(300);
    expect(zones300[3].maxWatts).toBeGreaterThan(zones200[3].maxWatts);
  });
});

describe("ftpPerKg", () => {
  it("calcula W/kg corretamente", () => {
    expect(ftpPerKg(300, 75)).toBeCloseTo(4.0, 1);
  });

  it("retorna 0 para peso = 0", () => {
    expect(ftpPerKg(300, 0)).toBe(0);
  });
});
