"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  TrendingUp,
  Clock,
  CheckCircle2,
  XCircle,
  Banknote,
  Calendar,
  ExternalLink,
  Info,
} from "lucide-react";

interface Stats {
  grossCents: number;
  netCents: number;
  pendingCents: number;
  last30GrossCents: number;
  totalOrders: number;
}

interface PagBankStatus {
  connected: boolean;
  pagbankAccountId?: string;
  authorizationStatus?: string;
}

function brl(cents: number) {
  return (cents / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function nextPayoutDates(): { next: Date; following: Date } {
  const today = new Date();
  const year = today.getFullYear();
  const month = today.getMonth();
  const day = today.getDate();

  // Payouts on the 1st and 16th of each month
  let next: Date;
  if (day < 1) {
    next = new Date(year, month, 1);
  } else if (day < 16) {
    next = new Date(year, month, 16);
  } else {
    next = new Date(year, month + 1, 1);
  }
  const following = new Date(next);
  following.setDate(following.getDate() === 1 ? 16 : 1);
  if (following.getDate() === 1) following.setMonth(following.getMonth() + 1);

  return { next, following };
}

function formatDate(d: Date) {
  return d.toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" });
}

export default function FinanceiroPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [pagBankStatus, setPagBankStatus] = useState<PagBankStatus | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch("/api/coach/marketplace/stats").then((r) => (r.ok ? r.json() : null)),
      fetch("/api/coach/pagbank/status").then((r) => (r.ok ? r.json() : null)),
    ])
      .then(([s, p]) => {
        if (s) setStats(s);
        if (p) setPagBankStatus(p);
      })
      .catch(() => null)
      .finally(() => setLoading(false));
  }, []);

  const { next, following } = nextPayoutDates();
  const isConnected = pagBankStatus?.connected === true;

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-10 space-y-4">
        {[1, 2, 3].map((i) => <div key={i} className="h-24 animate-pulse rounded-2xl bg-card-hover" />)}
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-8 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">Financeiro</h1>
        <p className="text-sm text-muted-foreground mt-1">Receitas do marketplace e repasses PagBank</p>
      </div>

      {/* PagBank connection status */}
      <div className={`border rounded-2xl px-5 py-4 flex items-start justify-between gap-4 ${isConnected ? "bg-green-50 dark:bg-green-900/15 border-green-200 dark:border-green-800" : "border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-900/15"}`}>
        <div className="flex items-start gap-3">
          {isConnected ? (
            <CheckCircle2 className="w-5 h-5 text-green-600 dark:text-green-400 mt-0.5 shrink-0" />
          ) : (
            <XCircle className="w-5 h-5 text-amber-600 dark:text-amber-400 mt-0.5 shrink-0" />
          )}
          <div>
            <p className="font-semibold text-sm">
              {isConnected ? "PagBank conectado" : "PagBank não conectado"}
            </p>
            {isConnected ? (
              <p className="text-xs text-muted-foreground mt-0.5 font-mono">
                {pagBankStatus?.pagbankAccountId}
              </p>
            ) : (
              <p className="text-xs text-muted-foreground mt-0.5">
                Conecte sua conta PagBank para receber repasses automáticos das suas vendas
              </p>
            )}
          </div>
        </div>
        <Link
          href="/treinador/marketplace/conectar"
          className="shrink-0 flex items-center gap-1 text-xs font-medium text-primary hover:underline"
        >
          {isConnected ? "Gerenciar" : "Conectar"}
          <ExternalLink className="w-3 h-3" />
        </Link>
      </div>

      {/* Revenue stats */}
      <div className="grid grid-cols-3 gap-3">
        <StatCard
          icon={<TrendingUp className="w-4 h-4" />}
          label="Receita bruta total"
          value={stats ? brl(stats.grossCents) : "—"}
        />
        <StatCard
          icon={<Banknote className="w-4 h-4" />}
          label="Receita líquida (90%)"
          value={stats ? brl(stats.netCents) : "—"}
        />
        <StatCard
          icon={<Clock className="w-4 h-4" />}
          label="Pendente de repasse"
          value={stats ? brl(stats.pendingCents) : "—"}
          highlight={!!stats?.pendingCents}
        />
      </div>

      {/* Last 30 days summary */}
      {stats && (
        <div className="border rounded-2xl px-5 py-4 flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Últimos 30 dias</span>
          <div className="flex items-center gap-4 font-medium">
            <span>{brl(stats.last30GrossCents)} faturados</span>
            <span className="text-muted-foreground">·</span>
            <span>{stats.totalOrders} pedidos</span>
          </div>
        </div>
      )}

      {/* Payout schedule */}
      <div className="border rounded-2xl p-5 space-y-4">
        <div className="flex items-center gap-2 font-semibold">
          <Calendar className="w-4 h-4 text-primary" />
          Cronograma de repasses quinzenais
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-primary/5 rounded-xl p-3">
            <p className="text-xs text-muted-foreground">Próximo repasse</p>
            <p className="font-semibold text-sm mt-1">{formatDate(next)}</p>
          </div>
          <div className="bg-muted/50 rounded-xl p-3">
            <p className="text-xs text-muted-foreground">Repasse seguinte</p>
            <p className="font-medium text-sm mt-1">{formatDate(following)}</p>
          </div>
        </div>
        <div className="rounded-xl bg-muted/50 px-4 py-3 space-y-1 text-xs text-muted-foreground">
          <div className="flex items-start gap-2">
            <Info className="w-3.5 h-3.5 mt-0.5 shrink-0" />
            <p>
              O split do PIX é feito automaticamente no momento do pagamento — 90% vai direto para sua conta PagBank, sem necessidade de solicitação. Os repasses quinzenais referem-se a outras modalidades de pagamento ou ajustes manuais.
            </p>
          </div>
        </div>
      </div>

      {/* Commission structure */}
      <div className="border rounded-2xl p-5 space-y-3">
        <p className="font-semibold text-sm">Estrutura de comissão</p>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between items-center py-1.5 border-b border-border/50">
            <span className="text-muted-foreground">Valor da venda</span>
            <span className="font-medium">100%</span>
          </div>
          <div className="flex justify-between items-center py-1.5 border-b border-border/50 text-green-700 dark:text-green-400">
            <span>Você recebe (split direto)</span>
            <span className="font-bold">90%</span>
          </div>
          <div className="flex justify-between items-center py-1.5 text-muted-foreground">
            <span>Taxa da plataforma PACE RUN PRO</span>
            <span>10%</span>
          </div>
        </div>
        <p className="text-xs text-muted-foreground">
          Cupons de desconto são absorvidos pelo valor bruto do produto — a taxa de 10% incide sobre o valor final após desconto.
        </p>
      </div>
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
  highlight = false,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <div className={`border rounded-2xl p-4 space-y-2 ${highlight ? "border-amber-300 dark:border-amber-700 bg-amber-50 dark:bg-amber-900/10" : ""}`}>
      <div className="text-primary/70">{icon}</div>
      <p className="text-xs text-muted-foreground leading-tight">{label}</p>
      <p className="text-lg font-bold">{value}</p>
    </div>
  );
}
