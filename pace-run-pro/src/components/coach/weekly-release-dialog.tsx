"use client";

import { useState, useEffect } from "react";
import { CalendarCheck, CheckCircle2, Lock, Loader2, Unlock } from "lucide-react";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { TYPE_LABELS, getSubtypeColor } from "@/lib/workout-constants";
import { cn } from "@/lib/utils";

const DAY_LABELS = ["Domingo", "Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado"];

const scopeOptions = [
  { id: "1-semana", label: "Próxima semana", description: "Libera apenas os 7 dias seguintes do plano." },
  { id: "2-semanas", label: "Próximas 2 semanas", description: "Libera duas semanas adiante — bom para viagens ou competições." },
  { id: "bloco", label: "Bloco específico", description: "Escolha manualmente quais treinos o atleta poderá visualizar." },
] as const;

type ScopeId = (typeof scopeOptions)[number]["id"];

interface UpcomingWorkout {
  id: string;
  date: string;
  type: string;
  title: string;
  status: string;
}

function formatDate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function nextMondayStr(): string {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  const dow = d.getDay();
  const add = dow === 1 ? 0 : dow === 0 ? 1 : 8 - dow;
  d.setDate(d.getDate() + add);
  return formatDate(d);
}

export function WeeklyReleaseDialog({ athleteName, athleteId }: { athleteName: string; athleteId: string }) {
  const [open, setOpen] = useState(false);
  const [scope, setScope] = useState<ScopeId>("1-semana");
  const [workouts, setWorkouts] = useState<UpcomingWorkout[]>([]);
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [confirmed, setConfirmed] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    setLoading(true);
    const weekStart = nextMondayStr();
    fetch(`/api/coach/athletes/week?weekStart=${weekStart}`)
      .then((r) => r.ok ? r.json() : null)
      .then((data: { athletes?: { id: string; workouts: UpcomingWorkout[] }[] } | null) => {
        const athlete = data?.athletes?.find((a) => a.id === athleteId);
        const upcoming = (athlete?.workouts ?? []).filter((w) => w.status === "AGENDADO");
        setWorkouts(upcoming);
        setSelected(new Set(upcoming.map((w) => w.id)));
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [open, athleteId]);

  function toggle(id: string) {
    setConfirmed(false);
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function reset(next: boolean) {
    setOpen(next);
    if (!next) {
      setConfirmed(false);
      setScope("1-semana");
      setSelected(new Set());
    }
  }

  async function handleConfirm() {
    setSaving(true);
    try {
      if (scope === "bloco") {
        await fetch("/api/coach/workouts/release-ids", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ athleteId, workoutIds: Array.from(selected) }),
        });
      } else {
        const today = formatDate(new Date());
        const to = new Date();
        to.setDate(to.getDate() + (scope === "1-semana" ? 6 : 13));
        await fetch("/api/coach/workouts/release", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ athleteId, from: today, to: formatDate(to) }),
        });
      }
      setConfirmed(true);
    } catch (e) {
      console.error(e);
    } finally {
      setSaving(false);
    }
  }

  const releasedCount = scope === "bloco" ? selected.size : workouts.length;

  return (
    <Dialog open={open} onOpenChange={reset}>
      <DialogTrigger asChild>
        <Button>Liberar próxima semana</Button>
      </DialogTrigger>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CalendarCheck className="h-4 w-4 text-primary" /> Liberar plano para {athleteName.split(" ")[0]}
          </DialogTitle>
          <DialogDescription>
            Por padrão, atletas só visualizam os treinos liberados — o ciclo completo permanece bloqueado para manter o
            foco no presente e permitir ajustes sem gerar ansiedade.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-2.5">
          {scopeOptions.map((opt) => (
            <button
              key={opt.id}
              onClick={() => { setConfirmed(false); setScope(opt.id); }}
              className={cn(
                "flex w-full items-start gap-3 rounded-xl border px-4 py-3 text-left transition-colors",
                scope === opt.id
                  ? "border-primary/60 bg-primary/15"
                  : "border-border bg-card-hover/30 hover:border-primary/30"
              )}
            >
              <span className={cn(
                "mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg",
                scope === opt.id ? "bg-primary/20 text-primary" : "bg-card-hover text-text-muted"
              )}>
                {scope === opt.id ? <Unlock className="h-3.5 w-3.5" /> : <Lock className="h-3.5 w-3.5" />}
              </span>
              <div>
                <p className="text-sm font-semibold text-text">{opt.label}</p>
                <p className="mt-0.5 text-xs text-text-muted">{opt.description}</p>
              </div>
            </button>
          ))}
        </div>

        {scope === "bloco" && (
          <div className="mt-3 max-h-64 space-y-1.5 overflow-y-auto rounded-xl border border-border bg-background/40 p-2.5">
            {loading ? (
              <div className="flex items-center justify-center py-6 text-text-muted">
                <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Carregando treinos...
              </div>
            ) : workouts.length === 0 ? (
              <p className="py-6 text-center text-sm text-text-muted">
                Nenhum treino agendado para a próxima semana.
              </p>
            ) : (
              workouts.map((w) => {
                const checked = selected.has(w.id);
                const dayLabel = DAY_LABELS[new Date(w.date + "T12:00:00").getDay()] ?? "";
                const color = getSubtypeColor(w.type);
                return (
                  <label
                    key={w.id}
                    className={cn(
                      "flex cursor-pointer items-center gap-3 rounded-lg border px-3 py-2 transition-colors",
                      checked
                        ? "border-primary/40 bg-primary/10"
                        : "border-transparent bg-card-hover/30 hover:border-border"
                    )}
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => toggle(w.id)}
                      className="h-4 w-4 accent-primary"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-xs font-semibold text-text">{w.title}</p>
                      <p className="text-[11px] text-text-muted">
                        {dayLabel} · {TYPE_LABELS[w.type] ?? w.type}
                      </p>
                    </div>
                    <Badge
                      style={{ borderColor: `${color}55`, color, backgroundColor: `${color}1a` }}
                      className="shrink-0 border"
                    >
                      {TYPE_LABELS[w.type] ?? w.type}
                    </Badge>
                  </label>
                );
              })
            )}
          </div>
        )}

        <div className="mt-5 border-t border-border pt-4">
          {confirmed ? (
            <div className="flex items-center gap-2.5 rounded-xl border border-success/30 bg-success/5 p-3.5 text-sm text-text-muted">
              <CheckCircle2 className="h-4 w-4 shrink-0 text-success" />
              Liberação confirmada para{" "}
              <span className="font-semibold text-text">{athleteName}</span>. O restante do ciclo continua bloqueado.
            </div>
          ) : (
            <div className="flex items-center justify-between gap-3">
              <p className="text-xs text-text-muted">
                <span className="font-semibold text-text">{releasedCount}</span>{" "}
                {releasedCount === 1 ? "treino será liberado" : "treinos serão liberados"}
              </p>
              <div className="flex gap-2">
                <DialogClose asChild>
                  <Button variant="ghost">Cancelar</Button>
                </DialogClose>
                <Button
                  onClick={handleConfirm}
                  disabled={saving || (scope === "bloco" && selected.size === 0)}
                >
                  {saving ? (
                    <>
                      <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                      Liberando...
                    </>
                  ) : (
                    "Confirmar liberação"
                  )}
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
