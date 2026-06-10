"use client";

import { useRouter } from "next/navigation";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
} from "recharts";
import { LogOut } from "lucide-react";
import { TopBar } from "@/components/layout/top-bar";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useAppStore } from "@/lib/store/useAppStore";
import { METRICAS_ADMIN } from "@/lib/data/mock-admin";
import { getPlanoById } from "@/lib/data/plans";

export default function AdminDashboardPage() {
  const router = useRouter();
  const logout = useAppStore((s) => s.logout);

  function handleLogout() {
    logout();
    router.push("/");
  }

  const mrrFormatado = METRICAS_ADMIN.mrr.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });

  return (
    <>
      <TopBar
        title="Painel Admin"
        subtitle="Visão geral da plataforma"
        right={
          <Button variant="ghost" size="icon" onClick={handleLogout} aria-label="Sair">
            <LogOut className="h-5 w-5" />
          </Button>
        }
      />

      <div className="flex flex-col gap-4 px-4 py-4">
        <div className="grid grid-cols-2 gap-3">
          <Card>
            <p className="text-xs text-text-muted">Total de usuários</p>
            <p className="font-display text-2xl font-extrabold text-text">
              {METRICAS_ADMIN.totalUsuarios}
            </p>
          </Card>
          <Card>
            <p className="text-xs text-text-muted">Alunos ativos</p>
            <p className="font-display text-2xl font-extrabold text-text">
              {METRICAS_ADMIN.alunosAtivos}
            </p>
          </Card>
          <Card>
            <p className="text-xs text-text-muted">MRR</p>
            <p className="font-display text-xl font-extrabold text-primary">{mrrFormatado}</p>
          </Card>
          <Card>
            <p className="text-xs text-text-muted">Novos assinantes (mês)</p>
            <p className="font-display text-2xl font-extrabold text-success">
              {METRICAS_ADMIN.novosAssinantesMes}
            </p>
          </Card>
          <Card className="col-span-2">
            <p className="text-xs text-text-muted">Churn</p>
            <p className="font-display text-2xl font-extrabold text-danger">
              {METRICAS_ADMIN.churnRatePct}%
            </p>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Receita mensal</CardTitle>
          </CardHeader>
          <div style={{ width: "100%", height: 220 }}>
            <ResponsiveContainer>
              <LineChart data={METRICAS_ADMIN.receitaMensal}>
                <CartesianGrid stroke="#1F2937" strokeDasharray="3 3" />
                <XAxis dataKey="mes" tick={{ fill: "#AAB3C5", fontSize: 11 }} />
                <YAxis tick={{ fill: "#AAB3C5", fontSize: 11 }} />
                <Tooltip
                  contentStyle={{
                    background: "#121923",
                    border: "1px solid #1F2937",
                    borderRadius: 12,
                    color: "#FFFFFF",
                  }}
                  formatter={(value) =>
                    Number(value).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })
                  }
                />
                <Line type="monotone" dataKey="receita" stroke="#C6FF00" strokeWidth={2} dot={{ r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Distribuição de planos</CardTitle>
          </CardHeader>
          <div className="flex flex-col gap-3">
            {METRICAS_ADMIN.distribuicaoPlanos.map((item) => {
              const nomePlano = getPlanoById(item.plano)?.nome ?? item.plano;
              return (
                <div key={item.plano} className="flex items-center justify-between">
                  <Badge variant="outline">{nomePlano}</Badge>
                  <span className="font-display text-sm font-bold text-text">
                    {item.quantidade}
                  </span>
                </div>
              );
            })}
          </div>
        </Card>
      </div>
    </>
  );
}
