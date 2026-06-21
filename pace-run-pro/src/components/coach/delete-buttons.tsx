"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Pencil, Trash2, X, Check } from "lucide-react";

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
      {loading ? "…" : confirm ? "Confirmar?" : <Trash2 className="h-3.5 w-3.5" />}
    </button>
  );
}

export function EditWorkoutButton({
  workoutId,
  currentDate,
  currentTitle,
}: {
  workoutId: string;
  currentDate: string; // ISO date string YYYY-MM-DD
  currentTitle: string;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [date, setDate] = useState(currentDate);
  const [title, setTitle] = useState(currentTitle);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const dateRef = useRef<HTMLInputElement>(null);

  async function handleSave() {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`/api/coach/workouts/${workoutId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ date, title }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        setError(body.error ?? "Erro ao salvar.");
        return;
      }
      setOpen(false);
      router.refresh();
    } catch {
      setError("Erro de rede.");
    } finally {
      setLoading(false);
    }
  }

  if (!open) {
    return (
      <button
        onClick={() => { setOpen(true); setTimeout(() => dateRef.current?.focus(), 50); }}
        title="Editar data/nome do treino"
        className="shrink-0 rounded-lg p-1.5 text-text-muted transition-colors hover:bg-primary/10 hover:text-primary"
      >
        <Pencil className="h-3.5 w-3.5" />
      </button>
    );
  }

  return (
    <div className="flex flex-wrap items-center gap-2 rounded-lg border border-primary/30 bg-primary/5 px-2 py-1.5">
      <input
        ref={dateRef}
        type="date"
        value={date}
        onChange={(e) => setDate(e.target.value)}
        className="rounded border border-border bg-background px-2 py-1 text-xs text-text outline-none focus:border-primary/60"
      />
      <input
        type="text"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Nome do treino"
        className="min-w-[8rem] rounded border border-border bg-background px-2 py-1 text-xs text-text outline-none focus:border-primary/60"
      />
      {error && <span className="text-[11px] text-danger">{error}</span>}
      <button
        onClick={handleSave}
        disabled={loading}
        title="Salvar"
        className="rounded-lg p-1 text-success hover:bg-success/10 disabled:opacity-50"
      >
        <Check className="h-3.5 w-3.5" />
      </button>
      <button
        onClick={() => { setOpen(false); setDate(currentDate); setTitle(currentTitle); setError(""); }}
        title="Cancelar"
        className="rounded-lg p-1 text-text-muted hover:bg-card-hover"
      >
        <X className="h-3.5 w-3.5" />
      </button>
    </div>
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
