"use client";

import { adminOverview, adminRecentSubscriptions, adminCoaches } from "@/lib/mock-data";
import { BarTrend } from "@/components/charts/trend-chart";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

const mrrSeriesForChart = adminOverview.mrrSeries.map((d) => ({ label: d.month, mrr: d.mrr }));

const actionConfig: Record<string, { label: string; variant: "success" | "info" | "danger" }> = {
  novo: { label: "Novo", variant: "success" },
  upgrade: { label: "Upgrade", variant: "info" },
  cancelamento: { label: "Cancelamento", variant: "danger" },
};

function formatCurrency(value: number) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 }).format(value);
}

export default function AdminDashboardPage() {
  return (
    <div className="mx-auto max-w-7xl space-y-8 px-4 py-8 sm:px-6">
      {/* Header */}
      <div className="space-y-1">
        <Badge variant="primary" className="mb-2">Painel Administrativo</Badge>
        <h1 className="font-display text-2xl font-bold text-text sm:text-3xl">
          Visão geral da plataforma
        </h1>
        <p className="text-sm text-text-muted">
          Métricas consolidadas de receita, crescimento e saúde da base de treinadores.
        </p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
        {[
          { label: "MRR", value: formatCurrency(adminOverview.mrr), sub: "Receita recorrente mensal", color: "text-primary" },
          { label: "Crescimento MRR", value: `+${(adminOverview.mrrGrowth * 100).toFixed(1)}%`, sub: "Últimos 30 dias", color: "text-success" },
          { label: "Treinadores", value: String(adminOverview.totalCoaches), sub: "Total na plataforma", color: "text-info" },
          { label: "Atletas", value: adminOverview.totalAthletes.toLocaleString("pt-BR"), sub: "Total na plataforma", color: "text-warning" },
          { label: "Churn rate", value: `${(adminOverview.churnRate * 100).toFixed(1)}%`, sub: "Últimos 30 dias", color: "text-danger" },
        ].map((stat) => (
          <Card key={stat.label}>
            <CardContent className="p-5">
              <p className="text-xs text-text-muted">{stat.label}</p>
              <p className={cn("mt-1 font-display text-2xl font-bold", stat.color)}>{stat.value}</p>
              <p className="mt-0.5 text-xs text-text-muted">{stat.sub}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Charts + revenue by plan */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <CardContent className="p-5">
            <h2 className="mb-4 font-display text-base font-semibold text-text">MRR mensal (R$)</h2>
            <BarTrend data={mrrSeriesForChart} dataKey="mrr" color="#8b5cf6" />
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5">
            <h2 className="mb-4 font-display text-base font-semibold text-text">Distribuição por plano</h2>
            <div className="space-y-4">
              {adminOverview.revenueByPlan.map((item) => (
                <div key={item.plan} className="rounded-xl border border-border bg-card-hover p-4">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-text">{item.plan}</span>
                    <Badge variant="primary">{formatCurrency(item.revenue)}/mês</Badge>
                  </div>
                  <div className="mt-2 flex items-center gap-2">
                    <span className="text-sm text-text-muted">{item.count} treinadores</span>
                    <span className="text-xs text-text-muted">·</span>
                    <span className="text-sm text-text-muted">
                      {formatCurrency(Math.round(item.revenue / item.count))}/treinador
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent activity */}
      <Card>
        <CardContent className="p-5">
          <h2 className="mb-5 font-display text-base font-semibold text-text">Atividade recente</h2>
          <div className="space-y-3">
            {adminRecentSubscriptions.map((sub) => {
              const cfg = actionConfig[sub.action] ?? { label: sub.action, variant: "default" as const };
              return (
                <div key={sub.id} className="flex items-center justify-between rounded-xl border border-border bg-card-hover p-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full gradient-primary font-display text-xs font-bold text-white">
                      {sub.coachName.slice(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-text">{sub.coachName}</p>
                      <p className="text-xs text-text-muted">Plano {sub.plan} · {sub.date}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge variant={cfg.variant}>{cfg.label}</Badge>
                    <span className={cn("text-sm font-semibold", sub.mrr > 0 ? "text-success" : "text-danger")}>
                      {sub.mrr > 0 ? "+" : ""}R$ {Math.abs(sub.mrr)}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Top coaches */}
      <Card>
        <CardContent className="p-5">
          <h2 className="mb-5 font-display text-base font-semibold text-text">Top treinadores</h2>
          <div className="space-y-3">
            {adminCoaches.slice(0, 4).map((coach) => (
              <div key={coach.id} className="flex items-center gap-3 rounded-xl border border-border bg-card-hover p-4">
                <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full gradient-primary font-display text-xs font-bold text-white">
                  {coach.name.split(" ").map((n) => n[0]).slice(0, 2).join("")}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-text truncate">{coach.name}</p>
                  <p className="text-xs text-text-muted">{coach.credential}</p>
                </div>
                <div className="flex items-center gap-3 flex-shrink-0">
                  <Badge
                    variant={coach.plan === "Pro" ? "primary" : coach.plan === "Assessoria" ? "warning" : "outline"}
                  >
                    {coach.plan}
                  </Badge>
                  <span className="text-sm text-text-muted">{coach.athletes} atletas</span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
