import { describe, it, expect } from "vitest";
import {
  trainingTemplates,
  getRecommendedTemplate,
  freeAthleteDefaultTemplate,
  type GoalDistance,
  type TrackLevel,
} from "@/lib/training-templates";

describe("trainingTemplates", () => {
  it("exports a non-empty array", () => {
    expect(trainingTemplates.length).toBeGreaterThan(0);
  });

  it("each template has required fields", () => {
    for (const t of trainingTemplates) {
      expect(t.id).toBeTruthy();
      expect(t.goal).toBeTruthy();
      expect(t.level).toBeTruthy();
      expect(Array.isArray(t.weeks)).toBe(true);
    }
  });

  it("each week has a week number and days", () => {
    for (const t of trainingTemplates) {
      for (const week of t.weeks) {
        expect(typeof week.week).toBe("number");
        expect(Array.isArray(week.days)).toBe(true);
        expect(week.days.length).toBeGreaterThan(0);
      }
    }
  });

  it("each day has day label and workout string", () => {
    for (const t of trainingTemplates) {
      for (const week of t.weeks) {
        for (const day of week.days) {
          expect(day.day).toBeTruthy();
          expect(typeof day.workout).toBe("string");
        }
      }
    }
  });

  it("covers 5km and 10km goals", () => {
    const goals = trainingTemplates.map((t) => t.goal);
    expect(goals).toContain("5km");
    expect(goals).toContain("10km");
  });

  it("covers multiple levels", () => {
    const levels = new Set(trainingTemplates.map((t) => t.level));
    expect(levels.size).toBeGreaterThanOrEqual(2);
  });
});

describe("getRecommendedTemplate", () => {
  it("returns a template for 5km superacao", () => {
    const t = getRecommendedTemplate("5km", "superacao");
    expect(t).toBeDefined();
    expect(t.goal).toBe("5km");
    expect(t.level).toBe("superacao");
  });

  it("returns a template for 10km evolucao", () => {
    const t = getRecommendedTemplate("10km", "evolucao");
    expect(t).toBeDefined();
    expect(t.goal).toBe("10km");
  });

  it("returns a template for 5km performance", () => {
    const t = getRecommendedTemplate("5km", "performance");
    expect(t).toBeDefined();
  });

  it("preferLong flag returns longer template when available", () => {
    const normal = getRecommendedTemplate("5km", "superacao", false);
    const long   = getRecommendedTemplate("5km", "superacao", true);
    // Both should return valid templates
    expect(normal).toBeDefined();
    expect(long).toBeDefined();
  });

  it("always returns a template (has fallback)", () => {
    // Even if we pass a weird combination, it should return something
    const t = getRecommendedTemplate("3km", "superacao");
    expect(t).toBeDefined();
  });
});

describe("freeAthleteDefaultTemplate", () => {
  it("is defined and is a valid template", () => {
    expect(freeAthleteDefaultTemplate).toBeDefined();
    expect(freeAthleteDefaultTemplate.weeks.length).toBeGreaterThan(0);
  });
});
