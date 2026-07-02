"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { formStatus, FORM_LABELS, type LoadDay } from "@/lib/training-load";

// ── helpers ────────────────────────────────────────────────────────────────
function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return "Bom dia";
  if (h < 18) return "Boa tarde";
  return "Boa noite";
}

function getWeekNumber() {
  const now = new Date();
  const start = new Date(now.getFullYear(), 0, 1);
  return Math.ceil(((now.getTime() - start.getTime()) / 86400000 + start.getDay() + 1) / 7);
}

function secToMin(s: number) {
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return `${m}:${String(sec).padStart(2, "0")}`;
}

// Zone bar segments derived from workout type / objective hint
function zoneSegments(type: string, sport?: string, objective?: string): { color: string; flex: number }[] {
  const obj = (objective ?? "").toLowerCase();
  const s = (sport ?? "RUN").toUpperCase();
  if (s === "STRENGTH") return [{ color: "#FFB020", flex: 100 }];
  if (s === "MOBILITY")  return [{ color: "#4ade80", flex: 100 }];
  if (s === "SWIM") {
    if (type.includes("SPRINT") || type.includes("LIMIAR"))
      return [{ color: "#22d3ee", flex: 40 }, { color: "#3b82f6", flex: 60 }];
    return [{ color: "#67e8f9", flex: 60 }, { color: "#22d3ee", flex: 40 }];
  }
  if (s === "BIKE") {
    if (type.includes("VO2") || type.includes("ANAEROBIC") || type.includes("SPRINT"))
      return [{ color: "#f97316", flex: 35 }, { color: "#ef4444", flex: 65 }];
    if (type.includes("THRESHOLD") || type.includes("SWEET"))
      return [{ color: "#fdba74", flex: 30 }, { color: "#f97316", flex: 70 }];
    return [{ color: "#fed7aa", flex: 65 }, { color: "#fdba74", flex: 35 }];
  }
  if (obj.includes("z4") || obj.includes("interval") || obj.includes("tiro"))
    return [{ color: "#46E0C8", flex: 30 }, { color: "#C6F24E", flex: 35 }, { color: "#FFB020", flex: 35 }];
  if (obj.includes("z3") || obj.includes("tempo") || obj.includes("progress"))
    return [{ color: "#46E0C8", flex: 50 }, { color: "#C6F24E", flex: 50 }];
  if (obj.includes("z1") || obj.includes("recup") || obj.includes("leve"))
    return [{ color: "#3FA7FF", flex: 100 }];
  return [{ color: "#46E0C8", flex: 65 }, { color: "#C6F24E", flex: 35 }];
}

const SPORT_ACCENT: Record<string, { color: string; bg: string; border: string; label: string; startLabel: string }> = {
  RUN:      { color: "#C6F24E", bg: "rgba(198,242,78,0.08)",  border: "rgba(198,242,78,0.26)",  label: "Corrida",   startLabel: "▶  Iniciar corrida" },
  BIKE:     { color: "#f97316", bg: "rgba(249,115,22,0.08)",  border: "rgba(249,115,22,0.26)",  label: "Ciclismo",  startLabel: "▶  Iniciar ciclismo" },
  SWIM:     { color: "#06b6d4", bg: "rgba(6,182,212,0.08)",   border: "rgba(6,182,212,0.26)",   label: "Natação",   startLabel: "▶  Iniciar natação" },
  STRENGTH: { color: "#FFB020", bg: "rgba(255,176,32,0.08)",  border: "rgba(255,176,32,0.26)",  label: "Força",     startLabel: "▶  Iniciar força" },
  MOBILITY: { color: "#4ade80", bg: "rgba(74,222,128,0.08)",  border: "rgba(74,222,128,0.26)",  label: "Mobilidade",startLabel: "▶  Iniciar mobilidade" },
  TRIATHLON:{ color: "#eab308", bg: "rgba(234,179,8,0.08)",   border: "rgba(234,179,8,0.26)",   label: "Triathlon", startLabel: "▶  Iniciar treino" },
  BRICK:    { color: "#eab308", bg: "rgba(234,179,8,0.08)",   border: "rgba(234,179,8,0.26)",   label: "Brick",     startLabel: "▶  Iniciar brick" },
};

