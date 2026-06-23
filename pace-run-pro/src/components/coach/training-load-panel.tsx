"use client";

import { useEffect, useState } from "react";
import { AlertTriangle, Info, TrendingUp } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formStatus, FORM_LABELS } from "@/lib/training-load";
import type { LoadDay, LoadAlert, LoadParams } from "@/lib/training-load";
import { formatPace } from "@/lib/utils";
import { cn } from "@/lib/utils";

const inputClass =
  "w-full rounded-xl border border-border bg-background px-3 py-2 text-sm text-text placeholder:text-text-muted/50 outline-none focus:border-primary/60 focus:ring-2 focus:ring-primary/20 transition-colors";

interface Props {
  athleteId: string;
}

interface LoadData {
  series: LoadDay[];
  alerts: LoadAlert[];
  params: LoadParams | null;
}

export function TrainingLoadPanel({ athleteId }: Props) {
  const [data, setData] = useState<LoadData | null>(null);
  const [loading, setLoading] = useState(true);

  // Load params form state
  const [editingParams, setEditingParams] = useState(false);
  const [thresholdPaceMin, setThresholdPaceMin] = useState("");
  const [thresholdPaceSec, setThresholdPaceSec] = useState("");
  const [ftpWatts, setFtpWatts] = useState("");
  const [hrMax, setHrMax] = useState("");
  const [hrRest, setHrRest] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    fetch(`/api/coach/athletes/${athleteId}/training-load`)
      .then((r) => r.ok ? r.json() : null)
      .then((d: LoadData | null) => {
        setData(d);
        if (d?.params) {
          const tp = d.params.thresholdPaceSecPerKm;
          if (tp) {
            setThresholdPaceMin(String(Math.floor(tp / 60)));
            setThresholdPaceSec(String(tp % 60).padStart(2, "0"));
          }
          setFtpWatts(d.params.ftpWatts ? String(d.params.ftpWatts) : "");
          setHrMax(d.params.hrMax ? String(d.params.hrMax) : "");
          setHrRest(d.params.hrRest ? String(d.params.hrRest) : "");
        }
      })
      .catch(() => null)
      .finally(() => setLoading(false));
  }, [athleteId]);

  async function handleSaveParams() {
    setSaving(true);
    const thresholdPaceSecPerKm =
      thresholdPaceMin && thresholdPaceSec
        ? parseInt(thresholdPaceMin) * 60 + parseInt(thresholdPaceSec)
        : null;
    try {
      const res = await fetch(`/api/coach/athletes/${athleteId}/load-params`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          thresholdPaceSecPerKm,
          ftpWatts: ftpWatts || null,
          hrMax: hrMax || null,
          hrRest: hrRest || null,
        }),
      });
      if (res.ok) {
        setSaved(true);
        setEditingParams(false);
        setTimeout(() => setSaved(false), 3000);
        // Re-fetch load data with new params
        const freshData = await fetch(`/api/coach/athletes/${athleteId}/training-load`)
          .then((r) => r.ok ? r.json() : null);
        if (freshData) setData(freshData);
      }
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="flex justify-center py-10">
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        </CardContent>
      </Card>
    );
  }

  if (!data) return null;

  const series = data.series;
  const latest = series[series.length - 1];
  const status = latest ? formStatus(latest.tsb) : null;
  const formInfo = status ? FORM_LABELS[status] : null;

  return (
    <div className="space-y-4">
      {/* Alerts */}
      {data.alerts.map((alert, i) => (
        <div
          key={i}
          className={cn(
            "flex items-start gap-3 rounded-xl border px-4 py-3 text-sm",
            alert.severity === "danger"
              ? "border-danger/30 bg-danger/10 text-danger"
              : "border-warning/30 bg-warning/10 text-warning"
          )}
        >
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
          <p>{alert.message}</p>
        </div>
      ))}

      {/* Summary tiles */}
      {latest && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <LoadTile label="CTL — Fitness" value={latest.ctl.toFixed(0)} sub="Carga crônica" color="text-primary" />
          <LoadTile label="ATL — Fadiga" value={latest.atl.toFixed(0)} sub="Carga aguda" color="text-danger" />
          <LoadTile label="TSB — Forma" value={(latest.tsb >= 0 ? "+" : "") + latest.tsb.toFixed(0)} sub="Balanço de treino" color={latest.tsb > 5 ? "text-success" : latest.tsb < -10 ? "text-danger" : "text-text"} />
          <div className={cn("flex flex-col justify-center rounded-xl border border-border p-3 text-center sm:text-left", formInfo?.bg)}>
            <p className="text-[10px] uppercase tracking-wider text-text-muted">Forma atual</p>
            {formInfo && (
              <p className={cn("mt-1 font-display text-base font-bold", formInfo.color)}>{formInfo.label}</p>
            )}
          </div>
        </div>
      )}

      {/* Sparkline chart */}
      {series.length > 0 && <LoadChart series={series} />}

      {/* Load params */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between text-sm">
            <span className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-primary" />
              Parâmetros de carga
            </span>
            <button
              type="button"
              onClick={() => setEditingParams((v) => !v)}
              className="text-xs text-primary hover:underline"
            >
              {editingParams ? "Cancelar" : "Editar"}
            </button>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {!editingParams ? (
            <div className="grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
              <ParamField label="Pace limiar" value={data.params?.thresholdPaceSecPerKm ? formatPace(data.params.thresholdPaceSecPerKm) : "—"} />
              <ParamField label="FTP" value={data.params?.ftpWatts ? `${data.params.ftpWatts} W` : "—"} />
              <ParamField label="FC máx" value={data.params?.hrMax ? `${data.params.hrMax} bpm` : "—"} />
              <ParamField label="FC repouso" value={data.params?.hrRest ? `${data.params.hrRest} bpm` : "—"} />
            </div>
          ) : (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-text-muted">Pace limiar (min:seg/km)</label>
                  <div className="flex items-center gap-1.5">
                    <input
                      type="number" min={2} max={12}
                      value={thresholdPaceMin}
                      onChange={(e) => setThresholdPaceMin(e.target.value)}
                      placeholder="5" className={cn(inputClass, "text-center")}
                    />
                    <span className="font-bold text-text-muted">:</span>
                    <input
                      type="number" min={0} max={59}
                      value={thresholdPaceSec}
                      onChange={(e) => setThresholdPaceSec(e.target.value.padStart(2, "0"))}
                      placeholder="00" className={cn(inputClass, "text-center")}
                    />
                  </div>
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-text-muted">FTP ciclismo (W)</label>
                  <input type="number" value={ftpWatts} onChange={(e) => setFtpWatts(e.target.value)} placeholder="250" className={inputClass} />
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-text-muted">FC máxima (bpm)</label>
                  <input type="number" value={hrMax} onChange={(e) => setHrMax(e.target.value)} placeholder="185" className={inputClass} />
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-text-muted">FC repouso (bpm)</label>
                  <input type="number" value={hrRest} onChange={(e) => setHrRest(e.target.value)} placeholder="48" className={inputClass} />
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button size="sm" onClick={handleSaveParams} disabled={saving}>
                  {saving ? "Salvando…" : "Salvar parâmetros"}
                </Button>
                {saved && <Badge variant="success">Salvo!</Badge>}
              </div>
              <p className="flex items-start gap-1.5 text-[11px] text-text-muted">
                <Info className="mt-0.5 h-3 w-3 shrink-0" />
                Parâmetros usados para calcular o TSS e afinar a curva CTL/ATL. Sem parâmetros, estimativas por zona são usadas.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function LoadTile({ label, value, sub, color }: { label: string; value: string; sub: string; color?: string }) {
  return (
    <div className="rounded-xl border border-border bg-card-hover/30 p-3 text-center sm:text-left">
      <p className="text-[10px] uppercase tracking-wider text-text-muted">{label}</p>
      <p className={cn("mt-1 font-display text-xl font-bold", color ?? "text-text")}>{value}</p>
      <p className="text-[10px] text-text-muted">{sub}</p>
    </div>
  );
}

function ParamField({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[10px] uppercase tracking-wider text-text-muted">{label}</p>
      <p className="mt-0.5 text-sm font-semibold text-text">{value}</p>
    </div>
  );
}

function LoadChart({ series }: { series: LoadDay[] }) {
  const days = series.slice(-42); // Show last 42 days
  const maxVal = Math.max(...days.map((d) => Math.max(d.ctl, d.atl)), 1);
  const minTsb = Math.min(...days.map((d) => d.tsb));
  const maxTsb = Math.max(...days.map((d) => d.tsb), 1);
  const tsbRange = Math.max(Math.abs(minTsb), Math.abs(maxTsb), 10);

  const w = 600;
  const h = 100;
  const n = days.length;

  function xOf(i: number) {
    return (i / (n - 1)) * w;
  }
  function yOf(val: number, max: number, invert = false) {
    const pct = val / max;
    return invert ? h * pct : h - h * pct;
  }

  const ctlPath = days.map((d, i) => `${i === 0 ? "M" : "L"}${xOf(i).toFixed(1)},${yOf(d.ctl, maxVal).toFixed(1)}`).join(" ");
  const atlPath = days.map((d, i) => `${i === 0 ? "M" : "L"}${xOf(i).toFixed(1)},${yOf(d.atl, maxVal).toFixed(1)}`).join(" ");

  // TSB as filled area around zero-line
  const mid = h / 2;
  const tsbPoints = days.map((d, i) => ({
    x: xOf(i),
    y: mid - (d.tsb / tsbRange) * (h / 2),
  }));

  return (
    <Card>
      <CardContent className="p-4">
        <div className="mb-2 flex items-center gap-4 text-[11px]">
          <span className="flex items-center gap-1.5"><span className="h-2 w-6 rounded-full bg-primary" />CTL (fitness)</span>
          <span className="flex items-center gap-1.5"><span className="h-2 w-6 rounded-full bg-danger" />ATL (fadiga)</span>
          <span className="flex items-center gap-1.5"><span className="h-2 w-4 rounded-full bg-success/60" />TSB (forma)</span>
        </div>
        <svg viewBox={`0 0 ${w} ${h}`} className="h-24 w-full overflow-visible" preserveAspectRatio="none">
          {/* TSB bars */}
          {tsbPoints.map((p, i) => {
            const barHeight = Math.abs(p.y - mid);
            const positive = tsbPoints[i] && days[i].tsb >= 0;
            return (
              <rect
                key={i}
                x={p.x - 3}
                y={positive ? p.y : mid}
                width={6}
                height={barHeight}
                fill={positive ? "rgba(var(--color-success-rgb,34,197,94),0.3)" : "rgba(var(--color-danger-rgb,239,68,68),0.25)"}
              />
            );
          })}
          {/* Zero line for TSB */}
          <line x1={0} y1={mid} x2={w} y2={mid} stroke="currentColor" strokeOpacity={0.1} strokeWidth={1} />
          {/* CTL line */}
          <path d={ctlPath} fill="none" stroke="hsl(var(--color-primary))" strokeWidth={2} strokeLinecap="round" />
          {/* ATL line */}
          <path d={atlPath} fill="none" stroke="hsl(var(--color-danger))" strokeWidth={1.5} strokeDasharray="4 3" strokeLinecap="round" />
        </svg>
        <p className="mt-1 text-right text-[10px] text-text-muted">Últimos 42 dias</p>
      </CardContent>
    </Card>
  );
}
