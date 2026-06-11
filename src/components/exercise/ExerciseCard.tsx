import { TacticalDiagram } from "@/components/diagrams/TacticalDiagram";
import { FOCI } from "@/lib/data/foci";
import { POSITIONS } from "@/lib/data/positions";
import { diagramFor } from "@/lib/diagrams/resolve";
import type { DiagramElement } from "@/lib/diagrams/types";
import type { Exercise } from "@/lib/exercises/types";

interface ExerciseCardProps {
  exercise: Exercise;
  minutes?: number;
  diagramOverride?: DiagramElement[];
}

export function ExerciseCard({ exercise: ex, minutes, diagramOverride }: ExerciseCardProps) {
  const diagram = diagramOverride ?? diagramFor(ex.pattern).elements;

  return (
    <article className="card my-3 overflow-hidden">
      <div
        className="flex items-start justify-between gap-3 p-3.5"
        style={{ background: "linear-gradient(90deg, var(--accent-soft), rgba(255,255,255,.025))" }}
      >
        <div className="min-w-0">
          <h3 className="m-0 text-lg font-bold tracking-tight">{ex.title}</h3>
          <div className="mt-2 flex flex-wrap gap-1.5">
            <span className="chip chip-accent">{POSITIONS[ex.position].label}</span>
            <span className="chip">{FOCI[ex.focus]}</span>
            <span className="chip">{ex.structure}</span>
            <span className="chip">{ex.pattern}</span>
          </div>
        </div>
        {minutes != null && <span className="chip chip-accent whitespace-nowrap">{minutes} min</span>}
      </div>
      <div className="grid gap-3.5 p-3.5 md:grid-cols-[360px_1fr]">
        <TacticalDiagram
          elements={diagram}
          title={ex.title}
          structureLabel={ex.structure}
          positionLabel={POSITIONS[ex.position].label}
        />
        <div className="text-[13px] leading-[1.45]">
          <p className="m-0 mb-2">
            <b>Objetivo:</b> {ex.objective}
          </p>
          <p className="m-0 mb-2">
            <b>Descrição:</b> {ex.description}
          </p>
          <div className="grid gap-2.5 sm:grid-cols-2">
            <div className="surface p-2.5">
              <strong className="mb-1 block text-[12px] uppercase tracking-wide" style={{ color: "var(--accent2)" }}>
                Organização
              </strong>
              {ex.organization}
            </div>
            <div className="surface p-2.5">
              <strong className="mb-1 block text-[12px] uppercase tracking-wide" style={{ color: "var(--accent2)" }}>
                Execução
              </strong>
              {ex.execution}
            </div>
          </div>
          <div className="surface mt-2.5 p-2.5">
            <strong className="mb-1 block text-[12px] uppercase tracking-wide" style={{ color: "var(--accent2)" }}>
              Pontos de correção
            </strong>
            {ex.coaching}
          </div>
        </div>
      </div>
    </article>
  );
}
