"use client";

import { use, useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Pause, Play, SkipForward, Square, Volume2, VolumeX, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { PlayerSession, ExecutionStatus, WorkoutCompletionData, PlayerPreferences } from "@/lib/workout-player/types";
import { DEFAULT_PLAYER_PREFERENCES } from "@/lib/workout-player/types";

// ── Helpers ────────────────────────────────────────────────────────────────

function fmtTime(sec: number): string {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

function fmtPace(secPerKm: number): string {
  if (!secPerKm || secPerKm <= 0) return "--:--";
  const m = Math.floor(secPerKm / 60);
  const s = Math.round(secPerKm % 60);
  return `${m}:${s.toString().padStart(2, "0")} /km`;
}

const PHASE_COLORS: Record<string, string> = {
  WARMUP: "#f97316",
  WORK: "#C6F24E",
  RECOVERY: "#06b6d4",
  COOLDOWN: "#a855f7",
  REST: "#6b7280",
  TRANSITION: "#eab308",
};

const PHASE_LABELS: Record<string, string> = {
  WARMUP: "Aquecimento",
  WORK: "Trabalho",
  RECOVERY: "Recuperação",
  COOLDOWN: "Desaquecimento",
  REST: "Descanso",
  TRANSITION: "Transição",
};

// ── Countdown overlay ──────────────────────────────────────────────────────

function CountdownOverlay({ value }: { value: number }) {
  return (
    <motion.div
      key={value}
      initial={{ scale: 1.6, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      exit={{ scale: 0.6, opacity: 0 }}
      transition={{ duration: 0.35 }}
      className="absolute inset-0 flex flex-col items-center justify-center bg-black/80 z-50 rounded-xl"
    >
      <p className="text-text-muted text-sm mb-2">Prepare-se</p>
      <span className="text-9xl font-black text-primary">{value}</span>
    </motion.div>
  );
}

// ── Completion screen ──────────────────────────────────────────────────────

function CompletionScreen({
  status,
  onSave,
}: {
  status: ExecutionStatus;
  onSave: (data: { rpe: number; feeling: string; notes: string }) => void;
}) {
  const [rpe, setRpe] = useState(7);
  const [feeling, setFeeling] = useState("good");
  const [notes, setNotes] = useState("");
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    onSave({ rpe, feeling, notes });
    setSaved(true);
  };

  return (
    <div className="flex flex-col items-center gap-6 py-8 px-4 text-center">
      <div className="text-6xl">🏅</div>
      <h2 className="text-2xl font-bold text-primary">Treino Concluído!</h2>
      <div className="grid grid-cols-2 gap-4 w-full max-w-sm">
        <div className="rounded-xl border border-border bg-card p-4">
          <p className="text-xs text-text-muted mb-1">Duração</p>
          <p className="text-xl font-bold">{fmtTime(status.totalElapsedSec)}</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-4">
          <p className="text-xs text-text-muted mb-1">Blocos</p>
          <p className="text-xl font-bold">{status.completedStepCount}/{status.currentStepIndex + 1}</p>
        </div>
      </div>
      {!saved ? (
        <div className="flex flex-col gap-4 w-full max-w-sm">
          <div>
            <label className="block text-sm font-medium mb-2">RPE pós-treino: {rpe}</label>
            <input type="range" min={1} max={10} value={rpe} onChange={(e) => setRpe(+e.target.value)}
              className="w-full accent-primary" />
            <div className="flex justify-between text-xs text-text-muted mt-1">
              <span>Muito leve</span><span>Máximo</span>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Como se sentiu?</label>
            <div className="flex gap-2 flex-wrap justify-center">
              {[["great","Ótimo","😄"],["good","Bem","🙂"],["normal","Normal","😐"],["tired","Cansado","😓"],["bad","Mal","😞"]].map(([v, l, e]) => (
                <button key={v} onClick={() => setFeeling(v)}
                  className={`px-3 py-2 rounded-lg border text-sm transition-all ${feeling === v ? "border-primary bg-primary/20 text-primary" : "border-border"}`}>
                  {e} {l}
                </button>
              ))}
            </div>
          </div>
          <textarea value={notes} onChange={(e) => setNotes(e.target.value)}
            placeholder="Observações (opcional)..."
            className="w-full rounded-lg border border-border bg-background p-3 text-sm resize-none h-20 focus:outline-none focus:ring-2 focus:ring-primary" />
          <Button onClick={handleSave} className="w-full" size="lg">Salvar feedback</Button>
        </div>
      ) : (
        <div className="flex flex-col items-center gap-3">
          <div className="text-4xl">✅</div>
          <p className="text-text-muted">Feedback salvo com sucesso!</p>
        </div>
      )}
    </div>
  );
}

// ── Main player page ───────────────────────────────────────────────────────

export default function WorkoutPlayerPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();

  const [session, setSession] = useState<PlayerSession | null>(null);
  const [status, setStatus] = useState<ExecutionStatus | null>(null);
  const [prefs, setPrefs] = useState<PlayerPreferences>(DEFAULT_PLAYER_PREFERENCES);
  const [completion, setCompletion] = useState<WorkoutCompletionData | null>(null);
  const [audioReady, setAudioReady] = useState(false);

  // Dynamic imports to avoid SSR issues
  const engineRef = useRef<import("@/lib/workout-player").WorkoutExecutionEngine | null>(null);
  const audioRef = useRef<import("@/lib/workout-player").AudioCueEngine | null>(null);
  const voiceRef = useRef<import("@/lib/workout-player").VoiceCueEngine | null>(null);
  const vibRef = useRef<import("@/lib/workout-player").VibrationCueEngine | null>(null);

  // Load workout and build a minimal player session from DB data
  useEffect(() => {
    fetch(`/api/atleta/workouts/${id}`)
      .then((r) => r.ok ? r.json() : null)
      .then((data: {
        id: string; title: string; sport?: string | null;
        targetDurationMin?: number | null; targetPaceSecPerKm?: number | null;
        targetPowerPctFtp?: number | null;
      } | null) => {
        if (!data) return;
        const sport = (data.sport ?? "RUN").toUpperCase();
        const durationSec = (data.targetDurationMin ?? 60) * 60;
        const paceTarget = data.targetPaceSecPerKm ?? 300;
        const stepSession: PlayerSession = {
          workoutId: data.id,
          workoutTitle: data.title,
          sport,
          estimatedDurationSec: durationSec,
          totalSteps: 3,
          steps: [
            {
              id: "warmup",
              phase: "WARMUP",
              sport,
              label: "Aquecimento",
              instruction: "Pace confortável, aquece progressivamente",
              durationType: "TIME",
              durationSeconds: 600,
              distanceMeters: 0,
              targetType: "RPE",
              targetMin: 1,
              targetMax: 3,
              targetUnit: "RPE",
              zone: "Z1",
              zoneColor: "#22c55e",
              countdownEnabled: true,
              autoAdvance: true,
              vibrationEnabled: prefs.vibrationEnabled,
            },
            {
              id: "main",
              phase: "WORK",
              sport,
              label: "Parte Principal",
              instruction: "Mantenha pace alvo",
              durationType: "TIME",
              durationSeconds: durationSec - 1200,
              distanceMeters: 0,
              targetType: sport === "BIKE" ? "POWER" : "PACE",
              targetMin: paceTarget - 15,
              targetMax: paceTarget + 15,
              targetUnit: sport === "BIKE" ? "W" : "sec/km",
              zone: "Z3",
              zoneColor: "#C6F24E",
              countdownEnabled: false,
              autoAdvance: true,
              vibrationEnabled: prefs.vibrationEnabled,
            },
            {
              id: "cooldown",
              phase: "COOLDOWN",
              sport,
              label: "Desaquecimento",
              instruction: "Reduz o ritmo, recupera",
              durationType: "TIME",
              durationSeconds: 600,
              distanceMeters: 0,
              targetType: "RPE",
              targetMin: 1,
              targetMax: 3,
              targetUnit: "RPE",
              zone: "Z1",
              zoneColor: "#a855f7",
              countdownEnabled: false,
              autoAdvance: true,
              vibrationEnabled: prefs.vibrationEnabled,
            },
          ],
        };
        setSession(stepSession);
      });
  }, [id]); // eslint-disable-line react-hooks/exhaustive-deps

  // Wire up engines
  useEffect(() => {
    if (!session) return;
    let unmounted = false;

    import("@/lib/workout-player").then(({ WorkoutExecutionEngine, AudioCueEngine, VoiceCueEngine, VibrationCueEngine }) => {
      if (unmounted) return;
      const engine = new WorkoutExecutionEngine();
      const audio = new AudioCueEngine();
      const voice = new VoiceCueEngine();
      const vib = new VibrationCueEngine();

      voice.setMode(prefs.voiceMode);
      voice.setVolume(prefs.volume);
      vib.setEnabled(prefs.vibrationEnabled);

      engineRef.current = engine;
      audioRef.current = audio;
      voiceRef.current = voice;
      vibRef.current = vib;

      engine.load(session);

      const unsub1 = engine.onStatus((s) => { if (!unmounted) setStatus(s); });
      const unsub2 = engine.onCountdown((v) => {
        audio.playCountdown(v);
        voice.speakCountdown(v);
        vib.onCountdown();
      });
      const unsub3 = engine.onStepChange((step) => {
        if (step.phase === "RECOVERY") {
          audio.playRecoveryStart();
          voice.speak("recovery", true);
          vib.onRecovery();
        } else if (step.phase === "WORK") {
          audio.playStartBlock();
          voice.speak("start", true);
          vib.onStart();
        } else if (step.phase === "COOLDOWN") {
          audio.playRecoveryStart();
          voice.speak("cooldown", true);
        }
      });
      const unsub4 = engine.onCompletion((data) => {
        if (unmounted) return;
        audio.playWorkoutComplete();
        voice.speak("workout_complete", true);
        vib.onComplete();
        setCompletion(data);
      });

      // Emit initial status
      setStatus(engine.getStatus());

      return () => {
        unmounted = true;
        unsub1(); unsub2(); unsub3(); unsub4();
        engine.destroy();
      };
    });

    return () => { unmounted = true; };
  }, [session]); // eslint-disable-line react-hooks/exhaustive-deps

  const activateAudio = useCallback(() => {
    audioRef.current?.activate();
    setAudioReady(true);
  }, []);

  const handleStart = useCallback(() => {
    activateAudio();
    engineRef.current?.start();
  }, [activateAudio]);

  const handlePauseResume = useCallback(() => {
    const s = engineRef.current?.getState();
    if (s === "running") engineRef.current?.pause();
    else if (s === "paused") engineRef.current?.resume();
  }, []);

  const handleSkip = useCallback(() => engineRef.current?.skipStep(), []);
  const handleStop = useCallback(() => engineRef.current?.stop(), []);

  const handleSaveCompletion = useCallback((feedback: { rpe: number; feeling: string; notes: string }) => {
    if (!completion) return;
    fetch(`/api/atleta/workouts/${id}/complete`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...completion, ...feedback }),
    }).then(() => setTimeout(() => router.push(`/atleta/treino/${id}`), 1500));
  }, [completion, id, router]);

  const toggleMute = useCallback(() => {
    const next = prefs.voiceMode === "silent" ? "sound_and_voice" : "silent";
    setPrefs((p) => ({ ...p, voiceMode: next }));
    voiceRef.current?.setMode(next);
    if (next === "silent") audioRef.current?.setVolume(0);
    else audioRef.current?.setVolume(prefs.volume);
  }, [prefs]);

  if (!session || !status) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="h-8 w-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
      </div>
    );
  }

  const step = status.currentStep;
  const phaseColor = step ? (PHASE_COLORS[step.phase] ?? "#6b7280") : "#6b7280";
  const phaseLabel = step ? (PHASE_LABELS[step.phase] ?? step.phase) : "";
  const stepRemaining = step?.durationType === "TIME"
    ? Math.max(0, step.durationSeconds - status.stepElapsedSec)
    : 0;

  if (completion) {
    return (
      <div className="min-h-screen bg-background">
        <CompletionScreen status={status} onSave={handleSaveCompletion} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col" style={{ touchAction: "manipulation" }}>
      {/* Header */}
      <div className="flex items-center justify-between px-4 pt-safe pt-4 pb-2">
        <button onClick={() => router.back()} className="text-text-muted text-sm">← Voltar</button>
        <p className="text-sm font-semibold truncate max-w-[60%] text-center">{session.workoutTitle}</p>
        <button onClick={toggleMute} aria-label="Mudo/Som" className="text-text-muted">
          {prefs.voiceMode === "silent" ? <VolumeX size={20} /> : <Volume2 size={20} />}
        </button>
      </div>

      {/* Progress bar */}
      <div className="h-1.5 bg-surface mx-4 rounded-full overflow-hidden">
        <motion.div
          className="h-full rounded-full"
          style={{ backgroundColor: phaseColor }}
          animate={{ width: `${status.progressPercent}%` }}
          transition={{ duration: 0.5 }}
        />
      </div>

      {/* Main display */}
      <div className="flex-1 flex flex-col items-center justify-center relative px-4 py-6 gap-6">
        <AnimatePresence mode="wait">
          {status.state === "countdown" && status.countdownValue !== null && (
            <CountdownOverlay key={`cd-${status.countdownValue}`} value={status.countdownValue} />
          )}
        </AnimatePresence>

        {/* Phase badge */}
        <div
          className="px-4 py-1.5 rounded-full text-sm font-semibold"
          style={{ backgroundColor: `${phaseColor}22`, color: phaseColor, border: `1px solid ${phaseColor}55` }}
        >
          {phaseLabel}
          {step?.repeatTotal && step.repeatTotal > 1 && (
            <span className="ml-2 opacity-70">{status.currentRep}/{status.totalReps}</span>
          )}
        </div>

        {/* Big time display */}
        <div className="text-center">
          <p className="text-8xl font-black tabular-nums" style={{ color: phaseColor }}>
            {step?.durationType === "TIME" ? fmtTime(stepRemaining) : fmtTime(status.stepElapsedSec)}
          </p>
          <p className="text-text-muted text-sm mt-2">
            {step?.durationType === "TIME" ? "restante" : "decorrido"}
          </p>
        </div>

        {/* Target */}
        {step && (
          <div className="flex flex-col items-center gap-1">
            <div className="flex items-center gap-2">
              <Zap size={16} className="text-text-muted" />
              <span className="text-text-muted text-sm">Alvo</span>
            </div>
            <p className="text-xl font-bold">
              {step.targetType === "PACE"
                ? `${fmtPace(step.targetMin)} – ${fmtPace(step.targetMax)}`
                : step.targetType === "POWER"
                ? `${step.targetMin}–${step.targetMax} ${step.targetUnit}`
                : step.targetType === "RPE"
                ? `RPE ${step.targetMin}–${step.targetMax}`
                : step.instruction}
            </p>
          </div>
        )}

        {/* Next step */}
        {status.nextStep && (
          <div className="rounded-xl border border-border bg-card px-4 py-3 w-full max-w-sm">
            <p className="text-xs text-text-muted mb-1">A seguir</p>
            <p className="text-sm font-medium">{PHASE_LABELS[status.nextStep.phase] ?? status.nextStep.phase}</p>
            {status.nextStep.durationType === "TIME" && (
              <p className="text-xs text-text-muted">{fmtTime(status.nextStep.durationSeconds)}</p>
            )}
          </div>
        )}
      </div>

      {/* Controls */}
      <div className="px-4 pb-safe pb-8 flex flex-col gap-3">
        {status.state === "idle" && (
          <Button onClick={handleStart} size="lg" className="w-full text-black font-bold" style={{ backgroundColor: phaseColor }}>
            ▶  Iniciar treino
          </Button>
        )}

        {(status.state === "running" || status.state === "paused" || status.state === "countdown") && (
          <div className="flex gap-3">
            <Button
              onClick={handlePauseResume}
              size="lg"
              variant="outline"
              className="flex-1 gap-2"
              disabled={status.state === "countdown"}
              aria-label={status.state === "paused" ? "Retomar" : "Pausar"}
            >
              {status.state === "paused" ? <Play size={20} /> : <Pause size={20} />}
              {status.state === "paused" ? "Retomar" : "Pausar"}
            </Button>
            <Button
              onClick={handleSkip}
              size="lg"
              variant="outline"
              className="gap-2"
              aria-label="Pular bloco"
              disabled={status.state === "countdown"}
            >
              <SkipForward size={20} />
            </Button>
            <Button
              onClick={handleStop}
              size="lg"
              variant="outline"
              className="gap-2 text-red-400 border-red-400/30"
              aria-label="Encerrar treino"
            >
              <Square size={20} />
            </Button>
          </div>
        )}

        {!audioReady && status.state !== "idle" && (
          <p className="text-xs text-center text-text-muted">Toque na tela para ativar o áudio</p>
        )}
      </div>
    </div>
  );
}
