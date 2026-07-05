"use client";

import { use, useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft, Activity, Bike, Waves, Dumbbell,
  Loader2, CheckCircle2, RefreshCw, Save, HeartPulse,
} from "lucide-react";
import { ZONE_PRESETS, type ZoneDef } from "@/lib/zone-models";

// ── Types ─────────────────────────────────────────────────────────────────────

type SportTab = "RUN" | "BIKE" | "SWIM" | "STRENGTH";
type MethodId = "FC_MAXIMA" | "LIMIAR" | "FTP" | "PACE" | "RPE";

interface SportProfile {
  hrMax: number | null;
  hrRest: number | null;
  hrThreshold: number | null;
  thresholdPaceSecPerKm: number | null;
  vdot: number | null;
  ftpWatts: number | null;
  cssPacePer100m: number | null;
  zones: ZoneDef[] | null;
}

interface MethodConfig {
  id: MethodId;
  label: string;
  refField: keyof SportProfile | null;
  unit: string | null;
  placeholder: string | null;
  presetName: string;
  isPace: boolean;
}

// ── Sport configuration ───────────────────────────────────────────────────────

const SPORT_CONFIGS: Record<SportTab, { label: string; icon: React.ElementType; color: string; methods: MethodConfig[] }> = {
  RUN: {
    label: "Corrida",
    icon: Activity,
    color: "#f97316",
    methods: [
      { id: "FC_MAXIMA", label: "FC Máxima",    refField: "hrMax",                  unit: "bpm",    placeholder: "Ex: 185", presetName: "Corrida 5 Zonas (FC Máxima)", isPace: false },
      { id: "LIMIAR",    label: "FC Limiar",    refField: "hrThreshold",            unit: "bpm",    placeholder: "Ex: 165", presetName: "Corrida FC Limiar",           isPace: false },
      { id: "PACE",      label: "Pace Limiar",  refField: "thresholdPaceSecPerKm",  unit: "min/km", placeholder: "Ex: 5:00", presetName: "Corrida Pace Limiar",         isPace: true  },
    ],
  },
  BIKE: {
    label: "Ciclismo",
    icon: Bike,
    color: "#3b82f6",
    methods: [
      { id: "FTP",    label: "FTP (Watts)", refField: "ftpWatts",    unit: "W",   placeholder: "Ex: 250", presetName: "Ciclismo 7 Zonas (FTP)",  isPace: false },
      { id: "LIMIAR", label: "FC Limiar",  refField: "hrThreshold", unit: "bpm", placeholder: "Ex: 165", presetName: "Ciclismo FC Limiar",       isPace: false },
    ],
  },
  SWIM: {
    label: "Natação",
    icon: Waves,
    color: "#06b6d4",
    methods: [
      { id: "PACE", label: "Pace CSS", refField: "cssPacePer100m", unit: "min/100m", placeholder: "Ex: 1:30", presetName: "Natação 5 Zonas (CSS Pace)", isPace: true  },
      { id: "RPE",  label: "RPE",      refField: null,             unit: null,        placeholder: null,       presetName: "Natação 5 Zonas (RPE)",      isPace: false },
    ],
  },
  STRENGTH: {
    label: "Força",
    icon: Dumbbell,
    color: "#a855f7",
    methods: [
      { id: "RPE", label: "RPE", refField: null, unit: null, placeholder: null, presetName: "Força — Zonas por RPE", isPace: false },
    ],
  },
};

const SPORT_TABS: SportTab[] = ["RUN", "BIKE", "SWIM", "STRENGTH"];

// ── Helpers ───────────────────────────────────────────────────────────────────

function secToMinSec(sec: number, unit = "/km"): string {
  const m = Math.floor(sec / 60);
  const s = Math.round(sec % 60);
  return `${m}:${s.toString().padStart(2, "0")} ${unit}`;
}

function parsePace(input: string): number | null {
  const m = input.match(/^(\d{1,2}):(\d{2})$/);
  if (!m) return null;
  return parseInt(m[1]) * 60 + parseInt(m[2]);
}

function fmtRefValue(val: number, method: MethodConfig): string {
  if (method.isPace) return secToMinSec(val, method.unit ?? "/km");
  return `${val} ${method.unit ?? ""}`.trim();
}

