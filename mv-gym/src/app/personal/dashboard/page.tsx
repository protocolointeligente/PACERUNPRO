"use client";

import Link from "next/link";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
} from "recharts";
import { TopBar } from "@/components/layout/top-bar";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ProgressBar } from "@/components/ui/progress-bar";
import { useAppStore } from "@/lib/store/useAppStore";
import { ALUNOS_PERSONAL, RESUMO_PERSONAL } from "@/lib/data/mock-personal";
import { OBJETIVOS } from "@/lib/data/options";

export default function PersonalDashboardPage() {
  const usuario = useAppStore((s) => s.usuario);

  const alunosAtencao = ALUNOS_PERSONAL.filter((a) => a.status !== "em_dia");

  const objetivosChartData = RESUMO_PERSONAL.objetivosDistribuicao.map((item) => ({
    label: OBJETIVOS.find((o) => o.id === item.objetivo)?.label ?? item.objetivo,
    quantidade: item.quantidade,
  }));

  const adesaoMediaPct = Math.round(RESUMO_PERSONAL.adesaoMedia * 100);

  return (
    <>
      <TopBar
        title={`Olá, ${usuario?.nome?.split(" ")[0] ?? "Personal"}`}
        subtitle="Painel do personal"
      />

      <div className="flex flex-col gap-4 px-4 py-4">
        <div className="grid grid-cols-2 gap-3">
          <Card>
            <p className="text-xs text-text-muted">Total de alunos</p>
            <p className="font-display text-2xl font-extrabold text-text">
              {RESUMO_PERSONAL.totalAlunos}
            </p>
          </Card>
          <Card>
            <p className="text-xs text-text-muted">Em dia</p>
            <p className="font-display text-2xl font-extrabold text-success">
              {RESUMO_PERSONAL.emDia}
            </p>
          </Card>
          <Card>
            <p className="text-xs text-text-muted">Atenção</p>
            <p className="font-display text-2xl font-extrabold text-warning">
              {RESUMO_PERSONAL.atencao}
            </p>
          </Card>
          <Card>
            <p className="text-xs text-text-muted">Inativos</p>
            <p className="font-display text-2xl font-extrabold text-danger">
              {RESUMO_PERSONAL.inativos}
            </p>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Adesão média</CardTitle>
            <span className="font-display text-lg font-bold text-primary">{adesaoMediaPct}%</span>
          </CardHeader>
          <ProgressBar value={adesaoMediaPct} />
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Distribuição por objetivo</CardTitle>
          </CardHeader>
          <div style={{ width: "100%", height: 220 }}>
            <ResponsiveContainer>
              <BarChart data={objetivosChartData}>
                <CartesianGrid stroke="#1F2937" strokeDasharray="3 3" />
                <XAxis
                  dataKey="label"
                  tick={{ fill: "#AAB3C5", fontSize: 10 }}
                  interval={0}
                  angle={-30}
                  textAnchor="end"
                  height={50}
                />
                <YAxis tick={{ fill: "#AAB3C5", fontSize: 11 }} allowDecimals={false} />
                <Tooltip
                  contentStyle={{
                    background: "#121923",
                    border: "1px solid #1F2937",
                    borderRadius: 12,
                    color: "#FFFFFF",
                  }}
                />
                <Bar dataKey="quantidade" fill="#C6FF00" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <div>
          <h2 className="mb-3 font-display text-base font-semibold text-text">
            Alunos que precisam de atenção
          </h2>

          {alunosAtencao.length === 0 ? (
            <Card>
              <p className="text-sm text-text-muted">
                Nenhum aluno precisa de atenção no momento. Tudo em dia!
              </p>
            </Card>
          ) : (
            <div className="flex flex-col gap-3">
              {alunosAtencao.map((aluno) => (
                <Link key={aluno.id} href={`/personal/alunos/${aluno.id}`}>
                  <Card className="transition-colors hover:bg-card-hover">
                    <div className="mb-2 flex items-center justify-between">
                      <p className="font-display text-sm font-semibold text-text">{aluno.nome}</p>
                      <Badge variant={aluno.status === "atencao" ? "warning" : "danger"}>
                        {aluno.status === "atencao" ? "Atenção" : "Inativo"}
                      </Badge>
                    </div>
                    <p className="mb-2 text-xs text-text-muted">
                      Último treino: {aluno.ultimoTreino}
                    </p>
                    <div className="flex items-center gap-2">
                      <ProgressBar value={Math.round(aluno.adesao * 100)} className="flex-1" />
                      <span className="text-xs font-medium text-text-muted">
                        {Math.round(aluno.adesao * 100)}%
                      </span>
                    </div>
                  </Card>
                </Link>
              ))}
            </div>
          )}
        </div>

        <div className="flex flex-col gap-2">
          <Link href="/personal/alunos" className="block">
            <Button variant="secondary" className="w-full">
              Ver todos os alunos
            </Button>
          </Link>
          <Link href="/personal/avaliacoes" className="block">
            <Button variant="outline" className="w-full">
              Ver avaliações
            </Button>
          </Link>
        </div>
      </div>
    </>
  );
}
