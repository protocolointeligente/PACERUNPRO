"use client";

import Link from "next/link";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import { useParams } from "next/navigation";
import { TacticalDiagram } from "@/components/diagrams/TacticalDiagram";
import { FOCI } from "@/lib/data/foci";
import { POSITIONS } from "@/lib/data/positions";
import { diagramFor } from "@/lib/diagrams/resolve";
import { getExercises } from "@/lib/exercises/bank";
import type { Exercise } from "@/lib/exercises/types";
import { loadCustomExercises, loadOverrides, type ExerciseOverrides } from "@/lib/storage";

export default function ExercicioDetalhePage() {
  const params = useParams<{ id: string }>();
  const id = Number(params.id);

  const bankExercises = useMemo(() => getExercises(), []);
  const [customExercises, setCustomExercises] = useState<Exercise[]>([]);
  const [overrides, setOverrides] = useState<ExerciseOverrides>({});

  useEffect(() => {
    // Reads persisted custom exercises/overrides after mount to avoid SSR/client markup mismatch.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setCustomExercises(loadCustomExercises());
    setOverrides(loadOverrides());
  }, []);

  const exercise = useMemo(
    () => [...bankExercises, ...customExercises].find((ex) => ex.id === id) ?? null,
    [bankExercises, customExercises, id]
  );

  if (!exercise) {
    return (
      <div className="card p-4.5">
        <h1 className="m-0 text-2xl font-black tracking-tight">Exercício não encontrado</h1>
        <p className="mt-2 text-sm leading-relaxed" style={{ color: "var(--muted)" }}>
          O exercício #{params.id} não existe no banco ou foi removido.
        </p>
        <Link href="/biblioteca" className="btn mt-4 inline-flex w-fit">
          Voltar à biblioteca
        </Link>
      </div>
    );
  }

  const override = overrides[exercise.id];
  const title = override?.title ?? exercise.title;
  const objective = override?.objective ?? exercise.objective;
  const description = override?.description ?? exercise.description;
  const organization = override?.organization ?? exercise.organization;
  const execution = override?.execution ?? exercise.execution;
  const coaching = override?.coaching ?? exercise.coaching;
  const diagram = override?.diagram ?? diagramFor(exercise.pattern).elements;

  return (
    <div>
      <div className="mb-4.5 flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <Link href="/biblioteca" className="text-xs font-extrabold uppercase tracking-wider" style={{ color: "var(--accent2)" }}>
            ← Biblioteca
          </Link>
          <h1 className="m-0 mt-1.5 text-2xl font-black tracking-tight">{title}</h1>
          <div className="mt-2 flex flex-wrap gap-1.5">
            <span className="chip chip-accent">{POSITIONS[exercise.position].label}</span>
            <span className="chip">{FOCI[exercise.focus]}</span>
            <span className="chip">{exercise.structure}</span>
            <span className="chip">{exercise.pattern}</span>
            <span className="chip">#{exercise.id}</span>
          </div>
        </div>
        <Link href={`/prancheta-tatica?id=${exercise.id}`} className="btn-secondary whitespace-nowrap">
          Editar na Prancheta Tática
        </Link>
      </div>

      <div className="grid gap-3.5 lg:grid-cols-[420px_1fr]">
        <div className="card p-4.5">
          <TacticalDiagram elements={diagram} title={title} structureLabel={exercise.structure} positionLabel={POSITIONS[exercise.position].label} />
        </div>
        <div className="card p-4.5 text-[13px] leading-[1.45]">
          <Section title="Objetivo">{objective}</Section>
          <Section title="Descrição">{description}</Section>
          <div className="grid gap-3.5 sm:grid-cols-2">
            <Section title="Organização">{organization}</Section>
            <Section title="Execução">{execution}</Section>
          </div>
          <Section title="Pontos de correção">{coaching}</Section>
        </div>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="surface mb-3 p-3">
      <strong className="mb-1 block text-[12px] uppercase tracking-wide" style={{ color: "var(--accent2)" }}>
        {title}
      </strong>
      {children}
    </div>
  );
}