// ── types ───────────────────────────────────────────────────────────────────
interface WorkoutEntry {
  id: string;
  date: string;
  title: string;
  type: string;
  sport?: string | null;
  objective?: string;
  targetPaceSecPerKm?: number;
  targetPacePer100m?: number;
  targetPowerPctFtp?: number;
  distanceKm?: number;
  durationMin?: number;
  targetRpe?: number;
}

// ── workout card ────────────────────────────────────────────────────────────
function WorkoutCard({ w, yesterday }: { w: WorkoutEntry; yesterday?: boolean }) {
  const sportKey = (w.sport ?? "RUN").toUpperCase();
  const sportCfg = SPORT_ACCENT[sportKey] ?? SPORT_ACCENT.RUN;
  const accent        = sportCfg.color;
  const accentBg      = sportCfg.bg;
  const accentBorder  = sportCfg.border;
  const accentLabel   = accentBg;
  const ctaBg         = sportKey === "RUN" ? "#C6F24E" : accentBg;
  const ctaText       = sportKey === "RUN" ? "#0A0C0F" : accent;
  const ctaLabel      = yesterday ? "▶  Ver treino" : sportCfg.startLabel;
  const typeLabel     = `${sportCfg.label} · ${w.objective?.slice(0, 20) ?? w.type}`;
  const segments      = zoneSegments(w.type, sportKey, w.objective);

  const href = yesterday ? `/atleta/treino/${w.id}` : `/atleta/treino/${w.id}/executar`;
  const detailHref = `/atleta/treino/${w.id}`;

  return (
    <div
      style={{
        background: "#0E1116",
        border: `1px solid ${accentBorder}`,
        borderRadius: 20,
        padding: 16,
        marginBottom: 10,
      }}
    >
      {/* header row */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 11 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 6 }}>
            <div style={{ width: 7, height: 7, borderRadius: "50%", background: accent, flexShrink: 0 }} />
            <span style={{
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: 9,
              letterSpacing: "0.18em",
              textTransform: "uppercase",
              color: accent,
            }}>
              {typeLabel}
            </span>
          </div>
          <div style={{ fontSize: 18, fontWeight: 800, letterSpacing: "-0.01em", color: "#ECEAE3", lineHeight: 1.2 }}>
            {w.title}
          </div>
          <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: "#9AA0A6", marginTop: 3 }}>
            {w.distanceKm ? `${w.distanceKm} ${sportKey === "SWIM" ? "m" : "km"}` : ""}
            {w.distanceKm && w.durationMin ? " · " : ""}
            {w.durationMin ? `~${w.durationMin} min` : ""}
            {w.targetPaceSecPerKm && sportKey === "RUN" ? ` · ${secToMin(w.targetPaceSecPerKm)}/km` : ""}
            {w.targetPacePer100m ? ` · ${secToMin(w.targetPacePer100m)}/100m` : ""}
            {w.targetPowerPctFtp ? ` · ${w.targetPowerPctFtp}% FTP` : ""}
          </div>
        </div>
        {/* icon square */}
        <div style={{
          width: 40, height: 40, borderRadius: 11,
          background: accentBg, border: `1px solid ${accentLabel}`,
          display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
          marginLeft: 10, fontSize: 20,
        }}>
          {sportKey === "STRENGTH" ? "🏋️" :
           sportKey === "BIKE"     ? "🚴" :
           sportKey === "SWIM"     ? "🏊" :
           sportKey === "MOBILITY" ? "🧘" :
           sportKey === "TRIATHLON"? "🏅" :
           sportKey === "BRICK"    ? "⚡" :
           "🏃"}
        </div>
      </div>

      {/* zone progress bar */}
      <div style={{ display: "flex", gap: 3, height: 4, borderRadius: 3, overflow: "hidden", marginBottom: 11 }}>
        {segments.map((seg, i) => (
          <div key={i} style={{ flex: seg.flex, background: seg.color }} />
        ))}
      </div>

      {/* coach note (using objective as note) */}
      {w.objective && (
        <div style={{
          background: "rgba(0,0,0,0.18)", borderRadius: 10, padding: "9px 12px", marginBottom: 11,
        }}>
          <div style={{
            fontFamily: "'JetBrains Mono', monospace", fontSize: 9,
            letterSpacing: "0.12em", color: "#5C636B", textTransform: "uppercase", marginBottom: 4,
          }}>
            Observação do treinador
          </div>
          <div style={{ fontSize: 12, color: "#B9BCC0", lineHeight: 1.55 }}>
            {w.objective}
          </div>
        </div>
      )}

      {/* CTA */}
      <Link href={href} style={{ display: "block" }}>
        <div style={{
          background: ctaBg,
          ...(sportKey !== "RUN" ? { border: `1px solid ${accentBorder}` } : {}),
          borderRadius: 12, padding: 13,
          textAlign: "center", fontWeight: 800, fontSize: 14, color: ctaText, cursor: "pointer",
        }}>
          {ctaLabel}
        </div>
      </Link>

      {/* secondary link */}
      {!yesterday && (
        <Link href={detailHref}>
          <div style={{ textAlign: "center", marginTop: 9, fontSize: 12, color: "#5C636B", textDecoration: "underline" }}>
            Ver detalhes
          </div>
        </Link>
      )}
    </div>
  );
}

