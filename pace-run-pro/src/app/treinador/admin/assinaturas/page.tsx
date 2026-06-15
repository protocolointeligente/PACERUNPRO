"use client";

import { adminOverview, adminRecentSubscriptions } from "@/lib/mock-data";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

const actionConfig: Record<
  string,
  { label: string; variant: "success" | "info" | "danger" }
> = {
  novo: { label: "Novo", variant: "success" },
  upgrade: { label: "Upgrade", variant: "info" },
  cancelamento: { label: "Cancelamento", variant: "danger" },
};

function formatCurrency(value: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    maximumFractionDigits: 0,
  }).format(value);
}

const totalRevenue = adminOverview.revenueByPlan.reduce(
  (sum, p) => sum + p.revenue,
  0
);

export default function AdminAssinaturasPage() {
  return (
    <div className="mx-auto max-w-7xl space-y-8 px-4 py-8 sm:px-6">
      {/* Header */}
      <div className="space-y-1">
        <Badge variant="primary" className="mb-2">
          Painel Administrativo
        </Badge>
        <h1 className="font-display text-2xl font-bold text-text sm:text-3xl">
          Assinaturas
        </h1>
        <p className="text-sm text-text-muted">
          Visão consolidada de assinaturas ativas, receita e churn.
        </p>
      </div>

      {/* Overview cards */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {[
          {
            label: "Assinaturas ativas",
            value: adminOverview.activeSubscriptions.toLocaleString("pt-BR"),
            color: "text-primary",
          },
          {
            label: "MRR",
            value: formatCurrency(adminOverview.mrr),
            color: "text-success",
          },
          {
            label: "Churn rate",
            value: `${(adminOverview.churnRate * 100).toFixed(1)}%`,
            color: "text-danger",
          },
          {
            label: "Atletas por treinador",
            value: adminOverview.avgAthletesPerCoach.toFixed(1),
            color: "text-info",
          },
        ].map((stat) => (
          <Card key={stat.label}>
            <CardContent className="p-5">
              <p className="text-xs text-text-muted">{stat.label}</p>
              <p className={cn("mt-1 font-display text-2xl font-bold", stat.color)}>
                {stat.value}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Plan distribution */}
      <Card>
        <CardContent className="p-5">
          <h2 className="mb-5 font-display text-base font-semibold text-text">
            Distribuição por plano
          </h2>

          {/* Table header */}
          <div className="mb-3 hidden grid-cols-[1.5fr_1fr_1fr_2fr] gap-4 text-xs font-semibold uppercase tracking-wider text-text-muted sm:grid">
            <span>Plano</span>
            <span>Treinadores</span>
            <span>Receita</span>
            <span>% do total</span>
          </div>

          <div className="divide-y divide-border">
            {adminOverview.revenueByPlan.map((item) => {
              const pct = totalRevenue > 0 ? (item.revenue / totalRevenue) * 100 : 0;
              return (
                <div
                  key={item.plan}
                  className="flex flex-col gap-3 py-4 sm:grid sm:grid-cols-[1.5fr_1fr_1fr_2fr] sm:items-center sm:gap-4"
                >
                  <span className="font-semibold text-text">{item.plan}</span>
                  <span className="text-sm text-text-muted">
                    {item.count} treinadores
                  </span>
                  <span className="text-sm font-semibold text-success">
                    {formatCurrency(item.revenue)}
                  </span>
                  <div className="flex items-center gap-3">
                    <Progress
                      value={pct}
                      colorClassName="gradient-primary"
                      className="flex-1"
                    />
                    <span className="w-10 flex-shrink-0 text-right text-xs text-text-muted">
                      {pct.toFixed(0)}%
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mt-4 flex items-center justify-between border-t border-border pt-4">
            <span className="text-sm font-semibold text-text">Total</span>
            <span className="text-sm font-bold text-success">
              {formatCurrency(totalRevenue)}
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Recent subscriptions */}
      <Card>
        <CardContent className="p-5">
          <h2 className="mb-5 font-display text-base font-semibold text-text">
            Atividade recente
          </h2>
          <div className="space-y-3">
            {adminRecentSubscriptions.map((sub) => {
              const cfg = actionConfig[sub.action] ?? {
                label: sub.action,
                variant: "default" as const,
              };
              return (
                <div
                  key={sub.id}
                  className="flex items-center justify-between rounded-xl border border-border bg-card-hover p-4"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full gradient-primary font-display text-xs font-bold text-white">
                      {sub.coachName.slice(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-text">
                        {sub.coachName}
                      </p>
                      <p className="text-xs text-text-muted">
                        Plano {sub.plan}
                        {sub.from ? ` (antes: ${sub.from})` : ""} · {sub.date}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge variant={cfg.variant}>{cfg.label}</Badge>
                    <span
                      className={cn(
                        "text-sm font-semibold",
                        sub.mrr > 0 ? "text-success" : "text-danger"
                      )}
                    >
                      {sub.mrr > 0 ? "+" : ""}R$ {Math.abs(sub.mrr)}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
