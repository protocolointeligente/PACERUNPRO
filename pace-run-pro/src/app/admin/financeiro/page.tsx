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
import { superAdminStats } from "@/lib/mock-data";
import { cn } from "@/lib/utils";

const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  show: (i: number = 0) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.06, duration: 0.4, ease: "easeOut" as const },
  }),
};

// B2B plan breakdown (mock)
const b2bBreakdown = [
  { name: "Starter", count: 12, price: 89, mrr: 12 * 89 },
  { name: "Pro", count: 22, price: 189, mrr: 22 * 189 },
  { name: "Premium", count: 8, price: 389, mrr: 8 * 389 },
  { name: "Ilimitado", count: 6, price: 997, mrr: 6 * 997 },
];

const b2bBadgeVariant = (name: string) => {
  if (name === "Ilimitado") return "danger" as const;
  if (name === "Premium") return "warning" as const;
  if (name === "Pro") return "primary" as const;
  return "outline" as const;
};

// Mock upcoming charges
const upcomingCharges = [
  {
    id: "uc-1",
    name: "Run Tribe Assessoria",
    plan: "Ilimitado",
    amount: 997,
    dueDate: "10 jun 2026",
    status: "processando",
  },
  {
    id: "uc-2",
    name: "Pace & Cia Esportes",
    plan: "Pro",
    amount: 189,
    dueDate: "12 jun 2026",
    status: "agendado",
  },
  {
    id: "uc-3",
    name: "Runners BH",
    plan: "Premium",
    amount: 389,
    dueDate: "15 jun 2026",
    status: "agendado",
  },
  {
    id: "uc-4",
    name: "Ultra Training SP",
    plan: "Pro",
    amount: 189,
    dueDate: "18 jun 2026",
    status: "agendado",
  },
  {
    id: "uc-5",
    name: "Maratonistas do Sul",
    plan: "Starter",
    amount: 89,
    dueDate: "22 jun 2026",
    status: "agendado",
  },
];

const totalMrr = superAdminStats.totalMrr;
const b2cMrr = superAdminStats.b2cMrr;
const b2bMrr = superAdminStats.b2bMrr;
const b2cPct = Math.round((b2cMrr / totalMrr) * 100);
const b2bPct = Math.round((b2bMrr / totalMrr) * 100);

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
          value="R$689.040"
          icon={TrendingUp}
          accent="primary"
        />
        <StatCard
          label="MRR atual"
          value="R$63.480"
          icon={DollarSign}
          accent="success"
        />
        <StatCard
          label="LTV médio estimado"
          value="R$2.340"
          icon={Users}
          accent="info"
        />
        <StatCard
          label="Churn 30d"
          value="8"
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
                    <p className="text-xs text-text-muted">312 atletas ativos</p>
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
                    <p className="text-xs text-text-muted">48 assessorias ativas</p>
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
                      {row.count}×R${row.price}
                    </p>
                    <p className="text-right text-sm font-semibold text-text">
                      R${row.mrr.toLocaleString("pt-BR")}
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
                    R${b2bBreakdown.reduce((acc, r) => acc + r.mrr, 0).toLocaleString("pt-BR")}
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
                    R${charge.amount.toLocaleString("pt-BR")}
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
