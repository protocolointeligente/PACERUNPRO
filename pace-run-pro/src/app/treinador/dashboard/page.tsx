"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { AlertTriangle, ClipboardCheck, Flame, Info, ShieldAlert, Users } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { SectionHeader } from "@/components/shared/section-header";
import { StatCard } from "@/components/dashboard/stat-card";
import { athleteList, coachOverview } from "@/lib/mock-data";
import { cn } from "@/lib/utils";

const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  show: (i: number = 0) => ({ opacity: 1, y: 0, transition: { delay: i * 0.06, duration: 0.4, ease: "easeOut" as const } }),
};

const severityIcon = { danger: ShieldAlert, warning: AlertTriangle, info: Info } as const;
const severityVariant = { danger: "danger", warning: "warning", info: "info" } as const;

export default function CoachDashboard() {
  const athletesAtRisk = athleteList.filter((a) => a.status === "risco");

  return (
    <div className="mx-auto max-w-6xl space-y-7">
      <motion.div variants={fadeUp} initial="hidden" animate="show" className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-sm text-text-muted">Painel do treinador</p>
          <h1 className="font-display text-2xl font-bold text-text sm:text-3xl">Olá, {coachOverview.name.split(" ")[0]} 👋</h1>
          <p className="mt-1 text-xs text-text-muted">{coachOverview.credential}</p>
        </div>
        <Link href="/treinador/prescricao/corrida">
          <Button size="lg">Nova prescrição</Button>
        </Link>
      </motion.div>

      <motion.div custom={1} variants={fadeUp} initial="hidden" animate="show" className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        <StatCard label="Atletas" value={`${coachOverview.athletesCount}`} icon={Users} accent="primary" />
        <StatCard label="Treinos prescritos" value={`${coachOverview.prescribedThisWeek}`} unit="/ sem" icon={ClipboardCheck} accent="info" />
        <StatCard label="Check-ins pendentes" value={`${coachOverview.pendingCheckIns}`} icon={ClipboardCheck} accent="warning" />
        <StatCard label="Atletas em risco" value={`${coachOverview.athletesAtRisk}`} icon={ShieldAlert} accent="danger" />
        <StatCard label="Carga da equipe" value={`${Math.round(coachOverview.teamLoad * 100)}%`} icon={Flame} accent="success" hint="da capacidade planejada" />
      </motion.div>

      <div className="grid gap-5 lg:grid-cols-3">
        {/* Alerts */}
        <motion.div custom={2} variants={fadeUp} initial="hidden" animate="show" className="lg:col-span-2">
          <SectionHeader title="Alertas inteligentes" subtitle="Gerados automaticamente a partir dos check-ins dos seus atletas" />
          <div className="space-y-3">
            {coachOverview.alerts.map((a) => {
              const Icon = severityIcon[a.severity];
              return (
                <Card key={a.id}>
                  <CardContent className="flex items-start gap-3 p-4">
                    <Badge variant={severityVariant[a.severity]} className="mt-0.5 shrink-0">
                      <Icon className="h-3 w-3" />
                    </Badge>
                    <p className="text-sm text-text-muted">{a.text}</p>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          <div className="mt-6">
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
                    <div className="mt-3 grid grid-cols-2 gap-3 text-xs text-text-muted sm:grid-cols-3">
                      <span>Adesão: <span className="font-semibold text-text">{Math.round(a.adherence * 100)}%</span></span>
                      <span>Carga semanal: <span className="font-semibold text-text">{a.weeklyLoad} UA</span></span>
                      <span>Último check-in: <span className="font-semibold text-text">{a.lastCheckIn}</span></span>
                    </div>
                  </Card>
                </Link>
              ))}
            </div>
          </div>
        </motion.div>

        {/* Team load */}
        <motion.div custom={3} variants={fadeUp} initial="hidden" animate="show" className="space-y-5">
          <Card>
            <CardContent className="p-5">
              <h3 className="mb-4 font-display text-base font-semibold text-text">Carga da equipe</h3>
              <div className="space-y-3">
                {athleteList.slice(0, 6).map((a) => (
                  <div key={a.id}>
                    <div className="mb-1 flex items-center justify-between text-xs">
                      <span className="truncate text-text-muted">{a.name}</span>
                      <span className="font-semibold text-text">{a.weeklyLoad} UA</span>
                    </div>
                    <Progress
                      value={(a.weeklyLoad / 500) * 100}
                      colorClassName={cn(a.status === "risco" ? "bg-danger" : a.status === "ativo" ? "bg-success" : "bg-text-muted")}
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
                Camila Andrade aguarda liberação da próxima semana de treinos. Revise e libere blocos específicos do plano.
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
