import { describe, it, expect } from "vitest";
import {
  UNIVERSITY_COURSES,
  getAthleteCoursesLength,
  getCoachCoursesLength,
} from "@/lib/university-data";

describe("UNIVERSITY_COURSES", () => {
  it("exports a non-empty array", () => {
    expect(UNIVERSITY_COURSES.length).toBeGreaterThan(0);
  });

  it("each course has required fields", () => {
    for (const course of UNIVERSITY_COURSES) {
      expect(course.id).toBeTruthy();
      expect(course.title).toBeTruthy();
      expect(course.description).toBeTruthy();
      expect(course.totalDuration).toBeTruthy();
      expect(["iniciante", "intermediário", "avançado"]).toContain(course.level);
      expect(course.category).toBeTruthy();
      expect(course.color).toBeTruthy();
      expect(["athlete", "coach", "both"]).toContain(course.for);
      expect(Array.isArray(course.lessons)).toBe(true);
    }
  });

  it("each lesson has id, title, duration, content", () => {
    for (const course of UNIVERSITY_COURSES) {
      for (const lesson of course.lessons) {
        expect(lesson.id).toBeTruthy();
        expect(lesson.title).toBeTruthy();
        expect(lesson.duration).toBeTruthy();
        expect(typeof lesson.content).toBe("string");
      }
    }
  });

  it("has courses for both athlete and coach", () => {
    const forAthletes = UNIVERSITY_COURSES.filter(
      (c) => c.for === "athlete" || c.for === "both",
    );
    const forCoaches = UNIVERSITY_COURSES.filter(
      (c) => c.for === "coach" || c.for === "both",
    );
    expect(forAthletes.length).toBeGreaterThan(0);
    expect(forCoaches.length).toBeGreaterThan(0);
  });
});

describe("getAthleteCoursesLength", () => {
  it("returns a positive number", () => {
    expect(getAthleteCoursesLength()).toBeGreaterThan(0);
  });

  it("matches filtered count of athlete/both courses", () => {
    const expected = UNIVERSITY_COURSES.filter(
      (c) => c.for === "athlete" || c.for === "both",
    ).length;
    expect(getAthleteCoursesLength()).toBe(expected);
  });
});

describe("getCoachCoursesLength", () => {
  it("returns a positive number", () => {
    expect(getCoachCoursesLength()).toBeGreaterThan(0);
  });

  it("matches filtered count of coach/both courses", () => {
    const expected = UNIVERSITY_COURSES.filter(
      (c) => c.for === "coach" || c.for === "both",
    ).length;
    expect(getCoachCoursesLength()).toBe(expected);
  });
});
