"use client";

import { motion } from "framer-motion";
import {
  AlertTriangle,
  BarChart2,
  CheckCircle2,
  TrendingDown,
  TrendingUp,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { weeklyAnalyses } from "@/lib/mock-data";
import { cn } from "@/lib/utils";

const myAnalysis = weeklyAnalyses[0];

const dailyVolume = [
  { day: "Seg", km: 8 },
  { day: "Ter", km: 0 },
  { day: "Qua", km: 12 },
  { day: "Qui", km: 0 },
  { day: "Sex", km: 15 },
  { day: "Sáb", km: 22 },
  { day: "Dom", km: 0 },
];

function formatPaceDisplay(sec: number) {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m}:${s.toString().padStart(2, "0")}/km`;
}

function formatMetricValue(label: string, value: number) {
  if (label === "Pace médio") return formatPaceDisplay(value);
  if (label === "FC média") return `${value} bpm`;
  if (label === "Carga") return `${value} UA`;
  if (label === "Sessões") return `${value}`;
  return `${value} km`;
}

function DeltaIndicator({ delta, unit }: { delta: number; unit: string }) {
  const isPace = unit === "s/km";
  const improved = isPace ? delta < 0 : delta > 0;
  const isNeutral = delta === 0;

  if (isNeutral) {
    return <span className="text-xs text-text-muted">Igual</span>;
  }

  return (
    <span
      className={cn(
        "inline-flex items-center gap-0.5 text-xs font-semibold",
        improved ? "text-success" : "text-danger"
      )}
    >
      {improved ? (
        <TrendingUp className="h-3 w-3" />
      ) : (
        <TrendingDown className="h-3 w-3" />
      )}
      {Math.abs(delta).toFixed(1)}%
    </span>
  );
}

const highlightIcons = [
  <TrendingUp key="up" className="h-4 w-4 text-success" />,
  <AlertTriangle key="warn" className="h-4 w-4 text-warning" />,
  <CheckCircle2 key="check" className="h-4 w-4 text-primary" />,
];

const fadeUp = (delay: number) => ({
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0 },
  transition: { delay, duration: 0.4, ease: "easeOut" as const },
});

export default function MinhaSemanPage() {
  return (
    <div className="mx-auto max-w-3xl space-y-7">
      <motion.div {...fadeUp(0)}>
        <Badge variant="primary" className="mb-3">
          <BarChart2 className="h-3 w-3" />
          Minha semana
        </Badge>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="font-display text-2xl font-bold text-white sm:text-3xl">
              Minha Semana
            </h1>
            <p className="mt-1 text-sm text-text-muted">{myAnalysis.weekLabel}</p>
          </div>
        </div>
      </motion.div>

      <motion.div {...fadeUp(0.08)} className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        {myAnalysis.metrics.map((metric) => (
          <Card key={metric.label}>
            <CardContent className="p-3.5 space-y-1.5">
              <p className="text-[10px] uppercase tracking-wide text-text-muted">{metric.label}</p>
              <p className="font-display text-lg font-bold text-white leading-tight">
                {formatMetricValue(metric.label, metric.value)}
              </p>
              <div className="flex items-center gap-1.5">
                <DeltaIndicator delta={metric.delta} unit={metric.unit} />
                <span className="text-[10px] text-text-muted">vs sem. ant.</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </motion.div>

      <motion.div {...fadeUp(0.14)}>
        <Card>
          <CardContent className="p-5">
            <h2 className="font-display text-base font-semibold text-white mb-4">
              Volume por dia (km)
            </h2>
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={dailyVolume} barCategoryGap="30%">
                <XAxis
                  dataKey="day"
                  tick={{ fill: "#64748b", fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fill: "#64748b", fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                  width={28}
                />
                <Tooltip
                  contentStyle={{
                    background: "#0b1220",
                    border: "1px solid #1e293b",
                    borderRadius: 10,
                    fontSize: 12,
                  }}
                  itemStyle={{ color: "#f1f5f9" }}
                  labelStyle={{ color: "#94a3b8" }}
                  formatter={(v) => [`${v} km`, "Volume"]}
                />
                <Bar dataKey="km" radius={[6, 6, 0, 0]}>
                  {dailyVolume.map((entry, index) => (
                    <Cell
                      key={index}
                      fill={entry.km > 0 ? "#8b5cf6" : "#1e293b"}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </motion.div>

      <motion.div {...fadeUp(0.2)}>
        <h2 className="font-display text-base font-semibold text-white mb-3">Destaques da semana</h2>
        <div className="space-y-3">
          {myAnalysis.highlights.map((highlight, i) => (
            <div
              key={i}
              className="flex items-start gap-3 rounded-2xl border border-border bg-card p-4"
            >
              <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-card-hover">
                {highlightIcons[i % highlightIcons.length]}
              </span>
              <p className="text-sm text-text-muted leading-relaxed">{highlight}</p>
            </div>
          ))}
          <div className="flex items-start gap-3 rounded-2xl border border-border bg-card p-4">
            <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-card-hover">
              <CheckCircle2 className="h-4 w-4 text-success" />
            </span>
            <p className="text-sm text-text-muted leading-relaxed">
              Aderência de {myAnalysis.adherence}% — você completou todos os treinos da semana.
            </p>
          </div>
        </div>
      </motion.div>

      <motion.div {...fadeUp(0.26)}>
        <div className="rounded-2xl border border-primary/25 bg-primary/8 p-5">
          <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-primary">
            Recomendação do treinador
          </p>
          <p className="text-sm text-text-muted leading-relaxed">{myAnalysis.recommendation}</p>
        </div>
      </motion.div>
    </div>
  );
}