// ── PSE widget ──────────────────────────────────────────────────────────────
function PseWidget({ yesterdayWorkout }: { yesterdayWorkout: WorkoutEntry | null }) {
  const [selected, setSelected] = useState<number | null>(null);
  const [saved, setSaved] = useState(false);

  if (!yesterdayWorkout || saved) return null;

  async function pick(val: number) {
    setSelected(val);
    try {
      await fetch("/api/atleta/checkin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rpe: val, workoutId: yesterdayWorkout?.id }),
      });
    } catch (_) {
      // non-blocking — best effort
    }
    setTimeout(() => setSaved(true), 600);
  }

  const dayStr = new Date(yesterdayWorkout.date).toLocaleDateString("pt-BR", { weekday: "short" });

  return (
    <div style={{
      background: "#14171C", border: "1px solid rgba(236,234,227,0.07)",
      borderRadius: 16, padding: 14, marginBottom: 10,
    }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: "#ECEAE3" }}>Como foi ontem?</div>
        <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: "#9AA0A6" }}>
          {dayStr} · {yesterdayWorkout.distanceKm ? `${yesterdayWorkout.distanceKm}km` : yesterdayWorkout.title.slice(0, 12)}
        </div>
      </div>
      <div style={{ display: "flex", gap: 5 }}>
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            onClick={() => pick(n)}
            style={{
              flex: 1, textAlign: "center", padding: "9px 0", borderRadius: 9,
              background: selected === n ? "#C6F24E" : "#1C2026",
              fontFamily: "'JetBrains Mono', monospace", fontSize: 13, fontWeight: 700,
              color: selected === n ? "#0A0C0F" : "#9AA0A6",
              border: "none", cursor: "pointer", transition: "all 0.15s",
            }}
          >
            {n}
          </button>
        ))}
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", marginTop: 5, fontSize: 10, color: "#5C636B" }}>
        <span>Fácil</span><span>Máximo</span>
      </div>
    </div>
  );
}

// ── quick metrics ───────────────────────────────────────────────────────────
function QuickMetrics({
  tsb,
  ctl,
  weeklyStats,
}: {
  tsb: number | null;
  ctl: number | null;
  weeklyStats: { totalKm: number; adherencePct: number | null } | null;
}) {
  const weekKm = weeklyStats?.totalKm ?? 0;
  const adherence = weeklyStats?.adherencePct ?? null;

  const formLabel = tsb !== null ? FORM_LABELS[formStatus(tsb)].label : null;
  const formColor = tsb !== null ? (tsb > 5 ? "#C6F24E" : tsb > -15 ? "#46E0C8" : "#FFB020") : "#9AA0A6";

  const metrics = [
    {
      label: "Adesão",
      value: adherence !== null ? `${adherence}%` : "—",
      color: adherence && adherence >= 80 ? "#C6F24E" : "#ECEAE3",
    },
    {
      label: "Volume",
      value: weekKm > 0 ? `${weekKm.toFixed(0)}km` : "—",
      color: "#ECEAE3",
    },
    {
      label: "Forma",
      value: formLabel ?? (tsb !== null ? `TSB ${tsb > 0 ? "+" : ""}${tsb.toFixed(0)}` : "—"),
      color: formColor,
      small: !!formLabel,
    },
  ];

  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 8 }}>
      {metrics.map((m) => (
        <div
          key={m.label}
          style={{
            background: "#14171C", border: "1px solid rgba(236,234,227,0.07)",
            borderRadius: 14, padding: "12px 10px",
          }}
        >
          <div style={{ fontSize: 10, color: "#9AA0A6", marginBottom: 4 }}>{m.label}</div>
          <div style={{
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: m.small ? 14 : 22, fontWeight: 700, color: m.color, lineHeight: 1,
          }}>
            {m.value}
          </div>
        </div>
      ))}
    </div>
  );
}

