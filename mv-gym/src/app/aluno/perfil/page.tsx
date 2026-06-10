"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Trophy, Sparkles, CreditCard, Settings, ChevronRight, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TopBar } from "@/components/layout/top-bar";
import { useAppStore } from "@/lib/store/useAppStore";
import { OBJETIVOS } from "@/lib/data/options";
import { PLANOS_ASSINATURA } from "@/lib/data/plans";
import { calcularNivel, calcularStreak } from "@/lib/gamification";
import type { NivelExperiencia } from "@/lib/types";

const NIVEL_LABELS: Record<NivelExperiencia, string> = {
  iniciante: "Iniciante",
  intermediario: "Intermediário",
  avancado: "Avançado",
};

function getIniciais(nome: string): string {
  const partes = nome.trim().split(/\s+/);
  if (partes.length === 0 || !partes[0]) return "?";
  if (partes.length === 1) return partes[0].slice(0, 2).toUpperCase();
  return `${partes[0][0]}${partes[partes.length - 1][0]}`.toUpperCase();
}

export default function PerfilPage() {
  const router = useRouter();
  const usuario = useAppStore((s) => s.usuario);
  const xp = useAppStore((s) => s.xp);
  const registrosTreino = useAppStore((s) => s.registrosTreino);
  const planoAssinatura = useAppStore((s) => s.planoAssinatura);
  const logout = useAppStore((s) => s.logout);

  const nivel = calcularNivel(xp);
  const streak = calcularStreak(registrosTreino);
  const objetivoLabel = OBJETIVOS.find((o) => o.id === usuario?.objetivo)?.label ?? "—";
  const nivelLabel = usuario?.nivel ? NIVEL_LABELS[usuario.nivel] : "—";
  const planoAtualNome = PLANOS_ASSINATURA.find((p) => p.id === planoAssinatura)?.nome ?? "Free";

  function handleSair() {
    logout();
    router.push("/");
  }

  return (
    <div className="flex flex-col gap-4 px-4 py-4">
      <TopBar title="Perfil" />

      <Card className="flex flex-col items-center gap-3 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-full gradient-primary font-display text-xl font-bold text-background">
          {getIniciais(usuario?.nome ?? "?")}
        </div>
        <div>
          <p className="font-display text-lg font-bold text-text">{usuario?.nome ?? "Usuário"}</p>
          <p className="text-sm text-text-muted">{usuario?.email ?? "—"}</p>
        </div>
        <div className="flex flex-wrap justify-center gap-2">
          <Badge variant="default">{objetivoLabel}</Badge>
          <Badge variant="secondary">{nivelLabel}</Badge>
        </div>
      </Card>

      <Card>
        <div className="grid grid-cols-3 gap-2 text-center">
          <div className="flex flex-col gap-1">
            <p className="font-display text-xl font-extrabold text-text">{registrosTreino.length}</p>
            <p className="text-xs text-text-muted">Treinos</p>
          </div>
          <div className="flex flex-col gap-1">
            <p className="font-display text-xl font-extrabold text-text">{streak}</p>
            <p className="text-xs text-text-muted">Sequência (dias)</p>
          </div>
          <div className="flex flex-col gap-1">
            <p className="font-display text-xl font-extrabold text-text">{nivel.nivel}</p>
            <p className="text-xs text-text-muted">Nível</p>
          </div>
        </div>
      </Card>

      <div className="flex flex-col gap-2">
        <Link
          href="/aluno/conquistas"
          className="flex items-center justify-between rounded-2xl border border-border bg-card p-4 transition-colors hover:bg-card-hover"
        >
          <div className="flex items-center gap-3">
            <Trophy className="h-5 w-5 text-primary" />
            <span className="text-sm font-medium text-text">Conquistas</span>
          </div>
          <ChevronRight className="h-5 w-5 text-text-muted" />
        </Link>

        <Link
          href="/aluno/coach"
          className="flex items-center justify-between rounded-2xl border border-border bg-card p-4 transition-colors hover:bg-card-hover"
        >
          <div className="flex items-center gap-3">
            <Sparkles className="h-5 w-5 text-primary" />
            <span className="text-sm font-medium text-text">AI Coach</span>
          </div>
          <ChevronRight className="h-5 w-5 text-text-muted" />
        </Link>

        <Link
          href="/aluno/planos"
          className="flex items-center justify-between rounded-2xl border border-border bg-card p-4 transition-colors hover:bg-card-hover"
        >
          <div className="flex items-center gap-3">
            <CreditCard className="h-5 w-5 text-primary" />
            <span className="text-sm font-medium text-text">Planos & Assinatura</span>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="default">{planoAtualNome}</Badge>
            <ChevronRight className="h-5 w-5 text-text-muted" />
          </div>
        </Link>

        <Link
          href="/onboarding/preferencias"
          className="flex items-center justify-between rounded-2xl border border-border bg-card p-4 transition-colors hover:bg-card-hover"
        >
          <div className="flex items-center gap-3">
            <Settings className="h-5 w-5 text-primary" />
            <span className="text-sm font-medium text-text">Editar preferências de treino</span>
          </div>
          <ChevronRight className="h-5 w-5 text-text-muted" />
        </Link>
      </div>

      <Button variant="outline" className="w-full" size="lg" onClick={handleSair}>
        <LogOut className="h-4 w-4" />
        Sair
      </Button>
    </div>
  );
}
