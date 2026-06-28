"use client";

import { useEffect, useState } from "react";
import { TrendingUp, DollarSign, Package, Store, ShoppingCart, Loader2, Settings } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface MarketplaceData {
  gmv: number;
  mrrMarketplace: number;
  totalCommissionRevenue: number;
  totalNetToCoaches: number;
  pendingPayout: number;
  totalOrders: number;
  publishedProducts: number;
  totalProducts: number;
  totalStores: number;
  recentOrders: { id: string; status: string; totalCents: number; createdAt: string }[];
  categoryBreakdown: { type: string; count: number }[];
  stores: { id: string; name: string; slug: string | null; isActive: boolean; commissionPct: number; coachName: string | null }[];
}

const TYPE_LABELS: Record<string, string> = {
  PLANILHA: "Planilha", EBOOK: "E-book", CURSO: "Curso", EVENTO: "Evento",
  CONSULTORIA: "Consultoria", AVALIACAO: "Avaliação", TESTE: "Teste",
  ASSINATURA: "Assinatura", TREINAMENTO: "Treinamento",
};

const STATUS_COLORS: Record<string, string> = {
  PAID: "text-success", PENDING: "text-warning", FULFILLED: "text-success",
  CANCELLED: "text-danger", REFUNDED: "text-danger", PROCESSING: "text-info",
};

