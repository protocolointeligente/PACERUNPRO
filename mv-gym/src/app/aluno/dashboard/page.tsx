"use client";

import { useRouter } from "next/navigation";
import { Flame, Sparkles, HeartPulse, Trophy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ProgressBar } from "@/components/ui/progress-bar";
import { useAppStore } from "@/lib/store/useAppStore";
import { calcularNivel, calcularStreak } from "@/lib/gamification";
import { gerarMensagemMotivacional } from "@/lib/ai/coach";
import { GRUPOS_MUSCULARES_LABEL } from "@/lib/data/exercises";

export default function DashboardPage() {
  const router = useRouter();

  const usuario = useAppStore((s) => s.usuario);
  const planoTreino = useAppStore((s) => s.planoTreino);
  const registrosTreino = useAppStore((s) => s.registrosTreino);
  const checkins = useAppStore((s) => s.checkins);
  const xp = useAppStore((s) => s.xp);
  const preferencias = useAppStore((s) => s.preferencias);

  if (!usuario) return null;

  const primeiroNome = usuario.nome.split(" ")[0];
  const streak = calcularStreak(registrosTreino);
  const nivel = calcularNivel(xp);

  const mensagemMotivacional = gerarMensagemMotivacional({
    nome: primeiroNome,
    streakDias: streak,
    treinosSemanaConcluidos: registrosTreino.filter(
      (r) => Date.now() - new Date(r.data).getTime() < 7 * 86400000,
    ).length,
    treinosSemanaAlvo: preferencias?.diasPorSemana ?? planoTreino?.treinos.length ?? 3,
    ultimoCheckinHumor: checkins[0]?.humor,
  });

  const treinoHoje = planoTreino
    ? planoTreino.treinos[registrosTreino.length % planoTreino.treinos.length]
    : null;

  return (
    <div className="flex flex-col gap-4 px-4 py-4">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-xl font-bold text-text">
          Olá, {primeiroNome}
        </h1>
        <div className="flex items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1.5 text-sm font-semibold text-text">
          <Flame className="h-4 w-4 text-primary" />
          {streak} {streak === 1 ? "dia" : "dias"}
        </div>
      </div>

      <Card>
        <div className="flex items-center justify-between">
          <CardTitle>
            Nível {nivel.nivel} · {nivel.titulo}
          </CardTitle>
        </div>
        <div className="mt-3">
          <ProgressBar value={nivel.progresso * 100} />
          <p className="mt-2 text-xs text-text-muted">
            {nivel.xpAtual} / {nivel.xpProximoNivel} XP
          </p>
        </div>
      </Card>

      <Card className="flex gap-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/15 text-primary">
          <Sparkles className="h-5 w-5" />
        </div>
        <p className="text-sm text-text">{mensagemMotivacional}</p>
      </Card>

      {planoTreino && treinoHoje ? (
        <Card className="border-primary/60 bg-card glow-primary">
          <CardTitle>Treino de hoje</CardTitle>
          <p className="mt-1 font-display text-lg font-extrabold text-text">{treinoHoje.nome}</p>

          <div className="mt-3 flex flex-wrap gap-2">
            {treinoHoje.grupos.map((grupo) => (
              <Badge key={grupo} variant="default">
                {GRUPOS_MUSCULARES_LABEL[grupo]}
              </Badge>
            ))}
          </div>

          <CardDescription className="mt-3">
            {treinoHoje.exercicios.length} exercícios · ~{treinoHoje.duracaoEstimadaMin} min
          </CardDescription>

          <div className="mt-4 flex gap-3">
            <Button
              className="flex-1"
              variant="primary"
              onClick={() => router.push(`/aluno/treino/executar/${treinoHoje.id}`)}
            >
              Iniciar treino
            </Button>
            <Button
              className="flex-1"
              variant="outline"
              onClick={() => router.push(`/aluno/treino/${treinoHoje.id}`)}
            >
              Ver detalhes
            </Button>
          </div>
        </Card>
      ) : (
        <Card>
          <CardTitle>Treino de hoje</CardTitle>
          <CardDescription className="mt-2">
            Você ainda não tem um plano de treino. Vá até a aba Treino para gerar um.
          </CardDescription>
          <Button className="mt-4 w-full" variant="primary" onClick={() => router.push("/aluno/treino")}>
            Ir para Treino
          </Button>
        </Card>
      )}

      <div className="grid grid-cols-3 gap-3">
        <button
          type="button"
          onClick={() => router.push("/aluno/checkin")}
          className="flex flex-col items-center gap-2 rounded-2xl border border-border bg-card p-3 text-center transition-colors hover:bg-card-hover"
        >
          <HeartPulse className="h-5 w-5 text-primary" />
          <span className="text-xs font-medium text-text">Check-in</span>
        </button>
        <button
          type="button"
          onClick={() => router.push("/aluno/conquistas")}
          className="flex flex-col items-center gap-2 rounded-2xl border border-border bg-card p-3 text-center transition-colors hover:bg-card-hover"
        >
          <Trophy className="h-5 w-5 text-primary" />
          <span className="text-xs font-medium text-text">Conquistas</span>
        </button>
        <button
          type="button"
          onClick={() => router.push("/aluno/coach")}
          className="flex flex-col items-center gap-2 rounded-2xl border border-border bg-card p-3 text-center transition-colors hover:bg-card-hover"
        >
          <Sparkles className="h-5 w-5 text-primary" />
          <span className="text-xs font-medium text-text">AI Coach</span>
        </button>
      </div>
    </div>
  );
}
