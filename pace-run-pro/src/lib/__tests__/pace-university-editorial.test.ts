import { describe, expect, it } from "vitest";
import { paceUniversityCourses } from "@/lib/pace-university";

describe("Pace University editorial coverage", () => {
  it("provides an editorial draft for every existing lesson", () => {
    const lessons = paceUniversityCourses.flatMap((course) => course.lessons);
    expect(paceUniversityCourses).toHaveLength(5);
    expect(lessons).toHaveLength(26);
    expect(lessons.every((lesson) =>
      lesson.content && lesson.example && lesson.activity && lesson.summary &&
      lesson.commonMistakes?.length && lesson.quiz?.length && lesson.references?.length && lesson.status === "review"
    )).toBe(true);
    expect(lessons.every((lesson) => !lesson.content?.includes("Na lógica do PaceRunPro"))).toBe(true);
  });
});
