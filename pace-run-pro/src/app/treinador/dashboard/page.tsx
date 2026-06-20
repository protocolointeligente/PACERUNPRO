"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import {
  AlertTriangle,
  ArrowRight,
  ClipboardCheck,
  Flame,
  ShieldAlert,
  Users,
  Wallet,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { SectionHeader } from "@/components/shared/section-header";
import { InfoTooltip } from "@/components/ui/info-tooltip";
import { athleteList, coachOverview } from "@/lib/mock-data";
import { cn } from "@/lib/utils";

const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  show: (i: number = 0) => ({ opacity: 1, y: 0, transition: { delay: i * 0.06, duration: 0.4, ease: "easeOut" as const } }),
};

const TODAY_ACTIONS = [
  {
    id: "intervencao",
    label: "atletas precisam de intervenção",
    value: 0,
    icon: ShieldAlert,
    color: "danger" as const,
    href: "/treinador/alertas",
    cta: "Ver alertas",
  },
  {
    id: "checkins",
    label: "check-ins pendentes de revisão",
    value: 0,
    icon: ClipboardCheck,
    color: "warning" as const,
    href: "/treinador/alunos",
    cta: "Revisar check-ins",
  },
  {
    id: "liberacao",
    label: "treinos aguardam liberação",
    value: 0,
    icon: Flame,
    color: "info" as const,
    href: "/treinador/alunos",
    cta: "Liberar treinos",
  },
  {
    id: "inadimplencia",
    label: "em inadimplência",
    value: "R$ 0",
    icon: Wallet,
    color: "text-muted" as const,
    href: "/treinador/crm",
    cta: "Ver financeiro",
  },
];

const colorMap = {
  danger: { border: "border-danger/30", bg: "bg-danger/8", text: "text-danger", icon: "bg-danger/15 text-danger" },
  warning: { border: "border-warning/30", bg: "bg-warning/8", text: "text-warning", icon: "bg-warning/15 text-warning" },
  info: { border: "border-info/30", bg: "bg-info/8", text: "text-info", icon: "bg-info/15 text-info" },
  "text-muted": { border: "border-border", bg: "bg-card-hover", text: "text-text", icon: "bg-card-hover text-text-muted" },
};

