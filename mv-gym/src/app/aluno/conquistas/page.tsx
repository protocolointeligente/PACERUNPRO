"use client";

import { Lock } from "lucide-react";
import { Card } from "@/components/ui/card";
import { ProgressBar } from "@/components/ui/progress-bar";
import { DynamicIcon } from "@/components/ui/dynamic-icon";
import { TopBar } from "@/components/layout/top-bar";
import { useAppStore } from "@/lib/store/useAppStore";
import { CONQUISTAS } from "@/lib/data/achievements";
import { calcularNivel } from "@/lib/gamification";
import { formatDate, cn } from "@/lib/utils";

export default function ConquistasPage() {
  const xp = useAppStore((s) => s.xp);
  const conquistasDesbloqueadas = useAppStore((s) => s.conquistasDesbloqueadas);

  const nivel = calcularNivel(xp);
  const totalDesbloqueadas = Object.keys(conquistasDesbloqueadas).length;

  return (
    <div className="flex flex-col gap-4 px-4 py-4">
      <TopBar title="Conquistas" showBack />

      <Card>
        <p className="font-display text-lg font-bold text-text">
          Nível {nivel.nivel} · {nivel.titulo}
        </p>
        <div className="mt-3">
          <ProgressBar value={nivel.progresso * 100} />
        </div>
        <p className="mt-2 text-xs text-text-muted">
          {nivel.xpAtual} / {nivel.xpProximoNivel} XP para o próximo nível
        </p>
      </Card>

      <p className="text-sm text-text-muted">
        {totalDesbloqueadas} de {CONQUISTAS.length} conquistas desbloqueadas
      </p>

      <div className="grid grid-cols-2 gap-3">
        {CONQUISTAS.map((conquista) => {
          const desbloqueadaEm = conquistasDesbloqueadas[conquista.id];
          const desbloqueada = !!desbloqueadaEm;

          return (
            <Card
              key={conquista.id}
              className={cn("relative flex flex-col gap-2", !desbloqueada && "opacity-60")}
            >
              {!desbloqueada && (
                <Lock className="absolute right-3 top-3 h-4 w-4 text-text-muted" />
              )}
              <div
                className={cn(
                  "flex h-12 w-12 items-center justify-center rounded-full",
                  desbloqueada ? "bg-primary/15 text-primary" : "bg-card-hover text-text-muted",
                )}
              >
                <DynamicIcon name={conquista.icone} className="h-6 w-6" />
              </div>
              <p className="font-semibold text-text">{conquista.titulo}</p>
              <p className="text-xs text-text-muted">{conquista.descricao}</p>
              {desbloqueada ? (
                <p className="text-xs text-text-muted">
                  Desbloqueada em {formatDate(desbloqueadaEm)}
                </p>
              ) : (
                <p className="text-xs text-text-muted">Bloqueada</p>
              )}
            </Card>
          );
        })}
      </div>
    </div>
  );
}
