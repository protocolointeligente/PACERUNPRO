"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Activity,
  AlertTriangle,
  Bell,
  BellOff,
  CalendarClock,
  CheckCheck,
  ChevronRight,
  Clock,
  MessageSquare,
  Zap,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { smartAlerts, type SmartAlert, type AlertSeverity } from "@/lib/mock-data";
import { cn } from "@/lib/utils";

interface ExpiringPlan {
  planId: string;
  athleteId: string;
  athleteName: string;
  endDate: string;
  daysLeft: number;
}

const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  show: (i: number = 0) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.06, duration: 0.4, ease: "easeOut" as const },
  }),
};

const FILTERS: { value: AlertSeverity | "todos"; label: string }[] = [
  { value: "todos", label: "Todos" },
  { value: "critico", label: "Crítico" },
  { value: "atencao", label: "Atenção" },
  { value: "info", label: "Informativo" },
];

const SIGNAL_ROWS: { color: string; text: string }[] = [
  { color: "bg-danger", text: "Ausência de treino > 5 dias" },
  { color: "bg-danger", text: "Dor ≥ 7 por 3 dias seguidos" },
  { color: "bg-danger", text: "Carga acumulada > 130% do baseline" },
  { color: "bg-warning", text: "FC em Z2 crescendo > 10%" },
  { color: "bg-warning", text: "Adesão semanal < 65%" },
  { color: "bg-warning", text: "Volume abaixo da meta > 30%" },
  { color: "bg-info", text: "Melhoras de performance notáveis" },
];

function SeverityIcon({ severity }: { severity: SmartAlert["severity"] }) {
  if (severity === "critico") return <AlertTriangle className="h-5 w-5" />;
  if (severity === "atencao") return <Clock className="h-5 w-5" />;
  return <Activity className="h-5 w-5" />;
}

