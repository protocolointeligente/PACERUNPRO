"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import {
  TrendingUp,
  Users,
  Building2,
  UserPlus,
  Clock,
  DollarSign,
  CheckCircle2,
  XCircle,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { StatCard } from "@/components/dashboard/stat-card";
import { SectionHeader } from "@/components/shared/section-header";
import { BarTrend } from "@/components/charts/trend-chart";
import {
  superAdminStats,
  b2cAthletesList,
  pendingApprovals,
} from "@/lib/mock-data";
import { cn } from "@/lib/utils";

const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  show: (i: number = 0) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.06, duration: 0.4, ease: "easeOut" as const },
  }),
};

const planBadgeVariant = (plan: string) => {
  if (plan === "b2b-unlimited") return "danger" as const;
  if (plan === "b2b-premium") return "warning" as const;
  if (plan === "b2b-pro") return "primary" as const;
  return "outline" as const;
};

const planLabel = (plan: string) => {
  const map: Record<string, string> = {
    "b2b-starter": "Starter",
    "b2b-pro": "Pro",
    "b2b-premium": "Premium",
    "b2b-unlimited": "Ilimitado",
  };
  return map[plan] ?? plan;
};

const b2cPlanBadgeVariant = (plan: string) => {
  if (plan === "anual") return "warning" as const;
  if (plan === "semestral") return "primary" as const;
  if (plan === "trimestral") return "info" as const;
  return "outline" as const;
};

const b2cPlanLabel = (plan: string) => {
  const map: Record<string, string> = {
    mensal: "Mensal",
    trimestral: "Trimestral",
    semestral: "Semestral",
    anual: "Anual",
  };
  return map[plan] ?? plan;
};

const today = new Date().toLocaleDateString("pt-BR", {
  day: "2-digit",
  month: "long",
  year: "numeric",
});

const b2cSeries = superAdminStats.mrrSeries.map((d) => ({
  label: d.month,
  b2c: d.b2c,
}));

const b2bSeries = superAdminStats.mrrSeries.map((d) => ({
  label: d.month,
  b2b: d.b2b,
}));