function fmtCurrency(cents: number) {
  return (cents / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export default function AdminMarketplacePage() {
  const [data, setData] = useState<MarketplaceData | null>(null);
  const [loading, setLoading] = useState(true);
  const [showCommissionEdit, setShowCommissionEdit] = useState(false);
  const [commissionPct, setCommissionPct] = useState("15");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch("/api/admin/marketplace")
      .then((r) => r.ok ? r.json() : null)
      .then((d) => { if (d) setData(d); })
      .finally(() => setLoading(false));
  }, []);

  async function saveCommission() {
    setSaving(true);
    await fetch("/api/admin/marketplace", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ defaultCommissionPct: Number(commissionPct) / 100 }),
    });
    setSaving(false);
    setShowCommissionEdit(false);
  }

  const kpis = [
    { label: "GMV Total", value: fmtCurrency(data?.gmv ?? 0), sub: "Volume bruto", color: "text-primary", icon: TrendingUp },
    { label: "GMV (30 dias)", value: fmtCurrency(data?.mrrMarketplace ?? 0), sub: "Últimos 30 dias", color: "text-info", icon: TrendingUp },
    { label: "Comissão PACE", value: fmtCurrency(data?.totalCommissionRevenue ?? 0), sub: "Receita da plataforma", color: "text-success", icon: DollarSign },
    { label: "Repasse coaches", value: fmtCurrency(data?.totalNetToCoaches ?? 0), sub: "Valor líquido pago", color: "text-warning", icon: DollarSign },
    { label: "Pendente repasse", value: fmtCurrency(data?.pendingPayout ?? 0), sub: "A repassar", color: "text-danger", icon: DollarSign },
    { label: "Pedidos", value: String(data?.totalOrders ?? 0), sub: "Total histórico", color: "text-text", icon: ShoppingCart },
    { label: "Produtos", value: `${data?.publishedProducts ?? 0}/${data?.totalProducts ?? 0}`, sub: "Publicados", color: "text-text", icon: Package },
    { label: "Assessorias", value: String(data?.totalStores ?? 0), sub: "Com loja ativa", color: "text-text", icon: Store },
  ];

  return (
    <div className="mx-auto max-w-7xl space-y-8 px-4 py-8 sm:px-6">
      <div className="flex items-start justify-between">
        <div>
          <Badge variant="primary" className="mb-2">Marketplace</Badge>
          <h1 className="font-display text-2xl font-bold text-text sm:text-3xl">Dashboard do Marketplace</h1>
          <p className="text-sm text-text-muted">GMV, comissões, repasses e saúde do ecossistema.</p>
        </div>
        <button
          onClick={() => setShowCommissionEdit(!showCommissionEdit)}
          className="flex items-center gap-2 rounded-xl border border-border px-4 py-2.5 text-sm font-semibold text-text-muted hover:bg-card-hover"
        >
          <Settings className="h-4 w-4" />
          Comissão
        </button>
      </div>

      {showCommissionEdit && (
        <div className="rounded-2xl border border-border bg-card p-5 flex items-center gap-4">
          <div className="flex-1">
            <p className="text-sm font-semibold text-text mb-1">Comissão padrão da plataforma (%)</p>
            <p className="text-xs text-text-muted">Aplicada a todos os produtos salvo override por assessoria ou produto.</p>
          </div>
          <div className="flex items-center gap-3">
            <input
              type="number"
              value={commissionPct}
              onChange={(e) => setCommissionPct(e.target.value)}
              min="0" max="100" step="0.5"
              className="w-20 rounded-xl border border-border bg-background px-3 py-2 text-sm text-text outline-none focus:border-primary/60"
            />
            <span className="text-text-muted">%</span>
            <button
              onClick={saveCommission}
              disabled={saving}
              className="rounded-xl gradient-primary px-4 py-2 text-sm font-bold text-white disabled:opacity-60"
            >
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Salvar"}
            </button>
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-16"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
      ) : (
        <>
          {/* KPIs */}
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 lg:grid-cols-4">
            {kpis.slice(0, 4).map((k) => {
              const Icon = k.icon;
              return (
                <Card key={k.label}>
                  <CardContent className="p-5">
                    <div className="flex items-center gap-2 mb-1">
                      <Icon className="h-3.5 w-3.5 text-text-muted" />
                      <p className="text-xs text-text-muted">{k.label}</p>
                    </div>
                    <p className={cn("font-display text-xl font-bold mt-1", k.color)}>{k.value}</p>
                    <p className="mt-0.5 text-xs text-text-muted">{k.sub}</p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            {kpis.slice(4).map((k) => {
              const Icon = k.icon;
              return (
                <Card key={k.label}>
                  <CardContent className="p-5">
                    <div className="flex items-center gap-2 mb-1">
                      <Icon className="h-3.5 w-3.5 text-text-muted" />
                      <p className="text-xs text-text-muted">{k.label}</p>
                    </div>
                    <p className={cn("font-display text-xl font-bold mt-1", k.color)}>{k.value}</p>
                    <p className="mt-0.5 text-xs text-text-muted">{k.sub}</p>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            {/* Category breakdown */}
            <Card>
              <CardContent className="p-5">
                <h2 className="mb-4 font-display text-base font-semibold text-text">Por categoria</h2>
                {data?.categoryBreakdown.length === 0 ? (
                  <p className="text-sm text-text-muted py-4 text-center">Sem dados ainda.</p>
                ) : (
                  <div className="space-y-2">
                    {(data?.categoryBreakdown ?? []).sort((a, b) => b.count - a.count).map((c) => (
                      <div key={c.type} className="flex items-center justify-between">
                        <span className="text-sm text-text">{TYPE_LABELS[c.type] ?? c.type}</span>
                        <span className="font-semibold text-sm text-primary">{c.count} vendas</span>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Recent orders */}
            <Card>
              <CardContent className="p-5">
                <h2 className="mb-4 font-display text-base font-semibold text-text">Pedidos recentes</h2>
                {data?.recentOrders.length === 0 ? (
                  <p className="text-sm text-text-muted py-4 text-center">Nenhum pedido ainda.</p>
                ) : (
                  <div className="space-y-2">
                    {(data?.recentOrders ?? []).map((o) => (
                      <div key={o.id} className="flex items-center justify-between gap-3 rounded-xl border border-border p-3">
                        <div>
                          <p className="text-xs font-semibold text-text">{new Date(o.createdAt).toLocaleDateString("pt-BR")}</p>
                          <p className={cn("text-[11px]", STATUS_COLORS[o.status] ?? "text-text-muted")}>{o.status}</p>
                        </div>
                        <span className="font-semibold text-sm text-success">{fmtCurrency(o.totalCents)}</span>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Assessorias / stores */}
          <Card>
            <CardContent className="p-5">
              <h2 className="mb-4 font-display text-base font-semibold text-text">Assessorias com marketplace</h2>
              {data?.stores.length === 0 ? (
                <p className="text-sm text-text-muted py-4 text-center">Nenhuma assessoria criou loja ainda.</p>
              ) : (
                <div className="divide-y divide-border">
                  {(data?.stores ?? []).map((s) => (
                    <div key={s.id} className="flex items-center justify-between gap-4 py-3">
                      <div>
                        <p className="font-medium text-sm text-text">{s.name}</p>
                        <p className="text-xs text-text-muted">{s.coachName} · {s.slug ? `/assessoria/${s.slug}` : "sem slug"}</p>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-xs text-text-muted">Comissão: {(s.commissionPct * 100).toFixed(0)}%</span>
                        <Badge variant={s.isActive ? "success" : "outline"} className="text-[10px]">{s.isActive ? "Ativa" : "Inativa"}</Badge>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
