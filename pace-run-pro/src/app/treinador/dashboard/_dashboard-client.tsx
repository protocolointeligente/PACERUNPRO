"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  ArrowRight,
  CalendarDays,
  ClipboardCheck,
  Dumbbell,
  Library,
  Plus,
  ShieldAlert,
  Users,
  Wallet,
  Flame,
  MessageSquare,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { CoachOnboardingSteps } from "@/components/coach/onboarding-steps";

export interface AthleteRow {
  id: string;
  name: string;
  goal: string;
  level: string;
  status: "ativo" | "risco" | "inativo";
  adherence: number;
  weeklyLoad: number;
  lastCheckIn: string;
  primarySport?: string | null;
}

export interface CoachDashboardProps {
  firstName: string;
  credential: string;
  athleteCount: number;
  athletesAtRisk: number;
  athletes: AthleteRow[];
}

interface ActionCenterData {
  athletesTotal: number;
  athletesWithoutWorkout: number;
  unreleasedWorkouts: number;
  missedWorkouts: number;
  flaggedCheckins: number;
  workoutsThisWeek: number;
}

const SPORT_EMOJI: Record<string, string> = {
  RUN: "🏃", BIKE: "🚴", SWIM: "🏊", STRENGTH: "🏋️",
  MOBILITY: "🧘", TRIATHLON: "🏅", BRICK: "⚡",
};

const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  show: (i: number = 0) => ({
    opacity: 1, y: 0,
    transition: { delay: i * 0.06, duration: 0.4, ease: "easeOut" as const },
  }),
};

const QUICK_ACTIONS = [
  { label: "Prescrever", description: "Corrida, bike, natação...", href: "/treinador/prescricao/corrida", icon: Plus, color: "#C6F24E", bg: "rgba(198,242,78,0.12)" },
  { label: "Criar semana", description: "Periodização completa", href: "/treinador/prescricao/periodizacao", icon: CalendarDays, color: "#46E0C8", bg: "rgba(70,224,200,0.12)" },
  { label: "Força / Mob.", description: "Prescrever força e mobilidade", href: "/treinador/prescricao/forca", icon: Dumbbell, color: "#B78BFF", bg: "rgba(183,139,255,0.12)" },
  { label: "Biblioteca", description: "Modelos de treino multisport", href: "/treinador/biblioteca", icon: Library, color: "#FFB020", bg: "rgba(255,176,32,0.12)" },
];

