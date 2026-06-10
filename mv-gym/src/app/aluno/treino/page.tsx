"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { TopBar } from "@/components/layout/top-bar";
import { Button } from "@/components/ui/button";
import { Card, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useAppStore } from "@/lib/store/useAppStore";
import { GRUPOS_MUSCULARES_LABEL } from "@/lib/data/exercises";
import { formatDate, formatSeconds } from "@/lib/utils";

export default function TreinoPage() {
  const planoTreino = useAppStore((s) => s.planoTreino);
  const registrosTreino = useAppStore((s) => s.registrosTreino);
  const regenerarPlano = useAppStore((s) => s.regenerarPlano);
  const aplicarDeload = useAppStore((s) => s.aplicarDeload);

  const [toast, setToast] = useState<string | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  function mostrarToast() {
    setToast("Plano atualizado!");
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => setToast(null), 2000);
  }

  function handleRegenerar() {
    regenerarPlano();
    mostrarToast();
  }

  function handleDeload() {
    aplicarDeload();
    mostrarToast();
  }

  return (
    <div className="flex flex-col">
      <TopBar title="Meu treino" />

      <div className="flex flex-col gap-4 px-4 py-4">
        {!planoTreino ? (
          <Card>
            <CardTitle>Nenhum plano de treino encontrado.</CardTitle>
            <CardDescription className="mt-2">
              Configure suas preferências para gerarmos um plano de treino com IA.
            </CardDescription>
            <Link href="/onboarding/preferencias">
              <Button className="mt-4 w-full" variant="primary">
                Configurar preferências
              </Button>
            </Link>
          </Card>
        ) : (
          <>
            <Card>
              <CardTitle>{planoTreino.nome}</CardTitle>
              <CardDescription className="mt-1">Split: {planoTreino.split}</CardDescription>
              <CardDescription>
                Semana {planoTreino.semanaAtual} de {planoTreino.totalSemanas}
              </CardDescription>
              {planoTreino.deload && (
                <Badge variant="warning" className="mt-2">
                  Semana de deload
                </Badge>
              )}

              <div className="mt-4 flex gap-3">
                <Button size="sm" variant="secondary" className="flex-1" onClick={handleRegenerar}>
                  Regenerar plano
                </Button>
                <Button size="sm" variant="outline" className="flex-1" onClick={handleDeload}>
                  Aplicar deload
                </Button>
              </div>

              {toast && <p className="mt-3 text-center text-xs font-medium text-primary">{toast}</p>}
            </Card>

            <div className="flex flex-col gap-3">
              {planoTreino.treinos.map((treino) => (
                <Link key={treino.id} href={`/aluno/treino/${treino.id}`}>
                  <Card className="transition-colors hover:bg-card-hover">
                    <p className="font-display font-bold text-text">{treino.nome}</p>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {treino.grupos.map((grupo) => (
                        <Badge key={grupo} variant="default">
                          {GRUPOS_MUSCULARES_LABEL[grupo]}
                        </Badge>
                      ))}
                    </div>
                    <CardDescription className="mt-2">
                      {treino.exercicios.length} exercícios · ~{treino.duracaoEstimadaMin} min
                    </CardDescription>
                  </Card>
                </Link>
              ))}
            </div>
          </>
        )}

        <div>
          <h2 className="mb-3 font-display text-lg font-bold text-text">Histórico recente</h2>
          {registrosTreino.length === 0 ? (
            <p className="text-sm text-text-muted">Nenhum treino registrado ainda.</p>
          ) : (
            <div className="flex flex-col gap-2">
              {registrosTreino.slice(0, 5).map((registro) => (
                <Card key={registro.id} className="flex items-center justify-between py-3">
                  <div>
                    <p className="text-sm font-semibold text-text">{registro.treinoNome}</p>
                    <p className="text-xs text-text-muted">{formatDate(registro.data)}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-text">
                      {Math.round(registro.volumeTotalKg)} kg
                    </p>
                    <p className="text-xs text-text-muted">{formatSeconds(registro.duracaoSeg)}</p>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
