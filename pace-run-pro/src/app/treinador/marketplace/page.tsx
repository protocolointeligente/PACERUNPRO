"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ShoppingBag, TrendingUp, Package, DollarSign, Clock, ArrowRight, ShoppingCart, Loader2, Plus } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface MarketplaceStats {
  totalGrossCents: number;
  totalNetCents: number;
  pendingPayoutCents: number;
  totalOrders: number;
  last30DaysGrossCents: number;
  totalProducts: number;
  publishedProducts: number;
  products: { id: string; title: string; type: string; priceCents: number; purchases: number; published: boolean }[];
}

const TYPE_LABELS: Record<string, string> = {
  PLANILHA: "Planilha", EBOOK: "E-book", CURSO: "Curso",
  EVENTO: "Evento", CONSULTORIA: "Consultoria", AVALIACAO: "Avaliação",
  TESTE: "Teste", ASSINATURA: "Assinatura", TREINAMENTO: "Treinamento",
};

function fmtCurrency(cents: number) {
  return (cents / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export default function MarketplaceDashboardPage() {
  const [stats, setStats] = useState<MarketplaceStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/coach/marketplace/stats")
      .then((r) => r.ok ? r.json() : null)
      .then((d) => { if (d) setStats(d); })
      .finally(() => setLoading(false));
  }, []);

  const metricCards = [
    {
      label: "Receita bruta",
      value: loading ? "…" : fmtCurrency(stats?.totalGrossCents ?? 0),
      sub: "Total histórico",
      color: "text-primary",
      icon: TrendingUp,
    },
    {
      label: "Receita líquida",
      value: loading ? "…" : fmtCurrency(stats?.totalNetCents ?? 0),
      sub: "Após comissão da plataforma",
      color: "text-success",
      icon: DollarSign,
    },
    {
      label: "A receber",
      value: loading ? "…" : fmtCurrency(stats?.pendingPayoutCents ?? 0),
      sub: "Pendente de repasse",
      color: "text-warning",
      icon: Clock,
    },
    {
      label: "Pedidos",
      value: loading ? "…" : String(stats?.totalOrders ?? 0),
      sub: "Total de compras",
      color: "text-info",
      icon: ShoppingCart,
    },
    {
      label: "Produtos",
      value: loading ? "…" : `${stats?.publishedProducts ?? 0}/${stats?.totalProducts ?? 0}`,
      sub: "Publicados / total",
      color: "text-text",
      icon: Package,
    },
  ];

  return (
    <div className="mx-auto max-w-5xl space-y-8 px-4 py-8 sm:px-6">
      <div className="space-y-1">
        <Badge variant="primary" className="mb-2">Meu Marketplace</Badge>
        <h1 className="font-display text-2xl font-bold text-text sm:text-3xl">Loja da assessoria</h1>
        <p className="text-sm text-text-muted">Venda planilhas, e-books, cursos, consultorias e muito mais diretamente para atletas.</p>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
        {metricCards.map((m) => {
          const Icon = m.icon;
          return (
            <Card key={m.label}>
              <CardContent className="p-5">
                <div className="flex items-center gap-2 mb-1">
                  <Icon className="h-3.5 w-3.5 text-text-muted" />
                  <p className="text-xs text-text-muted">{m.label}</p>
                </div>
                <p className={cn("font-display text-xl font-bold", m.color)}>{m.value}</p>
                <p className="mt-0.5 text-xs text-text-muted">{m.sub}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Quick actions */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {[
          { href: "/treinador/marketplace/produtos", icon: Package, label: "Gerenciar produtos", desc: "Criar e editar produtos" },
          { href: "/treinador/marketplace/pedidos", icon: ShoppingBag, label: "Pedidos", desc: "Ver histórico de compras" },
          { href: "/treinador/marketplace/financeiro", icon: DollarSign, label: "Financeiro", desc: "Repasses e extratos" },
        ].map((action) => {
          const Icon = action.icon;
          return (
            <Link key={action.href} href={action.href}>
              <div className="flex items-center gap-4 rounded-2xl border border-border bg-card p-5 hover:bg-card-hover transition-colors cursor-pointer">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl gradient-primary shrink-0">
                  <Icon className="h-5 w-5 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-text text-sm">{action.label}</p>
                  <p className="text-xs text-text-muted">{action.desc}</p>
                </div>
                <ArrowRight className="h-4 w-4 text-text-muted shrink-0" />
              </div>
            </Link>
          );
        })}
      </div>

      {/* Last 30 days highlight */}
      {!loading && (stats?.last30DaysGrossCents ?? 0) > 0 && (
        <div className="rounded-2xl border border-primary/20 bg-primary/5 px-5 py-4">
          <p className="text-xs text-text-muted">Últimos 30 dias</p>
          <p className="font-display text-2xl font-bold text-primary mt-1">{fmtCurrency(stats!.last30DaysGrossCents)}</p>
          <p className="text-xs text-text-muted mt-0.5">em receita bruta gerada pelo marketplace</p>
        </div>
      )}

      {/* Products list */}
      <Card>
        <CardContent className="p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display text-base font-semibold text-text">Meus produtos</h2>
            <Link href="/treinador/marketplace/produtos">
              <button className="flex items-center gap-1.5 rounded-xl border border-primary/40 bg-primary/10 px-3 py-1.5 text-xs font-bold text-primary hover:bg-primary/20">
                <Plus className="h-3 w-3" />Novo produto
              </button>
            </Link>
          </div>
          {loading ? (
            <div className="flex justify-center py-8"><Loader2 className="h-5 w-5 animate-spin text-primary" /></div>
          ) : !stats?.products.length ? (
            <div className="py-8 text-center">
              <Package className="mx-auto mb-3 h-10 w-10 text-text-muted/30" />
              <p className="text-sm text-text-muted">Nenhum produto criado ainda.</p>
              <Link href="/treinador/marketplace/produtos">
                <button className="mt-3 rounded-xl gradient-primary px-4 py-2 text-xs font-bold text-white">Criar meu primeiro produto</button>
              </Link>
            </div>
          ) : (
            <div className="space-y-2">
              {stats.products.slice(0, 8).map((p) => (
                <div key={p.id} className="flex items-center justify-between gap-3 rounded-xl border border-border p-3 hover:bg-card-hover">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-text truncate">{p.title}</p>
                    <p className="text-xs text-text-muted">{TYPE_LABELS[p.type] ?? p.type} · {(p.priceCents / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}</p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {p.purchases > 0 && <span className="text-xs text-text-muted">{p.purchases} vendas</span>}
                    <Badge variant={p.published ? "success" : "outline"} className="text-[10px]">{p.published ? "Publicado" : "Rascunho"}</Badge>
                  </div>
                </div>
              ))}
              {stats.products.length > 8 && (
                <Link href="/treinador/marketplace/produtos" className="block pt-2 text-center text-xs text-primary hover:underline">
                  Ver todos ({stats.products.length})
                </Link>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
