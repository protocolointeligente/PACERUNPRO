"use client";

import { useMemo } from "react";
import {
  loadDistribution,
  generateTriathlonAlerts,
  TRIATHLON_TARGET_DISTRIBUTION,
  type MultisportLoad,
  type TriathlonAlertInput,
  type TriathlonAlert,
} from "@/lib/sports-science/triathlon-load";

// ── Types ─────────────────────────────────────────────────────────────────────

export interface TriathlonLoadPanelProps {
  weekLoad: MultisportLoad;
  alertInput: TriathlonAlertInput;
  goal?: string;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

const SPORT_COLOR: Record<string, string> = {
  run:      "#3b82f6",
  bike:     "#f97316",
  swim:     "#06b6d4",
  strength: "#a855f7",
  other:    "#9ca3af",
};

const SPORT_LABEL: Record<string, string> = {
  run:      "Corrida",
  bike:     "Ciclismo",
  swim:     "Natação",
  strength: "Força",
  other:    "Outros",
};

const ALERT_COLOR: Record<TriathlonAlert["level"], string> = {
  info:      "border-blue-300 bg-blue-50 text-blue-800",
  attention: "border-amber-300 bg-amber-50 text-amber-800",
  warning:   "border-red-300 bg-red-50 text-red-800",
};

const ALERT_ICON: Record<TriathlonAlert["level"], string> = {
  info:      "ℹ️",
  attention: "⚠️",
  warning:   "🔴",
};

// ── Sub-components ────────────────────────────────────────────────────────────

function DistributionBar({
  label, pct, color, targetMin, targetMax,
}: {
  label: string; pct: number; color: string; targetMin?: number; targetMax?: number;
}) {
  const inRange = targetMin != null && targetMax != null
    ? pct >= targetMin && pct <= targetMax
    : null;

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-xs">
        <span className="text-text-muted">{label}</span>
        <span className="font-semibold text-text">
          {pct.toFixed(0)}%
          {targetMin != null && targetMax != null && (
            <span className={`ml-1 text-[10px] ${inRange ? "text-success" : "text-warning"}`}>
              (meta {targetMin}–{targetMax}%)
            </span>
          )}
        </span>
      </div>
      <div className="h-2.5 w-full overflow-hidden rounded-full bg-card-hover">
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{ width: `${Math.min(pct, 100)}%`, backgroundColor: color }}
        />
      </div>
    </div>
  );
}

function AlertCard({ alert }: { alert: TriathlonAlert }) {
  return (
    <div className={`rounded-xl border p-3 ${ALERT_COLOR[alert.level]}`}>
      <div className="flex items-start gap-2">
        <span className="mt-0.5 shrink-0 text-sm" aria-hidden="true">
          {ALERT_ICON[alert.level]}
        </span>
        <div className="min-w-0">
          <p className="text-xs font-semibold">{alert.title}</p>
          <p className="mt-0.5 text-[11px] leading-relaxed opacity-90">{alert.message}</p>
        </div>
      </div>
    </div>
  );
}

// ── Main Component ─────────────────────────────────────────────────────────────

export function TriathlonLoadPanel({ weekLoad, alertInput, goal }: TriathlonLoadPanelProps) {
  const dist    = useMemo(() => loadDistribution(weekLoad), [weekLoad]);
  const alerts  = useMemo(() => generateTriathlonAlerts(alertInput), [alertInput]);
  const targets = goal ? TRIATHLON_TARGET_DISTRIBUTION[goal] : undefined;

  const bars: { key: keyof typeof SPORT_COLOR; pct: number }[] = [
    { key: "run",      pct: dist.runPct },
    { key: "bike",     pct: dist.bikePct },
    { key: "swim",     pct: dist.swimPct },
    { key: "strength", pct: dist.strengthPct },
    { key: "other",    pct: dist.otherPct },
  ];

  const warnings = alerts.filter((a) => a.level === "warning");
  const attentions = alerts.filter((a) => a.level === "attention");
  const infos = alerts.filter((a) => a.level === "info");

  return (
    <div className="space-y-4">
      {/* Volume totals */}
      <div className="grid grid-cols-3 gap-2">
        <div className="rounded-xl bg-card-hover/50 p-3 text-center">
          <p className="text-[10px] text-text-muted">Total semana</p>
          <p className="text-base font-bold text-text">{weekLoad.total.toFixed(0)}</p>
          <p className="text-[10px] text-text-muted">u.a. carga</p>
        </div>
        <div className="rounded-xl bg-card-hover/50 p-3 text-center">
          <p className="text-[10px] text-text-muted">Corrida + Bike</p>
          <p className="text-base font-bold text-text">
            {(weekLoad.run + weekLoad.bike).toFixed(0)}
          </p>
          <p className="text-[10px] text-text-muted">u.a. carga</p>
        </div>
        <div className="rounded-xl bg-card-hover/50 p-3 text-center">
          <p className="text-[10px] text-text-muted">Natação</p>
          <p className="text-base font-bold text-cyan-600">{weekLoad.swim.toFixed(0)}</p>
          <p className="text-[10px] text-text-muted">u.a. carga</p>
        </div>
      </div>

      {/* Distribution bars */}
      <div className="space-y-2.5 rounded-xl border border-border bg-card p-4">
        <p className="text-xs font-semibold text-text-muted uppercase tracking-wider">
          Distribuição de carga
        </p>
        {bars.map(({ key, pct }) => (
          <DistributionBar
            key={key}
            label={SPORT_LABEL[key]}
            pct={pct}
            color={SPORT_COLOR[key]}
            targetMin={targets?.[`${key}Pct` as keyof typeof targets]?.[0] as number | undefined}
            targetMax={targets?.[`${key}Pct` as keyof typeof targets]?.[1] as number | undefined}
          />
        ))}
      </div>

      {/* Alerts */}
      {alerts.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-semibold text-text-muted uppercase tracking-wider">
            Alertas ({alerts.length})
          </p>
          {[...warnings, ...attentions, ...infos].map((a) => (
            <AlertCard key={a.id} alert={a} />
          ))}
        </div>
      )}

      {alerts.length === 0 && weekLoad.total > 0 && (
        <div className="rounded-xl border border-success/30 bg-success/5 p-3 text-center">
          <p className="text-xs font-semibold text-success">✓ Distribuição dentro dos parâmetros</p>
          <p className="mt-0.5 text-[11px] text-text-muted">Nenhum alerta de carga esta semana.</p>
        </div>
      )}

      <p className="text-[10px] text-text-muted text-center leading-relaxed">
        Estimativas baseadas no modelo de Banister e distribuições de referência bibliográfica.
        Não substituem avaliação de treinador ou profissional de saúde.
      </p>
    </div>
  );
}
