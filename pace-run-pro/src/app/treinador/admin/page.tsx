"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { BarTrend } from "@/components/charts/trend-chart";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { useCoachRole } from "@/context/coach-role-context";
import { canAccess } from "@/lib/coach-permissions";
import { AccessRestricted } from "@/components/shared/access-restricted";

const actionConfig: Record<string, { label: string; variant: "success" | "info" | "danger" }> = {
  novo: { label: "Novo", variant: "success" },
  upgrade: { label: "Upgrade", variant: "info" },
  cancelamento: { label: "Cancelamento", variant: "danger" },
};

function formatCurrency(value: number) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 }).format(value);
}

interface OverviewData {
  mrr: number;
  mrrGrowth: number;
  totalCoaches: number;
  totalAthletes: number;
  activeAthletes: number;
  churnRate: number;
  recentActivity: { id: string; name: string; plan: string; action: string; date: string; mrr: number }[];
  plans: { id: string; name: string; priceCents: number; period: string }[];
}

export default function AdminDashboardPage() {
  const { role, planId } = useCoachRole();
  const [data, setData] = useState<OverviewData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/coach/admin-overview")
      .then((r) => r.ok ? r.json() : null)
      .then((d) => { if (d) setData(d); })
      .catch(() => null)
      .finally(() => setLoading(false));
  }, []);

  if (!canAccess(role, "admin", planId)) {
    return <AccessRestricted feature="Admin" currentRole={role} requiredRoles={["owner"]} />;
  }

  const mrrSeriesForChart: { label: string; mrr: number }[] = [];

  const stats = [
    { label: "MRR", value: loading ? "…" : formatCurrency(data?.mrr ?? 0), sub: "Receita recorrente estimada", color: "text-primary" },
    { label: "Crescimento", value: loading ? "…" : `+${((data?.mrrGrowth ?? 0) * 100).toFixed(1)}%`, sub: "Últimos 30 dias", color: "text-success" },
    { label: "Treinadores", value: loading ? "…" : String(data?.totalCoaches ?? 1), sub: "Na assessoria", color: "text-info" },
    { label: "Atletas", value: loading ? "…" : (data?.totalAthletes ?? 0).toLocaleString("pt-BR"), sub: `${data?.activeAthletes ?? 0} ativos`, color: "text-warning" },
    { label: "Churn rate", value: loading ? "…" : `${(((data?.churnRate ?? 0)) * 100).toFixed(1)}%`, sub: "Inativos / total", color: "text-danger" },
  ];

  const planRows = (data?.plans ?? []).map((p) => ({
    plan: p.name,
    count: Math.round((data?.activeAthletes ?? 0) / Math.max(1, data?.plans.length ?? 1)),
    revenue: Math.round((p.priceCents / 100) * Math.round((data?.activeAthletes ?? 0) / Math.max(1, data?.plans.length ?? 1))),
  }));

  return (
    <div className="mx-auto max-w-7xl space-y-8 px-4 py-8 sm:px-6">
      <div className="space-y-1">
        <Badge variant="primary" className="mb-2">Painel Administrativo</Badge>
        <h1 className="font-display text-2xl font-bold text-text sm:text-3xl">Visão geral da assessoria</h1>
        <p className="text-sm text-text-muted">Métricas consolidadas de receita, atletas e saúde do negócio.</p>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
        {stats.map((stat) => (
          <Card key={stat.label}>
            <CardContent className="p-5">
              <p className="text-xs text-text-muted">{stat.label}</p>
              <p className={cn("mt-1 font-display text-2xl font-bold", stat.color)}>{stat.value}</p>
              <p className="mt-0.5 text-xs text-text-muted">{stat.sub}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <CardContent className="p-5">
            <h2 className="mb-4 font-display text-base font-semibold text-text">MRR mensal (R$)</h2>
            {mrrSeriesForChart.length === 0 ? (
              <p className="py-8 text-center text-sm text-text-muted">Sem dados históricos ainda.</p>
            ) : (
              <BarTrend data={mrrSeriesForChart} dataKey="mrr" color="#C6F24E" />
            )}
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5">
            <h2 className="mb-4 font-display text-base font-semibold text-text">Distribuição por plano</h2>
            {planRows.length === 0 ? (
              <p className="py-8 text-center text-sm text-text-muted">
                Nenhum plano de venda configurado ainda.{" "}
                <Link href="/treinador/planos-venda" className="text-primary hover:underline">Criar planos →</Link>
              </p>
            ) : (
              <div className="space-y-4">
                {planRows.map((item) => (
                  <div key={item.plan} className="rounded-xl border border-border bg-card-hover p-4">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-text">{item.plan}</span>
                      <Badge variant="primary">{formatCurrency(item.revenue)}/mês</Badge>
                    </div>
                    <div className="mt-2 flex items-center gap-2">
                      <span className="text-sm text-text-muted">~{item.count} atletas</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardContent className="p-5">
          <h2 className="mb-5 font-display text-base font-semibold text-text">Atividade recente</h2>
          {loading ? (
            <div className="flex justify-center py-8">
              <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
            </div>
          ) : (data?.recentActivity ?? []).length === 0 ? (
            <p className="py-6 text-center text-sm text-text-muted">
              Nenhum atleta ainda.{" "}
              <Link href="/treinador/atletas/convidar" className="text-primary hover:underline">Convidar atletas →</Link>
            </p>
          ) : (
            <div className="space-y-3">
              {(data?.recentActivity ?? []).map((sub) => {
                const cfg = actionConfig[sub.action] ?? { label: sub.action, variant: "outline" as const };
                return (
                  <div key={sub.id} className="flex flex-wrap items-center justify-between gap-y-2 rounded-xl border border-border bg-card-hover p-4">
                    <div className="flex min-w-0 flex-1 items-center gap-3">
                      <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full gradient-primary font-display text-xs font-bold text-white">
                        {sub.name.slice(0, 2).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-text">{sub.name}</p>
                        <p className="truncate text-xs text-text-muted">Plano {sub.plan} · {sub.date}</p>
                      </div>
                    </div>
                    <div className="flex shrink-0 items-center gap-3">
                      <Badge variant={cfg.variant}>{cfg.label}</Badge>
                      <span className={cn("text-sm font-semibold", sub.mrr > 0 ? "text-success" : "text-text-muted")}>
                        {sub.mrr > 0 ? `+R$ ${sub.mrr}` : "Gratuito"}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
