"use client";

import { motion } from "framer-motion";
import {
  DollarSign,
  TrendingUp,
  Users,
  TrendingDown,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { StatCard } from "@/components/dashboard/stat-card";
import { SectionHeader } from "@/components/shared/section-header";
import { superAdminStats, b2bPlans } from "@/lib/mock-data";
import { formatBRL } from "@/lib/utils";

const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  show: (i: number = 0) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.06, duration: 0.4, ease: "easeOut" as const },
  }),
};

// B2B plan breakdown (mock)
const planPrice = (id: string) => b2bPlans.find((p) => p.id === id)?.price ?? 0;

const b2bBreakdown = [
  { name: "Starter", count: 0, price: planPrice("b2b-starter") },
  { name: "Pro", count: 0, price: planPrice("b2b-pro") },
  { name: "Assessoria", count: 0, price: planPrice("b2b-assessoria") },
  { name: "White Label", count: 0, price: planPrice("b2b-unlimited") },
].map((row) => ({ ...row, mrr: row.count * row.price }));

const b2bBadgeVariant = (name: string) => {
  if (name === "White Label") return "danger" as const;
  if (name === "Assessoria") return "warning" as const;
  if (name === "Pro") return "primary" as const;
  return "outline" as const;
};

const upcomingCharges: { id: string; name: string; plan: string; amount: number; dueDate: string; status: string }[] = [];

const totalMrr = superAdminStats.totalMrr;
const b2cMrr = superAdminStats.b2cMrr;
const b2bMrr = superAdminStats.b2bMrr;
const b2cPct = totalMrr > 0 ? Math.round((b2cMrr / totalMrr) * 100) : 0;
const b2bPct = totalMrr > 0 ? Math.round((b2bMrr / totalMrr) * 100) : 0;

export default function FinanceiroPage() {
  return (
    <div className="mx-auto max-w-6xl space-y-8">
      {/* Header */}
      <motion.div
        variants={fadeUp}
        initial="hidden"
        animate="show"
        className="flex flex-wrap items-start gap-4"
      >
        <div>
          <Badge variant="success" className="mb-2">Financeiro</Badge>
          <h1 className="font-display text-2xl font-bold text-text sm:text-3xl">
            Receita e faturamento
          </h1>
        </div>
      </motion.div>

      {/* KPI Cards */}
      <motion.div
        custom={1}
        variants={fadeUp}
        initial="hidden"
        animate="show"
        className="grid grid-cols-2 gap-3 sm:grid-cols-4"
      >
        <StatCard
          label="Receita 12 meses"
          value="R$0"
          icon={TrendingUp}
          accent="primary"
        />
        <StatCard
          label="MRR atual"
          value="R$0"
          icon={DollarSign}
          accent="success"
        />
        <StatCard
          label="LTV médio estimado"
          value="R$0"
          icon={Users}
          accent="info"
        />
        <StatCard
          label="Churn 30d"
          value="0"
          unit="cancelamentos"
          icon={TrendingDown}
          accent="danger"
        />
      </motion.div>

      {/* Revenue by Track + B2B Breakdown */}
      <motion.div
        custom={2}
        variants={fadeUp}
        initial="hidden"
        animate="show"
        className="grid gap-5 lg:grid-cols-2"
      >
        {/* Left: Revenue by Track */}
        <div className="space-y-3">
          <SectionHeader title="Receita por track" />
          <Card>
            <CardContent className="p-5 space-y-5">
              {/* B2C */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <p className="text-sm font-semibold text-text">B2C — Atletas diretos</p>
                    <p className="text-xs text-text-muted">0 atletas ativos</p>
                  </div>
                  <div className="text-right">
                    <p className="font-display text-xl font-bold text-text">
                      R${b2cMrr.toLocaleString("pt-BR")}
                    </p>
                    <p className="text-xs text-text-muted">{b2cPct}% do MRR</p>
                  </div>
                </div>
                <Progress
                  value={b2cPct}
                  colorClassName="bg-info"
                />
              </div>

              {/* Divider */}
              <div className="border-t border-border" />

              {/* B2B */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <p className="text-sm font-semibold text-text">B2B — Assessorias</p>
                    <p className="text-xs text-text-muted">0 assessorias ativas</p>
                  </div>
                  <div className="text-right">
                    <p className="font-display text-xl font-bold text-text">
                      R${b2bMrr.toLocaleString("pt-BR")}
                    </p>
                    <p className="text-xs text-text-muted">{b2bPct}% do MRR</p>
                  </div>
                </div>
                <Progress
                  value={b2bPct}
                  colorClassName="bg-primary"
                />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right: B2B by Plan */}
        <div className="space-y-3">
          <SectionHeader title="Distribuição B2B por plano" />
          <Card>
            <CardContent className="p-5">
              <div className="space-y-3">
                {/* Table header */}
                <div className="grid grid-cols-3 gap-2 border-b border-border pb-2">
                  <span className="text-xs font-semibold uppercase tracking-wider text-text-muted">Plano</span>
                  <span className="text-xs font-semibold uppercase tracking-wider text-text-muted text-center">Qtd</span>
                  <span className="text-xs font-semibold uppercase tracking-wider text-text-muted text-right">MRR</span>
                </div>
                {b2bBreakdown.map((row) => (
                  <div key={row.name} className="grid grid-cols-3 items-center gap-2 py-1">
                    <Badge variant={b2bBadgeVariant(row.name)} className="w-fit">
                      {row.name}
                    </Badge>
                    <p className="text-center text-sm text-text-muted">
                      {row.count}×R${formatBRL(row.price)}
                    </p>
                    <p className="text-right text-sm font-semibold text-text">
                      R${formatBRL(row.mrr)}
                    </p>
                  </div>
                ))}
                {/* Total row */}
                <div className="grid grid-cols-3 items-center gap-2 border-t border-border pt-2">
                  <span className="text-sm font-bold text-text">Total</span>
                  <p className="text-center text-sm font-bold text-text">
                    {b2bBreakdown.reduce((acc, r) => acc + r.count, 0)}
                  </p>
                  <p className="text-right text-sm font-bold text-primary">
                    R${formatBRL(b2bBreakdown.reduce((acc, r) => acc + r.mrr, 0))}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </motion.div>

      {/* Upcoming Charges */}
      <motion.div
        custom={3}
        variants={fadeUp}
        initial="hidden"
        animate="show"
      >
        <SectionHeader
          title="Próximas cobranças"
          subtitle="Cobranças previstas nos próximos dias"
        />
        <div className="space-y-3">
          {upcomingCharges.length === 0 && (
            <Card>
              <CardContent className="py-8 text-center text-sm text-text-muted">
                Nenhuma cobrança prevista.
              </CardContent>
            </Card>
          )}
          {upcomingCharges.map((charge) => (
            <Card key={charge.id}>
              <CardContent className="flex flex-wrap items-center justify-between gap-3 p-4">
                <div>
                  <p className="text-sm font-semibold text-text">{charge.name}</p>
                  <p className="text-xs text-text-muted">
                    Plano {charge.plan} · Vencimento: {charge.dueDate}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="font-display text-base font-bold text-text">
                    R${formatBRL(charge.amount)}
                  </span>
                  <Badge
                    variant={
                      charge.status === "processando" ? "warning" : "info"
                    }
                  >
                    {charge.status === "processando" ? "Processando" : "Agendado"}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </motion.div>
    </div>
  );
}
