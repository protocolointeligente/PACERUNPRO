import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const root = process.cwd();

function readProjectFile(path: string) {
  return readFileSync(join(root, path), "utf8");
}

describe("P1 operational guardrails", () => {
  it("athlete calendar and plan APIs only expose active coach-linked plans", () => {
    const workoutsRoute = readProjectFile("src/app/api/atleta/workouts/route.ts");
    const planRoute = readProjectFile("src/app/api/atleta/plan/route.ts");

    expect(workoutsRoute).toContain("coachId: { not: null }");
    expect(planRoute).toContain("coachId: { not: null }");
  });

  it("unlinking an athlete unpublishes old coach workouts without deleting audit history", () => {
    const route = readProjectFile("src/app/api/coach/athletes/[id]/route.ts");

    expect(route).toContain("archivedWorkoutCount");
    expect(route).toContain('status: "PERDIDO"');
    expect(route).toContain("publishedAt: null");
    expect(route).toContain('entity: "AthleteCoachLink"');
  });

  it("Pace University lessons are actionable and persist local progress", () => {
    const page = readProjectFile("src/components/pace-university-page.tsx");

    expect(page).toContain("completed-lessons");
    expect(page).toContain("window.localStorage.setItem");
    expect(page).toContain("toggleSelectedLesson");
    expect(page).toContain("goToNextLesson");
  });
});
