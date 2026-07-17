import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const root = process.cwd();

function readProjectFile(path: string) {
  return readFileSync(join(root, path), "utf8");
}

describe("P2 athlete experience guardrails", () => {
  it("athlete workout detail and execution APIs ignore archived coachless plans", () => {
    const workoutApi = readProjectFile("src/app/api/atleta/workouts/[id]/route.ts");
    const forceApi = readProjectFile("src/app/api/atleta/forca/[id]/route.ts");
    const forceTodayApi = readProjectFile("src/app/api/atleta/forca/hoje/route.ts");
    const workoutPage = readProjectFile("src/app/atleta/treino/[id]/page.tsx");

    for (const file of [workoutApi, forceApi, forceTodayApi, workoutPage]) {
      expect(file).toContain("coachId: { not: null }");
    }
  });

  it("strength execution keeps local editable set data and media support", () => {
    const forceExecution = readProjectFile("src/app/atleta/forca/treino/[id]/executar/page.tsx");

    expect(forceExecution).toContain("prp:strength-session");
    expect(forceExecution).toContain("resolveExerciseMedia");
    expect(forceExecution).toContain("Carga usada");
    expect(forceExecution).toContain("Reps feitas");
  });
});
