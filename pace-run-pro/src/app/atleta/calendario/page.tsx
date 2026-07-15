"use client";

import { useEffect, useMemo, useState } from "react";
import { Bike, ChevronLeft, ChevronRight, Clock, Dumbbell, Footprints, Loader2, Plus, Trophy, Waves, X } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { WorkoutCard } from "@/components/dashboard/workout-card";
import { cn } from "@/lib/utils";
import type { WorkoutSummary } from "@/lib/types";

interface CalendarEvent {
  date: string;
  type: string;
  title: string;
  subtype?: string;
}

interface WorkoutRow {
  id: string;
  date: string;
  type: string;
  subtype?: string;
  title: string;
  status: "liberado" | "agendado" | "concluido" | "perdido";
  distanceKm?: number | null;
  durationMin?: number | null;
  targetPaceSecPerKm?: number | null;
  targetRpe?: number | null;
  targetHrZone?: string | null;
  color: string;
}

interface RaceRow {
  id: string;
  name: string;
  date: string;
  distanceKm: number;
  goalTime?: string | null;
  location?: string | null;
}

const calendarLegend = [
  { type: "corrida", color: "#38bdf8", label: "Corrida" },
  { type: "ciclismo", color: "#84cc16", label: "Ciclismo" },
  { type: "natacao", color: "#0ea5e9", label: "Natacao" },
  { type: "forca", color: "#8b5cf6", label: "Força" },
  { type: "funcional", color: "#a855f7", label: "Funcional" },
  { type: "mobilidade", color: "#84cc16", label: "Mobilidade" },
  { type: "recuperacao", color: "#94a3b8", label: "Recuperação" },
];

const TYPE_LABELS: Record<string, string> = {
  corrida: "Corrida",
  ciclismo: "Ciclismo",
  natacao: "Natacao",
  triathlon: "Triathlon",
  forca: "Força",
  funcional: "Funcional",
  mobilidade: "Mobilidade",
  recuperacao: "Recuperação",
  prova: "Prova",
};

const TYPE_COLORS: Record<string, string> = {
  corrida: "#38bdf8",
  forca: "#8b5cf6",
  funcional: "#a855f7",
  mobilidade: "#84cc16",
  recuperacao: "#94a3b8",
  prova: "#facc15",
  ciclismo: "#65a30d",
  natacao: "#0ea5e9",
};

const RUN_SUBTYPE_COLORS: Record<string, string> = {
  "Regenerativo": "#94a3b8",
  "Rodagem leve": "#84cc16",
  "Longão": "#22c55e",
  "Técnica": "#06b6d4",
  "Progressivo": "#38bdf8",
  "Fartlek": "#a78bfa",
  "Tempo Run": "#eab308",
  "Subida": "#fb923c",
  "Intervalado longo": "#f97316",
  "Intervalado curto": "#ef4444",
};

function getSubtypeColor(type: string, subtype?: string): string {
  if (subtype && RUN_SUBTYPE_COLORS[subtype]) return RUN_SUBTYPE_COLORS[subtype];
  return TYPE_COLORS[type] ?? TYPE_COLORS.corrida;
}

function EventIcon({ type, title, className, style }: { type: string; title?: string; className?: string; style?: { color?: string } }) {
  const key = `${type} ${title ?? ""}`.toUpperCase();
  if (type === "prova") return <Trophy className={className} style={style} />;
  if (key.includes("BIKE") || key.includes("CICL")) return <Bike className={className} style={style} />;
  if (key.includes("NAT") || key.includes("SWIM")) return <Waves className={className} style={style} />;
  if (key.includes("FORCA") || key.includes("FUNCIONAL")) return <Dumbbell className={className} style={style} />;
  return <Footprints className={className} style={style} />;
}

const WEEKDAYS = ["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"];

const DISTANCES = [
  { label: "5K", value: 5 },
  { label: "10K", value: 10 },
  { label: "21K (meia)", value: 21.1 },
  { label: "42K (maratona)", value: 42.2 },
  { label: "Outro", value: 0 },
];

const inputClass =
  "w-full rounded-xl border border-border bg-background px-3.5 py-2.5 text-sm text-text placeholder:text-text-muted/50 outline-none focus:border-primary/60 transition-colors";

