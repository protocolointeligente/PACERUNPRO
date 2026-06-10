"use client";

import { useState } from "react";
import { CalendarCheck, CheckCircle2, Lock, Unlock } from "lucide-react";
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
import { weekWorkouts, TYPE_LABELS, getSubtypeColor } from "@/lib/mock-data";
import { cn } from "@/lib/utils";

const dayLabels = ["Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado", "Domingo"];

const scopeOptions = [
  { id: "1-semana", label: "Próxima semana", description: "Libera apenas os 7 dias seguintes do plano." },
  { id: "2-semanas", label: "Próximas 2 semanas", description: "Libera duas semanas adiante — bom para viagens ou competições." },
  { id: "bloco", label: "Bloco específico", description: "Escolha manualmente quais treinos da semana o atleta poderá visualizar." },
] as const;

type ScopeId = (typeof scopeOptions)[number]["id"];

export function WeeklyReleaseDialog({ athleteName }: { athleteName: string }) {
  const [open, setOpen] = useState(false);
  const [scope, setScope] = useState<ScopeId>("1-semana");
  const [selected, setSelected] = useState<Set<string>>(() => new Set(weekWorkouts.map((w) => w.id)));
  const [confirmed, setConfirmed] = useState(false);

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
      setSelected(new Set(weekWorkouts.map((w) => w.id)));
    }
  }

  const releasedCount = scope === "bloco" ? selected.size : weekWorkouts.length;

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
            foco no presente e permitir ajustes do motor de prescrição inteligente sem gerar ansiedade ou desistência.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-2.5">
          {scopeOptions.map((opt) => (
            <button
              key={opt.id}
              onClick={() => {
                setConfirmed(false);
                setScope(opt.id);
              }}
              className={cn(
                "flex w-full items-start gap-3 rounded-xl border px-4 py-3 text-left transition-colors",
                scope === opt.id ? "border-primary/60 bg-primary/15" : "border-border bg-card-hover/30 hover:border-primary/30"
              )}
            >
              <span className={cn("mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg", scope === opt.id ? "bg-primary/20 text-primary" : "bg-card-hover text-text-muted")}>
                {scope === opt.id ? <Unlock className="h-3.5 w-3.5" /> : <Lock className="h-3.5 w-3.5" />}
              </span>
              <div>
                <p className="text-sm font-semibold text-white">{opt.label}</p>
                <p className="mt-0.5 text-xs text-text-muted">{opt.description}</p>
              </div>
            </button>
          ))}
        </div>

        {scope === "bloco" && (
          <div className="mt-3 max-h-64 space-y-1.5 overflow-y-auto rounded-xl border border-border bg-background/40 p-2.5">
            {weekWorkouts.map((w, i) => {
              const checked = selected.has(w.id);
              return (
                <label
                  key={w.id}
                  className={cn(
                    "flex cursor-pointer items-center gap-3 rounded-lg border px-3 py-2 transition-colors",
                    checked ? "border-primary/40 bg-primary/10" : "border-transparent bg-card-hover/30 hover:border-border"
                  )}
                >
                  <input type="checkbox" checked={checked} onChange={() => toggle(w.id)} className="h-4 w-4 accent-primary" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-xs font-semibold text-white">{w.title}</p>
                    <p className="text-[11px] text-text-muted">{dayLabels[i] ?? ""} · {TYPE_LABELS[w.type]}</p>
                  </div>
                  {(() => {
                    const color = getSubtypeColor(w.type, w.subtype);
                    return (
                      <Badge style={{ borderColor: `${color}55`, color, backgroundColor: `${color}1a` }} className="shrink-0 border">
                        {w.subtype ?? TYPE_LABELS[w.type]}
                      </Badge>
                    );
                  })()}
                </label>
              );
            })}
          </div>
        )}

        <div className="mt-5 flex items-center justify-between gap-3 border-t border-border pt-4">
          <p className="text-xs text-text-muted">
            <span className="font-semibold text-white">{releasedCount}</span> {releasedCount === 1 ? "treino será liberado" : "treinos serão liberados"}
          </p>
          <div className="flex gap-2">
            <DialogClose asChild>
              <Button variant="ghost">Cancelar</Button>
            </DialogClose>
            <Button onClick={() => setConfirmed(true)}>Confirmar liberação</Button>
          </div>
        </div>

        {confirmed && (
          <div className="mt-4 flex items-center gap-2.5 rounded-xl border border-success/30 bg-success/5 p-3.5 text-sm text-text-muted">
            <CheckCircle2 className="h-4 w-4 shrink-0 text-success" />
            Liberação confirmada para <span className="font-semibold text-white">{athleteName}</span>. O restante do
            ciclo continua bloqueado até a próxima liberação.
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
