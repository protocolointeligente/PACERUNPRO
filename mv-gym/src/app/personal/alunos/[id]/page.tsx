"use client";

import { use } from "react";
import Link from "next/link";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
} from "recharts";
import { CheckCircle2, XCircle } from "lucide-react";
import { TopBar } from "@/components/layout/top-bar";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { getAlunoById } from "@/lib/data/mock-personal";
import { OBJETIVOS } from "@/lib/data/options";

function getIniciais(nome: string): string {
  return nome
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join("");
}

const STATUS_BADGE: Record<string, { label: string; variant: "success" | "warning" | "danger" }> = {
  em_dia: { label: "Em dia", variant: "success" },
  atencao: { label: "Atenção", variant: "warning" },
  inativo: { label: "Inativo", variant: "danger" },
};

export default function AlunoDetalhePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const aluno = getAlunoById(id);

  if (!aluno) {
    return (
      <>
        <TopBar showBack title="Aluno não encontrado" />
        <div className="flex flex-col gap-4 px-4 py-4">
          <Card>
            <p className="mb-3 text-sm text-text-muted">
              Não encontramos esse aluno na sua lista.
            </p>
            <Link href="/personal/alunos" className="text-sm font-medium text-primary">
              Voltar para meus alunos
            </Link>
          </Card>
        </div>
      </>
    );
  }

  const objetivoLabel = OBJETIVOS.find((o) => o.id === aluno.objetivo)?.label ?? aluno.objetivo;
  const statusBadge = STATUS_BADGE[aluno.status];
  const avaliacaoAtrasada = aluno.proximaAvaliacao === "atrasada";

  return (
    <>
      <TopBar showBack title={aluno.nome} subtitle={aluno.email} />

      <div className="flex flex-col gap-4 px-4 py-4">
        <Card className="flex flex-col items-center gap-3 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full gradient-primary font-display text-xl font-bold text-background">
            {getIniciais(aluno.nome)}
          </div>
          <div>
            <p className="font-display text-lg font-bold text-text">{aluno.nome}</p>
            <p className="text-sm text-text-muted">{aluno.idade} anos</p>
          </div>
          <div className="flex flex-wrap justify-center gap-2">
            <Badge variant="outline">{objetivoLabel}</Badge>
            <Badge variant={statusBadge.variant}>{statusBadge.label}</Badge>
          </div>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Plano atual</CardTitle>
          </CardHeader>
          <div className="flex flex-col gap-2 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-text-muted">Plano</span>
              <span className="font-medium text-text">{aluno.planoAtual}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-text-muted">Split</span>
              <span className="font-medium text-text">{aluno.split}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-text-muted">Peso atual / meta</span>
              <span className="font-medium text-text">
                {aluno.pesoKg} kg → {aluno.pesoMetaKg} kg
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-text-muted">Próxima avaliação</span>
              <Badge variant={avaliacaoAtrasada ? "danger" : "warning"}>
                {avaliacaoAtrasada ? "Atrasada" : aluno.proximaAvaliacao}
              </Badge>
            </div>
          </div>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Evolução de peso</CardTitle>
          </CardHeader>
          <div style={{ width: "100%", height: 220 }}>
            <ResponsiveContainer>
              <LineChart data={aluno.evolucaoPeso}>
                <CartesianGrid stroke="#1F2937" strokeDasharray="3 3" />
                <XAxis dataKey="data" tick={{ fill: "#AAB3C5", fontSize: 11 }} />
                <YAxis
                  tick={{ fill: "#AAB3C5", fontSize: 11 }}
                  domain={["dataMin - 2", "dataMax + 2"]}
                />
                <Tooltip
                  contentStyle={{
                    background: "#121923",
                    border: "1px solid #1F2937",
                    borderRadius: 12,
                    color: "#FFFFFF",
                  }}
                />
                <Line type="monotone" dataKey="pesoKg" stroke="#C6FF00" strokeWidth={2} dot={{ r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Histórico de treinos</CardTitle>
          </CardHeader>
          <div className="flex flex-col gap-3">
            {aluno.historicoTreinos.map((treino, idx) => (
              <div key={idx} className="flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-text">{treino.nome}</p>
                  <p className="text-xs text-text-muted">{treino.data}</p>
                </div>
                {treino.concluido ? (
                  <CheckCircle2 className="h-5 w-5 shrink-0 text-success" />
                ) : (
                  <XCircle className="h-5 w-5 shrink-0 text-text-muted" />
                )}
              </div>
            ))}
          </div>
        </Card>
      </div>
    </>
  );
}
