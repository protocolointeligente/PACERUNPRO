"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { PlanPrintFooter } from "@/components/planner/PlanPrintFooter";
import { PlanResult } from "@/components/planner/PlanResult";
import { planToText } from "@/lib/planner/text";
import { loadSavedPlans, type SavedPlan } from "@/lib/storage";

export default function TreinoSalvoPage() {
  const params = useParams<{ id: string }>();
  const [plans, setPlans] = useState<SavedPlan[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [copyStatus, setCopyStatus] = useState<string | null>(null);

  useEffect(() => {
    // Reads persisted plans after mount to avoid SSR/client markup mismatch.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setPlans(loadSavedPlans());
    setLoaded(true);
  }, []);

  const saved = useMemo(() => plans.find((p) => p.id === params.id) ?? null, [plans, params.id]);

  if (!loaded) return null;

  if (!saved) {
    return (
      <div className="card p-4.5">
        <h1 className="m-0 text-2xl font-black tracking-tight">Treino não encontrado</h1>
        <p className="mt-2 text-sm leading-relaxed" style={{ color: "var(--muted)" }}>
          O treino salvo solicitado não existe ou foi removido.
        </p>
        <Link href="/treinos" className="btn mt-4 inline-flex w-fit">
          Voltar a Treinos salvos
        </Link>
      </div>
    );
  }

  function handleCopiar() {
    if (!saved) return;
    navigator.clipboard?.writeText(planToText(saved.plan));
    setCopyStatus("Plano copiado para a área de transferência.");
  }

  return (
    <div>
      <div className="mb-4.5 flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <Link href="/treinos" className="text-xs font-extrabold uppercase tracking-wider" style={{ color: "var(--accent2)" }}>
            ← Treinos salvos
          </Link>
          <h1 className="m-0 mt-1.5 text-2xl font-black tracking-tight">{saved.title}</h1>
          <p className="mt-1.5 text-sm leading-relaxed" style={{ color: "var(--muted)" }}>
            Salvo em {new Date(saved.createdAt).toLocaleString("pt-BR")}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
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
        <PlanResult plan={saved.plan} />
        <PlanPrintFooter />
      </section>
    </div>
  );
}
