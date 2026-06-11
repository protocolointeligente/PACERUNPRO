"use client";

import { useEffect, useMemo, useState } from "react";
import { TacticalDiagram } from "@/components/diagrams/TacticalDiagram";
import { FOCI } from "@/lib/data/foci";
import { POSITIONS } from "@/lib/data/positions";
import { STRUCTURES } from "@/lib/data/structures";
import { DIAGRAM_PATTERNS, PATTERN_KEYS } from "@/lib/diagrams/patterns";
import { cloneElements, diagramFor } from "@/lib/diagrams/resolve";
import { DIAGRAM_COLORS, type DiagramElement } from "@/lib/diagrams/types";
import { getExercises } from "@/lib/exercises/bank";
import type { Exercise } from "@/lib/exercises/types";
import {
  loadCustomExercises,
  loadOverrides,
  saveCustomExercises,
  saveOverrides,
  type ExerciseOverride,
  type ExerciseOverrides,
} from "@/lib/storage";

const ELEMENT_TYPES = ["player", "ball", "cone", "arrow", "zone", "miniGoal"] as const;

const ELEMENT_LABELS: Record<DiagramElement["type"], string> = {
  player: "Jogador",
  ball: "Bola",
  cone: "Cone",
  arrow: "Seta",
  zone: "Zona",
  miniGoal: "Mini-gol",
};

function defaultElement(type: DiagramElement["type"]): DiagramElement {
  switch (type) {
    case "player":
      return { type: "player", x: 80, y: 52, color: DIAGRAM_COLORS.team, label: "1" };
    case "ball":
      return { type: "ball", x: 80, y: 52 };
    case "cone":
      return { type: "cone", x: 80, y: 52 };
    case "arrow":
      return { type: "arrow", x1: 60, y1: 52, x2: 100, y2: 52, color: DIAGRAM_COLORS.pass };
    case "zone":
      return { type: "zone", x: 60, y: 30, w: 40, h: 40, label: "Zona", color: "rgba(255,255,255,.14)" };
    case "miniGoal":
      return { type: "miniGoal", x: 80, y: 50 };
  }
}

interface ExerciseDraft {
  title: string;
  objective: string;
  description: string;
  organization: string;
  execution: string;
  coaching: string;
}

function draftFrom(ex: Exercise, override: ExerciseOverride | undefined): ExerciseDraft {
  return {
    title: override?.title ?? ex.title,
    objective: override?.objective ?? ex.objective,
    description: override?.description ?? ex.description,
    organization: override?.organization ?? ex.organization,
    execution: override?.execution ?? ex.execution,
    coaching: override?.coaching ?? ex.coaching,
  };
}

