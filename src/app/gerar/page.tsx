"use client";

import { useState } from "react";
import { PlanResult } from "@/components/planner/PlanResult";
import { PlannerForm } from "@/components/planner/PlannerForm";
import type { LessonPlan } from "@/lib/planner/generate";

export default function GerarPage() {
  const [plan, setPlan] = useState<LessonPlan | null>(null);

  return (
    <div>
      <div className="mb-4.5">
        <h1 className="m-0 text-2xl font-black tracking-tight">Gerar aula</h1>
        <p className="mt-1.5 text-sm leading-relaxed" style={{ color: "var(--muted)" }}>
          Configure os campos e gere uma sessão completa com exercícios do banco, pranchas táticas, tempos e
          sugestão de mesociclo.
        </p>
      </div>

      <div className="grid items-start gap-4.5 lg:grid-cols-[420px_1fr]">
        <PlannerForm onPlanChange={setPlan} />
        <section className="card min-h-[660px] p-5">
          {plan ? (
            <PlanResult plan={plan} />
          ) : (
            <div className="rounded-[22px] border border-dashed p-9 text-center" style={{ borderColor: "var(--line)", background: "rgba(255,255,255,.025)", color: "var(--muted)" }}>
              <h3 className="m-0 text-lg font-bold" style={{ color: "var(--text)" }}>
                Configure os campos e clique em &ldquo;Gerar aula&rdquo;.
              </h3>
              <p className="mt-2 text-sm leading-relaxed">
                O treino será montado com exercícios, duração, pranchas táticas e sugestão de mesociclo.
              </p>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