export default function AlertasPage() {
  const [alerts, setAlerts] = useState(smartAlerts);
  const [filter, setFilter] = useState<AlertSeverity | "todos">("todos");
  const [expiringPlans, setExpiringPlans] = useState<ExpiringPlan[]>([]);

  useEffect(() => {
    fetch("/api/treinador/alertas")
      .then((r) => r.ok ? r.json() : null)
      .then((data) => {
        if (data?.expiringPlans) setExpiringPlans(data.expiringPlans);
      })
      .catch(() => null);
  }, []);

  const unread = alerts.filter((a) => !a.read).length;
  const criticos = alerts.filter((a) => a.severity === "critico" && !a.read).length;
  const atencao = alerts.filter((a) => a.severity === "atencao").length;
  const info = alerts.filter((a) => a.severity === "info").length;

  function markRead(id: string) {
    setAlerts((prev) => prev.map((a) => (a.id === id ? { ...a, read: true } : a)));
  }

  function markAllRead() {
    setAlerts((prev) => prev.map((a) => ({ ...a, read: true })));
  }

  const filtered = filter === "todos" ? alerts : alerts.filter((a) => a.severity === filter);

  return (
    <div className="mx-auto max-w-6xl space-y-7">
      {/* Header */}
      <motion.div variants={fadeUp} initial="hidden" animate="show">
        <Badge variant="primary" className="mb-3">
          <Bell className="h-3 w-3" />
          Central de Alertas
        </Badge>
        <h1 className="font-display text-2xl font-bold text-text sm:text-3xl">
          Alertas inteligentes
        </h1>
        <p className="mt-1.5 max-w-2xl text-sm text-text-muted">
          O sistema monitora todos os seus atletas automaticamente e sinaliza riscos antes que se
          tornem problemas.
        </p>
      </motion.div>

      {/* Stats row */}
      <motion.div
        custom={1}
        variants={fadeUp}
        initial="hidden"
        animate="show"
        className="grid grid-cols-3 gap-3"
      >
        <div className="rounded-2xl border border-danger/30 bg-danger/5 p-4">
          <p className="text-xs text-text-muted">Críticos</p>
          <p className="mt-1 font-display text-2xl font-bold text-danger">{criticos}</p>
        </div>
        <div className="rounded-2xl border border-warning/30 bg-warning/5 p-4">
          <p className="text-xs text-text-muted">Atenção</p>
          <p className="mt-1 font-display text-2xl font-bold text-warning">{atencao}</p>
        </div>
        <div className="rounded-2xl border border-info/30 bg-info/5 p-4">
          <p className="text-xs text-text-muted">Informativos</p>
          <p className="mt-1 font-display text-2xl font-bold text-info">{info}</p>
        </div>
      </motion.div>

      {/* Expiring periodizations banner */}
      {expiringPlans.length > 0 && (
        <motion.div custom={2} variants={fadeUp} initial="hidden" animate="show">
          <Card className="border-warning/40 bg-warning/5">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-3">
                <CalendarClock className="h-4 w-4 text-warning" />
                <h3 className="text-sm font-semibold text-text">
                  Periodizações próximas do vencimento
                </h3>
                <Badge variant="warning" className="ml-auto">{expiringPlans.length}</Badge>
              </div>
              <div className="space-y-2">
                {expiringPlans.map((p) => (
                  <div key={p.planId} className="flex items-center justify-between gap-3 rounded-xl bg-card-hover px-3 py-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className={cn(
                        "h-2 w-2 shrink-0 rounded-full",
                        p.daysLeft <= 2 ? "bg-danger" : "bg-warning"
                      )} />
                      <span className="text-sm font-medium text-text truncate">{p.athleteName}</span>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className={cn(
                        "text-xs font-semibold",
                        p.daysLeft <= 2 ? "text-danger" : "text-warning"
                      )}>
                        {p.daysLeft === 0 ? "Vence hoje" : p.daysLeft === 1 ? "Vence amanhã" : `${p.daysLeft} dias`}
                      </span>
                      <a
                        href={`/treinador/prescricao/periodizacao`}
                        className="text-xs text-primary hover:underline"
                      >
                        Renovar →
                      </a>
                    </div>
                  </div>
                ))}
              </div>
              <p className="mt-3 text-xs text-text-muted">
                Gere uma nova periodização para estes atletas para continuar a prescrição automaticamente.
              </p>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Main layout */}
      <motion.div
        custom={3}
        variants={fadeUp}
        initial="hidden"
        animate="show"
        className="grid gap-6 lg:grid-cols-[1fr_18rem]"
      >
        {/* Left — alert list */}
        <div className="space-y-4">
          {/* Filter bar */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap gap-2">
              {FILTERS.map((f) => (
                <button
                  key={f.value}
                  onClick={() => setFilter(f.value)}
                  className={cn(
                    "rounded-xl border px-3.5 py-1.5 text-xs font-semibold transition-all",
                    filter === f.value
                      ? "border-primary/60 bg-primary/15 text-primary"
                      : "border-border bg-card text-text-muted hover:border-primary/30 hover:text-text"
                  )}
                >
                  {f.label}
                </button>
              ))}
            </div>
            {unread > 0 && (
              <Button size="sm" variant="ghost" onClick={markAllRead} className="shrink-0">
                <CheckCheck className="h-3.5 w-3.5" />
                Marcar todos como lidos
              </Button>
            )}
          </div>

          {/* Alert cards */}
          <div className="space-y-3">
            <AnimatePresence mode="popLayout">
              {filtered.length === 0 ? (
                <motion.div
                  key="empty"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="flex flex-col items-center gap-3 py-16 text-center"
                >
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-success/15">
                    <BellOff className="h-7 w-7 text-success" />
                  </div>
                  <p className="font-display text-base font-semibold text-text">
                    Nenhum alerta {filter !== "todos" ? "neste filtro" : "ativo"}
                  </p>
                  <p className="text-sm text-text-muted">
                    Todos os seus atletas estão dentro dos parâmetros normais.
                  </p>
                </motion.div>
              ) : (
                filtered.map((a) => (
                  <motion.div
                    key={a.id}
                    layout
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                  >
                    <Card
                      className={cn(
                        "transition-all cursor-default",
                        !a.read && a.severity === "critico" && "border-danger/40 bg-danger/5",
                        !a.read && a.severity === "atencao" && "border-warning/40 bg-warning/5",
                        !a.read && a.severity === "info" && "border-info/20",
                        a.read && "opacity-60"
                      )}
                    >
                      <CardContent className="flex items-start gap-4 p-4">
                        {/* Severity icon */}
                        <span
                          className={cn(
                            "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl mt-0.5",
                            a.severity === "critico" && "bg-danger/15 text-danger",
                            a.severity === "atencao" && "bg-warning/15 text-warning",
                            a.severity === "info" && "bg-info/15 text-info"
                          )}
                        >
                          <SeverityIcon severity={a.severity} />
                        </span>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <p className="text-sm font-semibold text-text">{a.title}</p>
                              <p className="text-xs text-text-muted mt-0.5">
                                {a.athleteName} ·{" "}
                                {a.daysAgo === 0 ? "Hoje" : `${a.daysAgo}d atrás`}
                              </p>
                            </div>
                            <div className="flex items-center gap-2 shrink-0">
                              {!a.read && (
                                <span className="h-2 w-2 rounded-full bg-primary" />
                              )}
                              <Badge
                                variant={
                                  a.severity === "critico"
                                    ? "danger"
                                    : a.severity === "atencao"
                                    ? "warning"
                                    : "info"
                                }
                              >
                                {a.severity === "critico"
                                  ? "Crítico"
                                  : a.severity === "atencao"
                                  ? "Atenção"
                                  : "Info"}
                              </Badge>
                            </div>
                          </div>

                          <p className="text-sm text-text-muted mt-1.5 leading-relaxed">
                            {a.description}
                          </p>

                          {a.metric && (
                            <span className="mt-2 inline-block rounded-lg bg-card-hover px-2.5 py-1 text-xs font-semibold text-text">
                              {a.metric}
                            </span>
                          )}

                          {a.recommendation && (
                            <div className={cn(
                              "mt-3 rounded-xl border-l-2 bg-card-hover px-3 py-2.5",
                              a.severity === "critico" && "border-danger",
                              a.severity === "atencao" && "border-warning",
                              a.severity === "info" && "border-info",
                            )}>
                              <p className="text-xs font-semibold text-text-muted uppercase tracking-wide mb-0.5">
                                Recomendação
                              </p>
                              <p className="text-xs text-text leading-relaxed">{a.recommendation}</p>
                            </div>
                          )}

                          <div className="mt-3 flex flex-wrap items-center gap-2">
                            {a.severity !== "info" && (
                              <Button
                                size="sm"
                                variant="primary"
                                onClick={() => markRead(a.id)}
                                disabled={a.read}
                                className="gap-1.5"
                              >
                                <Zap className="h-3.5 w-3.5" />
                                Aplicar ajuste
                              </Button>
                            )}
                            <Button
                              size="sm"
                              variant="secondary"
                              className="gap-1.5"
                            >
                              <MessageSquare className="h-3.5 w-3.5" />
                              Enviar mensagem
                            </Button>
                            <a
                              href={`/treinador/alunos/${a.athleteId}`}
                              className={cn(
                                "inline-flex items-center gap-1 rounded-xl px-3.5 py-2 text-xs font-semibold transition-all",
                                "text-text-muted hover:text-text hover:bg-card"
                              )}
                            >
                              Ver atleta <ChevronRight className="h-3.5 w-3.5" />
                            </a>
                            {!a.read && (
                              <button
                                onClick={() => markRead(a.id)}
                                className="ml-auto text-xs text-text-muted hover:text-text transition-colors"
                              >
                                <CheckCheck className="h-3.5 w-3.5 inline mr-1" />
                                Lido
                              </button>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Right — how it works */}
        <div className="space-y-4">
          <Card>
            <CardContent className="p-5">
              <h3 className="font-display text-base font-semibold text-text mb-1">
                Como funcionam os alertas
              </h3>
              <p className="text-xs text-text-muted mb-4 leading-relaxed">
                O sistema monitora 7 sinais automaticamente a partir dos check-ins e dados de
                treino de cada atleta.
              </p>
              <div className="space-y-3">
                {SIGNAL_ROWS.map((s, i) => (
                  <div key={i} className="flex items-center gap-2.5">
                    <span className={cn("h-2 w-2 shrink-0 rounded-full", s.color)} />
                    <p className="text-xs text-text-muted leading-snug">{s.text}</p>
                  </div>
                ))}
              </div>
              <div className="mt-5 rounded-xl border border-border bg-card-hover p-3">
                <p className="text-xs text-text-muted leading-relaxed">
                  Os alertas são gerados automaticamente — você não precisa monitorar cada atleta
                  individualmente. O sistema faz isso por você.
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="border-primary/20 bg-gradient-to-br from-primary/8 to-card">
            <CardContent className="p-5">
              <div className="flex items-center gap-2 mb-2">
                <Bell className="h-4 w-4 text-primary" />
                <h3 className="font-display text-sm font-semibold text-text">
                  Notificações ativas
                </h3>
              </div>
              <p className="text-xs text-text-muted leading-relaxed">
                Você receberá notificações por push e e-mail sempre que um alerta crítico for
                gerado. Configure suas preferências em{" "}
                <a href="/treinador/admin" className="text-primary hover:underline">
                  Configurações
                </a>
                .
              </p>
            </CardContent>
          </Card>
        </div>
      </motion.div>
    </div>
  );
}
