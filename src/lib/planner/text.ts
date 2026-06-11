import { FOCI } from "../data/foci";
import { MESOCICLO } from "./mesociclo";
import type { LessonPlan } from "./generate";

export function planToText(plan: LessonPlan): string {
  const lines: string[] = [];
  lines.push("FUTEBOL COACH — PLANO DE AULA");
  lines.push(`Categoria: ${plan.category.label} (${plan.category.idade})`);
  lines.push(`Foco: ${FOCI[plan.config.foco]}`);
  lines.push(`Posição: ${plan.position.label}`);
  lines.push(`Tempo: ${plan.config.tempo} min`);
  lines.push("");
  lines.push(
    `Diretriz da aula: ${plan.category.stage} • ${plan.config.nivel} • ${plan.config.espaco} • ${plan.config.atletas} atletas.`
  );
  lines.push(`Prioridades: ${plan.priorities.join(" • ")}`);
  lines.push("");
  lines.push("OBJETIVOS DA SESSÃO");
  plan.config.objetivos.forEach((o) => lines.push(`- ${o}`));
  lines.push("");
  lines.push("ORGANIZAÇÃO DA SESSÃO");
  plan.organization.forEach((row) => lines.push(`${row.block} (${row.duration} min): ${row.content} — ${row.guidance}`));
  lines.push("");
  lines.push("EXERCÍCIOS SELECIONADOS");
  plan.exercises.forEach((ex) => {
    lines.push(`• ${ex.title} (${plan.eachMinutes} min)`);
    lines.push(`  Objetivo: ${ex.objective}`);
    lines.push(`  Descrição: ${ex.description}`);
    lines.push(`  Organização: ${ex.organization}`);
    lines.push(`  Execução: ${ex.execution}`);
    lines.push(`  Pontos de correção: ${ex.coaching}`);
  });
  lines.push("");
  lines.push("MESOCICLO SUGERIDO — 4 SEMANAS");
  MESOCICLO.forEach((week) => {
    lines.push(`${week.title}:`);
    week.items.forEach((item) => lines.push(`  - ${item}`));
  });
  lines.push("");
  lines.push(`Banco interno: ${plan.bankSize} exercícios.`);

  return lines.join("\n");
}
