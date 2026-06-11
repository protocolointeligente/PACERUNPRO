"use client";

import { useState } from "react";
import { PlanResult } from "@/components/planner/PlanResult";
import { PlannerForm } from "@/components/planner/PlannerForm";
import type { LessonPlan } from "@/lib/planner/generate";

export default function Home() {
  const [plan, setPlan] = useState<LessonPlan | null>(null);

  return (
    <div>
      <section className="hero-panel relative mb-4.5 overflow-hidden p-6 after:absolute after:-bottom-[130px] after:-right-[70px] after:h-[360px] after:w-[360px] after:rounded-full after:border after:border-white/[.08] after:shadow-[inset_0_0_0_34px_rgba(255,255,255,.025)] after:content-['']">
        <h1 className="m-0 text-[clamp(40px,6vw,76px)] font-black leading-[0.9] tracking-[-0.075em]">Futebol Coach</h1>
        <p className="mt-4 max-w-[820px] text-[17px] leading-relaxed" style={{ color: "var(--muted)" }}>
          Planeje aulas de futebol por idade, objetivo, fundamentos, posição e estrutura funcional. O sistema seleciona
          exercícios do banco de 500 atividades e gera uma sessão com pranchas táticas, tempos e mesociclo.
        </p>
        <div className="mt-4.5 text-xs font-black uppercase tracking-[0.08em]">Ricardo Pace • Educação Física • Licença B ATFA CONMEBOL</div>
      </section>

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
