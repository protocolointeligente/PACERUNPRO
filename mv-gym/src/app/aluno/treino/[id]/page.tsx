"use client";

import { use } from "react";
import { useRouter } from "next/navigation";
import { Sparkles } from "lucide-react";
import { TopBar } from "@/components/layout/top-bar";
import { Button } from "@/components/ui/button";
import { Card, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useAppStore } from "@/lib/store/useAppStore";
import { getExercicioById, GRUPOS_MUSCULARES_LABEL } from "@/lib/data/exercises";
import { sugerirProgressao } from "@/lib/ai/coach";

export default function TreinoDetalhePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();

  const planoTreino = useAppStore((s) => s.planoTreino);
  const registrosTreino = useAppStore((s) => s.registrosTreino);

  const treino = planoTreino?.treinos.find((t) => t.id === id);

  if (!treino) {
    return (
      <div className="flex flex-col gap-4 px-4 py-4">
        <Card>
          <CardDescription>Treino não encontrado.</CardDescription>
          <Button className="mt-4 w-full" variant="primary" onClick={() => router.push("/aluno/treino")}>
            Voltar
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex flex-col">
      <TopBar
        title={treino.nome}
        showBack
        subtitle={`~${treino.duracaoEstimadaMin} min · ${treino.exercicios.length} exercícios`}
      />

      <div className="flex flex-col gap-4 px-4 py-4 pb-32">
        <div className="flex flex-wrap gap-2">
          {treino.grupos.map((grupo) => (
            <Badge key={grupo} variant="default">
              {GRUPOS_MUSCULARES_LABEL[grupo]}
            </Badge>
          ))}
        </div>

        {treino.exercicios.map((ex) => {
          const exercicio = getExercicioById(ex.exercicioId);
          if (!exercicio) return null;

          const temHistorico = registrosTreino.some((r) =>
            r.series.some((s) => s.exercicioId === ex.exercicioId),
          );

          return (
            <Dialog key={ex.exercicioId}>
              <DialogTrigger asChild>
                <Card className="cursor-pointer transition-colors hover:bg-card-hover">
                  <div className="flex items-center justify-between gap-2">
                    <p className="font-semibold text-text">{exercicio.nome}</p>
                    <Badge variant="default">{GRUPOS_MUSCULARES_LABEL[exercicio.grupoMuscular]}</Badge>
                  </div>

                  <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm text-text-muted">
                    <span>
                      {ex.series} x {ex.repeticoes}
                    </span>
                    <span>Descanso: {ex.descansoSeg}s</span>
                    {ex.rpeAlvo && <span>RPE alvo: {ex.rpeAlvo}</span>}
                  </div>

                  {temHistorico && (
                    <div className="mt-3 flex items-start gap-2 rounded-xl border border-primary/30 bg-primary/5 p-2.5">
                      <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                      <p className="text-xs text-text">{sugerirProgressao(registrosTreino, ex.exercicioId)}</p>
                    </div>
                  )}
                </Card>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>{exercicio.nome}</DialogTitle>
                </DialogHeader>
                <div className="flex flex-col gap-4">
                  <div>
                    <p className="text-sm font-semibold text-text">Como executar</p>
                    <p className="mt-1 text-sm text-text-muted">{exercicio.execucao}</p>
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-text">Erros comuns</p>
                    <p className="mt-1 text-sm text-text-muted">{exercicio.errosComuns}</p>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          );
        })}
      </div>

      <div className="fixed inset-x-0 bottom-16 z-30 mx-auto max-w-md border-t border-border bg-background/95 p-4 backdrop-blur safe-bottom">
        <Button
          size="lg"
          variant="primary"
          className="w-full"
          onClick={() => router.push(`/aluno/treino/executar/${treino.id}`)}
        >
          Iniciar treino
        </Button>
      </div>
    </div>
  );
}
