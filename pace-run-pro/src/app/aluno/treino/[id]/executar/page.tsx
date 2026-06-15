"use client";

import { use, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  Footprints,
  HeartPulse,
  Mic,
  Mountain,
  Pause,
  Play,
  Square,
  Gauge,
  Navigation2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { getWorkoutDetail } from "@/lib/mock-data";
import { calculateHrZones } from "@/lib/calculations";
import { formatDuration, formatPace } from "@/lib/utils";

const hrZones = calculateHrZones(188, 58);

const voiceCues = [
  "Você completou 1 quilômetro. Pace atual: 4 minutos e 38 segundos por quilômetro.",
  "Frequência cardíaca na zona 3. Mantenha o ritmo.",
  "Metade do treino concluída. Continue assim!",
  "Cadência ideal — 174 passos por minuto.",
];

export default function ExecuteWorkoutPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const workout = useMemo(() => getWorkoutDetail(id), [id]);

  const [running, setRunning] = useState(true);
  const [elapsed, setElapsed] = useState(0); // seconds
  const [splits, setSplits] = useState<{ km: number; pace: string }[]>([]);
  const [voiceIndex, setVoiceIndex] = useState(0);
  const lastSplitKm = useRef(0);

  useEffect(() => {
    if (!running) return;
    const t = setInterval(() => setElapsed((e) => e + 1), 1000);
    return () => clearInterval(t);
  }, [running]);

  // Simulated live metrics derived from elapsed time
  const basePaceSec = workout?.targetPaceSecPerKm ?? 300;
  const wobble = Math.sin(elapsed / 9) * 6;
  const instantPaceSec = Math.round(basePaceSec - 8 + wobble);
  const distanceKm = (elapsed / basePaceSec);
  const hr = Math.round(150 + Math.sin(elapsed / 14) * 9);
  const cadence = Math.round(172 + Math.sin(elapsed / 11) * 3);
  const elevation = Math.round(38 + Math.sin(elapsed / 25) * 12);
  const currentZone = hrZones.find((z) => hr >= z.min && hr <= z.max) ?? hrZones[2];

  // Auto-splits each completed km
  useEffect(() => {
    const wholeKm = Math.floor(distanceKm);
    if (wholeKm > lastSplitKm.current) {
      lastSplitKm.current = wholeKm;
      setSplits((prev) => [...prev, { km: wholeKm, pace: formatPace(Math.round(basePaceSec - 4 + Math.random() * 12 - 6)) }]);
      setVoiceIndex((v) => (v + 1) % voiceCues.length);
    }
  }, [distanceKm, basePaceSec]);

  if (!workout) {
    return <p className="text-text-muted">Treino não encontrado.</p>;
  }

  function finish() {
    setRunning(false);
    router.push("/aluno/checkin");
  }

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-5">
      {/* Map */}
      <div className="relative h-56 overflow-hidden rounded-2xl border border-border sm:h-72">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_30%,rgba(139,92,246,0.35),transparent_55%),radial-gradient(circle_at_75%_70%,rgba(56,189,248,0.25),transparent_55%),#0b1220]" />
        <svg viewBox="0 0 400 240" className="absolute inset-0 h-full w-full opacity-80">
          <motion.path
            d="M40 200 C 90 140, 130 180, 170 120 S 260 60, 320 90 S 370 40, 360 30"
            fill="none"
            stroke="#8b5cf6"
            strokeWidth="4"
            strokeLinecap="round"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: Math.min(1, distanceKm / (workout.distanceKm ?? 9)) }}
            transition={{ ease: "linear", duration: 0.6 }}
          />
          <path
            d="M40 200 C 90 140, 130 180, 170 120 S 260 60, 320 90 S 370 40, 360 30"
            fill="none"
            stroke="#1e2a40"
            strokeWidth="4"
            strokeLinecap="round"
            strokeDasharray="2 10"
          />
        </svg>
        <div className="absolute left-4 top-4 flex items-center gap-2">
          <Badge variant="primary" className="backdrop-blur">
            <Navigation2 className="h-3 w-3" />
            Modo GPS ativo
          </Badge>
          <Badge variant={running ? "success" : "warning"}>{running ? "Gravando" : "Pausado"}</Badge>
        </div>
        <div className="absolute bottom-4 right-4 flex items-center gap-2 rounded-full glass px-3 py-1.5 text-xs text-text-muted">
          <Mic className="h-3.5 w-3.5 text-primary" />
          <span className="max-w-[220px] truncate sm:max-w-xs">{voiceCues[voiceIndex]}</span>
        </div>
      </div>

      {/* Primary readouts */}
      <div className="grid grid-cols-2 gap-3 text-center sm:grid-cols-3">
        <BigStat label="Tempo" value={formatDuration(elapsed)} accent="text-text" />
        <BigStat label="Distância" value={`${distanceKm.toFixed(2)} km`} accent="gradient-text" />
        <BigStat label="Pace médio" value={formatPace(Math.round(elapsed > 0 ? elapsed / Math.max(distanceKm, 0.01) : basePaceSec))} accent="text-info" className="col-span-2 sm:col-span-1" />
      </div>

      {/* Secondary metrics */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <SmallStat icon={Gauge} label="Ritmo instantâneo" value={formatPace(Math.max(180, instantPaceSec))} />
        <SmallStat icon={HeartPulse} label="FC" value={`${hr} bpm`} accent={currentZone.color} />
        <SmallStat icon={Footprints} label="Cadência" value={`${cadence} spm`} />
        <SmallStat icon={Mountain} label="Altimetria" value={`+${elevation} m`} />
      </div>

      {/* Zone indicator */}
      <div className="rounded-2xl border border-border bg-card p-4">
        <div className="mb-2 flex items-center justify-between text-sm">
          <span className="font-medium text-text">Zona atual</span>
          <span className="font-display font-bold" style={{ color: currentZone.color }}>
            Z{currentZone.zone} · {currentZone.name}
          </span>
        </div>
        <div className="flex gap-1">
          {hrZones.map((z) => (
            <div
              key={z.zone}
              className="h-2 flex-1 rounded-full transition-opacity"
              style={{ backgroundColor: z.color, opacity: z.zone === currentZone.zone ? 1 : 0.25 }}
            />
          ))}
        </div>
        <p className="mt-2 text-xs text-text-muted">
          Faixa de FC: {currentZone.min}–{currentZone.max} bpm · Alvo da sessão: {workout.targetHrZone}
        </p>
      </div>

      {/* Splits */}
      {splits.length > 0 && (
        <div className="rounded-2xl border border-border bg-card p-4">
          <h3 className="mb-3 font-display text-sm font-semibold text-text">Splits automáticos</h3>
          <div className="space-y-2">
            {splits.map((s) => (
              <div key={s.km} className="flex items-center justify-between rounded-lg bg-card-hover/50 px-3 py-2 text-sm">
                <span className="text-text-muted">Km {s.km}</span>
                <span className="font-semibold text-text">{s.pace}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Controls */}
      <div className="sticky bottom-20 z-10 flex items-center justify-center gap-3 lg:bottom-6">
        <Button size="lg" variant="secondary" className="flex-1 max-w-[200px]" onClick={() => setRunning((r) => !r)}>
          {running ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5" />}
          {running ? "PAUSAR" : "RETOMAR"}
        </Button>
        <Button size="lg" variant="danger" className="flex-1 max-w-[200px]" onClick={finish}>
          <Square className="h-5 w-5" />
          FINALIZAR
        </Button>
      </div>
    </div>
  );
}

function BigStat({ label, value, accent, className }: { label: string; value: string; accent: string; className?: string }) {
  return (
    <div className={`rounded-2xl border border-border bg-card p-5 ${className ?? ""}`}>
      <p className="text-[11px] uppercase tracking-wider text-text-muted">{label}</p>
      <p className={`mt-1 font-stat text-3xl font-extrabold tabular-nums ${accent}`}>{value}</p>
    </div>
  );
}

function SmallStat({
  icon: Icon,
  label,
  value,
  accent,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
  accent?: string;
}) {
  return (
    <div className="rounded-xl border border-border bg-card p-3.5 text-center">
      <Icon className="mx-auto h-4 w-4 text-text-muted" />
      <p className="mt-1.5 text-[10px] uppercase tracking-wider text-text-muted">{label}</p>
      <p className="mt-0.5 font-stat text-base font-bold tabular-nums" style={accent ? { color: accent } : undefined}>
        <span className={accent ? "" : "text-text"}>{value}</span>
      </p>
    </div>
  );
}