export default function CoachDashboard() {
  const athletesAtRisk = athleteList.filter((a) => a.status === "risco");

  return (
    <div className="mx-auto max-w-6xl space-y-7">
      {/* Greeting */}
      <motion.div variants={fadeUp} initial="hidden" animate="show" className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-sm text-text-muted">Painel do treinador</p>
          <h1 className="font-display text-2xl font-bold text-text sm:text-3xl">
            Olá, {coachOverview.name.split(" ")[0]}
          </h1>
          <p className="mt-1 text-xs text-text-muted">{coachOverview.credential}</p>
        </div>
        <Link href="/treinador/prescricao/corrida">
          <Button size="lg">Nova prescrição</Button>
        </Link>
      </motion.div>

      {/* Ações de hoje */}
      <motion.div custom={1} variants={fadeUp} initial="hidden" animate="show">
        <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-text-muted">
          Ações de hoje
        </p>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {TODAY_ACTIONS.map((action) => {
            const Icon = action.icon;
            const c = colorMap[action.color];
            return (
              <Link key={action.id} href={action.href}>
                <div
                  className={cn(
                    "group relative flex flex-col gap-3 rounded-2xl border p-5 transition-all duration-200 hover:shadow-lg",
                    c.border, c.bg
                  )}
                >
                  <div className={cn("flex h-10 w-10 items-center justify-center rounded-xl", c.icon)}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <div>
                    <div className={cn("font-display text-2xl font-extrabold", c.text)}>
                      {action.value}
                    </div>
                    <p className="mt-0.5 text-xs text-text-muted leading-snug">{action.label}</p>
                  </div>
                  <span className="inline-flex items-center gap-1 text-xs font-semibold text-text-muted group-hover:text-text transition-colors">
                    {action.cta} <ArrowRight className="h-3 w-3" />
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      </motion.div>

      {/* Visão geral */}
      <motion.div custom={2} variants={fadeUp} initial="hidden" animate="show" className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {[
          { label: "Total de atletas", value: coachOverview.athletesCount, icon: Users, accent: "text-primary" },
          { label: "Treinos prescritos / sem", value: coachOverview.prescribedThisWeek, icon: ClipboardCheck, accent: "text-info" },
          { label: "Atletas em risco", value: coachOverview.athletesAtRisk, icon: AlertTriangle, accent: "text-danger" },
        ].map(({ label, value, icon: Icon, accent }) => (
          <Card key={label}>
            <CardContent className="flex items-center gap-3 p-4">
              <Icon className={cn("h-5 w-5 shrink-0", accent)} />
              <div>
                <p className="font-display text-xl font-bold text-text">{value}</p>
                <p className="text-xs text-text-muted">{label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </motion.div>

      <div className="grid gap-5 lg:grid-cols-3">
        {/* Atletas em risco */}
        <motion.div custom={3} variants={fadeUp} initial="hidden" animate="show" className="lg:col-span-2 space-y-5">
          <SectionHeader title="Atletas que precisam de atenção" href="/treinador/alunos" />
          <div className="space-y-3">
            {athletesAtRisk.map((a) => (
              <Link key={a.id} href={`/treinador/alunos/${a.id}`}>
                <Card hover className="p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <span className="flex h-10 w-10 items-center justify-center rounded-full bg-danger/15 font-display text-sm font-bold text-danger">
                        {a.name.split(" ").map((n) => n[0]).slice(0, 2).join("")}
                      </span>
                      <div>
                        <p className="text-sm font-semibold text-text">{a.name}</p>
                        <p className="text-xs text-text-muted">Meta: {a.goal} · {a.level}</p>
                      </div>
                    </div>
                    <Badge variant="danger">Em risco</Badge>
                  </div>
                  <div className="mt-3 grid grid-cols-2 gap-2 text-xs text-text-muted sm:grid-cols-3 sm:gap-3">
                    <span>Adesão: <span className="font-semibold text-text">{Math.round(a.adherence * 100)}%</span></span>
                    <span>Carga: <span className="font-semibold text-text">{a.weeklyLoad} UA</span></span>
                    <span>Último check-in: <span className="font-semibold text-text">{a.lastCheckIn}</span></span>
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        </motion.div>

        {/* Carga da equipe */}
        <motion.div custom={4} variants={fadeUp} initial="hidden" animate="show" className="space-y-5">
          <Card>
            <CardContent className="p-5">
              <h3 className="mb-4 flex items-center gap-1.5 font-display text-base font-semibold text-text">
                Carga da equipe
                <InfoTooltip text="UA = Unidades Arbitrárias. Mede a carga combinando duração (min) × RPE de cada sessão, somadas na semana." />
              </h3>
              <div className="space-y-3">
                {athleteList.slice(0, 6).map((a) => (
                  <div key={a.id}>
                    <div className="mb-1 flex items-center justify-between text-xs">
                      <span className="truncate text-text-muted">{a.name}</span>
                      <span className="font-semibold text-text">{a.weeklyLoad} UA</span>
                    </div>
                    <Progress
                      value={(a.weeklyLoad / 500) * 100}
                      colorClassName={cn(
                        a.status === "risco" ? "bg-danger" :
                        a.status === "ativo" ? "bg-success" : "bg-text-muted"
                      )}
                    />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="border-primary/30 bg-gradient-to-br from-primary/10 to-card">
            <CardContent className="p-5">
              <h3 className="font-display text-base font-semibold text-text">Liberação semanal</h3>
              <p className="mt-1.5 text-sm text-text-muted">
                Nenhum treino aguarda liberação esta semana.
              </p>
              <Link href="/treinador/alunos">
                <Button className="mt-3 w-full">Revisar liberações</Button>
              </Link>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
