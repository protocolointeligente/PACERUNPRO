"use client";

import { use, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Check, Trophy } from "lucide-react";
import { TopBar } from "@/components/layout/top-bar";
import { Button } from "@/components/ui/button";
import { Card, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { CircularProgress } from "@/components/ui/progress-bar";
import { useAppStore } from "@/lib/store/useAppStore";
import { getExercicioById, GRUPOS_MUSCULARES_LABEL } from "@/lib/data/exercises";
import { formatSeconds } from "@/lib/utils";
import type { ExercicioTreino, SerieRegistrada } from "@/lib/types";

interface SerieEstado {
  repeticoes: number;
  cargaKg: number;
  concluida: boolean;
}

function repeticaoInicial(repeticoes: string): number {
  const match = repeticoes.match(/\d+/);
  if (!match) return 0;
  if (repeticoes.toLowerCase().includes("min")) return 0;
  return parseInt(match[0], 10);
}

function buildEstadoInicial(exercicios: ExercicioTreino[]): Record<string, SerieEstado[]> {
  const estado: Record<string, SerieEstado[]> = {};
  exercicios.forEach((ex) => {
    const isCardio = ex.repeticoes.toLowerCase().includes("min");
    const totalSeries = isCardio ? 1 : ex.series;
    estado[ex.exercicioId] = Array.from({ length: totalSeries }).map(() => ({
      repeticoes: repeticaoInicial(ex.repeticoes),
      cargaKg: ex.cargaSugeridaKg ?? 0,
      concluida: false,
    }));
  });
  return estado;
}

export default function ExecutarTreinoPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();

  const planoTreino = useAppStore((s) => s.planoTreino);
  const addRegistroTreino = useAppStore((s) => s.addRegistroTreino);

  const treino = planoTreino?.treinos.find((t) => t.id === id);

  const exerciciosValidos = (treino?.exercicios ?? []).filter(
    (ex) => getExercicioById(ex.exercicioId) !== undefined,
  );

  const [series, setSeries] = useState<Record<string, SerieEstado[]>>(() =>
    buildEstadoInicial(exerciciosValidos),
  );

  const inicioRef = useRef(Date.now());
  const [elapsedSec, setElapsedSec] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setElapsedSec(Math.floor((Date.now() - inicioRef.current) / 1000));
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // Descanso
  const [restOpen, setRestOpen] = useState(false);
  const [restTotal, setRestTotal] = useState(0);
  const [restRemaining, setRestRemaining] = useState(0);
  const restIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    return () => {
      if (restIntervalRef.current) clearInterval(restIntervalRef.current);
    };
  }, []);

  function iniciarDescanso(segundos: number) {
    if (segundos <= 0) return;
    if (restIntervalRef.current) clearInterval(restIntervalRef.current);
    setRestTotal(segundos);
    setRestRemaining(segundos);
    setRestOpen(true);
    restIntervalRef.current = setInterval(() => {
      setRestRemaining((prev) => {
        if (prev <= 1) {
          if (restIntervalRef.current) clearInterval(restIntervalRef.current);
          setRestOpen(false);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }

  function pularDescanso() {
    if (restIntervalRef.current) clearInterval(restIntervalRef.current);
    setRestOpen(false);
    setRestRemaining(0);
  }

  // Conclusão
  const [concluidoOpen, setConcluidoOpen] = useState(false);
  const [resumo, setResumo] = useState<{ duracaoSeg: number; volumeTotalKg: number } | null>(null);

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

  function atualizarSerie(
    exercicioId: string,
    index: number,
    campo: "repeticoes" | "cargaKg",
    valor: number,
  ) {
    setSeries((prev) => {
      const atual = prev[exercicioId] ?? [];
      const novaLista = atual.map((serie, i) =>
        i === index ? { ...serie, [campo]: valor } : serie,
      );
      return { ...prev, [exercicioId]: novaLista };
    });
  }

  function toggleConcluida(exercicioId: string, index: number, ex: ExercicioTreino, exIdx: number) {
    setSeries((prev) => {
      const atual = prev[exercicioId] ?? [];
      const serieAtual = atual[index];
      if (!serieAtual) return prev;

      const novaConcluida = !serieAtual.concluida;
      const novaLista = atual.map((serie, i) =>
        i === index ? { ...serie, concluida: novaConcluida } : serie,
      );

      if (novaConcluida) {
        const ultimoExercicio = exIdx === exerciciosValidos.length - 1;
        const ultimaSerie = index === atual.length - 1;
        if (!(ultimoExercicio && ultimaSerie)) {
          iniciarDescanso(ex.descansoSeg);
        }
      }

      return { ...prev, [exercicioId]: novaLista };
    });
  }

  function finalizarTreino() {
    const seriesRegistradas: SerieRegistrada[] = [];

    exerciciosValidos.forEach((ex) => {
      const lista = series[ex.exercicioId] ?? [];
      let numeroSerie = 0;
      lista.forEach((serie) => {
        if (!serie.concluida) return;
        numeroSerie += 1;
        seriesRegistradas.push({
          exercicioId: ex.exercicioId,
          numeroSerie,
          repeticoes: serie.repeticoes,
          cargaKg: serie.cargaKg,
        });
      });
    });

    const volumeTotalKg = seriesRegistradas.reduce(
      (acc, s) => acc + s.repeticoes * s.cargaKg,
      0,
    );

    addRegistroTreino({
      treinoId: treino!.id,
      treinoNome: treino!.nome,
      data: new Date().toISOString(),
      duracaoSeg: elapsedSec,
      series: seriesRegistradas,
      volumeTotalKg,
    });

    setResumo({ duracaoSeg: elapsedSec, volumeTotalKg });
    setConcluidoOpen(true);
  }

  return (
    <div className="flex flex-col">
      <div className="sticky top-0 z-30">
        <TopBar title={treino.nome} subtitle="Treino em andamento" showBack />
        <div className="border-b border-border bg-background/90 px-4 py-2 text-center backdrop-blur">
          <span className="font-display text-lg font-bold text-text">⏱ {formatSeconds(elapsedSec)}</span>
        </div>
      </div>

      <div className="flex flex-col gap-4 px-4 py-4 pb-28">
        {exerciciosValidos.map((ex, exIdx) => {
          const exercicio = getExercicioById(ex.exercicioId);
          if (!exercicio) return null;

          const lista = series[ex.exercicioId] ?? [];

          return (
            <Card key={ex.exercicioId}>
              <div className="flex items-center justify-between gap-2">
                <p className="font-semibold text-text">{exercicio.nome}</p>
                <Badge variant="default">{GRUPOS_MUSCULARES_LABEL[exercicio.grupoMuscular]}</Badge>
              </div>

              <div className="mt-3 flex flex-col gap-2">
                <div className="grid grid-cols-[1fr_1fr_1fr_auto] items-center gap-2 px-1 text-xs font-medium text-text-muted">
                  <span>Série</span>
                  <span>Reps</span>
                  <span>Carga (kg)</span>
                  <span className="sr-only">Concluída</span>
                </div>
                {lista.map((serie, index) => (
                  <div key={index} className="grid grid-cols-[1fr_1fr_1fr_auto] items-center gap-2">
                    <span className="text-sm text-text">Série {index + 1}</span>
                    <Input
                      type="number"
                      inputMode="numeric"
                      min={0}
                      value={serie.repeticoes}
                      onChange={(e) =>
                        atualizarSerie(ex.exercicioId, index, "repeticoes", Number(e.target.value))
                      }
                      className="h-10 px-2 text-center"
                    />
                    <Input
                      type="number"
                      inputMode="decimal"
                      min={0}
                      step={0.5}
                      value={serie.cargaKg}
                      onChange={(e) =>
                        atualizarSerie(ex.exercicioId, index, "cargaKg", Number(e.target.value))
                      }
                      className="h-10 px-2 text-center"
                    />
                    <Button
                      type="button"
                      size="icon"
                      variant={serie.concluida ? "primary" : "secondary"}
                      onClick={() => toggleConcluida(ex.exercicioId, index, ex, exIdx)}
                      aria-label={`Marcar série ${index + 1} como concluída`}
                    >
                      <Check className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </Card>
          );
        })}
      </div>

      {/* Rest timer */}
      <Dialog open={restOpen} onOpenChange={(open) => !open && pularDescanso()}>
        <DialogContent className="text-center">
          <DialogHeader>
            <DialogTitle className="text-center">Descanso</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col items-center gap-4">
            <CircularProgress value={(restRemaining / Math.max(restTotal, 1)) * 100} size={140}>
              <span className="font-display text-2xl font-extrabold text-text">
                {formatSeconds(restRemaining)}
              </span>
            </CircularProgress>
            <Button variant="outline" className="w-full" onClick={pularDescanso}>
              Pular descanso
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Conclusão */}
      <Dialog open={concluidoOpen} onOpenChange={setConcluidoOpen}>
        <DialogContent className="text-center">
          <DialogHeader>
            <div className="flex flex-col items-center gap-2">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/15 text-primary">
                <Trophy className="h-7 w-7" />
              </div>
              <DialogTitle className="gradient-text text-center text-xl">Treino concluído!</DialogTitle>
            </div>
          </DialogHeader>
          <div className="flex flex-col gap-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-xl border border-border bg-card-hover p-3">
                <p className="text-xs text-text-muted">Duração</p>
                <p className="font-display text-lg font-bold text-text">
                  {resumo ? formatSeconds(resumo.duracaoSeg) : "0:00"}
                </p>
              </div>
              <div className="rounded-xl border border-border bg-card-hover p-3">
                <p className="text-xs text-text-muted">Volume total</p>
                <p className="font-display text-lg font-bold text-text">
                  {resumo ? Math.round(resumo.volumeTotalKg) : 0} kg
                </p>
              </div>
            </div>
            <div className="rounded-xl border border-primary/30 bg-primary/5 p-3">
              <p className="font-display text-lg font-extrabold text-primary">+50 XP</p>
              <p className="mt-1 text-xs text-text-muted">+ bônus por recordes pessoais!</p>
            </div>
            <Button className="w-full" variant="primary" onClick={() => router.push("/aluno/dashboard")}>
              Voltar ao início
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <div className="fixed inset-x-0 bottom-16 z-30 mx-auto max-w-md border-t border-border bg-background/95 p-4 backdrop-blur safe-bottom">
        <Button size="lg" variant="primary" className="w-full" onClick={finalizarTreino}>
          Finalizar treino
        </Button>
      </div>
    </div>
  );
}