function toLocalISODate(d: Date): string {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export default function CalendarPage() {
  const [monthOffset, setMonthOffset] = useState(0);
  const [workouts, setWorkouts] = useState<WorkoutRow[]>([]);
  const [races, setRaces] = useState<RaceRow[]>([]);
  const [loadingRaces, setLoadingRaces] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [raceName, setRaceName] = useState("");
  const [raceDate, setRaceDate] = useState("");
  const [raceDist, setRaceDist] = useState(10);
  const [raceDistCustom, setRaceDistCustom] = useState("");
  const [raceGoalTime, setRaceGoalTime] = useState("");
  const [raceLocation, setRaceLocation] = useState("");
  const [savingRace, setSavingRace] = useState(false);

  const reference = useMemo(() => {
    const d = new Date();
    d.setMonth(d.getMonth() + monthOffset);
    return d;
  }, [monthOffset]);

  const monthLabel = reference.toLocaleDateString("pt-BR", { month: "long", year: "numeric" });
  const grid = useMemo(() => buildMonthGrid(reference), [reference]);

  useEffect(() => {
    const year = reference.getFullYear();
    const month = reference.getMonth();
    const from = toLocalISODate(new Date(year, month, -6));
    const to = toLocalISODate(new Date(year, month + 1, 7));
    fetch(`/api/atleta/workouts?from=${from}&to=${to}`, { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : []))
      .then((data: WorkoutRow[]) => setWorkouts(Array.isArray(data) ? data : []))
      .catch(() => null);
  }, [monthOffset]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    fetch("/api/atleta/races")
      .then((r) => r.json())
      .then((d: RaceRow[]) => setRaces(Array.isArray(d) ? d : []))
      .catch(() => [])
      .finally(() => setLoadingRaces(false));
  }, []);

  const workoutEvents = useMemo((): CalendarEvent[] =>
    workouts.map((w) => ({
      date: w.date.slice(0, 10),
      type: w.type,
      title: w.title,
      subtype: w.subtype,
    })),
    [workouts]
  );

  const raceEvents = useMemo((): CalendarEvent[] =>
    races.map((r) => ({
      date: r.date.slice(0, 10),
      type: "prova" as const,
      title: `🍅 ${r.name}`,
      subtype: `${r.distanceKm}K`,
    })),
    [races]
  );

  const allEvents = useMemo(() => [...workoutEvents, ...raceEvents], [workoutEvents, raceEvents]);

  const eventsByDate = useMemo(() => {
    const map = new Map<string, CalendarEvent[]>();
    for (const e of allEvents) {
      const list = map.get(e.date) ?? [];
      list.push(e);
      map.set(e.date, list);
    }
    return map;
  }, [allEvents]);

  const currentWeekWorkouts = useMemo((): WorkoutSummary[] => {
    const now = new Date();
    const dow = (now.getDay() + 6) % 7;
    const weekStart = new Date(now.getFullYear(), now.getMonth(), now.getDate() - dow);
    const weekEnd = new Date(weekStart.getTime() + 7 * 24 * 60 * 60 * 1000);
    return workouts
      .filter((w) => {
        const d = new Date(w.date);
        return d >= weekStart && d < weekEnd;
      })
      .map((w) => ({
        id: w.id,
        date: w.date,
        type: w.type as WorkoutSummary["type"],
        subtype: w.subtype,
        title: w.title,
        status: w.status,
        distanceKm: w.distanceKm ?? undefined,
        durationMin: w.durationMin ?? undefined,
        targetPaceSecPerKm: w.targetPaceSecPerKm ?? undefined,
        targetRpe: w.targetRpe ?? undefined,
        targetHrZone: w.targetHrZone ?? undefined,
        color: w.color,
      }));
  }, [workouts]);

  const upcomingRaces = races.filter((r) => new Date(r.date) >= new Date());
  const modalitySummary = useMemo(() => {
    const items = [
      { type: "corrida", label: "Corrida", icon: Footprints },
      { type: "ciclismo", label: "Ciclismo", icon: Bike },
      { type: "natacao", label: "Natacao", icon: Waves },
      { type: "forca", label: "Forca", icon: Dumbbell },
    ];
    return items.map((item) => {
      const list = workouts.filter((workout) => workout.type === item.type);
      const next = list.find((workout) => new Date(workout.date) >= new Date());
      return { ...item, count: list.length, next };
    });
  }, [workouts]);

  async function addRace() {
    if (!raceName || !raceDate) return;
    const distKm = raceDist === 0 ? parseFloat(raceDistCustom.replace(",", ".")) || 0 : raceDist;
    if (!distKm) return;
    setSavingRace(true);
    try {
      const res = await fetch("/api/atleta/races", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: raceName, date: raceDate, distanceKm: distKm, goalTime: raceGoalTime || undefined, location: raceLocation || undefined }),
      });
      if (res.ok) {
        const created = await res.json() as RaceRow;
        setRaces((prev) => [...prev, created].sort((a, b) => a.date.localeCompare(b.date)));
        setRaceName(""); setRaceDate(""); setRaceDist(10); setRaceDistCustom(""); setRaceGoalTime(""); setRaceLocation("");
        setShowModal(false);
      }
    } finally {
      setSavingRace(false);
    }
  }

  async function deleteRace(id: string) {
    await fetch(`/api/atleta/races/${id}`, { method: "DELETE" });
    setRaces((prev) => prev.filter((r) => r.id !== id));
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <Badge variant="primary" className="mb-2">Meus treinos</Badge>
          <h1 className="font-display text-2xl font-bold capitalize text-text sm:text-3xl">{monthLabel}</h1>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Button variant="outline" size="sm" className="gap-1.5" onClick={() => setShowModal(true)}>
            <Trophy className="h-3.5 w-3.5 text-orange-400" /> Minhas provas
            {upcomingRaces.length > 0 && (
              <span className="ml-1 rounded-full bg-orange-500/20 px-1.5 py-0.5 text-[10px] font-bold text-orange-400">
                {upcomingRaces.length}
              </span>
            )}
          </Button>
          <button onClick={() => setMonthOffset((m) => m - 1)} className="rounded-lg border border-border p-2 text-text-muted hover:border-primary/40 hover:text-text">
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button onClick={() => setMonthOffset(0)} className="rounded-lg border border-border px-3 py-2 text-xs font-medium text-text-muted hover:border-primary/40 hover:text-text">
            Hoje
          </button>
          <button onClick={() => setMonthOffset((m) => m + 1)} className="rounded-lg border border-border p-2 text-text-muted hover:border-primary/40 hover:text-text">
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {modalitySummary.map((item) => {
          const Icon = item.icon;
          return (
            <Card key={item.type}>
              <CardContent className="flex items-center justify-between gap-3 p-4">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="flex h-9 w-9 items-center justify-center rounded-xl" style={{ backgroundColor: `${TYPE_COLORS[item.type] ?? "#38bdf8"}22`, color: TYPE_COLORS[item.type] ?? "#38bdf8" }}>
                      <Icon className="h-4 w-4" />
                    </span>
                    <div>
                      <p className="font-semibold text-text">{item.label}</p>
                      <p className="text-xs text-text-muted">{item.count} treino(s)</p>
                    </div>
                  </div>
                  <p className="mt-3 truncate text-xs text-text-muted">
                    {item.next ? `Proximo: ${item.next.title}` : "Sem treino liberado"}
                  </p>
                </div>
                {item.next ? (
                  <a href={item.type === "forca" ? `/atleta/forca/treino/${item.next.id}` : `/atleta/treino/${item.next.id}`} className="rounded-lg border border-border px-3 py-2 text-xs font-semibold text-text hover:border-primary/50 hover:text-primary">
                    Abrir
                  </a>
                ) : null}
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="flex flex-wrap gap-2">
        {calendarLegend.map((l) => (
          <span key={l.type} className="flex items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1 text-xs text-text-muted">
            <span className="h-2 w-2 rounded-full" style={{ backgroundColor: l.color }} />
            {l.label}
          </span>
        ))}
        <span className="flex items-center gap-1.5 rounded-full border border-orange-500/40 bg-orange-500/10 px-3 py-1 text-xs text-orange-400">
          <span className="h-2 w-2 rounded-full bg-orange-400" />
          Prova
        </span>
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center p-4" onClick={() => setShowModal(false)}>
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
          <div
            className="relative w-full max-w-md rounded-2xl border border-border bg-[#0d1528] p-5 space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Trophy className="h-4 w-4 text-orange-400" />
                <h2 className="font-display text-sm font-bold text-text">Minhas provas</h2>
              </div>
              <button onClick={() => setShowModal(false)} className="rounded-lg p-1.5 text-text-muted hover:bg-card-hover hover:text-text">
                <X className="h-4 w-4" />
              </button>
            </div>

            {loadingRaces ? (
              <div className="flex justify-center py-4"><Loader2 className="h-5 w-5 animate-spin text-text-muted" /></div>
            ) : races.length === 0 ? (
              <p className="text-center text-sm text-text-muted py-2">Nenhuma prova cadastrada.</p>
            ) : (
              <div className="space-y-2 max-h-52 overflow-y-auto">
                {[...races].sort((a, b) => a.date.localeCompare(b.date)).map((r) => {
                  const isPast = new Date(r.date) < new Date();
                  return (
                    <div key={r.id} className={cn("flex items-start gap-3 rounded-xl border px-3 py-2.5", isPast ? "border-border/40 opacity-50" : "border-orange-500/30 bg-orange-500/5")}>
                      <Trophy className="h-4 w-4 shrink-0 mt-0.5 text-orange-400" />
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold text-text truncate">{r.name}</p>
                        <p className="text-xs text-text-muted">
                          {new Date(r.date + "T12:00").toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" })}
                          {" · "}{r.distanceKm}km
                          {r.location && ` · ${r.location}`}
                        </p>
                        {r.goalTime && <p className="text-xs text-primary">Meta: {r.goalTime}</p>}
                      </div>
                      <button onClick={() => deleteRace(r.id)} className="shrink-0 rounded p-1 text-text-muted hover:text-danger transition-colors">
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  );
                })}
              </div>
            )}

            <div className="border-t border-border pt-3 space-y-3">
              <p className="text-xs font-semibold uppercase tracking-wider text-text-muted">Cadastrar nova prova</p>
              <div className="grid gap-2 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-xs text-text-muted">Nome da prova *</label>
                  <input className={inputClass} value={raceName} onChange={(e) => setRaceName(e.target.value)} placeholder="Ex.: Maratona SP" />
                </div>
                <div>
                  <label className="mb-1 block text-xs text-text-muted">Data *</label>
                  <input type="date" className={inputClass} value={raceDate} onChange={(e) => setRaceDate(e.target.value)} />
                </div>
                <div>
                  <label className="mb-1 block text-xs text-text-muted">Distância *</label>
                  <select className={inputClass} value={raceDist} onChange={(e) => setRaceDist(Number(e.target.value))}>
                    {DISTANCES.map((d) => <option key={d.label} value={d.value}>{d.label}</option>)}
                  </select>
                </div>
                {raceDist === 0 && (
                  <div>
                    <label className="mb-1 block text-xs text-text-muted">Distância em km *</label>
                    <input className={inputClass} value={raceDistCustom} onChange={(e) => setRaceDistCustom(e.target.value)} placeholder="Ex.: 15" />
                  </div>
                )}
                <div>
                  <label className="mb-1 block text-xs text-text-muted">Meta de tempo</label>
                  <input className={inputClass} value={raceGoalTime} onChange={(e) => setRaceGoalTime(e.target.value)} placeholder="Ex.: 4h30m" />
                </div>
                <div>
                  <label className="mb-1 block text-xs text-text-muted">Local</label>
                  <input className={inputClass} value={raceLocation} onChange={(e) => setRaceLocation(e.target.value)} placeholder="Cidade / evento" />
                </div>
              </div>
              <Button variant="primary" size="sm" className="w-full" disabled={savingRace || !raceName || !raceDate} onClick={addRace}>
                {savingRace ? <><Loader2 className="h-4 w-4 animate-spin" /> Salvando…</> : <><Plus className="h-4 w-4" /> Cadastrar prova</>}
              </Button>
            </div>
          </div>
        </div>
      )}

      <Tabs defaultValue="semana">
        <TabsList>
          <TabsTrigger value="mes">Mensal</TabsTrigger>
          <TabsTrigger value="semana">Semanal</TabsTrigger>
          <TabsTrigger value="agenda">Agenda</TabsTrigger>
        </TabsList>

        <TabsContent value="mes">
          <Card className="border-white/10 bg-card/75 shadow-xl shadow-black/10 backdrop-blur-xl">
            <CardContent className="p-3 sm:p-5">
              <div className="grid grid-cols-7 gap-1.5 text-center text-[11px] uppercase tracking-wider text-text-muted">
                {WEEKDAYS.map((d) => (
                  <div key={d} className="py-1.5">{d}</div>
                ))}
              </div>
              <div className="grid grid-cols-7 gap-1.5">
                {grid.map((day, i) => {
                  const key = day ? toLocalISODate(day) : undefined;
                  const dayEvents = key ? eventsByDate.get(key) ?? [] : [];
                  const isToday = key === toLocalISODate(new Date());
                  return (
                    <div
                      key={i}
                      className={cn(
                        "flex min-h-[78px] flex-col gap-1 rounded-xl border p-1.5 backdrop-blur-sm sm:min-h-[96px] sm:p-2",
                        day ? "border-white/10 bg-white/[0.04]" : "border-transparent",
                        isToday && "border-primary/60 bg-primary/10 ring-1 ring-primary/30"
                      )}
                    >
                      {day && (
                        <>
                          <span className={cn("text-xs font-medium", isToday ? "text-primary" : "text-text-muted")}>
                            {day.getDate()}
                          </span>
                          <div className="flex flex-1 flex-col gap-1 overflow-hidden">
                            {dayEvents.slice(0, 2).map((e, idx) => {
                              const isRace = e.type === "prova" && e.title.startsWith("🍅");
                              const color = isRace ? "#f97316" : getSubtypeColor(e.type, e.subtype);
                              return (
                                <span
                                  key={idx}
                                  className="flex items-center gap-1 truncate rounded-md border px-1.5 py-0.5 text-[10px] font-medium leading-tight"
                                  style={{ backgroundColor: `${color}22`, color }}
                                >
                                  <EventIcon type={e.type} title={e.title} className="h-3 w-3 shrink-0" />
                                  <span className="truncate">{e.title}</span>
                                </span>
                              );
                            })}
                            {dayEvents.length > 2 && (
                              <span className="text-[10px] text-text-muted">+{dayEvents.length - 2} mais</span>
                            )}
                          </div>
                        </>
                      )}
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="semana">
          <div className="space-y-3">
            {currentWeekWorkouts.length === 0 ? (
              <Card>
                <CardContent className="p-8 text-center">
                  <p className="text-sm font-semibold text-text">Nenhum treino nesta semana</p>
                  <p className="mt-1 text-xs text-text-muted">Seu treinador ainda não liberou treinos para esta semana.</p>
                </CardContent>
              </Card>
            ) : (
              currentWeekWorkouts.map((w) => (
                <WorkoutCard key={w.id} workout={w} href={`/atleta/treino/${w.id}`} />
              ))
            )}
          </div>
        </TabsContent>

        <TabsContent value="agenda">
          <div className="space-y-5">
            {allEvents.length === 0 ? (
              <Card>
                <CardContent className="p-8 text-center">
                  <p className="text-sm font-semibold text-text">Nenhum evento neste mês</p>
                  <p className="mt-1 text-xs text-text-muted">Os treinos liberados pelo treinador aparecerão aqui.</p>
                </CardContent>
              </Card>
            ) : (
              Array.from(eventsByDate.entries())
                .sort(([a], [b]) => a.localeCompare(b))
                .map(([date, items]) => (
                  <div key={date}>
                    <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-text-muted">
                      {new Date(date + "T12:00:00").toLocaleDateString("pt-BR", { weekday: "long", day: "2-digit", month: "long" })}
                    </p>
                    <div className="space-y-2">
                      {items.map((e, idx) => {
                        const isRace = e.type === "prova" && e.title.startsWith("🍅");
                        const color = isRace ? "#f97316" : getSubtypeColor(e.type, e.subtype);
                        return (
                          <Card key={idx}>
                            <CardContent className="flex items-center gap-3 p-3.5">
                              <span className="h-9 w-9 shrink-0 rounded-lg" style={{ backgroundColor: `${color}22` }}>
                                <span className="flex h-full w-full items-center justify-center">
                                  <EventIcon type={e.type} title={e.title} className="h-4 w-4" style={{ color }} />
                                </span>
                              </span>
                              <div className="min-w-0 flex-1">
                                <p className="truncate text-sm font-semibold text-text">{e.title.replace("🍅 ", "")}</p>
                                <span className="flex items-center gap-1 text-xs text-text-muted">
                                  <Clock className="h-3 w-3" /> {isRace ? "Prova" : TYPE_LABELS[e.type]}
                                </span>
                              </div>
                              <Badge style={{ borderColor: `${color}55`, color, backgroundColor: `${color}1a` }} className="border">
                                {e.subtype ?? (isRace ? "Prova" : TYPE_LABELS[e.type])}
                              </Badge>
                            </CardContent>
                          </Card>
                        );
                      })}
                    </div>
                  </div>
                ))
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function buildMonthGrid(reference: Date) {
  const year = reference.getFullYear();
  const month = reference.getMonth();
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const startWeekday = (firstDay.getDay() + 6) % 7;
  const totalCells = Math.ceil((startWeekday + lastDay.getDate()) / 7) * 7;

  const grid: (Date | null)[] = [];
  for (let i = 0; i < totalCells; i++) {
    const dayNumber = i - startWeekday + 1;
    if (dayNumber < 1 || dayNumber > lastDay.getDate()) {
      grid.push(null);
    } else {
      grid.push(new Date(year, month, dayNumber));
    }
  }
  return grid;
}
