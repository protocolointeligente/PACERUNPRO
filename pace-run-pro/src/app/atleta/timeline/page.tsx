"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Activity,
  AlertTriangle,
  ArrowLeft,
  Award,
  Filter,
  Heart,
  MapPin,
  Shirt,
  Star,
  TrendingUp,
  Zap,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";

type TimelineEventType = "treino" | "checkin" | "teste" | "prova" | "conquista" | "avaliacao" | "lesao" | "tenis";
interface TimelineEvent {
  id: string; date: string; type: TimelineEventType; title: string;
  subtitle?: string; detail?: string; badge?: string; highlight?: boolean;
}
import { cn } from "@/lib/utils";
import Link from "next/link";

type FilterValue = TimelineEventType | "todos";

const filterOptions: { label: string; value: FilterValue }[] = [
  { label: "Todos", value: "todos" },
  { label: "Treinos", value: "treino" },
  { label: "Provas", value: "prova" },
  { label: "Testes", value: "teste" },
  { label: "Conquistas", value: "conquista" },
  { label: "Avaliações", value: "avaliacao" },
];

function getIcon(type: TimelineEventType) {
  switch (type) {
    case "treino":
      return Activity;
    case "checkin":
      return Heart;
    case "teste":
      return TrendingUp;
    case "prova":
      return MapPin;
    case "conquista":
      return Award;
    case "avaliacao":
      return Zap;
    case "lesao":
      return AlertTriangle;
    case "tenis":
      return Shirt;
  }
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
    const key = ev.date.slice(0, 7); // YYYY-MM
    if (!acc[key]) acc[key] = [];
    acc[key].push(ev);
    return acc;
  }, {});
  return Object.entries(grouped).sort((a, b) => (a[0] < b[0] ? 1 : -1));
}

function getBadgeVariant(ev: TimelineEvent) {
  if (ev.type === "conquista" || ev.highlight) return "warning" as const;
  if (ev.type === "prova") return "success" as const;
  if (ev.type === "teste") return "primary" as const;
  return "outline" as const;
}

export default function TimelinePage() {
  const [filter, setFilter] = useState<FilterValue>("todos");
  const [events, setEvents] = useState<TimelineEvent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/atleta/timeline")
      .then((r) => r.json())
      .then((d) => {
        if (d.events) setEvents(d.events as TimelineEvent[]);
      })
      .catch(() => undefined)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="py-16 text-center text-text-muted">Carregando...</div>;

  const filtered =
    filter === "todos"
      ? events
      : events.filter((ev) => ev.type === filter);

  const grouped = groupByMonth(filtered);

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      {/* Header */}
      <div className="space-y-3">
        <Link
          href="/atleta/dashboard"
          className="inline-flex items-center gap-1.5 text-sm text-text-muted hover:text-text transition-colors"
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
            Todo o histórico da sua carreira — treinos, provas, testes,
            conquistas e marcos — em uma única linha do tempo.
          </p>
        </div>
      </div>

      {/* Filter chips */}
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

      {/* Timeline body */}
      <div className="max-w-2xl">
        {filtered.length === 0 ? (
          <div className="py-16 text-center text-text-muted">
            Nenhum evento deste tipo.
          </div>
        ) : (
          grouped.map(([monthKey, events]) => (
            <div key={monthKey}>
              {/* Month header */}
              <div className="mb-4 mt-8 first:mt-0 text-xs font-semibold uppercase tracking-widest text-text-muted capitalize">
                {formatMonthYear(events[0].date)}
              </div>

              {/* Events for this month */}
              <div className="relative">
                {/* Vertical line */}
                <div className="absolute left-5 top-0 bottom-0 w-px bg-border" />

                <div className="space-y-3">
                  {events.map((ev, i) => {
                    const Icon = getIcon(ev.type);

                    return (
                      <motion.div
                        key={ev.id}
                        initial={{ opacity: 0, x: -12 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.04 }}
                      >
                        <div className="flex gap-4">
                          {/* Icon dot */}
                          <div
                            className={cn(
                              "relative z-10 flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-2",
                              ev.type === "treino" &&
                                "bg-info/15 border-info/40 text-info",
                              ev.type === "checkin" &&
                                "bg-primary/15 border-primary/40 text-primary",
                              ev.type === "teste" &&
                                "bg-warning/15 border-warning/40 text-warning",
                              ev.type === "prova" &&
                                "bg-success/15 border-success/40 text-success",
                              ev.type === "conquista" &&
                                "bg-yellow-500/15 border-yellow-500/40 text-yellow-400",
                              ev.type === "avaliacao" &&
                                "bg-primary/15 border-primary/40 text-primary",
                              ev.type === "lesao" &&
                                "bg-danger/15 border-danger/40 text-danger",
                              ev.type === "tenis" &&
                                "bg-card-hover border-border text-text-muted",
                              ev.highlight &&
                                "ring-2 ring-offset-1 ring-offset-background ring-yellow-400/50"
                            )}
                          >
                            <Icon className="h-4 w-4" />
                          </div>

                          {/* Content card */}
                          <div
                            className={cn(
                              "flex-1 rounded-2xl border p-3.5 mb-1",
                              ev.highlight
                                ? "border-yellow-400/30 bg-yellow-400/5"
                                : "border-border bg-card"
                            )}
                          >
                            <div className="flex items-start justify-between gap-2">
                              <div className="min-w-0">
                                <p className="text-sm font-semibold text-text">
                                  {ev.title}
                                </p>
                                {ev.subtitle && (
                                  <p className="mt-0.5 text-xs text-text-muted">
                                    {ev.subtitle}
                                  </p>
                                )}
                                {ev.detail && (
                                  <p className="mt-1 text-xs text-text-muted italic">
                                    {ev.detail}
                                  </p>
                                )}
                              </div>
                              <div className="flex flex-col items-end gap-1 shrink-0">
                                {ev.badge && (
                                  <Badge variant={getBadgeVariant(ev)}>
                                    {(ev.type === "conquista" || ev.highlight) && (
                                      <Star className="h-3 w-3" />
                                    )}
                                    {ev.badge}
                                  </Badge>
                                )}
                                <span className="text-[10px] text-text-muted">
                                  {new Date(
                                    ev.date + "T12:00:00"
                                  ).toLocaleDateString("pt-BR", {
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
