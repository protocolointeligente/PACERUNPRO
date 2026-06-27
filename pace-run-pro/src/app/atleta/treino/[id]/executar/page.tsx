"use client";

import { use, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  AlertTriangle,
  Crosshair,
  Mic,
  Mountain,
  Pause,
  Play,
  Square,
  Gauge,
  Navigation2,
  Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { formatDuration, formatPace } from "@/lib/utils";
import {
  buildRoutePath,
  computeInstantPace,
  elevationGainMeters,
  totalDistanceMeters,
  type GeoPoint,
} from "@/lib/geo";

type GpsStatus = "idle" | "requesting" | "active" | "denied" | "unsupported" | "error";

interface WorkoutData {
  id: string;
  title: string;
  targetPaceSecPerKm?: number | null;
  targetHrZone?: string | null;
  targetDistanceKm?: number | null;
  targetDurationMin?: number | null;
  targetRpe?: number | null;
}

export default function ExecuteWorkoutPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [workout, setWorkout] = useState<WorkoutData | null>(null);

  useEffect(() => {
    fetch(`/api/atleta/workouts/${id}`)
      .then((r) => r.ok ? r.json() : null)
      .then((data: WorkoutData | null) => setWorkout(data))
      .catch(() => null);
  }, [id]);

  const [running, setRunning] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [points, setPoints] = useState<GeoPoint[]>([]);
  const [splits, setSplits] = useState<{ km: number; pace: string }[]>([]);
  const [showFinishDialog, setShowFinishDialog] = useState(false);
  const [voiceCue, setVoiceCue] = useState("Toque em Iniciar Treino para começar.");
  const [gpsStatus, setGpsStatus] = useState<GpsStatus>("idle");
  const [gpsErrorMsg, setGpsErrorMsg] = useState<string | null>(null);

  const lastSplitKmRef = useRef(0);
  const lastSplitElapsedRef = useRef(0);

  // Timer — increments only while running
  useEffect(() => {
    if (!running) return;
    const t = setInterval(() => setElapsed((e) => e + 1), 1000);
    return () => clearInterval(t);
  }, [running]);

  const handlePosition = useCallback((pos: GeolocationPosition) => {
    setPoints((prev) => [
      ...prev,
      {
        lat: pos.coords.latitude,
        lng: pos.coords.longitude,
        alt: pos.coords.altitude,
        accuracy: pos.coords.accuracy ?? 9999,
        speed: pos.coords.speed,
        timestamp: pos.timestamp,
      },
    ]);
  }, []);

  const handleGeoError = useCallback((err: GeolocationPositionError) => {
    if (err.code === err.PERMISSION_DENIED) {
      setGpsStatus("denied");
      setVoiceCue("GPS bloqueado. Permita o acesso à localização para registrar rota e distância.");
    } else {
      setGpsStatus("error");
      setGpsErrorMsg(err.message);
      setVoiceCue("Não foi possível obter o GPS. Verifique se está em área com boa cobertura.");
    }
  }, []);

  const requestGps = useCallback(() => {
    if (!("geolocation" in navigator)) {
      setGpsStatus("unsupported");
      setVoiceCue("GPS não disponível neste dispositivo.");
      return;
    }
    setGpsStatus("requesting");
    setGpsErrorMsg(null);
    setVoiceCue("Solicitando permissão de GPS...");
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        handlePosition(pos);
        setGpsStatus("active");
        setRunning(true);
        setVoiceCue("GPS ativado! Treino iniciado — bom treino!");
      },
      handleGeoError,
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 },
    );
  }, [handlePosition, handleGeoError]);

  // GPS is requested only on explicit user action (requestGps called via button)
  // Auto-requesting on mount silently fails on iOS Safari

  // Continuous position watch — pauses when athlete pauses the workout
  useEffect(() => {
    if (gpsStatus !== "active" || !running) return;
    const watchId = navigator.geolocation.watchPosition(handlePosition, handleGeoError, {
      enableHighAccuracy: true,
      maximumAge: 1000,
      timeout: 20000,
    });
    return () => navigator.geolocation.clearWatch(watchId);
  }, [gpsStatus, running, handlePosition, handleGeoError]);

  // Derived real metrics from GPS points
  const distanceMeters = useMemo(() => totalDistanceMeters(points), [points]);
  const distanceKm = distanceMeters / 1000;
  const elevationGain = useMemo(() => elevationGainMeters(points), [points]);
  const hasAltitude = points.some((p) => p.alt != null);
  const instantPace = useMemo(() => computeInstantPace(points), [points]);
  const avgPaceSec = distanceKm > 0.01 && elapsed > 0 ? elapsed / distanceKm : null;
  const lastPoint = points[points.length - 1];
  const speedKmh =
    lastPoint?.speed != null
      ? lastPoint.speed * 3.6
      : instantPace
        ? 3600 / instantPace
        : null;

  // Real SVG route drawn from actual GPS coordinates
  const routePath = useMemo(() => buildRoutePath(points, 400, 240, 24), [points]);

  // Auto-splits triggered by real GPS-measured distance
  useEffect(() => {
    const wholeKm = Math.floor(distanceKm);
    if (wholeKm > lastSplitKmRef.current) {
      lastSplitKmRef.current = wholeKm;
      const splitPaceSec = elapsed - lastSplitElapsedRef.current;
      lastSplitElapsedRef.current = elapsed;
      const paceStr = formatPace(splitPaceSec);
      setSplits((prev) => [...prev, { km: wholeKm, pace: paceStr }]);
      setVoiceCue(`Você completou ${wholeKm} km. Pace do quilômetro: ${paceStr}.`);
    }
  }, [distanceKm, elapsed]);

  if (!workout) {
    return <p className="text-text-muted">Treino não encontrado.</p>;
  }

  function finish() {
    setShowFinishDialog(false);
    setRunning(false);
    // Persist real GPS stats so the check-in page can build the share card
    const avgPace = distanceKm > 0.01 && elapsed > 0 ? elapsed / distanceKm : null;
    try {
      localStorage.setItem(
        "lastWorkout",
        JSON.stringify({
          distanceKm,
          durationSec: elapsed,
          avgPaceSec: avgPace ? Math.round(avgPace) : null,
          elevationGain: hasAltitude ? elevationGain : null,
          title: workout?.title ?? "",
          splits,
        }),
      );
    } catch {
      // storage unavailable (private browsing or permissions)
    }
    // Save workout log to the database
    fetch(`/api/atleta/workouts/${id}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        distanceKm: distanceKm > 0.01 ? parseFloat(distanceKm.toFixed(3)) : null,
        durationSec: elapsed > 0 ? elapsed : null,
        rpe: null,
        feeling: null,
      }),
    }).catch(() => null);
    router.push("/atleta/checkin");
  }

  const gpsBadge = (() => {
    switch (gpsStatus) {
      case "active":
        return {
          label: lastPoint ? `GPS ativo · ±${Math.round(lastPoint.accuracy)}m` : "GPS ativo",
          variant: "primary" as const,
        };
      case "requesting":
        return { label: "Solicitando GPS...", variant: "warning" as const };
      case "denied":
        return { label: "GPS bloqueado", variant: "danger" as const };
      case "unsupported":
        return { label: "GPS indisponível", variant: "danger" as const };
      case "error":
        return { label: "Erro de GPS", variant: "danger" as const };
      default:
        return { label: "Aguardando GPS...", variant: "warning" as const };
    }
  })();

  const targetPaceSec = workout.targetPaceSecPerKm;
  const comparePace = instantPace ?? avgPaceSec;
  let paceStatus: { label: string; color: string } | null = null;
  if (targetPaceSec && comparePace) {
    const diff = comparePace - targetPaceSec;
    if (Math.abs(diff) <= 5) paceStatus = { label: "Na meta", color: "#22c55e" };
    else if (diff > 5) paceStatus = { label: "Mais lento que a meta", color: "#FFB020" };
    else paceStatus = { label: "Mais rápido que a meta", color: "#38bdf8" };
  }

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-5">
      {/* Pre-start overlay — shown while GPS is idle (not yet requested) */}
      {gpsStatus === "idle" && (
        <div className="flex flex-col items-center gap-4 rounded-2xl border border-border bg-card py-12 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10">
            <Play className="h-8 w-8 text-primary" />
          </div>
          <div>
            <h2 className="font-display text-lg font-bold text-text">{workout.title}</h2>
            <p className="mt-1 text-sm text-text-muted">
              O treino solicitará acesso ao GPS para registrar distância e rota.
            </p>
          </div>
          <Button size="lg" onClick={requestGps} className="gap-2 px-10">
            <Play className="h-5 w-5" />
            Iniciar treino
          </Button>
        </div>
      )}

      {/* Finish confirmation dialog */}
      {showFinishDialog && (
        <div role="dialog" aria-modal="true" aria-label="Finalizar treino" className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4">
          <div className="w-full max-w-sm rounded-2xl bg-card border border-border p-6 space-y-4 shadow-xl">
            <h2 className="font-display text-lg font-bold text-text">Finalizar treino?</h2>
            <p className="text-sm text-text-muted">
              Seu progresso até agora ({distanceKm.toFixed(2)} km · {Math.floor(elapsed / 60)}min) será salvo.
            </p>
            <div className="flex gap-3">
              <Button variant="outline" className="flex-1" onClick={() => setShowFinishDialog(false)}>
                Continuar correndo
              </Button>
              <Button variant="danger" className="flex-1" onClick={finish}>
                Sim, finalizar
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* GPS permission / error notice */}
      {(gpsStatus === "denied" || gpsStatus === "unsupported" || gpsStatus === "error") && (
        <Card className="border-warning/30 bg-warning/5">
          <CardContent className="flex items-start gap-3 p-4">
            <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-warning" />
            <div className="flex-1">
              <h3 className="font-display text-sm font-semibold text-text">
                {gpsStatus === "unsupported" ? "GPS não disponível" : "Acesso ao GPS necessário"}
              </h3>
              <p className="mt-1 text-sm text-text-muted">
                {gpsStatus === "denied" &&
                  "Você bloqueou o acesso à localização. Para registrar distância, pace e rota reais, permita o GPS nas configurações do navegador e tente novamente."}
                {gpsStatus === "unsupported" &&
                  "Este navegador/dispositivo não oferece suporte a geolocalização. O treino será cronometrado, mas distância e rota não poderão ser registradas."}
                {gpsStatus === "error" &&
                  `Não foi possível obter sua localização${gpsErrorMsg ? ` (${gpsErrorMsg})` : ""}. Verifique se o GPS está ativado e tente novamente.`}
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                {gpsStatus !== "unsupported" && (
                  <Button size="sm" variant="secondary" onClick={requestGps}>
                    Tentar novamente
                  </Button>
                )}
                {!running && (
                  <Button size="sm" variant="ghost" onClick={() => { setRunning(true); setVoiceCue("Cronômetro iniciado sem GPS."); }}>
                    Continuar sem GPS (cronômetro)
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Route map — real GPS trace or waiting indicator */}
      <div className="relative h-56 overflow-hidden rounded-2xl border border-border sm:h-72">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_30%,rgba(139,92,246,0.35),transparent_55%),radial-gradient(circle_at_75%_70%,rgba(56,189,248,0.25),transparent_55%),#0b1220]" />
        <svg viewBox="0 0 400 240" className="absolute inset-0 h-full w-full opacity-80">
          {routePath ? (
            <motion.path
              d={routePath}
              fill="none"
              stroke="#C6F24E"
              strokeWidth="4"
              strokeLinecap="round"
              strokeLinejoin="round"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ ease: "linear", duration: 0.6 }}
            />
          ) : (
            /* Dot while waiting for first GPS fix */
            <circle cx="200" cy="120" r="6" fill="#C6F24E" opacity="0.6" />
          )}
        </svg>
        <div className="absolute left-4 top-4 flex items-center gap-2">
          <Badge variant={gpsBadge.variant} className="backdrop-blur">
            <Navigation2 className="h-3 w-3" />
            {gpsBadge.label}
          </Badge>
          <Badge variant={running ? "success" : "warning"}>{running ? "Gravando" : "Pausado"}</Badge>
        </div>
        <div className="absolute bottom-4 right-4 flex items-center gap-2 rounded-full glass px-3 py-1.5 text-xs text-text-muted">
          <Mic className="h-3.5 w-3.5 text-primary" />
          <span className="max-w-[220px] truncate sm:max-w-xs">{voiceCue}</span>
        </div>
      </div>

      {/* Primary readouts */}
      <div className="grid grid-cols-2 gap-3 text-center sm:grid-cols-3">
        <BigStat label="Tempo" value={formatDuration(elapsed)} accent="text-text" />
        <BigStat label="Distância" value={`${distanceKm.toFixed(2)} km`} accent="gradient-text" />
        <BigStat
          label="Pace médio"
          value={avgPaceSec ? formatPace(Math.round(avgPaceSec)) : "--:--/km"}
          accent="text-info"
          className="col-span-2 sm:col-span-1"
        />
      </div>

      {/* Secondary metrics — all real GPS-derived values */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <SmallStat icon={Gauge} label="Ritmo instantâneo" value={instantPace ? formatPace(Math.round(instantPace)) : "--:--/km"} />
        <SmallStat icon={Zap} label="Velocidade" value={speedKmh != null ? `${speedKmh.toFixed(1)} km/h` : "--"} />
        <SmallStat icon={Mountain} label="Elevação ganha" value={hasAltitude ? `+${elevationGain.toFixed(0)} m` : "—"} />
        <SmallStat icon={Crosshair} label="Precisão GPS" value={lastPoint ? `±${Math.round(lastPoint.accuracy)} m` : "--"} />
      </div>

      {/* Pace vs target */}
      <div className="rounded-2xl border border-border bg-card p-4">
        <div className="mb-1.5 flex items-center justify-between text-sm">
          <span className="font-medium text-text">Pace vs. meta da sessão</span>
          {paceStatus ? (
            <span className="font-display font-bold" style={{ color: paceStatus.color }}>
              {paceStatus.label}
            </span>
          ) : (
            <span className="text-text-muted">Aguardando dados de GPS...</span>
          )}
        </div>
        <p className="text-xs text-text-muted">
          Pace atual:{" "}
          {comparePace ? formatPace(Math.round(comparePace)) : "--:--/km"} · Meta:{" "}
          {targetPaceSec ? formatPace(targetPaceSec) : "—"}
          {workout.targetHrZone ? ` · FC alvo: ${workout.targetHrZone}` : ""}
        </p>
      </div>

      {/* Auto-splits from real GPS distance */}
      {splits.length > 0 && (
        <div className="rounded-2xl border border-border bg-card p-4">
          <h3 className="mb-3 font-display text-sm font-semibold text-text">Splits automáticos</h3>
          <div className="space-y-2">
            {splits.map((s) => (
              <div
                key={s.km}
                className="flex items-center justify-between rounded-lg bg-card-hover/50 px-3 py-2 text-sm"
              >
                <span className="text-text-muted">Km {s.km}</span>
                <span className="font-semibold text-text">{s.pace}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Controls */}
      <div className="sticky bottom-20 z-10 flex items-center justify-center gap-3 lg:bottom-6">
        <Button
          size="lg"
          variant="secondary"
          className="max-w-[200px] flex-1"
          disabled={gpsStatus === "requesting"}
          onClick={() => setRunning((r) => !r)}
        >
          {running ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5" />}
          {running ? "PAUSAR" : "RETOMAR"}
        </Button>
        <Button size="lg" variant="danger" className="max-w-[200px] flex-1" onClick={() => setShowFinishDialog(true)}>
          <Square className="h-5 w-5" />
          FINALIZAR
        </Button>
      </div>
    </div>
  );
}

function BigStat({
  label,
  value,
  accent,
  className,
}: {
  label: string;
  value: string;
  accent: string;
  className?: string;
}) {
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
      <p className="mt-0.5 font-stat text-base font-bold tabular-nums">
        <span className={accent ? "" : "text-text"} style={accent ? { color: accent } : undefined}>
          {value}
        </span>
      </p>
    </div>
  );
}
