"use client";

import { motion } from "framer-motion";
import { Users, DollarSign, TrendingDown, Star } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { StatCard } from "@/components/dashboard/stat-card";
import { SectionHeader } from "@/components/shared/section-header";
import { b2cAthletesList, b2cPlans } from "@/lib/mock-data";

const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  show: (i: number = 0) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.06, duration: 0.4, ease: "easeOut" as const },
  }),
};

const planBadgeVariant = (plan: string) => {
  if (plan === "anual") return "warning" as const;
  if (plan === "semestral") return "primary" as const;
  if (plan === "trimestral") return "info" as const;
  return "outline" as const;
};

const planLabel = (plan: string) => {
  const map: Record<string, string> = {
    mensal: "Mensal",
    trimestral: "Trimestral",
    semestral: "Semestral",
    anual: "Anual",
  };
  return map[plan] ?? plan;
};

// Mock distribution counts for plan distribution cards
const planDistribution: Record<string, number> = {
  anual: 98,
  semestral: 112,
  trimestral: 64,
  mensal: 38,
};

const totalAthletes = 312;

export default function AtletasB2CPage() {
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
          <Badge variant="info" className="mb-2">Atletas B2C</Badge>
          <h1 className="font-display text-2xl font-bold text-text sm:text-3xl">
            Atletas com plano direto
          </h1>
        </div>
      </motion.div>

      {/* Stats */}
      <motion.div
        custom={1}
        variants={fadeUp}
        initial="hidden"
        animate="show"
        className="grid grid-cols-2 gap-3 sm:grid-cols-4"
      >
        <StatCard label="Total de atletas" value="312" icon={Users} accent="primary" />
        <StatCard label="MRR B2C" value="R$51.264" icon={DollarSign} accent="success" />
        <StatCard label="Plano mais popular" value="Semestral" icon={Star} accent="info" />
        <StatCard label="Churn 30d" value="4" icon={TrendingDown} accent="danger" />
      </motion.div>

      {/* Plan Distribution */}
      <motion.div
        custom={2}
        variants={fadeUp}
        initial="hidden"
        animate="show"
      >
        <SectionHeader title="Distribuição por plano" />
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {b2cPlans.map((plan) => {
            const count = planDistribution[plan.id] ?? 0;
            const pct = Math.round((count / totalAthletes) * 100);
            return (
              <Card key={plan.id}>
                <CardContent className="p-5">
                  <Badge variant={planBadgeVariant(plan.id)} className="mb-3">
                    {plan.name}
                  </Badge>
                  <p className="font-display text-2xl font-bold text-text">
                    {count}
                  </p>
                  <p className="mt-1 text-xs text-text-muted">
                    {pct}% do total
                  </p>
                  <p className="mt-1 text-xs text-text-muted">
                    R${plan.pricePerMonth}/mês
                  </p>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </motion.div>

      {/* Athletes List */}
      <motion.div
        custom={3}
        variants={fadeUp}
        initial="hidden"
        animate="show"
      >
        <SectionHeader
          title="Lista de atletas"
          subtitle={`Exibindo ${b2cAthletesList.length} de ${totalAthletes} atletas`}
        />
        <div className="space-y-3">
          {b2cAthletesList.map((a) => (
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
                    <p className="text-sm font-semibold text-text">{a.name}</p>
                    <p className="text-xs text-text-muted">
                      {a.city} · desde {a.startDate}
                    </p>
                    <p className="text-xs text-text-muted">{a.coachAssigned}</p>
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant={planBadgeVariant(a.plan)}>
                    {planLabel(a.plan)}
                  </Badge>
                  <span className="text-sm font-semibold text-text">
                    R${a.mrr}/mês
                  </span>
                  <Badge variant={a.status === "ativo" ? "success" : "warning"}>
                    {a.status === "ativo" ? "Ativo" : "Pendente"}
                  </Badge>
                  <Button variant="secondary" size="sm">
                    Atribuir treinador
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </motion.div>
    </div>
  );
}
