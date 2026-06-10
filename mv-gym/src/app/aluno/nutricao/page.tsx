"use client";

import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ProgressBar, CircularProgress } from "@/components/ui/progress-bar";
import { TopBar } from "@/components/layout/top-bar";
import { useAppStore } from "@/lib/store/useAppStore";
import { todayIso, cn } from "@/lib/utils";
import type { Refeicao } from "@/lib/types";

export default function NutricaoPage() {
  const planoNutricional = useAppStore((s) => s.planoNutricional);
  const registrosNutricao = useAppStore((s) => s.registrosNutricao);
  const toggleRefeicaoConcluida = useAppStore((s) => s.toggleRefeicaoConcluida);
  const addAgua = useAppStore((s) => s.addAgua);

  if (!planoNutricional) {
    return (
      <div className="flex flex-col gap-4 px-4 py-4">
        <TopBar title="Nutrição" subtitle="Seu plano alimentar de hoje" />
        <Card>
          <p className="text-sm text-text-muted">
            Seu plano nutricional ainda não foi gerado.
          </p>
        </Card>
      </div>
    );
  }

  const hoje = todayIso();
  const registroHoje = registrosNutricao.find((r) => r.data === hoje) ?? {
    data: hoje,
    aguaMl: 0,
    refeicoesConcluidas: [] as string[],
  };

  const refeicoesConcluidas = planoNutricional.refeicoes.filter((r) =>
    registroHoje.refeicoesConcluidas.includes(r.id),
  );

  const consumido = refeicoesConcluidas.reduce(
    (acc, refeicao) => {
      refeicao.alimentos.forEach((alimento) => {
        acc.calorias += alimento.calorias;
        acc.proteinasG += alimento.proteinasG;
        acc.carboidratosG += alimento.carboidratosG;
        acc.gordurasG += alimento.gordurasG;
      });
      return acc;
    },
    { calorias: 0, proteinasG: 0, carboidratosG: 0, gordurasG: 0 },
  );

  const percentualCalorias =
    planoNutricional.caloriasAlvo > 0
      ? (consumido.calorias / planoNutricional.caloriasAlvo) * 100
      : 0;

  const percentualAgua =
    planoNutricional.aguaAlvoMl > 0
      ? (registroHoje.aguaMl / planoNutricional.aguaAlvoMl) * 100
      : 0;

  return (
    <div className="flex flex-col gap-4 px-4 py-4">
      <TopBar title="Nutrição" subtitle="Seu plano alimentar de hoje" />

      <Card className="flex flex-col items-center gap-4">
        <CircularProgress value={percentualCalorias} size={140}>
          <div className="flex flex-col items-center justify-center text-center">
            <span className="font-display text-2xl font-extrabold text-text">
              {consumido.calorias}
              <span className="text-sm font-medium text-text-muted"> / {planoNutricional.caloriasAlvo}</span>
            </span>
            <span className="text-xs text-text-muted">kcal</span>
          </div>
        </CircularProgress>

        <div className="flex w-full flex-col gap-3">
          <div>
            <div className="mb-1 flex items-center justify-between text-xs text-text-muted">
              <span>Proteínas</span>
              <span>
                {consumido.proteinasG}g / {planoNutricional.proteinasAlvoG}g
              </span>
            </div>
            <ProgressBar
              value={
                planoNutricional.proteinasAlvoG > 0
                  ? (consumido.proteinasG / planoNutricional.proteinasAlvoG) * 100
                  : 0
              }
            />
          </div>

          <div>
            <div className="mb-1 flex items-center justify-between text-xs text-text-muted">
              <span>Carboidratos</span>
              <span>
                {consumido.carboidratosG}g / {planoNutricional.carboidratosAlvoG}g
              </span>
            </div>
            <ProgressBar
              value={
                planoNutricional.carboidratosAlvoG > 0
                  ? (consumido.carboidratosG / planoNutricional.carboidratosAlvoG) * 100
                  : 0
              }
            />
          </div>

          <div>
            <div className="mb-1 flex items-center justify-between text-xs text-text-muted">
              <span>Gorduras</span>
              <span>
                {consumido.gordurasG}g / {planoNutricional.gordurasAlvoG}g
              </span>
            </div>
            <ProgressBar
              value={
                planoNutricional.gordurasAlvoG > 0
                  ? (consumido.gordurasG / planoNutricional.gordurasAlvoG) * 100
                  : 0
              }
            />
          </div>
        </div>
      </Card>

      <Card>
        <CardTitle>Água</CardTitle>
        <p className="mt-1 text-sm text-text-muted">
          {registroHoje.aguaMl}ml / {planoNutricional.aguaAlvoMl}ml
        </p>
        <div className="mt-2">
          <ProgressBar value={percentualAgua} />
        </div>
        <div className="mt-4 flex gap-3">
          <Button className="flex-1" variant="primary" onClick={() => addAgua(hoje, 250)}>
            +250ml
          </Button>
          <Button className="flex-1" variant="outline" onClick={() => addAgua(hoje, -250)}>
            -250ml
          </Button>
        </div>
      </Card>

      <div className="flex flex-col gap-3">
        <h2 className="font-display text-base font-bold text-text">Refeições de hoje</h2>
        {planoNutricional.refeicoes.map((refeicao: Refeicao) => {
          const concluida = registroHoje.refeicoesConcluidas.includes(refeicao.id);
          return (
            <Card
              key={refeicao.id}
              className={cn(concluida && "border-success bg-success/5")}
            >
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-text">{refeicao.nome}</span>
                  <Badge variant="secondary">{refeicao.horario}</Badge>
                </div>
                <Button
                  size="icon"
                  variant={concluida ? "primary" : "outline"}
                  onClick={() => toggleRefeicaoConcluida(hoje, refeicao.id)}
                  aria-label={
                    concluida ? "Marcar refeição como não concluída" : "Marcar refeição como concluída"
                  }
                >
                  <Check className="h-5 w-5" />
                </Button>
              </div>

              <div className="mt-3 flex flex-col gap-2">
                {refeicao.alimentos.map((alimento, idx) => (
                  <div key={idx} className="flex items-center justify-between text-sm">
                    <div>
                      <p className="text-text">{alimento.nome}</p>
                      <p className="text-xs text-text-muted">{alimento.quantidade}</p>
                    </div>
                    <span className="text-text-muted">{alimento.calorias} kcal</span>
                  </div>
                ))}
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
