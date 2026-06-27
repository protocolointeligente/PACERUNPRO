"use client";

import { useEffect, useState } from "react";
import { ArrowDown, ArrowUp, BarChart2, DollarSign, Package, ShoppingBag, TrendingUp, Users } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { SkeletonCard } from "@/components/ui/skeleton";
import { BarTrend } from "@/components/charts/trend-chart";
import { cn } from "@/lib/utils";

interface RevenueData {
  totalCents: number;
  thisMonthCents: number;
  lastMonthCents: number;
  salesCount: number;
  byProduct: { productId: string; title: string; sport: string; count: number; totalCents: number }[];
  monthly: { label: string; totalCents: number }[];
  recent: { id: string; athleteName: string; productTitle: string; pricePaidCents: number; createdAt: string }[];
}

function fmtBRL(cents: number) {
  return (cents / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric" });
}

const SPORT_EMOJI: Record<string, string> = {
  CORRIDA: "🏃", CICLISMO: "🚴", NATACAO: "🏊", FORCA: "🏋️", GERAL: "⚡",
};

function StatCard({
  label,
  value,
  sub,
  trend,
  icon: Icon,
}: {
  label: string;
  value: string;
  sub?: string;
  trend?: "up" | "down" | "neutral";
  icon: React.ElementType;
}) {
  return (
    <Card>
      <CardContent className="flex items-start gap-4 p-5">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
          <Icon className="h-5 w-5" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-semibold uppercase tracking-wider text-text-muted">{label}</p>
          <p className="mt-1 font-display text-xl font-bold text-text">{value}</p>
          {sub && (
            <p className={cn("mt-0.5 text-xs flex items-center gap-1",
              trend === "up" ? "text-success" : trend === "down" ? "text-danger" : "text-text-muted"
            )}>
              {trend === "up" && <ArrowUp className="h-3 w-3" />}
              {trend === "down" && <ArrowDown className="h-3 w-3" />}
              {sub}
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export default function ReceitasPage() {
  const [data, setData] = useState<RevenueData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/coach/revenue")
      .then((r) => r.ok ? r.json() : null)
      .then((d) => { if (d) setData(d); })
      .catch(() => null)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="mx-auto max-w-5xl space-y-7">
        <div className="space-y-2">
          <SkeletonCard className="h-5 w-24" />
          <SkeletonCard className="h-8 w-56" />
          <SkeletonCard className="h-4 w-80" />
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} className="h-24" />)}
        </div>
        <div className="grid gap-5 lg:grid-cols-2">
          <SkeletonCard className="h-64" />
          <SkeletonCard className="h-64" />
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="mx-auto max-w-5xl py-16 text-center">
        <DollarSign className="mx-auto mb-3 h-8 w-8 text-text-muted/40" />
        <p className="text-sm font-semibold text-text">Não foi possível carregar as receitas</p>
        <p className="text-xs text-text-muted mt-1">Recarregue a página ou tente novamente.</p>
      </div>
    );
  }

  const momDiff = data.lastMonthCents > 0
    ? ((data.thisMonthCents - data.lastMonthCents) / data.lastMonthCents) * 100
    : null;

  const totalMaxCents = Math.max(...data.byProduct.map((p) => p.totalCents), 1);

  const chartData = data.monthly.map((m) => ({ label: m.label, value: m.totalCents / 100 }));

  return (
    <div className="mx-auto max-w-5xl space-y-7">
      {/* Header */}
      <div>
        <Badge variant="primary" className="mb-2">
          <TrendingUp className="h-3 w-3" /> Receitas
        </Badge>
        <h1 className="font-display text-2xl font-bold text-text sm:text-3xl">Receitas da loja</h1>
        <p className="mt-1.5 text-sm text-text-muted">
          Vendas de planilhas e planos de treino publicados na sua loja.
        </p>
      </div>

      {/* KPI cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Receita total"
          value={fmtBRL(data.totalCents)}
          icon={DollarSign}
        />
        <StatCard
          label="Este mês"
          value={fmtBRL(data.thisMonthCents)}
          sub={
            momDiff !== null
              ? `${momDiff >= 0 ? "+" : ""}${momDiff.toFixed(0)}% vs mês anterior`
              : undefined
          }
          trend={momDiff === null ? "neutral" : momDiff >= 0 ? "up" : "down"}
          icon={BarChart2}
        />
        <StatCard
          label="Mês anterior"
          value={fmtBRL(data.lastMonthCents)}
          icon={TrendingUp}
        />
        <StatCard
          label="Total de vendas"
          value={String(data.salesCount)}
          sub="planos ativados"
          icon={ShoppingBag}
        />
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        {/* Monthly bar chart */}
        <Card>
          <CardHeader>
            <CardTitle>Receita mensal</CardTitle>
            <CardDescription>Últimos 6 meses (R$)</CardDescription>
          </CardHeader>
          <CardContent className="pt-2">
            {chartData.some((m) => m.value > 0) ? (
              <BarTrend data={chartData} dataKey="value" color="#f97316" unit=" R$" />
            ) : (
              <div className="flex h-[140px] items-center justify-center text-sm text-text-muted">
                Nenhuma venda registrada ainda.
              </div>
            )}
          </CardContent>
        </Card>

        {/* By product */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-4 w-4 text-text-muted" /> Por produto
            </CardTitle>
            <CardDescription>Ranking de receita por planilha</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 pt-2">
            {data.byProduct.length === 0 ? (
              <p className="py-8 text-center text-sm text-text-muted">Nenhuma venda ainda.</p>
            ) : (
              data.byProduct.map((p) => {
                const pct = Math.round((p.totalCents / totalMaxCents) * 100);
                return (
                  <div key={p.productId} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="flex items-center gap-1.5 font-medium text-text truncate max-w-[60%]">
                        {SPORT_EMOJI[p.sport] ?? "📋"} {p.title}
                      </span>
                      <span className="shrink-0 font-semibold text-primary">{fmtBRL(p.totalCents)}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-card-hover">
                        <div
                          className="h-full rounded-full bg-primary/70 transition-all"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                      <span className="shrink-0 text-[10px] text-text-muted">{p.count} venda{p.count !== 1 ? "s" : ""}</span>
                    </div>
                  </div>
                );
              })
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent transactions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-4 w-4 text-text-muted" /> Últimas transações
          </CardTitle>
          <CardDescription>Vendas pagas mais recentes</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {data.recent.length === 0 ? (
            <p className="py-10 text-center text-sm text-text-muted">Nenhuma transação ainda.</p>
          ) : (
            <div className="divide-y divide-border">
              {data.recent.map((tx) => (
                <div key={tx.id} className="flex items-center justify-between gap-4 px-5 py-3.5">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-text truncate">{tx.athleteName}</p>
                    <p className="text-xs text-text-muted truncate">{tx.productTitle}</p>
                  </div>
                  <div className="shrink-0 text-right">
                    <p className="text-sm font-bold text-success">{fmtBRL(tx.pricePaidCents)}</p>
                    <p className="text-[11px] text-text-muted">{fmtDate(tx.createdAt)}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
