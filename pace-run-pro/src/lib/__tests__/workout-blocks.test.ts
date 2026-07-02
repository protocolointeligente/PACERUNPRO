import { describe, it, expect } from "vitest";
import {
  ZONE_OPTIONS,
  ZONE_COLOR,
  BLOCK_TYPE_STYLE,
  makeBlockId,
  defaultBlocks,
  calcBlocksDuration,
  calcBlocksTSS,
  blocksSummary,
  type WorkoutBlock,
} from "@/lib/workout-blocks";

describe("ZONE_OPTIONS", () => {
  it("has 6 options (Z1-Z5 + LIVRE)", () => {
    expect(ZONE_OPTIONS).toHaveLength(6);
  });

  it("each option has value, label, color, ifEst", () => {
    for (const opt of ZONE_OPTIONS) {
      expect(opt.value).toBeTruthy();
      expect(opt.label).toBeTruthy();
      expect(opt.color).toMatch(/^#/);
      expect(typeof opt.ifEst).toBe("number");
    }
  });

  it("ifEst values are positive numbers", () => {
    for (const opt of ZONE_OPTIONS) {
      expect(opt.ifEst).toBeGreaterThan(0);
      expect(typeof opt.ifEst).toBe("number");
    }
  });
});

describe("ZONE_COLOR", () => {
  it("has color for all zone keys", () => {
    const keys = ["Z1", "Z2", "Z3", "Z4", "Z5", "LIVRE"];
    for (const k of keys) {
      expect(ZONE_COLOR[k as keyof typeof ZONE_COLOR]).toMatch(/^#/);
    }
  });
});

describe("BLOCK_TYPE_STYLE", () => {
  it("has style for warmup, main, cooldown, other", () => {
    const types = ["warmup", "main", "cooldown", "other"];
    for (const t of types) {
      const style = BLOCK_TYPE_STYLE[t as keyof typeof BLOCK_TYPE_STYLE];
      expect(style.label).toBeTruthy();
    }
  });
});

describe("makeBlockId", () => {
  it("returns a non-empty string", () => {
    expect(makeBlockId().length).toBeGreaterThan(0);
  });

  it("returns unique ids", () => {
    const ids = new Set(Array.from({ length: 20 }, () => makeBlockId()));
    expect(ids.size).toBe(20);
  });
});

describe("defaultBlocks", () => {
  it("returns 3 blocks (warmup, main, cooldown)", () => {
    expect(defaultBlocks()).toHaveLength(3);
  });

  it("blocks are ordered warmup → main → cooldown", () => {
    const blocks = defaultBlocks();
    expect(blocks[0].type).toBe("warmup");
    expect(blocks[1].type).toBe("main");
    expect(blocks[2].type).toBe("cooldown");
  });

  it("each block has an id", () => {
    for (const b of defaultBlocks()) {
      expect(b.id).toBeTruthy();
    }
  });
});

describe("calcBlocksDuration", () => {
  it("returns 0 for empty blocks", () => {
    expect(calcBlocksDuration([])).toBe(0);
  });

  it("sums durationMin for non-interval blocks", () => {
    const blocks: WorkoutBlock[] = [
      { id: "1", type: "warmup", label: "W", durationMin: 10 },
      { id: "2", type: "main",   label: "M", durationMin: 40 },
      { id: "3", type: "cooldown", label: "C", durationMin: 10 },
    ];
    expect(calcBlocksDuration(blocks)).toBe(60);
  });

  it("computes interval duration as reps × (repDuration + recovery)", () => {
    const blocks: WorkoutBlock[] = [
      {
        id: "1", type: "main", label: "Intervals",
        isInterval: true, reps: 5,
        repDurationMin: 3,
        recoveryDurationMin: 2,
      },
    ];
    expect(calcBlocksDuration(blocks)).toBe(25); // 5 × (3 + 2)
  });

  it("handles missing repDurationMin and recoveryDurationMin as 0", () => {
    const blocks: WorkoutBlock[] = [
      {
        id: "1", type: "main", label: "Intervals",
        isInterval: true, reps: 4,
        repDurationMin: undefined,
        recoveryDurationMin: undefined,
      },
    ];
    expect(calcBlocksDuration(blocks)).toBe(0);
  });
});

describe("calcBlocksTSS", () => {
  it("returns 0 for empty blocks", () => {
    expect(calcBlocksTSS([])).toBe(0);
  });

  it("returns positive TSS for non-zero duration blocks", () => {
    const blocks: WorkoutBlock[] = [
      { id: "1", type: "main", label: "M", durationMin: 60, zone: "Z3" },
    ];
    expect(calcBlocksTSS(blocks)).toBeGreaterThan(0);
  });

  it("higher zone → higher TSS for same duration", () => {
    const lowBlocks: WorkoutBlock[] = [
      { id: "1", type: "main", label: "M", durationMin: 60, zone: "Z1" },
    ];
    const highBlocks: WorkoutBlock[] = [
      { id: "1", type: "main", label: "M", durationMin: 60, zone: "Z5" },
    ];
    expect(calcBlocksTSS(highBlocks)).toBeGreaterThan(calcBlocksTSS(lowBlocks));
  });

  it("interval blocks accumulate TSS", () => {
    const blocks: WorkoutBlock[] = [
      {
        id: "1", type: "main", label: "I",
        isInterval: true, reps: 5,
        repDurationMin: 4, repZone: "Z5",
        recoveryDurationMin: 2, recoveryZone: "Z1",
      },
    ];
    expect(calcBlocksTSS(blocks)).toBeGreaterThan(0);
  });
});

describe("blocksSummary", () => {
  it("returns empty string for empty blocks", () => {
    expect(blocksSummary([])).toBe("");
  });

  it("summarizes non-interval block with duration", () => {
    const blocks: WorkoutBlock[] = [
      { id: "1", type: "warmup", label: "W", durationMin: 10 },
    ];
    const summary = blocksSummary(blocks);
    expect(summary).toContain("10min");
  });

  it("summarizes non-interval block with distance", () => {
    const blocks: WorkoutBlock[] = [
      { id: "1", type: "main", label: "M", distanceKm: 8 },
    ];
    const summary = blocksSummary(blocks);
    expect(summary).toContain("8km");
  });

  it("summarizes interval block as NxY", () => {
    const blocks: WorkoutBlock[] = [
      {
        id: "1", type: "main", label: "I",
        isInterval: true, reps: 5,
        repDurationMin: 3,
        recoveryDurationMin: 2,
      },
    ];
    const summary = blocksSummary(blocks);
    expect(summary).toContain("5×");
  });

  it("joins multiple blocks with arrow", () => {
    const blocks: WorkoutBlock[] = [
      { id: "1", type: "warmup",  label: "W", durationMin: 10 },
      { id: "2", type: "main",    label: "M", durationMin: 30 },
      { id: "3", type: "cooldown", label: "C", durationMin: 5  },
    ];
    const summary = blocksSummary(blocks);
    expect(summary).toContain("→");
  });
});
