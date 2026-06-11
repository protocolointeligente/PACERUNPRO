"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { FOCI } from "@/lib/data/foci";
import { loadSavedPlans, saveSavedPlans, type SavedPlan } from "@/lib/storage";

export default function TreinosPage() {
  const [plans, setPlans] = useState<SavedPlan[]>([]);

  useEffect(() => {
    // Reads persisted plans after mount to avoid SSR/client markup mismatch.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setPlans(loadSavedPlans());
  }, []);

  const sorted = useMemo(() => [...plans].sort((a, b) => b.createdAt.localeCompare(a.createdAt)), [plans]);

  function handleRemove(id: string) {
    const next = plans.filter((p) => p.id !== id);
    setPlans(next);
    saveSavedPlans(next);
  }

  return (
    <div className="card p-4.5">
      <h2 className="m-0 mb-4 flex items-center gap-2.5 text-[19px] font-bold tracking-tight">
        <span className="grid h-[31px] w-[31px] place-items-center rounded-xl text-sm font-black text-white" style={{ background: "var(--accent)" }}>
          8
        </span>
        Treinos salvos
      </h2>

      {sorted.length === 0 ? (
        <div className="rounded-[22px] border border-dashed p-9 text-center" style={{ borderColor: "var(--line)", background: "rgba(255,255,255,.025)", color: "var(--muted)" }}>
          Nenhum treino salvo ainda. Gere uma aula em &ldquo;Gerar aula&rdquo; e use &ldquo;Salvar treino&rdquo; para guardá-la aqui.
        </div>
      ) : (
        <div className="grid gap-2.5 sm:grid-cols-2">
          {sorted.map((saved) => (
            <div key={saved.id} className="surface p-3.5">
              <h4 className="m-0 mb-2 text-[15px] font-bold">{saved.title}</h4>
              <p className="m-0 mb-2 text-[12px]" style={{ color: "var(--muted)" }}>
                Salvo em {new Date(saved.createdAt).toLocaleString("pt-BR")}
              </p>
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="chip chip-accent">{saved.plan.category.label}</span>
                <span className="chip">{FOCI[saved.plan.config.foco]}</span>
                <span className="chip">{saved.plan.position.label}</span>
                <span className="chip">{saved.plan.config.tempo} min</span>
                <Link href={`/treinos/${saved.id}`} className="chip ml-auto" style={{ color: "var(--accent2)" }}>
                  Ver →
                </Link>
                <button type="button" className="chip" style={{ color: "var(--danger)" }} onClick={() => handleRemove(saved.id)}>
                  Excluir
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
