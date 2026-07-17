"use client";

import { useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { motion } from "framer-motion";
import { AlertTriangle, BarChart2, CheckCircle2, Clock, TrendingUp } from "lucide-react";
import {
  Bar,
  BarChart,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { InfoTooltip } from "@/components/ui/info-tooltip";
import { cn } from "@/lib/utils";

interface AthleteLog {
  id: string;
  distanceKm: number | null;
  durationSec: number | null;
  avgPaceSecPerKm: number | null;
  avgHr?: number | null;
  rpe: number | null;
  finishedAt: string | null;
  createdAt: string;
}

interface TrainingLoadResponse {
  latest?: {
    date: string;
    ctl?: number;
    atl?: number;
    tsb?: number;
    tss?: number;
  } | null;
}

const weekDays = ["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"];

function startOfWeek(date: Date) {
  const copy = new Date(date);
  copy.setHours(0, 0, 0, 0);
  const day = copy.getDay();
  copy.setDate(copy.getDate() - (day === 0 ? 6 : day - 1));
  return copy;
}

function isSameOrAfter(a: Date, b: Date) {
  return a.getTime() >= b.getTime();
}

function formatPaceDisplay(sec: number | null) {
  if (!sec) return "—";
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m}:${s.toString().padStart(2, "0")}/km`;
}

function formatDuration(sec: number) {
  const min = Math.round(sec / 60);
  if (min < 60) return `${min} min`;
  return `${Math.floor(min / 60)}h${String(min % 60).padStart(2, "0")}`;
}

function avg(values: Array<number | null | undefined>) {
  const valid = values.filter((value): value is number => typeof value === "number" && Number.isFinite(value));
  if (!valid.length) return null;
  return valid.reduce((sum, value) => sum + value, 0) / valid.length;
}

const fadeUp = (delay: number) => ({
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0 },
  transition: { delay, duration: 0.4, ease: "easeOut" as const },
});

export default function MinhaSemanaPage() {
  const [logs, setLogs] = useState<AthleteLog[]>([]);
  const [trainingLoad, setTrainingLoad] = useState<TrainingLoadResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch("/api/atleta/logs").then((res) => (res.ok ? res.json() : { logs: [] })),
      fetch("/api/atleta/training-load").then((res) => (res.ok ? res.json() : null)),
    ])
      .then(([logsData, loadData]: [{ logs?: AthleteLog[] }, TrainingLoadResponse | null]) => {
        setLogs(logsData.logs ?? []);
        setTrainingLoad(loadData);
      })
      .catch(() => {
        setLogs([]);
        setTrainingLoad(null);
      })
      .finally(() => setLoading(false));
  }, []);

  const analysis = useMemo(() => {
    const monday = startOfWeek(new Date());
    const weekLogs = logs.filter((log) => {
      const date = new Date(log.finishedAt ?? log.createdAt);
      return isSameOrAfter(date, monday);
    });
    const totalDistance = weekLogs.reduce((sum, log) => sum + (log.distanceKm ?? 0), 0);
    const totalDuration = weekLogs.reduce((sum, log) => sum + (log.durationSec ?? 0), 0);
    const avgPace = avg(weekLogs.map((log) => log.avgPaceSecPerKm));
    const avgHr = avg(weekLogs.map((log) => log.avgHr));
    const sessionLoad = weekLogs.reduce((sum, log) => {
      if (!log.durationSec || !log.rpe) return sum;
      return sum + Math.round((log.durationSec / 60) * log.rpe);
    }, 0);

    const dailyVolume = weekDays.map((day, index) => {
      const d = new Date(monday);
      d.setDate(monday.getDate() + index);
      const iso = d.toISOString().slice(0, 10);
      const km = weekLogs
        .filter((log) => (log.finishedAt ?? log.createdAt).slice(0, 10) === iso)
        .reduce((sum, log) => sum + (log.distanceKm ?? 0), 0);
      return { day, km: Math.round(km * 10) / 10 };
    });

    return { weekLogs, totalDistance, totalDuration, avgPace, avgHr, sessionLoad, dailyVolume };
  }, [logs]);

  const hasData = analysis.weekLogs.length > 0;

  return (
    <div className="mx-auto max-w-3xl space-y-7">
      <motion.div {...fadeUp(0)}>
        <Badge variant="primary" className="mb-3">
          <BarChart2 className="h-3 w-3" />
          Minha semana
        </Badge>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="font-display text-2xl font-bold text-text sm:text-3xl">
              Minha Semana
            </h1>
            <p className="mt-1 text-sm text-text-muted">
              Análise calculada somente com treinos registrados ou importados.
            </p>
          </div>
        </div>
      </motion.div>

      {loading ? (
        <Card>
          <CardContent className="p-8 text-center text-sm text-text-muted">Carregando dados reais...</CardContent>
        </Card>
      ) : !hasData ? (
        <Card>
          <CardContent className="p-8 text-center">
            <Clock className="mx-auto mb-3 h-8 w-8 text-text-muted" />
            <p className="font-semibold text-text">Ainda não há dados suficientes nesta semana.</p>
            <p className="mt-1 text-sm text-text-muted">
              Registre a execução dos treinos ou sincronize uma integração para liberar métricas semanais.
            </p>
          </CardContent>
        </Card>
      ) : (
        <>
          <motion.div {...fadeUp(0.08)} className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
            <MetricCard label="Sessões" value={String(analysis.weekLogs.length)} />
            <MetricCard label="Distância" value={`${analysis.totalDistance.toFixed(1)} km`} />
            <MetricCard label="Duração" value={formatDuration(analysis.totalDuration)} />
            <MetricCard label="Pace médio" value={formatPaceDisplay(analysis.avgPace ? Math.round(analysis.avgPace) : null)} />
            <MetricCard label="Carga" value={`${analysis.sessionLoad} UA`} withInfo />
          </motion.div>

          <motion.div {...fadeUp(0.14)}>
            <Card>
              <CardContent className="p-5">
                <h2 className="mb-4 font-display text-base font-semibold text-text">
                  Volume por dia (km)
                </h2>
                <ResponsiveContainer width="100%" height={180}>
                  <BarChart data={analysis.dailyVolume} barCategoryGap="30%">
                    <XAxis dataKey="day" tick={{ fill: "#64748b", fontSize: 11 }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fill: "#64748b", fontSize: 11 }} axisLine={false} tickLine={false} width={28} />
                    <Tooltip
                      contentStyle={{ background: "#0b1220", border: "1px solid #1e293b", borderRadius: 10, fontSize: 12 }}
                      itemStyle={{ color: "#f1f5f9" }}
                      labelStyle={{ color: "#94a3b8" }}
                      formatter={(v) => [`${v} km`, "Volume"]}
                    />
                    <Bar dataKey="km" radius={[6, 6, 0, 0]}>
                      {analysis.dailyVolume.map((entry) => (
                        <Cell key={entry.day} fill={entry.km > 0 ? "#2563eb" : "#cbd5e1"} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div {...fadeUp(0.2)}>
            <h2 className="mb-3 font-display text-base font-semibold text-text">Leitura da semana</h2>
            <div className="space-y-3">
              <Insight icon={<TrendingUp className="h-4 w-4 text-info" />}>
                Você registrou {analysis.weekLogs.length} sessão(ões), somando {analysis.totalDistance.toFixed(1)} km.
              </Insight>
              {analysis.avgHr && (
                <Insight icon={<CheckCircle2 className="h-4 w-4 text-success" />}>
                  Frequência cardíaca média registrada: {Math.round(analysis.avgHr)} bpm.
                </Insight>
              )}
              {trainingLoad?.latest ? (
                <Insight icon={<BarChart2 className="h-4 w-4 text-primary" />}>
                  Carga atual: ATL {Math.round(trainingLoad.latest.atl ?? 0)}, CTL {Math.round(trainingLoad.latest.ctl ?? 0)}, TSB {Math.round(trainingLoad.latest.tsb ?? 0)}.
                </Insight>
              ) : (
                <Insight icon={<AlertTriangle className="h-4 w-4 text-warning" />}>
                  Ainda faltam dados acumulados para estimar ATL, CTL e TSB com boa confiança.
                </Insight>
              )}
            </div>
          </motion.div>

          <motion.div {...fadeUp(0.26)}>
            <div className="rounded-2xl border border-primary/25 bg-primary/8 p-5">
              <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-primary">
                Recomendação
              </p>
              <p className="text-sm leading-relaxed text-text-muted">
                Use esta leitura como apoio. A decisão de ajustar volume, intensidade ou recuperação deve considerar sono, dor, fadiga e orientação do treinador.
              </p>
            </div>
          </motion.div>
        </>
      )}
    </div>
  );
}

function MetricCard({ label, value, withInfo }: { label: string; value: string; withInfo?: boolean }) {
  return (
    <Card>
      <CardContent className="space-y-1.5 p-3.5">
        <p className="flex items-center gap-1 text-[10px] uppercase tracking-wide text-text-muted">
          {label}
          {withInfo && (
            <InfoTooltip text="UA = unidades arbitrárias. Calculada por duração em minutos multiplicada pelo RPE informado." />
          )}
        </p>
        <p className="font-display text-lg font-bold leading-tight text-text">{value}</p>
      </CardContent>
    </Card>
  );
}

function Insight({ icon, children }: { icon: ReactNode; children: ReactNode }) {
  return (
    <div className="flex items-start gap-3 rounded-2xl border border-border bg-card p-4">
      <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-card-hover">
        {icon}
      </span>
      <p className={cn("text-sm leading-relaxed text-text-muted")}>{children}</p>
    </div>
  );
}
