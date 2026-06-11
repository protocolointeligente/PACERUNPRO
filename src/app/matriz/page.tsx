"use client";

import { useEffect, useState } from "react";
import { CATEGORIES, CATEGORY_KEYS, type CategoryKey } from "@/lib/data/categories";
import { getPriorities, type CustomPriorities } from "@/lib/planner/lists";
import { loadCustomPriorities, saveCustomPriorities } from "@/lib/storage";

export default function MatrizPage() {
  const [customPriorities, setCustomPriorities] = useState<CustomPriorities>({});
  const [inputs, setInputs] = useState<Record<string, string>>({});

  useEffect(() => {
    // Reads persisted custom priorities after mount to avoid SSR/client markup mismatch.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setCustomPriorities(loadCustomPriorities());
  }, []);

  function update(next: CustomPriorities) {
    setCustomPriorities(next);
    saveCustomPriorities(next);
  }

  function addPriority(key: CategoryKey) {
    const value = (inputs[key] ?? "").trim();
    if (!value) return;
    update({ ...customPriorities, [key]: getPriorities(key, customPriorities).concat(value) });
    setInputs((prev) => ({ ...prev, [key]: "" }));
  }

  function removePriority(key: CategoryKey, index: number) {
    update({ ...customPriorities, [key]: getPriorities(key, customPriorities).filter((_, i) => i !== index) });
  }

  function reset() {
    update({});
  }

  return (
    <div className="card p-4.5">
      <div className="mb-3.5 flex flex-wrap items-center justify-between gap-3">
        <h2 className="m-0 flex items-center gap-2.5 text-[19px] font-bold tracking-tight">
          <span className="grid h-[31px] w-[31px] place-items-center rounded-xl text-sm font-black text-white" style={{ background: "var(--accent)" }}>
            3
          </span>
          Matriz por categoria
        </h2>
        <button type="button" className="btn-secondary" onClick={reset}>
          Restaurar referência
        </button>
      </div>

      <div className="mb-3.5 rounded-2xl border p-3.5 text-sm leading-relaxed" style={{ borderColor: "rgba(255,120,31,.28)", background: "rgba(255,120,31,.12)", color: "var(--text)" }}>
        Esta é a referência atual de prioridades do sistema. O treinador pode acrescentar ou remover prioridades conforme contexto, calendário, nível, maturação e objetivos da equipe.
      </div>

      <div className="grid gap-3.5 sm:grid-cols-2 lg:grid-cols-3">
        {CATEGORY_KEYS.map((key) => {
          const c = CATEGORIES[key];
          const priorities = getPriorities(key, customPriorities);
          return (
            <div key={key} className="card p-4">
              <h3 className="m-0 mb-1 text-base font-bold">
                {c.label} <small style={{ color: "var(--muted)" }}>{c.idade}</small>
              </h3>
              <p className="m-0 text-xs font-bold" style={{ color: "var(--muted)" }}>
                {c.stage}
              </p>
              <div className="mt-2.5 grid gap-2">
                {priorities.map((p, i) => (
                  <div key={i} className="surface flex items-start justify-between gap-2.5 p-2.5 text-[13px] leading-relaxed">
                    <span>{p}</span>
                    <button
                      type="button"
                      className="grid h-7 w-7 flex-none place-items-center rounded-xl border text-sm"
                      style={{ borderColor: "var(--line)", color: "var(--muted)" }}
                      onClick={() => removePriority(key, i)}
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
              <div className="mt-2.5 grid grid-cols-[1fr_auto] gap-2">
                <input
                  className="field-input"
                  placeholder="Nova prioridade"
                  value={inputs[key] ?? ""}
                  onChange={(e) => setInputs((prev) => ({ ...prev, [key]: e.target.value }))}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") addPriority(key);
                  }}
                />
                <button type="button" className="btn-secondary" onClick={() => addPriority(key)}>
                  Adicionar
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
