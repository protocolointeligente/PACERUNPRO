import { uniq } from "../utils";
import type { CategoryKey } from "../data/categories";
import type { FocusKey } from "../data/foci";
import type { PositionKey } from "../data/positions";
import type { Exercise } from "./types";

export function makeExercise(
  id: number,
  title: string,
  focus: FocusKey,
  position: PositionKey,
  structure: string,
  fundamentals: string[],
  categories: CategoryKey[],
  pattern: string,
  source: string,
  note?: string
): Exercise {
  return {
    id,
    title,
    focus,
    position,
    structure,
    fundamentals: uniq(fundamentals),
    categories: uniq(categories),
    pattern,
    source,
    objective: `${title}: desenvolver ${fundamentals.slice(0, 3).join(", ")} em contexto ${structure}.`,
    description:
      note ||
      `Atividade representativa para trabalhar ${title.toLowerCase()}, com oposição, tomada de decisão e transferência para o jogo.`,
    organization: `Organizar ${structure} em espaço compatível com idade e número de atletas. Ajustar dimensões, coringas, alvos e zonas conforme nível.`,
    execution: `Realizar blocos curtos com pausa para correção. A pontuação deve induzir ${
      fundamentals[0] || "o princípio principal"
    } e manter os atletas em tomada de decisão.`,
    coaching:
      "Corrigir orientação corporal, percepção antes de receber, distância entre jogadores, comunicação, timing da ação e qualidade da decisão.",
  };
}