export default function TaticalPadPage() {
  const bankExercises = useMemo(() => getExercises(), []);
  const [customExercises, setCustomExercises] = useState<Exercise[]>([]);
  const [overrides, setOverrides] = useState<ExerciseOverrides>({});
  const [search, setSearch] = useState("");
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [draft, setDraft] = useState<ExerciseDraft | null>(null);
  const [elements, setElements] = useState<DiagramElement[]>([]);
  const [templatePattern, setTemplatePattern] = useState(PATTERN_KEYS[0]);
  const [status, setStatus] = useState<string | null>(null);

  useEffect(() => {
    // Reads persisted custom exercises/overrides after mount to avoid SSR/client markup mismatch.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setCustomExercises(loadCustomExercises());
    setOverrides(loadOverrides());
  }, []);

  const allExercises = useMemo(() => [...bankExercises, ...customExercises], [bankExercises, customExercises]);

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    if (!q) return allExercises.slice(0, 80);
    return allExercises
      .filter((ex) =>
        `${ex.id} ${ex.title} ${ex.pattern} ${POSITIONS[ex.position].label} ${FOCI[ex.focus]} ${ex.structure}`
          .toLowerCase()
          .includes(q)
      )
      .slice(0, 80);
  }, [allExercises, search]);

  const selected = useMemo(() => allExercises.find((ex) => ex.id === selectedId) ?? null, [allExercises, selectedId]);

  function applyDraft(ex: Exercise, override: ExerciseOverride | undefined) {
    setSelectedId(ex.id);
    setDraft(draftFrom(ex, override));
    setElements(cloneElements(override?.diagram ?? diagramFor(ex.pattern).elements));
    setTemplatePattern(ex.pattern in DIAGRAM_PATTERNS ? ex.pattern : PATTERN_KEYS[0]);
    setStatus(null);
  }

  function selectExercise(ex: Exercise) {
    applyDraft(ex, overrides[ex.id]);
  }

  function updateElement(index: number, patch: Record<string, unknown>) {
    setElements((prev) => prev.map((el, i) => (i === index ? ({ ...el, ...patch } as DiagramElement) : el)));
  }

  function removeElement(index: number) {
    setElements((prev) => prev.filter((_, i) => i !== index));
  }

  function addElement(type: DiagramElement["type"]) {
    setElements((prev) => [...prev, defaultElement(type)]);
  }

  function loadTemplate() {
    setElements(cloneElements(DIAGRAM_PATTERNS[templatePattern] ?? []));
  }

  function handleSave() {
    if (!selected || !draft) return;
    const next: ExerciseOverrides = { ...overrides, [selected.id]: { ...draft, diagram: elements } };
    setOverrides(next);
    saveOverrides(next);
    setStatus("Alterações salvas.");
  }

  function handleResetOverride() {
    if (!selected) return;
    const next = { ...overrides };
    delete next[selected.id];
    setOverrides(next);
    saveOverrides(next);
    applyDraft(selected, undefined);
    setStatus("Restaurado para o original.");
  }

  function handleCreateCustom() {
    const id = Date.now();
    const novo: Exercise = {
      id,
      title: "Novo exercício personalizado",
      focus: "misto",
      position: "geral",
      structure: STRUCTURES.find((s) => s !== "todas") ?? STRUCTURES[0],
      fundamentals: [],
      categories: [],
      pattern: "posse",
      source: "Personalizado",
      objective: "",
      description: "",
      organization: "",
      execution: "",
      coaching: "",
    };
    const next = [...customExercises, novo];
    setCustomExercises(next);
    saveCustomExercises(next);
    selectExercise(novo);
  }

  const hasOverride = selected != null && overrides[selected.id] != null;

  return (
    <div className="grid items-start gap-4.5 lg:grid-cols-[360px_1fr]">
      <aside className="card sticky top-[88px] p-4.5">
        <h2 className="m-0 mb-4 flex items-center gap-2.5 text-[19px] font-bold tracking-tight">
          <span className="grid h-[31px] w-[31px] place-items-center rounded-xl text-sm font-black text-white" style={{ background: "var(--accent)" }}>
            ✎
          </span>
          TaticalPad
        </h2>
        <p className="mb-3 text-[13px] leading-relaxed" style={{ color: "var(--muted)" }}>
          Selecione um exercício para visualizar e editar a prancha tática e a descrição. Edições ficam salvas neste
          dispositivo.
        </p>
        <button type="button" className="btn mb-3 w-full" onClick={handleCreateCustom}>
          + Novo exercício personalizado
        </button>
        <input
          className="field-input mb-3"
          placeholder="Buscar por id, título, posição, foco..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <div className="grid max-h-[480px] gap-1.5 overflow-auto">
          {filtered.map((ex) => (
            <button
              key={ex.id}
              type="button"
              className={`nav-link ${selectedId === ex.id ? "active" : ""}`}
              onClick={() => selectExercise(ex)}
            >
              <span className="min-w-0 flex-1 truncate">
                {ex.id}. {ex.title}
              </span>
              {overrides[ex.id] && <span className="chip chip-accent flex-none">editado</span>}
            </button>
          ))}
          {filtered.length === 0 && (
            <div className="p-2 text-[13px]" style={{ color: "var(--muted)" }}>
              Nenhum exercício encontrado.
            </div>
          )}
        </div>
      </aside>

      <section className="card min-h-[660px] p-4.5">
        {!selected || !draft ? (
          <div className="rounded-[22px] border border-dashed p-9 text-center" style={{ borderColor: "var(--line)", background: "rgba(255,255,255,.025)", color: "var(--muted)" }}>
            <h3 className="m-0 text-lg font-bold" style={{ color: "var(--text)" }}>
              Selecione um exercício à esquerda
            </h3>
            <p className="mt-2 text-sm leading-relaxed">
              Visualize a prancha tática gerada automaticamente, edite os elementos e a descrição, ou crie um novo
              exercício personalizado para expandir o banco.
            </p>
          </div>
        ) : (
          <div>
            <div className="mb-3.5 flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0 flex-1">
                <label className="field-label" htmlFor="title">
                  Título
                </label>
                <input
                  id="title"
                  className="field-input text-base font-bold"
                  value={draft.title}
                  onChange={(e) => setDraft({ ...draft, title: e.target.value })}
                />
                <div className="mt-2 flex flex-wrap gap-1.5">
                  <span className="chip chip-accent">{POSITIONS[selected.position].label}</span>
                  <span className="chip">{FOCI[selected.focus]}</span>
                  <span className="chip">{selected.structure}</span>
                  <span className="chip">{selected.pattern}</span>
                  <span className="chip">#{selected.id}</span>
                </div>
              </div>
            </div>

            <div className="grid gap-3.5 md:grid-cols-[360px_1fr]">
              <div>
                <TacticalDiagram elements={elements} title={draft.title} structureLabel={selected.structure} positionLabel={POSITIONS[selected.position].label} />
                <div className="surface mt-2.5 p-2.5">
                  <div className="field-label">Carregar modelo de prancha</div>
                  <div className="flex gap-2">
                    <select className="field-input" value={templatePattern} onChange={(e) => setTemplatePattern(e.target.value)}>
                      {PATTERN_KEYS.map((p) => (
                        <option key={p} value={p}>
                          {p}
                        </option>
                      ))}
                    </select>
                    <button type="button" className="btn-secondary whitespace-nowrap" onClick={loadTemplate}>
                      Carregar
                    </button>
                  </div>
                </div>
              </div>

              <div>
                <div className="field-label">Elementos da prancha ({elements.length})</div>
                <div className="grid max-h-[360px] gap-2 overflow-auto">
                  {elements.map((el, i) => (
                    <div key={i} className="surface p-2.5">
                      <div className="mb-2 flex items-center justify-between">
                        <span className="chip chip-accent">{ELEMENT_LABELS[el.type]}</span>
                        <button type="button" className="grid h-7 w-7 place-items-center rounded-xl border text-sm" style={{ borderColor: "var(--line)", color: "var(--muted)" }} onClick={() => removeElement(i)}>
                          ×
                        </button>
                      </div>
                      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                        <ElementFields el={el} onChange={(patch) => updateElement(i, patch)} />
                      </div>
                    </div>
                  ))}
                </div>
                <div className="surface mt-2 flex flex-wrap items-center gap-2 p-2.5">
                  <span className="field-label m-0">Adicionar elemento</span>
                  {ELEMENT_TYPES.map((t) => (
                    <button key={t} type="button" className="btn-secondary" onClick={() => addElement(t)}>
                      {ELEMENT_LABELS[t]}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="mt-3.5 grid gap-2.5">
              <div>
                <label className="field-label" htmlFor="objective">
                  Objetivo
                </label>
                <textarea id="objective" className="field-input min-h-[60px]" value={draft.objective} onChange={(e) => setDraft({ ...draft, objective: e.target.value })} />
              </div>
              <div>
                <label className="field-label" htmlFor="description">
                  Descrição
                </label>
                <textarea id="description" className="field-input min-h-[60px]" value={draft.description} onChange={(e) => setDraft({ ...draft, description: e.target.value })} />
              </div>
              <div className="grid gap-2.5 sm:grid-cols-2">
                <div>
                  <label className="field-label" htmlFor="organization">
                    Organização
                  </label>
                  <textarea id="organization" className="field-input min-h-[80px]" value={draft.organization} onChange={(e) => setDraft({ ...draft, organization: e.target.value })} />
                </div>
                <div>
                  <label className="field-label" htmlFor="execution">
                    Execução
                  </label>
                  <textarea id="execution" className="field-input min-h-[80px]" value={draft.execution} onChange={(e) => setDraft({ ...draft, execution: e.target.value })} />
                </div>
              </div>
              <div>
                <label className="field-label" htmlFor="coaching">
                  Pontos de correção
                </label>
                <textarea id="coaching" className="field-input min-h-[60px]" value={draft.coaching} onChange={(e) => setDraft({ ...draft, coaching: e.target.value })} />
              </div>
            </div>

            <div className="mt-3.5 flex flex-wrap items-center gap-2.5">
              <button type="button" className="btn" onClick={handleSave}>
                Salvar alterações
              </button>
              {hasOverride && (
                <button type="button" className="btn-secondary" onClick={handleResetOverride}>
                  Restaurar original
                </button>
              )}
              {status && (
                <span className="rounded-xl border px-2.5 py-1.5 text-xs" style={{ borderColor: "rgba(34,197,94,.22)", background: "rgba(48,209,88,.10)", color: "var(--ok)" }}>
                  {status}
                </span>
              )}
            </div>
          </div>
        )}
      </section>
    </div>
  );
}

function ElementFields({ el, onChange }: { el: DiagramElement; onChange: (patch: Record<string, unknown>) => void }) {
  switch (el.type) {
    case "player":
      return (
        <>
          <NumberField label="X" value={el.x} onChange={(v) => onChange({ x: v })} />
          <NumberField label="Y" value={el.y} onChange={(v) => onChange({ y: v })} />
          <TextField label="Cor" value={el.color} onChange={(v) => onChange({ color: v })} />
          <TextField label="Rótulo" value={el.label} onChange={(v) => onChange({ label: v })} />
        </>
      );
    case "ball":
    case "cone":
    case "miniGoal":
      return (
        <>
          <NumberField label="X" value={el.x} onChange={(v) => onChange({ x: v })} />
          <NumberField label="Y" value={el.y} onChange={(v) => onChange({ y: v })} />
        </>
      );
    case "arrow":
      return (
        <>
          <NumberField label="X1" value={el.x1} onChange={(v) => onChange({ x1: v })} />
          <NumberField label="Y1" value={el.y1} onChange={(v) => onChange({ y1: v })} />
          <NumberField label="X2" value={el.x2} onChange={(v) => onChange({ x2: v })} />
          <NumberField label="Y2" value={el.y2} onChange={(v) => onChange({ y2: v })} />
          <TextField label="Cor" value={el.color} onChange={(v) => onChange({ color: v })} />
          <TextField label="Rótulo" value={el.label ?? ""} onChange={(v) => onChange({ label: v || undefined })} />
          <CheckField label="Tracejada" checked={!!el.dash} onChange={(v) => onChange({ dash: v || undefined })} />
        </>
      );
    case "zone":
      return (
        <>
          <NumberField label="X" value={el.x} onChange={(v) => onChange({ x: v })} />
          <NumberField label="Y" value={el.y} onChange={(v) => onChange({ y: v })} />
          <NumberField label="Largura" value={el.w} onChange={(v) => onChange({ w: v })} />
          <NumberField label="Altura" value={el.h} onChange={(v) => onChange({ h: v })} />
          <TextField label="Cor" value={el.color} onChange={(v) => onChange({ color: v })} />
          <TextField label="Rótulo" value={el.label} onChange={(v) => onChange({ label: v })} />
        </>
      );
    default:
      return null;
  }
}

function NumberField({ label, value, onChange }: { label: string; value: number; onChange: (v: number) => void }) {
  return (
    <label className="block text-[10px] font-extrabold uppercase tracking-wider" style={{ color: "var(--muted)" }}>
      {label}
      <input type="number" step="0.5" className="field-input mt-1 px-2 py-1.5 text-xs" value={value} onChange={(e) => onChange(Number(e.target.value))} />
    </label>
  );
}

function TextField({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <label className="block text-[10px] font-extrabold uppercase tracking-wider" style={{ color: "var(--muted)" }}>
      {label}
      <input type="text" className="field-input mt-1 px-2 py-1.5 text-xs" value={value} onChange={(e) => onChange(e.target.value)} />
    </label>
  );
}

function CheckField({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="flex items-center gap-2 text-[10px] font-extrabold uppercase tracking-wider" style={{ color: "var(--muted)" }}>
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} />
      {label}
    </label>
  );
}
