"use client";

import { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, MapPin, Clock } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { WorkoutCard } from "@/components/dashboard/workout-card";
import { calendarLegend, getMonthEvents, weekWorkouts, type CalendarEvent } from "@/lib/mock-data";
import { TYPE_LABELS, getSubtypeColor } from "@/lib/mock-data";
import { cn } from "@/lib/utils";

const WEEKDAYS = ["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"];

export default function CalendarPage() {
  const [monthOffset, setMonthOffset] = useState(0);
  const reference = useMemo(() => {
    const d = new Date();
    d.setMonth(d.getMonth() + monthOffset);
    return d;
  }, [monthOffset]);

  const events = useMemo(() => getMonthEvents(reference), [reference]);
  const eventsByDate = useMemo(() => {
    const map = new Map<string, CalendarEvent[]>();
    for (const e of events) {
      const list = map.get(e.date) ?? [];
      list.push(e);
      map.set(e.date, list);
    }
    return map;
  }, [events]);

  const monthLabel = reference.toLocaleDateString("pt-BR", { month: "long", year: "numeric" });
  const grid = useMemo(() => buildMonthGrid(reference), [reference]);

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <Badge variant="primary" className="mb-2">Calendário de treinos</Badge>
          <h1 className="font-display text-2xl font-bold capitalize text-text sm:text-3xl">{monthLabel}</h1>
        </div>
        <div className="flex items-center gap-2">
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

      {/* Legend */}
      <div className="flex flex-wrap gap-2">
        {calendarLegend.map((l) => (
          <span key={l.type} className="flex items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1 text-xs text-text-muted">
            <span className="h-2 w-2 rounded-full" style={{ backgroundColor: l.color }} />
            {l.label}
          </span>
        ))}
      </div>

      <Tabs defaultValue="semana">
        <TabsList>
          <TabsTrigger value="mes">Mensal</TabsTrigger>
          <TabsTrigger value="semana">Semanal</TabsTrigger>
          <TabsTrigger value="agenda">Agenda</TabsTrigger>
        </TabsList>

        {/* Month view */}
        <TabsContent value="mes">
          <Card>
            <CardContent className="p-3 sm:p-5">
              <div className="grid grid-cols-7 gap-1.5 text-center text-[11px] uppercase tracking-wider text-text-muted">
                {WEEKDAYS.map((d) => (
                  <div key={d} className="py-1.5">{d}</div>
                ))}
              </div>
              <div className="grid grid-cols-7 gap-1.5">
                {grid.map((day, i) => {
                  const key = day?.toISOString().slice(0, 10);
                  const dayEvents = key ? eventsByDate.get(key) ?? [] : [];
                  const isToday = key === new Date().toISOString().slice(0, 10);
                  return (
                    <div
                      key={i}
                      className={cn(
                        "flex min-h-[78px] flex-col gap-1 rounded-xl border p-1.5 sm:min-h-[96px] sm:p-2",
                        day ? "border-border bg-card-hover/30" : "border-transparent",
                        isToday && "border-primary/60 bg-primary/10"
                      )}
                    >
                      {day && (
                        <>
                          <span className={cn("text-xs font-medium", isToday ? "text-primary" : "text-text-muted")}>
                            {day.getDate()}
                          </span>
                          <div className="flex flex-1 flex-col gap-1 overflow-hidden">
                            {dayEvents.slice(0, 2).map((e, idx) => {
                              const color = getSubtypeColor(e.type, e.subtype);
                              return (
                                <span
                                  key={idx}
                                  className="truncate rounded-md px-1.5 py-0.5 text-[10px] font-medium leading-tight"
                                  style={{ backgroundColor: `${color}22`, color }}
                                >
                                  {e.title}
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

        {/* Week view */}
        <TabsContent value="semana">
          <div className="space-y-3">
            {weekWorkouts.map((w) => (
              <WorkoutCard key={w.id} workout={w} href={`/aluno/treino/${w.id}`} />
            ))}
          </div>
        </TabsContent>

        {/* Agenda view */}
        <TabsContent value="agenda">
          <div className="space-y-5">
            {Array.from(eventsByDate.entries())
              .sort(([a], [b]) => a.localeCompare(b))
              .map(([date, items]) => (
                <div key={date}>
                  <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-text-muted">
                    {new Date(date + "T12:00:00").toLocaleDateString("pt-BR", { weekday: "long", day: "2-digit", month: "long" })}
                  </p>
                  <div className="space-y-2">
                    {items.map((e, idx) => {
                      const color = getSubtypeColor(e.type, e.subtype);
                      return (
                        <Card key={idx}>
                          <CardContent className="flex items-center gap-3 p-3.5">
                            <span className="h-9 w-9 shrink-0 rounded-lg" style={{ backgroundColor: `${color}22` }}>
                              <span className="flex h-full w-full items-center justify-center">
                                <MapPin className="h-4 w-4" style={{ color }} />
                              </span>
                            </span>
                            <div className="min-w-0 flex-1">
                              <p className="truncate text-sm font-semibold text-text">{e.title}</p>
                              <span className="flex items-center gap-1 text-xs text-text-muted">
                                <Clock className="h-3 w-3" /> {TYPE_LABELS[e.type]}
                              </span>
                            </div>
                            <Badge style={{ borderColor: `${color}55`, color, backgroundColor: `${color}1a` }} className="border">
                              {e.subtype ?? TYPE_LABELS[e.type]}
                            </Badge>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                </div>
              ))}
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
  const startWeekday = (firstDay.getDay() + 6) % 7; // Monday = 0
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
