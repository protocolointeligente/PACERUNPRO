"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";

export function DeleteWorkoutButton({ workoutId }: { workoutId: string }) {
  const router = useRouter();
  const [confirm, setConfirm] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleDelete() {
    if (!confirm) { setConfirm(true); return; }
    setLoading(true);
    try {
      await fetch(`/api/coach/workouts/${workoutId}`, { method: "DELETE" });
      router.refresh();
    } finally {
      setLoading(false);
      setConfirm(false);
    }
  }

  return (
    <button
      onClick={handleDelete}
      disabled={loading}
      title={confirm ? "Clique novamente para confirmar" : "Excluir treino"}
      className={`shrink-0 rounded-lg p-1.5 text-xs transition-colors ${
        confirm
          ? "bg-danger/15 text-danger font-semibold px-2"
          : "text-text-muted hover:bg-danger/10 hover:text-danger"
      }`}
    >
      {loading ? "…" : confirm ? "Confirmar exclusão" : <Trash2 className="h-3.5 w-3.5" />}
    </button>
  );
}

export function DeletePlanButton({ planId, planName }: { planId: string; planName: string }) {
  const router = useRouter();
  const [confirm, setConfirm] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleDelete() {
    if (!confirm) { setConfirm(true); return; }
    setLoading(true);
    try {
      await fetch(`/api/coach/plans/${planId}`, { method: "DELETE" });
      router.refresh();
    } finally {
      setLoading(false);
      setConfirm(false);
    }
  }

  return (
    <button
      onClick={handleDelete}
      disabled={loading}
      title={confirm ? "Isso excluirá o plano e todos os treinos. Clique para confirmar." : `Excluir plano "${planName}"`}
      className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors border ${
        confirm
          ? "border-danger/50 bg-danger/10 text-danger"
          : "border-border text-text-muted hover:border-danger/30 hover:text-danger"
      }`}
    >
      {loading ? "Excluindo…" : confirm ? "Confirmar exclusão do plano" : "Excluir periodização"}
    </button>
  );
}
