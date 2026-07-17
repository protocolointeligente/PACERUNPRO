"use client";

import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Activity, ArrowLeft, Clock, Filter, HeartPulse, MapPin } from "lucide-react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

type TimelineEventType = "treino" | "prova" | "feedback";
type FilterValue = TimelineEventType | "todos";

interface AthleteLog {
  id: string;
  source: string | null;
  distanceKm: number | null;
  durationSec: number | null;
  avgPaceSecPerKm: number | null;
  rpe: number | null;
  finishedAt: string | null;
  createdAt: string;
  workout: {
    title: string | null;
    type: string;
    date: string;
  } | null;
  _count?: { comments: number };
}

interface TimelineEvent {
  id: string;
  type: TimelineEventType;
  date: string;
  title: string;
  subtitle?: string;
  detail?: string;
  badge?: string;
}

const filterOptions: { label: string; value: FilterValue }[] = [
  { label: "Todos", value: "todos" },
  { label: "Treinos", value: "treino" },
  { label: "Provas", value: "prova" },
  { label: "Feedbacks", value: "feedback" },
];

function getIcon(type: TimelineEventType) {
  if (type === "prova") return MapPin;
  if (type === "feedback") return HeartPulse;
  return Activity;
}

function formatMonthYear(dateStr: string): string {
  const d = new Date(dateStr + "T12:00:00");
  return d.toLocaleDateString("pt-BR", { month: "long", year: "numeric" });
}

function groupByMonth(events: TimelineEvent[]): [string, TimelineEvent[]][] {
  const sorted = [...events].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );
  const grouped = sorted.reduce<Record<string, TimelineEvent[]>>((acc, ev) => {
    const key = ev.date.slice(0, 7);
    acc[key] ??= [];
    acc[key].push(ev);
    return acc;
  }, {});
  return Object.entries(grouped).sort((a, b) => (a[0] < b[0] ? 1 : -1));
}

function formatDuration(sec: number | null) {
  if (!sec) return null;
  const min = Math.round(sec / 60);
  if (min < 60) return `${min} min`;
  const h = Math.floor(min / 60);
  const m = min % 60;
  return `${h}h${String(m).padStart(2, "0")}`;
}

function formatPace(sec: number | null) {
  if (!sec) return null;
  return `${Math.floor(sec / 60)}:${String(sec % 60).padStart(2, "0")}/km`;
}

function eventFromLog(log: AthleteLog): TimelineEvent {
  const date = (log.finishedAt ?? log.createdAt).slice(0, 10);
  const title = log.workout?.title ?? "Treino registrado";
  const isRace = log.workout?.type === "PROVA";
  const details = [
    log.distanceKm ? `${log.distanceKm.toFixed(1)} km` : null,
    formatDuration(log.durationSec),
    formatPace(log.avgPaceSecPerKm),
    log.rpe ? `RPE ${log.rpe}` : null,
  ].filter(Boolean);

  return {
    id: log.id,
    type: isRace ? "prova" : "treino",
    date,
    title,
    subtitle: details.join(" · ") || "Execução registrada",
    detail: log.source ? `Origem: ${log.source}` : undefined,
    badge: log._count?.comments ? `${log._count.comments} comentário(s)` : undefined,
  };
}

export default function TimelinePage() {
  const [filter, setFilter] = useState<FilterValue>("todos");
  const [logs, setLogs] = useState<AthleteLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/atleta/logs")
      .then((res) => (res.ok ? res.json() : { logs: [] }))
      .then((data: { logs?: AthleteLog[] }) => setLogs(data.logs ?? []))
      .catch(() => setLogs([]))
      .finally(() => setLoading(false));
  }, []);

  const events = useMemo(() => logs.map(eventFromLog), [logs]);
  const filtered = filter === "todos" ? events : events.filter((ev) => ev.type === filter);
  const grouped = groupByMonth(filtered);

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="space-y-3">
        <Link
          href="/atleta/dashboard"
          className="inline-flex items-center gap-1.5 text-sm text-text-muted transition-colors hover:text-text"
        >
          <ArrowLeft className="h-4 w-4" />
          Voltar ao dashboard
        </Link>

        <div className="space-y-1">
          <Badge variant="primary">Linha do Tempo</Badge>
          <h1 className="font-display text-2xl font-bold text-text sm:text-3xl">
            Sua jornada esportiva
          </h1>
          <p className="max-w-lg text-sm text-text-muted">
            Histórico real de treinos e provas registrados por você ou importados das integrações.
          </p>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        <Filter className="h-4 w-4 shrink-0 self-center text-text-muted" />
        {filterOptions.map((opt) => (
          <button
            key={opt.value}
            onClick={() => setFilter(opt.value)}
            className={cn(
              "rounded-full border px-3.5 py-1.5 text-xs font-medium transition-all",
              filter === opt.value
                ? "border-primary/50 bg-primary/15 text-primary"
                : "border-border bg-card text-text-muted hover:border-primary/30 hover:text-text"
            )}
          >
            {opt.label}
          </button>
        ))}
      </div>

      <div className="max-w-2xl">
        {loading ? (
          <div className="rounded-2xl border border-border bg-card p-8 text-center text-sm text-text-muted">
            Carregando histórico...
          </div>
        ) : filtered.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border bg-card/70 p-8 text-center">
            <Clock className="mx-auto mb-3 h-8 w-8 text-text-muted" />
            <p className="font-semibold text-text">Ainda não há histórico real para mostrar.</p>
            <p className="mt-1 text-sm text-text-muted">
              Quando você concluir treinos, registrar feedbacks ou sincronizar atividades, eles aparecerão aqui.
            </p>
          </div>
        ) : (
          grouped.map(([monthKey, monthEvents]) => (
            <div key={monthKey}>
              <div className="mb-4 mt-8 text-xs font-semibold uppercase tracking-widest text-text-muted first:mt-0">
                {formatMonthYear(monthEvents[0].date)}
              </div>

              <div className="relative">
                <div className="absolute bottom-0 left-5 top-0 w-px bg-border" />
                <div className="space-y-3">
                  {monthEvents.map((ev, i) => {
                    const Icon = getIcon(ev.type);
                    return (
                      <motion.div
                        key={ev.id}
                        initial={{ opacity: 0, x: -12 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.04 }}
                      >
                        <div className="flex gap-4">
                          <div
                            className={cn(
                              "relative z-10 flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-2",
                              ev.type === "treino" && "border-info/40 bg-info/15 text-info",
                              ev.type === "prova" && "border-success/40 bg-success/15 text-success",
                              ev.type === "feedback" && "border-primary/40 bg-primary/15 text-primary"
                            )}
                          >
                            <Icon className="h-4 w-4" />
                          </div>

                          <div className="mb-1 flex-1 rounded-2xl border border-border bg-card p-3.5">
                            <div className="flex items-start justify-between gap-2">
                              <div className="min-w-0">
                                <p className="text-sm font-semibold text-text">{ev.title}</p>
                                {ev.subtitle && <p className="mt-0.5 text-xs text-text-muted">{ev.subtitle}</p>}
                                {ev.detail && <p className="mt-1 text-xs italic text-text-muted">{ev.detail}</p>}
                              </div>
                              <div className="flex shrink-0 flex-col items-end gap-1">
                                {ev.badge && <Badge variant="outline">{ev.badge}</Badge>}
                                <span className="text-[10px] text-text-muted">
                                  {new Date(ev.date + "T12:00:00").toLocaleDateString("pt-BR", {
                                    day: "2-digit",
                                    month: "short",
                                  })}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
