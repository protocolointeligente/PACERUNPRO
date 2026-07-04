"use client";

import { useState, useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { useCoachRole } from "@/context/coach-role-context";
import { canAccess } from "@/lib/coach-permissions";
import { AccessRestricted } from "@/components/shared/access-restricted";

type RecentActivity = {
  id: string;
  name: string;
  plan: string;
  action: "novo" | "upgrade" | "cancelamento";
  date: string;
  mrr: number;
};

type CoachPlanItem = {
  id: string;
  name: string;
  priceCents: number;
  period: string;
};

type AdminOverview = {
  mrr: number;
  mrrGrowth: number;
  totalCoaches: number;
  totalAthletes: number;
  activeAthletes: number;
  churnRate: number;
  recentActivity: RecentActivity[];
  plans: CoachPlanItem[];
};

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

export default function AdminAssinaturasPage() {
  const { role, planId } = useCoachRole();
  const [data, setData] = useState<AdminOverview | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/coach/admin-overview")
      .then((r) => r.json())
      .then((json: AdminOverview) => {
        setData(json);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  if (!canAccess(role, "admin", planId)) {
    return (
      <AccessRestricted
        feature="Admin — Assinaturas"
        currentRole={role}
        requiredRoles={["owner"]}
      />
    );
  }

  if (loading || !data) {
    return (
      <div className="flex min-h-[300px] items-center justify-center text-sm text-text-muted">
        Carregando...
      </div>
    );
  }

  const avgAthletesPerCoach =
    data.totalCoaches > 0 ? data.activeAthletes / data.totalCoaches : 0;

  // Use plan prices to build a relative distribution
  const totalPlanPrices = data.plans.reduce(
    (sum, p) => sum + Math.round(p.priceCents / 100),
    0
  );

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
            value: data.activeAthletes.toLocaleString("pt-BR"),
            color: "text-primary",
          },
          {
            label: "MRR",
            value: formatCurrency(data.mrr),
            color: "text-success",
          },
          {
            label: "Churn rate",
            value: `${(data.churnRate * 100).toFixed(1)}%`,
            color: "text-danger",
          },
          {
            label: "Atletas por treinador",
            value: avgAthletesPerCoach.toFixed(1),
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

          {data.plans.length === 0 ? (
            <p className="text-sm text-text-muted">Nenhum plano cadastrado.</p>
          ) : (
            <>
              {/* Table header */}
              <div className="mb-3 hidden grid-cols-[1.5fr_1fr_1fr_2fr] gap-4 text-xs font-semibold uppercase tracking-wider text-text-muted sm:grid">
                <span>Plano</span>
                <span>Período</span>
                <span>Valor</span>
                <span>% do total</span>
              </div>

              <div className="divide-y divide-border">
                {data.plans.map((item) => {
                  const price = Math.round(item.priceCents / 100);
                  const pct =
                    totalPlanPrices > 0 ? (price / totalPlanPrices) * 100 : 0;
                  return (
                    <div
                      key={item.id}
                      className="flex flex-col gap-3 py-4 sm:grid sm:grid-cols-[1.5fr_1fr_1fr_2fr] sm:items-center sm:gap-4"
                    >
                      <span className="font-semibold text-text">{item.name}</span>
                      <span className="text-sm capitalize text-text-muted">
                        {item.period}
                      </span>
                      <span className="text-sm font-semibold text-success">
                        {formatCurrency(price)}
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
                <span className="text-sm font-semibold text-text">MRR estimado</span>
                <span className="text-sm font-bold text-success">
                  {formatCurrency(data.mrr)}
                </span>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Recent activity */}
      <Card>
        <CardContent className="p-5">
          <h2 className="mb-5 font-display text-base font-semibold text-text">
            Atividade recente
          </h2>
          {data.recentActivity.length === 0 ? (
            <p className="text-sm text-text-muted">Nenhuma atividade recente.</p>
          ) : (
            <div className="space-y-3">
              {data.recentActivity.map((item) => {
                const cfg = actionConfig[item.action] ?? {
                  label: item.action,
                  variant: "default" as const,
                };
                return (
                  <div
                    key={item.id}
                    className="flex flex-wrap items-center justify-between gap-y-2 rounded-xl border border-border bg-card-hover p-4"
                  >
                    <div className="flex min-w-0 flex-1 items-center gap-3">
                      <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full gradient-primary font-display text-xs font-bold text-white">
                        {item.name.slice(0, 2).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-text">
                          {item.name}
                        </p>
                        <p className="truncate text-xs text-text-muted">
                          Plano {item.plan} · {item.date}
                        </p>
                      </div>
                    </div>
                    <div className="flex shrink-0 items-center gap-3">
                      <Badge variant={cfg.variant}>{cfg.label}</Badge>
                      <span
                        className={cn(
                          "text-sm font-semibold",
                          item.mrr > 0 ? "text-success" : "text-danger"
                        )}
                      >
                        {item.mrr > 0 ? "+" : ""}R$ {Math.abs(item.mrr)}
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
