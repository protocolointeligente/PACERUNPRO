"use client";

import { useState } from "react";
import Link from "next/link";
import { Flame } from "lucide-react";
import { TopBar } from "@/components/layout/top-bar";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Chip } from "@/components/ui/chip";
import { ProgressBar } from "@/components/ui/progress-bar";
import { ALUNOS_PERSONAL } from "@/lib/data/mock-personal";
import { OBJETIVOS } from "@/lib/data/options";
import type { AlunoResumo } from "@/lib/types";

type StatusFiltro = "todos" | AlunoResumo["status"];

const FILTROS: { id: StatusFiltro; label: string }[] = [
  { id: "todos", label: "Todos" },
  { id: "em_dia", label: "Em dia" },
  { id: "atencao", label: "Atenção" },
  { id: "inativo", label: "Inativos" },
];

const STATUS_BADGE: Record<AlunoResumo["status"], { label: string; variant: "success" | "warning" | "danger" }> = {
  em_dia: { label: "Em dia", variant: "success" },
  atencao: { label: "Atenção", variant: "warning" },
  inativo: { label: "Inativo", variant: "danger" },
};

function getIniciais(nome: string): string {
  return nome
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join("");
}

export default function PersonalAlunosPage() {
  const [filtro, setFiltro] = useState<StatusFiltro>("todos");

  const alunosFiltrados =
    filtro === "todos" ? ALUNOS_PERSONAL : ALUNOS_PERSONAL.filter((a) => a.status === filtro);

  return (
    <>
      <TopBar title="Meus alunos" subtitle={`${ALUNOS_PERSONAL.length} alunos no total`} />

      <div className="flex flex-col gap-4 px-4 py-4">
        <div className="flex flex-wrap gap-2">
          {FILTROS.map((f) => (
            <Chip key={f.id} selected={filtro === f.id} onClick={() => setFiltro(f.id)}>
              {f.label}
            </Chip>
          ))}
        </div>

        <div className="flex flex-col gap-3">
          {alunosFiltrados.map((aluno) => {
            const objetivoLabel = OBJETIVOS.find((o) => o.id === aluno.objetivo)?.label ?? aluno.objetivo;
            const statusBadge = STATUS_BADGE[aluno.status];
            const adesaoPct = Math.round(aluno.adesao * 100);

            return (
              <Link key={aluno.id} href={`/personal/alunos/${aluno.id}`}>
                <Card className="transition-colors hover:bg-card-hover">
                  <div className="flex items-start gap-3">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-primary/15 font-display text-sm font-bold text-primary">
                      {getIniciais(aluno.nome)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="mb-1 flex items-center justify-between gap-2">
                        <p className="truncate font-display text-sm font-semibold text-text">
                          {aluno.nome}
                        </p>
                        <Badge variant={statusBadge.variant}>{statusBadge.label}</Badge>
                      </div>
                      <div className="mb-2 flex flex-wrap items-center gap-2">
                        <Badge variant="outline">{objetivoLabel}</Badge>
                        {aluno.sequenciaDias > 0 && (
                          <span className="inline-flex items-center gap-1 text-xs text-text-muted">
                            <Flame className="h-3.5 w-3.5 text-warning" />
                            {aluno.sequenciaDias} dias
                          </span>
                        )}
                      </div>
                      <p className="mb-2 text-xs text-text-muted">
                        Último treino: {aluno.ultimoTreino}
                      </p>
                      <div className="flex items-center gap-2">
                        <ProgressBar value={adesaoPct} className="flex-1" />
                        <span className="text-xs font-medium text-text-muted">{adesaoPct}%</span>
                      </div>
                    </div>
                  </div>
                </Card>
              </Link>
            );
          })}
        </div>
      </div>
    </>
  );
}