function computeActual(zone: ZoneDef, refValue: number, method: MethodConfig): string {
  if (method.id === "RPE") {
    if (!zone.rpeRange) return "—";
    return `RPE ${zone.rpeRange[0]}–${zone.rpeRange[1]}`;
  }
  if (method.isPace) {
    const unit = method.unit ?? "/km";
    const fastSec = Math.round(refValue * zone.minPct / 100);
    if (zone.maxPct >= 999) return `> ${secToMinSec(fastSec, unit)}`;
    const slowSec = Math.round(refValue * zone.maxPct / 100);
    return `${secToMinSec(fastSec, unit)} – ${secToMinSec(slowSec, unit)}`;
  }
  const min = Math.round(refValue * zone.minPct / 100);
  if (zone.maxPct >= 999) return `> ${min} ${method.unit ?? ""}`.trim();
  const max = Math.round(refValue * zone.maxPct / 100);
  return `${min} – ${max} ${method.unit ?? ""}`.trim();
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function ZonasAtletaPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: athleteId } = use(params);

  const [activeSport, setActiveSport] = useState<SportTab>("RUN");
  const [activeMethod, setActiveMethod] = useState<Record<SportTab, string>>({
    RUN: "FC_MAXIMA", BIKE: "FTP", SWIM: "PACE", STRENGTH: "RPE",
  });
  // refInputs keyed by "SPORT_METHODID"
  const [refInputs, setRefInputs] = useState<Record<string, string>>({});
  const [profiles, setProfiles] = useState<Record<SportTab, SportProfile | null>>({
    RUN: null, BIKE: null, SWIM: null, STRENGTH: null,
  });
  const [loading, setLoading] = useState<Record<SportTab, boolean>>({
    RUN: true, BIKE: true, SWIM: true, STRENGTH: true,
  });
  const [saving, setSaving] = useState<Record<SportTab, boolean>>({
    RUN: false, BIKE: false, SWIM: false, STRENGTH: false,
  });
  const [saved, setSaved] = useState<Record<SportTab, boolean>>({
    RUN: false, BIKE: false, SWIM: false, STRENGTH: false,
  });
  const [error, setError] = useState<Record<SportTab, string>>({
    RUN: "", BIKE: "", SWIM: "", STRENGTH: "",
  });

  // ── Load profiles ────────────────────────────────────────────────────────────

  const loadProfile = useCallback(async (sport: SportTab) => {
    setLoading((p) => ({ ...p, [sport]: true }));
    try {
      const res = await fetch(`/api/treinador/atletas/${athleteId}/sport-profile/${sport}`);
      if (!res.ok) return;
      const { profile } = await res.json();
      if (!profile) return;

      setProfiles((p) => ({ ...p, [sport]: profile }));

      // Pre-fill refInputs from profile
      const config = SPORT_CONFIGS[sport];
      const updates: Record<string, string> = {};
      config.methods.forEach((m) => {
        if (!m.refField) return;
        const val = profile[m.refField] as number | null;
        if (val === null || val === undefined) return;
        updates[`${sport}_${m.id}`] = m.isPace ? secToMinSec(val, "").trim() : String(val);
      });
      if (Object.keys(updates).length) {
        setRefInputs((p) => ({ ...p, ...updates }));
      }
    } finally {
      setLoading((p) => ({ ...p, [sport]: false }));
    }
  }, [athleteId]);

  useEffect(() => {
    SPORT_TABS.forEach((s) => loadProfile(s));
  }, [loadProfile]);

  // ── Save ─────────────────────────────────────────────────────────────────────

  async function handleSave(sport: SportTab) {
    const config = SPORT_CONFIGS[sport];
    const methodId = activeMethod[sport];
    const method = config.methods.find((m) => m.id === methodId);
    if (!method) return;

    const key = `${sport}_${methodId}`;
    const refStr = (refInputs[key] ?? "").trim();

    let refNumeric: number | null = null;
    if (method.refField && refStr) {
      refNumeric = method.isPace ? parsePace(refStr) : (Number(refStr) || null);
    }

    const preset = ZONE_PRESETS.find((p) => p.name === method.presetName);
    if (!preset) return;

    const body: Record<string, unknown> = { zones: preset.zones };
    if (method.refField && refNumeric !== null) {
      body[method.refField] = refNumeric;
    }

    setSaving((p) => ({ ...p, [sport]: true }));
    setSaved((p) => ({ ...p, [sport]: false }));
    setError((p) => ({ ...p, [sport]: "" }));
    try {
      const res = await fetch(`/api/treinador/atletas/${athleteId}/sport-profile/${sport}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        setError((p) => ({ ...p, [sport]: d?.error ?? "Erro ao salvar." }));
        return;
      }
      setSaved((p) => ({ ...p, [sport]: true }));
      await loadProfile(sport);
      setTimeout(() => setSaved((p) => ({ ...p, [sport]: false })), 3000);
    } finally {
      setSaving((p) => ({ ...p, [sport]: false }));
    }
  }

  // ── Render ───────────────────────────────────────────────────────────────────

  const sportConfig = SPORT_CONFIGS[activeSport];
  const methodId = activeMethod[activeSport];
  const method = sportConfig.methods.find((m) => m.id === methodId) ?? sportConfig.methods[0];
  const refKey = `${activeSport}_${method.id}`;
  const refStr = refInputs[refKey] ?? "";
  const profile = profiles[activeSport];

  const refNumeric = method.refField
    ? (method.isPace ? parsePace(refStr) : (Number(refStr) || null))
    : null;

  const preset = ZONE_PRESETS.find((p) => p.name === method.presetName);

  const SIcon = sportConfig.icon;

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      {/* Header */}
      <div>
        <Link href={`/treinador/atletas/${athleteId}`}
          className="mb-3 inline-flex items-center gap-1.5 text-xs font-semibold text-text-muted hover:text-text">
          <ArrowLeft className="h-3.5 w-3.5" />
          Voltar ao perfil
        </Link>
        <div className="flex items-center gap-2">
          <HeartPulse className="h-5 w-5 text-primary" />
          <h1 className="font-display text-2xl font-bold text-text">Zonas de Intensidade</h1>
        </div>
        <p className="mt-1 text-sm text-text-muted">
          Configure as zonas por modalidade. Os valores são calculados automaticamente a partir do parâmetro de referência.
        </p>
      </div>

      {/* Sport tabs */}
      <div className="flex gap-1 rounded-2xl border border-border bg-card p-1">
        {SPORT_TABS.map((sport) => {
          const cfg = SPORT_CONFIGS[sport];
          const Icon = cfg.icon;
          const isActive = sport === activeSport;
          return (
            <button key={sport} type="button"
              onClick={() => setActiveSport(sport)}
              style={isActive ? { borderColor: cfg.color + "50", backgroundColor: cfg.color + "15", color: cfg.color } : {}}
              className={`flex flex-1 items-center justify-center gap-1.5 rounded-xl border px-3 py-2.5 text-xs font-semibold transition-all ${
                isActive ? "" : "border-transparent text-text-muted hover:bg-card-hover"
              }`}>
              <Icon className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">{cfg.label}</span>
              <span className="sm:hidden">{cfg.label.slice(0, 3)}</span>
            </button>
          );
        })}
      </div>

      {loading[activeSport] ? (
        <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
      ) : (
        <div className="rounded-2xl border border-border bg-card overflow-hidden">
          {/* Method selector */}
          <div className="border-b border-border bg-card-hover/30 p-4">
            <p className="mb-2 text-xs font-semibold text-text-muted uppercase tracking-wider">Método de cálculo</p>
            <div className="flex flex-wrap gap-2">
              {sportConfig.methods.map((m) => (
                <button key={m.id} type="button"
                  onClick={() => setActiveMethod((p) => ({ ...p, [activeSport]: m.id }))}
                  className={`rounded-xl border px-3 py-1.5 text-xs font-medium transition-all ${
                    methodId === m.id
                      ? "border-primary/50 bg-primary/10 text-primary"
                      : "border-border bg-background text-text-muted hover:border-primary/30"
                  }`}>
                  {m.label}
                </button>
              ))}
            </div>
          </div>

          <div className="p-5 space-y-5">
            {/* Reference value */}
            {method.refField && (
              <div className="space-y-2">
                <p className="text-xs font-semibold text-text-muted uppercase tracking-wider">Parâmetro de referência</p>
                <div className="flex items-center gap-3">
                  <div className="relative flex-1">
                    <input
                      type="text"
                      value={refStr}
                      onChange={(e) => setRefInputs((p) => ({ ...p, [refKey]: e.target.value }))}
                      placeholder={method.placeholder ?? "—"}
                      className="w-full rounded-xl border border-border bg-background px-3.5 py-2.5 pr-16 text-sm text-text placeholder:text-text-muted/50 outline-none focus:border-primary/60 focus:ring-2 focus:ring-primary/20 transition-colors"
                    />
                    {method.unit && (
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-medium text-text-muted">
                        {method.unit}
                      </span>
                    )}
                  </div>
                  {profile && method.refField && profile[method.refField] !== null && (
                    <button type="button"
                      onClick={() => {
                        const val = profile![method.refField!] as number;
                        setRefInputs((p) => ({
                          ...p,
                          [refKey]: method.isPace ? secToMinSec(val, "").trim() : String(val),
                        }));
                      }}
                      className="flex items-center gap-1.5 rounded-xl border border-border px-3 py-2.5 text-xs font-semibold text-text-muted hover:bg-card-hover whitespace-nowrap">
                      <RefreshCw className="h-3 w-3" />
                      Do perfil: {fmtRefValue(profile[method.refField] as number, method)}
                    </button>
                  )}
                </div>
                {method.isPace && refStr && !parsePace(refStr) && (
                  <p className="text-[11px] text-danger">Use o formato mm:ss (ex: 5:00)</p>
                )}
                {method.id === "FC_MAXIMA" && !refStr && (
                  <p className="text-[11px] text-text-muted/60">
                    Estimativa Tanaka: FC máx = 208 − 0,7 × idade
                  </p>
                )}
              </div>
            )}

            {/* Zone table */}
            {preset ? (
              <div className="space-y-2">
                <p className="text-xs font-semibold text-text-muted uppercase tracking-wider">
                  Zonas calculadas
                  {!refNumeric && method.refField && (
                    <span className="ml-2 normal-case font-normal text-text-muted/60">— informe o valor de referência para ver os limites</span>
                  )}
                </p>
                <div className="divide-y divide-border rounded-xl border border-border overflow-hidden">
                  {preset.zones.map((zone) => (
                    <div key={zone.number} className="flex items-center gap-3 px-4 py-3 bg-background">
                      <div
                        className="h-3 w-3 shrink-0 rounded-full"
                        style={{ backgroundColor: zone.color }}
                      />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-text-muted">Z{zone.number}</span>
                          <span className="text-sm font-semibold text-text truncate">{zone.name}</span>
                        </div>
                        {zone.description && (
                          <p className="text-[11px] text-text-muted/70 truncate">{zone.description}</p>
                        )}
                      </div>
                      <div className="shrink-0 text-right">
                        {refNumeric ? (
                          <p className="text-sm font-bold text-text whitespace-nowrap">
                            {computeActual(zone, refNumeric, method)}
                          </p>
                        ) : method.id === "RPE" ? (
                          <p className="text-sm font-bold text-text">
                            {computeActual(zone, 0, method)}
                          </p>
                        ) : (
                          <span className="text-xs text-text-muted/50">
                            {zone.maxPct >= 999 ? `> ${zone.minPct}%` : `${zone.minPct}–${zone.maxPct}%`}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : null}

            {/* Current saved zones info */}
            {profile?.zones && (
              <div className="rounded-xl border border-border/50 bg-background/40 px-4 py-3">
                <p className="text-[11px] text-text-muted">
                  <CheckCircle2 className="inline h-3 w-3 text-success mr-1" />
                  {profile.zones.length} zonas salvas para este atleta nesta modalidade.
                  Salvar novamente substituirá as zonas atuais.
                </p>
              </div>
            )}

            {/* Error */}
            {error[activeSport] && (
              <p className="rounded-xl border border-danger/30 bg-danger/10 px-3.5 py-2.5 text-sm text-danger">
                {error[activeSport]}
              </p>
            )}

            {/* Save */}
            <div className="flex items-center justify-between gap-3">
              <p className="text-[11px] text-text-muted/60">
                Preset: {method.presetName}
              </p>
              <button
                type="button"
                onClick={() => handleSave(activeSport)}
                disabled={saving[activeSport] || (!!method.refField && !refNumeric && method.id !== "RPE")}
                className="flex items-center gap-1.5 rounded-xl gradient-primary px-5 py-2.5 text-sm font-bold text-white shadow-lg shadow-primary/30 disabled:opacity-50 transition-opacity">
                {saving[activeSport] ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : saved[activeSport] ? (
                  <CheckCircle2 className="h-4 w-4" />
                ) : (
                  <Save className="h-4 w-4" />
                )}
                {saved[activeSport] ? "Salvo!" : "Salvar zonas"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
