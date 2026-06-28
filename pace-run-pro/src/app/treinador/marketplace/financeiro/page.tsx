"use client";

import { useEffect, useState } from "react";
import { DollarSign, Loader2, Info, TrendingUp, Clock } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";

interface Stats {
  totalGrossCents: number;
  totalNetCents: number;
  pendingPayoutCents: number;
  totalOrders: number;
  last30DaysGrossCents: number;
}

function fmtCurrency(cents: number) {
  return (cents / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export default function MarketplaceFinanceiroPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/coach/marketplace/stats")
      .then((r) => r.ok ? r.json() : null)
      .then((d) => { if (d) setStats(d); })
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="mx-auto max-w-3xl space-y-8 px-4 py-8 sm:px-6">
      <div>
        <Badge variant="primary" className="mb-2">Marketplace</Badge>
        <h1 className="font-display text-2xl font-bold text-text">Financeiro</h1>
        <p className="text-sm text-text-muted mt-1">Extrato de receitas e repasses do marketplace.</p>
      </div>

      {/* Commission info */}
      <div className="flex items-start gap-3 rounded-xl border border-border/60 bg-card/60 px-4 py-3">
        <Info className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
        <p className="text-xs text-text-muted">
          A PACE RUN PRO retém uma <strong className="text-text">comissão de 15%</strong> sobre cada venda processada pelo marketplace. O valor líquido é repassado mensalmente via PIX. Configure sua chave PIX no painel de configurações.
        </p>
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
      ) : (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
            {[
              { label: "Receita bruta total", value: stats?.totalGrossCents ?? 0, icon: TrendingUp, color: "text-primary" },
              { label: "Receita líquida total", value: stats?.totalNetCents ?? 0, icon: DollarSign, color: "text-success" },
              { label: "Pendente de repasse", value: stats?.pendingPayoutCents ?? 0, icon: Clock, color: "text-warning" },
            ].map((card) => {
              const Icon = card.icon;
              return (
                <Card key={card.label}>
                  <CardContent className="p-5">
                    <div className="flex items-center gap-2 mb-2">
                      <Icon className="h-4 w-4 text-text-muted" />
                      <p className="text-xs text-text-muted">{card.label}</p>
                    </div>
                    <p className={`font-display text-2xl font-bold ${card.color}`}>{fmtCurrency(card.value)}</p>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          <Card>
            <CardContent className="p-5">
              <h2 className="mb-4 font-display text-base font-semibold text-text">Como funciona o repasse</h2>
              <div className="space-y-3 text-sm text-text-muted">
                <div className="flex items-center gap-3">
                  <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary shrink-0">1</div>
                  <p>Atleta realiza a compra via Stripe ou PIX.</p>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary shrink-0">2</div>
                  <p>A PACE retém 15% como taxa de plataforma.</p>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary shrink-0">3</div>
                  <p>O valor líquido (85%) é repassado até o dia 10 do mês seguinte via PIX.</p>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary shrink-0">4</div>
                  <p>Você recebe extrato detalhado por e-mail no dia do repasse.</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="rounded-xl border border-border/40 bg-card-hover/30 px-4 py-3 text-xs text-text-muted">
            Últimos 30 dias: <strong className="text-primary">{fmtCurrency(stats?.last30DaysGrossCents ?? 0)}</strong> em receita bruta · {stats?.totalOrders ?? 0} pedidos
          </div>
        </div>
      )}
    </div>
  );
}