export default function CoachDashboard({ firstName, credential, athleteCount, athletesAtRisk: riskCount, athletes }: CoachDashboardProps) {
  const [center, setCenter] = useState<ActionCenterData | null>(null);

  useEffect(() => {
    fetch("/api/coach/action-center")
      .then((r) => r.ok ? r.json() : null)
      .then((d: ActionCenterData | null) => setCenter(d))
      .catch(() => null);
  }, []);

  const athletesAtRisk = athletes.filter((a) => a.status === "risco");

  const todayActions = [
    { id: "sem-treino", label: "sem treino esta semana", value: center ? center.athletesWithoutWorkout : null, icon: Users, href: "/treinador/atletas?filtro=sem-treino", accent: "#FFB020" },
    { id: "liberacao", label: "aguardando liberação", value: center ? center.unreleasedWorkouts : null, icon: Flame, href: "/treinador/atletas", accent: "#3FA7FF" },
    { id: "perdidos", label: "treinos não realizados", value: center ? center.missedWorkouts : null, icon: ShieldAlert, href: "/treinador/alertas", accent: "#FF5A4D" },
    { id: "checkins", label: "check-ins sinalizados", value: center ? center.flaggedCheckins : null, icon: ClipboardCheck, href: "/treinador/atletas", accent: "#FFB020" },
  ];

  const stats = [
    { label: "Atletas ativos", value: athleteCount, color: "#C6F24E" },
    { label: "Treinos esta semana", value: center?.workoutsThisWeek ?? "—", color: "#46E0C8" },
    { label: "Em risco", value: riskCount, color: riskCount > 0 ? "#FF5A4D" : "#5C636B" },
  ];

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <CoachOnboardingSteps athleteCount={athleteCount} />

      {/* Greeting */}
      <motion.div variants={fadeUp} initial="hidden" animate="show"
        className="flex flex-wrap items-center justify-between gap-4"
      >
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.14em]" style={{ color: "#5C636B" }}>
            Painel do Treinador
          </p>
          <h1 className="mt-1 text-2xl font-bold sm:text-3xl" style={{ fontFamily: "'Archivo', sans-serif", color: "#ECEAE3" }}>
            Olá, {firstName}
          </h1>
          {credential && (
            <p className="mt-0.5 text-xs" style={{ color: "#5C636B" }}>{credential}</p>
          )}
        </div>
        <Link href="/treinador/atletas/convidar">
          <button
            className="flex items-center gap-1.5 rounded-xl px-4 py-2.5 text-sm font-semibold transition-opacity hover:opacity-90"
            style={{ background: "rgba(198,242,78,0.12)", color: "#C6F24E", border: "1px solid rgba(198,242,78,0.2)" }}
          >
            <Plus className="h-4 w-4" />
            Convidar atleta
          </button>
        </Link>
      </motion.div>

      {/* Stats row */}
      <motion.div custom={0.5} variants={fadeUp} initial="hidden" animate="show"
        className="grid grid-cols-3 gap-3"
      >
        {stats.map((s) => (
          <div
            key={s.label}
            className="rounded-2xl px-4 py-3 text-center"
            style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}
          >
            <p
              className="text-2xl font-bold"
              style={{ fontFamily: "'JetBrains Mono', monospace", color: s.color }}
            >
              {s.value}
            </p>
            <p className="mt-0.5 text-[11px]" style={{ color: "#5C636B" }}>{s.label}</p>
          </div>
        ))}
      </motion.div>

      {/* Quick actions */}
      <motion.div custom={1} variants={fadeUp} initial="hidden" animate="show">
        <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.14em]" style={{ color: "#5C636B" }}>
          Ações rápidas
        </p>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {QUICK_ACTIONS.map((action) => {
            const Icon = action.icon;
            return (
              <Link key={action.href} href={action.href}>
                <div
                  className="flex flex-col gap-3 rounded-2xl p-4 transition-all duration-200"
                  style={{
                    background: "rgba(255,255,255,0.03)",
                    border: "1px solid rgba(255,255,255,0.06)",
                  }}
                >
                  <div
                    className="flex h-9 w-9 items-center justify-center rounded-xl"
                    style={{ background: action.bg }}
                  >
                    <Icon className="h-4 w-4" style={{ color: action.color }} />
                  </div>
                  <div>
                    <p className="text-sm font-semibold" style={{ color: "#ECEAE3" }}>{action.label}</p>
                    <p className="mt-0.5 text-[11px] leading-snug" style={{ color: "#5C636B" }}>{action.description}</p>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </motion.div>

      {/* Action center */}
      <motion.div custom={2} variants={fadeUp} initial="hidden" animate="show">
        <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.14em]" style={{ color: "#5C636B" }}>
          Requer ação hoje
        </p>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {todayActions.map((action) => {
            const Icon = action.icon;
            const val = action.value;
            const hasAlert = val !== null && val > 0;
            return (
              <Link key={action.id} href={action.href}>
                <div
                  className="flex flex-col gap-2 rounded-2xl p-4"
                  style={{
                    background: hasAlert ? `${action.accent}10` : "rgba(255,255,255,0.03)",
                    border: hasAlert ? `1px solid ${action.accent}30` : "1px solid rgba(255,255,255,0.06)",
                  }}
                >
                  <Icon className="h-5 w-5" style={{ color: hasAlert ? action.accent : "#5C636B" }} />
                  <p
                    className="text-2xl font-bold"
                    style={{ fontFamily: "'JetBrains Mono', monospace", color: hasAlert ? action.accent : "#5C636B" }}
                  >
                    {val === null ? "—" : val}
                  </p>
                  <p className="text-[11px] leading-snug" style={{ color: "#5C636B" }}>{action.label}</p>
                  <span className="flex items-center gap-0.5 text-[11px] font-semibold" style={{ color: "#5C636B" }}>
                    Ver <ArrowRight className="h-3 w-3" />
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      </motion.div>

      {/* Atletas em risco + carga */}
      <div className="grid gap-5 lg:grid-cols-3">
        <motion.div custom={3} variants={fadeUp} initial="hidden" animate="show" className="space-y-3 lg:col-span-2">
          <div className="flex items-center justify-between">
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em]" style={{ color: "#5C636B" }}>
              Atletas em atenção
            </p>
            <Link href="/treinador/atletas" className="text-xs font-semibold" style={{ color: "#C6F24E" }}>
              Ver todos →
            </Link>
          </div>
          {athletesAtRisk.length === 0 ? (
            <div
              className="flex flex-col items-center gap-3 rounded-2xl py-10 text-center"
              style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-full" style={{ background: "rgba(70,224,160,0.12)" }}>
                <Users className="h-6 w-6" style={{ color: "#46E0A0" }} />
              </div>
              <p className="text-sm font-semibold" style={{ color: "#ECEAE3" }}>Nenhum atleta em risco</p>
              <p className="text-xs" style={{ color: "#5C636B" }}>Todos os atletas estão ativos.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {athletesAtRisk.map((a) => (
                <Link key={a.id} href={`/treinador/atletas/${a.id}`}>
                  <div
                    className="flex items-center gap-3 rounded-2xl px-4 py-3 transition-opacity hover:opacity-90"
                    style={{
                      background: "rgba(255,90,77,0.06)",
                      border: "1px solid rgba(255,90,77,0.2)",
                    }}
                  >
                    <div
                      className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-bold"
                      style={{ background: "rgba(255,90,77,0.15)", color: "#FF5A4D" }}
                    >
                      {a.name.split(" ").map((n) => n[0]).slice(0, 2).join("")}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold" style={{ color: "#ECEAE3" }}>{a.name}</p>
                      <p className="text-xs" style={{ color: "#5C636B" }}>
                        {a.primarySport && a.primarySport !== "RUN" && (
                          <span className="mr-1">{SPORT_EMOJI[a.primarySport] ?? ""}</span>
                        )}
                        {a.goal} · {a.level}
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-xs font-semibold" style={{ color: "#FF5A4D" }}>Em risco</p>
                      <p className="text-[11px]" style={{ color: "#5C636B" }}>Últ.: {a.lastCheckIn}</p>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </motion.div>

        {/* Carga da equipe */}
        <motion.div custom={4} variants={fadeUp} initial="hidden" animate="show">
          <div className="flex items-center justify-between mb-3">
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em]" style={{ color: "#5C636B" }}>
              Carga da equipe
            </p>
          </div>
          <div
            className="rounded-2xl p-4 space-y-3"
            style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}
          >
            {athletes.length === 0 ? (
              <p className="py-4 text-center text-sm" style={{ color: "#5C636B" }}>Nenhum atleta ainda.</p>
            ) : (
              athletes.slice(0, 6).map((a) => {
                const barColor = a.status === "risco" ? "#FF5A4D" : a.status === "ativo" ? "#46E0A0" : "#5C636B";
                const pct = Math.min((a.weeklyLoad / 500) * 100, 100);
                return (
                  <div key={a.id}>
                    <div className="mb-1 flex items-center justify-between text-xs">
                      <span className="truncate" style={{ color: "#9AA0A6" }}>
                        {a.primarySport && a.primarySport !== "RUN" && (
                          <span className="mr-1">{SPORT_EMOJI[a.primarySport] ?? ""}</span>
                        )}
                        {a.name}
                      </span>
                      <span className="font-semibold font-mono" style={{ color: "#ECEAE3" }}>{a.weeklyLoad}</span>
                    </div>
                    <div className="h-1.5 w-full rounded-full" style={{ background: "rgba(255,255,255,0.08)" }}>
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{ width: `${pct}%`, background: barColor }}
                      />
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Quick message CTA */}
          <Link href="/treinador/mensagens" className="mt-3 block">
            <div
              className="flex items-center gap-3 rounded-2xl px-4 py-3"
              style={{ background: "rgba(198,242,78,0.06)", border: "1px solid rgba(198,242,78,0.15)" }}
            >
              <MessageSquare className="h-5 w-5 shrink-0" style={{ color: "#C6F24E" }} />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold" style={{ color: "#ECEAE3" }}>Mensagens</p>
                <p className="text-xs" style={{ color: "#5C636B" }}>Conversar com atletas</p>
              </div>
              <ArrowRight className="h-4 w-4 shrink-0" style={{ color: "#5C636B" }} />
            </div>
          </Link>

          {center && center.unreleasedWorkouts > 0 && (
            <Link href="/treinador/atletas" className="mt-3 block">
              <div
                className="flex items-center gap-3 rounded-2xl px-4 py-3"
                style={{ background: "rgba(255,176,32,0.06)", border: "1px solid rgba(255,176,32,0.2)" }}
              >
                <Wallet className="h-5 w-5 shrink-0" style={{ color: "#FFB020" }} />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold" style={{ color: "#ECEAE3" }}>Liberação pendente</p>
                  <p className="text-xs" style={{ color: "#5C636B" }}>
                    {center.unreleasedWorkouts} {center.unreleasedWorkouts === 1 ? "treino aguarda" : "treinos aguardam"}
                  </p>
                </div>
                <Button
                  size="sm"
                  className="shrink-0 text-xs"
                  style={{ background: "#FFB020", color: "#0A0C0F" }}
                >
                  Liberar
                </Button>
              </div>
            </Link>
          )}
        </motion.div>
      </div>
    </div>
  );
}
