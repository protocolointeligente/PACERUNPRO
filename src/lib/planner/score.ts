import type { Exercise } from "../exercises/types";
import type { PlannerConfig } from "./types";

export function scoreExercise(ex: Exercise, cfg: PlannerConfig): number {
  let s = 0;
  if (ex.categories.includes(cfg.categoria)) s += 20;
  if (cfg.posicao === "geral") {
    if (ex.position === "geral") s += 12;
  } else {
    if (ex.position === cfg.posicao) s += 40;
    if (ex.position === "geral") s += 6;
  }
  if (cfg.foco === "misto" || ex.focus === cfg.foco) s += 16;
  if (cfg.estrutura === "todas" || ex.structure === cfg.estrutura) s += 14;
  cfg.fundamentos.forEach((f) => {
    const needle = f.toLowerCase();
    if (ex.fundamentals.join(" ").toLowerCase().includes(needle) || ex.title.toLowerCase().includes(needle)) {
      s += 4;
    }
  });
  return s;
}

export function escolher(exercises: Exercise[], cfg: PlannerConfig): Exercise[] {
  return exercises
    .map((ex) => ({ ex, s: scoreExercise(ex, cfg) }))
    .sort((a, b) => b.s - a.s || a.ex.id - b.ex.id)
    .slice(0, cfg.tempo <= 50 ? 3 : cfg.tempo <= 80 ? 4 : 5)
    .map((x) => x.ex);
}
