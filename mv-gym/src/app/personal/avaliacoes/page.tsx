"use client";

import Link from "next/link";
import { TopBar } from "@/components/layout/top-bar";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ALUNOS_PERSONAL, type AlunoDetalhe } from "@/lib/data/mock-personal";
import { OBJETIVOS } from "@/lib/data/options";

function urgenciaAvaliacao(proximaAvaliacao: string): number {
  if (proximaAvaliacao === "atrasada") return -1;
  const match = proximaAvaliacao.match(/\d+/);
  return match ? Number(match[0]) : Number.MAX_SAFE_INTEGER;
}

function ordenarPorUrgencia(alunos: AlunoDetalhe[]): AlunoDetalhe[] {
  return [...alunos].sort(
    (a, b) => urgenciaAvaliacao(a.proximaAvaliacao) - urgenciaAvaliacao(b.proximaAvaliacao),
  );
}

function capitalizar(texto: string): string {
  return texto.charAt(0).toUpperCase() + texto.slice(1);
}

export default function AvaliacoesPage() {
  const alunosOrdenados = ordenarPorUrgencia(ALUNOS_PERSONAL);

  return (
    <>
      <TopBar title="Avaliações" subtitle="Próximas avaliações dos alunos" />

      <div className="flex flex-col gap-3 px-4 py-4">
        {alunosOrdenados.map((aluno) => {
          const objetivoLabel = OBJETIVOS.find((o) => o.id === aluno.objetivo)?.label ?? aluno.objetivo;
          const urgencia = urgenciaAvaliacao(aluno.proximaAvaliacao);
          const isAtrasada = aluno.proximaAvaliacao === "atrasada";
          const variant = isAtrasada ? "danger" : urgencia <= 5 ? "warning" : "secondary";

          return (
            <Link key={aluno.id} href={`/personal/alunos/${aluno.id}`}>
              <Card className="flex items-center justify-between gap-3 transition-colors hover:bg-card-hover">
                <div className="min-w-0">
                  <p className="truncate font-display text-sm font-semibold text-text">
                    {aluno.nome}
                  </p>
                  <p className="text-xs text-text-muted">{objetivoLabel}</p>
                </div>
                <Badge variant={variant}>
                  {isAtrasada ? "Atrasada" : capitalizar(aluno.proximaAvaliacao)}
                </Badge>
              </Card>
            </Link>
          );
        })}
      </div>
    </>
  );
}
