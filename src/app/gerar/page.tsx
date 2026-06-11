"use client";

import { useState } from "react";
import { PlanResult } from "@/components/planner/PlanResult";
import { PlannerWizard } from "@/components/planner/PlannerWizard";
import type { LessonPlan } from "@/lib/planner/generate";
import { planToText } from "@/lib/planner/text";

export default function GerarPage() {
  const [plan, setPlan] = useState<LessonPlan | null>(null);
  const [copyStatus, setCopyStatus] = useState<string | null>(null);

  function handleCopiar() {
    if (!plan) return;
    navigator.clipboard?.writeText(planToText(plan));
    setCopyStatus("Plano copiado para a área de transferência.");
  }

  if (plan) {
    return (
      <div>
        <div className="mb-4.5 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="m-0 text-2xl font-black tracking-tight">Treino gerado</h1>
            <p className="mt-1.5 text-sm leading-relaxed" style={{ color: "var(--muted)" }}>
              Sessão completa com exercícios do banco, pranchas táticas e sugestão de mesociclo.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button type="button" className="btn-secondary" onClick={() => setPlan(null)}>
              Nova aula
            </button>
            <button type="button" className="btn-secondary" onClick={handleCopiar}>
              Copiar
            </button>
            <button type="button" className="btn-secondary" onClick={() => window.print()}>
              Salvar PDF
            </button>
          </div>
        </div>

        {copyStatus && (
          <div className="mb-3.5 rounded-xl border px-2.5 py-1.5 text-xs" style={{ borderColor: "rgba(34,197,94,.22)", background: "rgba(48,209,88,.10)", color: "var(--ok)" }}>
            {copyStatus}
          </div>
        )}

        <section className="card p-5">
          <PlanResult plan={plan} />
        </section>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-4.5">
        <h1 className="m-0 text-2xl font-black tracking-tight">Gerar aula</h1>
        <p className="mt-1.5 text-sm leading-relaxed" style={{ color: "var(--muted)" }}>
          Configure os campos em duas etapas e gere uma sessão completa com exercícios do banco, pranchas táticas,
          tempos e sugestão de mesociclo.
        </p>
      </div>

      <div className="mx-auto max-w-[640px]">
        <PlannerWizard onPlanGenerated={setPlan} />
      </div>
    </div>
  );
}