// ── empty state ─────────────────────────────────────────────────────────────
function EmptyState({ tsb }: { tsb: number | null }) {
  const hasLoad = tsb !== null;
  const status = hasLoad ? formStatus(tsb!) : null;
  const info = status ? FORM_LABELS[status] : null;

  const msg = hasLoad
    ? tsb! > 10
      ? "Você está em pico de forma! Sua carga está baixa e o fitness alto — ótimo momento para treinar."
      : tsb! > 0
        ? "Forma ótima. Boa hora para uma rodagem moderada ou fartlek se quiser treinar."
        : tsb! > -20
          ? "Em carga de treino. Se treinar hoje, opte por ritmo leve e técnica."
          : "Fadiga acumulada. Seu corpo pede recuperação — descanso ativo ou mobilidade."
    : "Seu treinador ainda está preparando seu plano. Você receberá uma notificação quando os treinos forem liberados.";

  return (
    <div style={{
      background: "#14171C",
      border: "1px solid rgba(236,234,227,0.07)",
      borderRadius: 20, padding: "28px 20px", marginBottom: 10, textAlign: "center",
    }}>
      <div style={{
        width: 52, height: 52, borderRadius: 14,
        background: "rgba(198,242,78,0.08)", border: "1px solid rgba(198,242,78,0.18)",
        display: "flex", alignItems: "center", justifyContent: "center",
        margin: "0 auto 14px",
      }}>
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
          <path d="M8 6h8M8 10h8M8 14h5" stroke="#C6F24E" strokeWidth="1.8" strokeLinecap="round" />
          <rect x="3" y="3" width="18" height="18" rx="3" stroke="#C6F24E" strokeWidth="1.5" />
        </svg>
      </div>
      {info && (
        <div style={{
          display: "inline-block", fontFamily: "'JetBrains Mono', monospace",
          fontSize: 10, letterSpacing: "0.12em", textTransform: "uppercase",
          padding: "4px 12px", borderRadius: 20, marginBottom: 10,
          background: "rgba(198,242,78,0.09)", border: "1px solid rgba(198,242,78,0.22)", color: "#C6F24E",
        }}>
          {info.label}
        </div>
      )}
      <div style={{ fontSize: 15, fontWeight: 700, color: "#ECEAE3", marginBottom: 8, lineHeight: 1.3 }}>
        {hasLoad ? "Sem treino prescrito hoje" : "Aguardando prescrição"}
      </div>
      <div style={{ fontSize: 13, color: "#9AA0A6", lineHeight: 1.55, maxWidth: 260, margin: "0 auto 18px" }}>
        {msg}
      </div>
      <Link href="/atleta/ia-treinadora">
        <div style={{
          background: "rgba(198,242,78,0.1)", border: "1px solid rgba(198,242,78,0.22)",
          borderRadius: 12, padding: "11px 0", fontSize: 13, fontWeight: 700, color: "#C6F24E",
          cursor: "pointer",
        }}>
          Perguntar à IA Treinadora
        </div>
      </Link>
    </div>
  );
}