export default function AdminDashboard() {
  const [approvedIds, setApprovedIds] = useState<Set<string>>(new Set());
  const [refusedIds, setRefusedIds] = useState<Set<string>>(new Set());

  const visibleApprovals = pendingApprovals.filter(
    (a) => !refusedIds.has(a.id)
  );

  return (
    <div className="mx-auto max-w-6xl space-y-8">
      {/* Header */}
      <motion.div
        variants={fadeUp}
        initial="hidden"
        animate="show"
        className="flex flex-wrap items-start justify-between gap-4"
      >
        <div>
          <Badge variant="danger" className="mb-2">Super Admin</Badge>
          <h1 className="font-display text-2xl font-bold text-white sm:text-3xl">
            Painel do Administrador
          </h1>
          <p className="mt-1 text-sm text-text-muted">
            Visão completa da plataforma — {today}
          </p>
        </div>
      </motion.div>

      {/* Stat Cards */}
      <motion.div
        custom={1}
        variants={fadeUp}
        initial="hidden"
        animate="show"
        className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5"
      >
        <StatCard
          label="MRR Total"
          value="R$63.480"
          unit="+13,8%"
          icon={TrendingUp}
          accent="primary"
        />
        <StatCard
          label="MRR B2C"
          value="R$51.264"
          unit="312 atletas"
          icon={Users}
          accent="info"
        />
        <StatCard
          label="MRR B2B"
          value="R$12.216"
          unit="48 assessorias"
          icon={Building2}
          accent="success"
        />
        <StatCard
          label="Novos 30d"
          value="+34"
          icon={UserPlus}
          accent="warning"
        />
        <div className="relative">
          <StatCard
            label="Pendentes de aprovação"
            value="3"
            icon={Clock}
            accent="danger"
          />
          <Badge
            variant="danger"
            className="absolute -right-1 -top-1 text-[10px] px-1.5 py-0.5"
          >
            3
          </Badge>
        </div>
      </motion.div>

      {/* MRR Chart */}
      <motion.div
        custom={2}
        variants={fadeUp}
        initial="hidden"
        animate="show"
      >
        <SectionHeader
          title="Evolução do MRR"
          subtitle="Receita mensal recorrente — B2C e B2B"
        />
        <div className="grid gap-4 lg:grid-cols-2">
          <Card>
            <CardContent className="p-5">
              <p className="mb-3 text-sm font-semibold text-text-muted">
                MRR B2C — Atletas diretos
              </p>
              <BarTrend
                data={b2cSeries}
                dataKey="b2c"
                color="#38bdf8"
                unit=""
              />
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-5">
              <p className="mb-3 text-sm font-semibold text-text-muted">
                MRR B2B — Assessorias
              </p>
              <BarTrend
                data={b2bSeries}
                dataKey="b2b"
                color="#8b5cf6"
                unit=""
              />
            </CardContent>
          </Card>
        </div>
      </motion.div>

      {/* Pending Approvals */}
      <motion.div
        custom={3}
        variants={fadeUp}
        initial="hidden"
        animate="show"
      >
        <SectionHeader
          title="Assessorias pendentes de aprovação"
          subtitle={`${visibleApprovals.length} assessoria(s) aguardando revisão`}
        />
        <div className="space-y-3">
          {visibleApprovals.map((a) => {
            const isApproved = approvedIds.has(a.id);
            return (
              <Card key={a.id}>
                <CardContent className="flex flex-wrap items-center justify-between gap-4 p-4">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-10 w-10">
                      <AvatarFallback>
                        {a.name
                          .split(" ")
                          .map((n) => n[0])
                          .slice(0, 2)
                          .join("")}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="text-sm font-semibold text-white">
                        {a.name}
                      </p>
                      <p className="text-xs text-text-muted">{a.city}</p>
                      <p className="text-xs text-text-muted">{a.contact}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge variant={planBadgeVariant(a.plan)}>
                      {planLabel(a.plan)}
                    </Badge>
                    {isApproved ? (
                      <Badge variant="success">
                        <CheckCircle2 className="h-3 w-3" />
                        Aprovado
                      </Badge>
                    ) : (
                      <div className="flex gap-2">
                        <Button
                          variant="success"
                          size="sm"
                          onClick={() =>
                            setApprovedIds((prev) => new Set([...prev, a.id]))
                          }
                        >
                          Aprovar
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-danger hover:text-danger"
                          onClick={() =>
                            setRefusedIds((prev) => new Set([...prev, a.id]))
                          }
                        >
                          <XCircle className="h-4 w-4" />
                          Recusar
                        </Button>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
          {visibleApprovals.length === 0 && (
            <Card>
              <CardContent className="p-6 text-center text-sm text-text-muted">
                Nenhuma assessoria pendente de aprovação.
              </CardContent>
            </Card>
          )}
        </div>
      </motion.div>

      {/* Recent B2C Athletes */}
      <motion.div
        custom={4}
        variants={fadeUp}
        initial="hidden"
        animate="show"
      >
        <SectionHeader
          title="Últimos atletas B2C cadastrados"
          href="/admin/atletas"
        />
        <div className="space-y-3">
          {b2cAthletesList.slice(0, 4).map((a) => (
            <Card key={a.id}>
              <CardContent className="flex flex-wrap items-center justify-between gap-3 p-4">
                <div className="flex items-center gap-3">
                  <Avatar className="h-9 w-9">
                    <AvatarFallback>
                      {a.name
                        .split(" ")
                        .map((n) => n[0])
                        .slice(0, 2)
                        .join("")}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="text-sm font-semibold text-white">
                      {a.name}
                    </p>
                    <p className="text-xs text-text-muted">
                      {a.city} · {a.coachAssigned}
                    </p>
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant={b2cPlanBadgeVariant(a.plan)}>
                    {b2cPlanLabel(a.plan)}
                  </Badge>
                  <span className="text-sm font-semibold text-white">
                    R${a.mrr}/mês
                  </span>
                  <Badge
                    variant={
                      a.status === "ativo" ? "success" : "warning"
                    }
                  >
                    {a.status === "ativo" ? "Ativo" : "Pendente"}
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