// ── main page ───────────────────────────────────────────────────────────────
export default function AthleteDashboard() {
  const [greeting, setGreeting] = useState("");
  const [firstName, setFirstName] = useState("Atleta");
  const [todayWorkouts, setTodayWorkouts] = useState<WorkoutEntry[]>([]);
  const [yesterdayWorkout, setYesterdayWorkout] = useState<WorkoutEntry | null>(null);
  const [workoutsLoading, setWorkoutsLoading] = useState(true);
  const [tsb, setTsb] = useState<number | null>(null);
  const [ctl, setCtl] = useState<number | null>(null);
  const [series, setSeries] = useState<LoadDay[]>([]);
  const [weeklyStats, setWeeklyStats] = useState<{ totalKm: number; adherencePct: number | null } | null>(null);

  useEffect(() => { setGreeting(getGreeting()); }, []);

  useEffect(() => {
    fetch("/api/atleta/perfil")
      .then((r) => r.ok ? r.json() : null)
      .then((d: { name?: string } | null) => { if (d?.name) setFirstName(d.name.split(" ")[0]); })
      .catch(() => null);
  }, []);

  useEffect(() => {
    fetch("/api/atleta/training-load")
      .then((r) => r.ok ? r.json() : null)
      .then((d: {
        latest?: { tsb: number; ctl: number } | null;
        series?: LoadDay[];
        weeklyStats?: { totalKm: number; adherencePct: number | null };
      } | null) => {
        if (d?.latest) { setTsb(d.latest.tsb); setCtl(d.latest.ctl); }
        if (d?.series?.length) setSeries(d.series.slice(-14));
        if (d?.weeklyStats) setWeeklyStats(d.weeklyStats);
      })
      .catch(() => null);
  }, []);

  useEffect(() => {
    fetch("/api/atleta/workouts")
      .then((r) => r.ok ? r.json() : [])
      .then((data: WorkoutEntry[]) => {
        const todayStr = new Date().toLocaleDateString("sv");
        const yesterdayStr = new Date(Date.now() - 86400000).toLocaleDateString("sv");
        setTodayWorkouts(data.filter((w) => w.date.slice(0, 10) === todayStr));
        setYesterdayWorkout(data.find((w) => w.date.slice(0, 10) === yesterdayStr) ?? null);
      })
      .catch(() => null)
      .finally(() => setWorkoutsLoading(false));
  }, []);

  const week = getWeekNumber();

  return (
    <div
      style={{
        minHeight: "100dvh",
        background: "#0A0C0F",
        fontFamily: "Archivo, system-ui, sans-serif",
        WebkitFontSmoothing: "antialiased",
        paddingBottom: 90, // space for bottom nav
      }}
    >
      {/* Ambient glow */}
      <div style={{
        position: "fixed", top: 0, left: "50%", transform: "translateX(-50%)",
        width: "100%", maxWidth: 480, height: 360,
        background: "radial-gradient(ellipse at top,rgba(198,242,78,0.06),transparent 60%)",
        pointerEvents: "none", zIndex: 0,
      }} />

      {/* Content */}
      <div style={{ position: "relative", zIndex: 1, maxWidth: 480, margin: "0 auto", padding: "18px 20px 28px" }}>

        {/* ── Greeting ── */}
        <div style={{ marginBottom: 14 }}>
          <div style={{ fontSize: 13, color: "#9AA0A6" }}>
            {greeting || "Olá"},
          </div>
          <div style={{ fontSize: 26, fontWeight: 800, letterSpacing: "-0.02em", color: "#ECEAE3", lineHeight: 1.15 }}>
            {firstName}
          </div>
        </div>

        {/* ── Badge pills ── */}
        <div style={{ display: "flex", gap: 6, marginBottom: 16, flexWrap: "wrap" }}>
          {todayWorkouts.length > 0 && (
            <div style={{
              fontFamily: "'JetBrains Mono', monospace", fontSize: 10, padding: "5px 10px",
              borderRadius: 999, background: "rgba(198,242,78,0.09)",
              border: "1px solid rgba(198,242,78,0.24)", color: "#C6F24E", letterSpacing: "0.08em",
            }}>
              {todayWorkouts.length === 1 ? "1 treino hoje" : `${todayWorkouts.length} treinos hoje`}
            </div>
          )}
          <div style={{
            fontFamily: "'JetBrains Mono', monospace", fontSize: 10, padding: "5px 10px",
            borderRadius: 999, background: "rgba(236,234,227,0.05)",
            border: "1px solid rgba(236,234,227,0.1)", color: "#9AA0A6", letterSpacing: "0.08em",
          }}>
            Semana {week}
          </div>
        </div>

        {/* ── Today workouts ── */}
        {workoutsLoading ? (
          <div style={{ display: "flex", justifyContent: "center", padding: "40px 0" }}>
            <div style={{
              width: 24, height: 24, borderRadius: "50%",
              border: "2px solid rgba(198,242,78,0.3)", borderTopColor: "#C6F24E",
              animation: "spin 0.8s linear infinite",
            }} />
            <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
          </div>
        ) : todayWorkouts.length > 0 ? (
          todayWorkouts.map((w) => <WorkoutCard key={w.id} w={w} />)
        ) : (
          <EmptyState tsb={tsb} />
        )}

        {/* ── PSE Widget ── */}
        <PseWidget yesterdayWorkout={yesterdayWorkout} />

        {/* ── Quick metrics ── */}
        <QuickMetrics tsb={tsb} ctl={ctl} weeklyStats={weeklyStats} />

      </div>
    </div>
  );
}
