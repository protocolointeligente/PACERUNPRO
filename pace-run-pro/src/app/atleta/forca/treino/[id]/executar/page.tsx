"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowLeft,
  CheckCircle2,
  ChevronRight,
  Dumbbell,
  Flame,
  Loader2,
  Repeat,
  SkipForward,
  Timer,
} from "lucide-react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { WorkoutShareModal } from "@/components/workout-share-modal";
import { cn } from "@/lib/utils";

type Phase = "working" | "resting" | "rpe" | "between" | "done";

interface ExerciseData {
  id: string;
  name: string;
  category: string;
  sets: number;
  reps: string;
  restSec: number;
  targetRpe: number | null;
  gifUrl?: string;
}

interface WorkoutData {
  id: string;
  title: string;
  strengthWorkout?: {
    split: string;
    label?: string | null;
    blocks: {
      id: string;
      sets: number;
      reps: string;
      restSec?: number | null;
      rpe?: number | null;
      exercise: {
        id: string;
        name: string;
        category: string;
        imageUrl?: string | null;
      };
    }[];
  } | null;
}

interface ExerciseJsonEntry {
  name: string;
  gifUrl?: string;
  imageUrl?: string;
}

function normName(n: string) {
  return n.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

function playBeep() {
  try {
    const AudioCtx =
      window.AudioContext ||
      (window as Window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.frequency.value = 880;
    gain.gain.setValueAtTime(0.3, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.25);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.25);
  } catch {}
}

function formatCountdown(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

const RPE_COLORS = [
  "", // index 0 unused
  "border-success/30 bg-success/10 text-success hover:bg-success/20",
  "border-success/30 bg-success/10 text-success hover:bg-success/20",
  "border-success/30 bg-success/10 text-success hover:bg-success/20",
  "border-warning/30 bg-warning/10 text-warning hover:bg-warning/20",
  "border-warning/30 bg-warning/10 text-warning hover:bg-warning/20",
  "border-warning/30 bg-warning/10 text-warning hover:bg-warning/20",
  "border-orange-400/30 bg-orange-400/10 text-orange-400 hover:bg-orange-400/20",
  "border-orange-400/30 bg-orange-400/10 text-orange-400 hover:bg-orange-400/20",
  "border-destructive/30 bg-destructive/10 text-destructive hover:bg-destructive/20",
  "border-destructive/30 bg-destructive/10 text-destructive hover:bg-destructive/20",
];

export default function StrengthExecPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  const [exercises, setExercises] = useState<ExerciseData[]>([]);
  const [sessionLabel, setSessionLabel] = useState("Treino de força");
  const [loading, setLoading] = useState(true);

  const [exerciseIdx, setExerciseIdx] = useState(0);
  const [currentSet, setCurrentSet] = useState(1);
  const [phase, setPhase] = useState<Phase>("working");
  const [restRemaining, setRestRemaining] = useState(0);
  const [restTotal, setRestTotal] = useState(0);
  const [showShare, setShowShare] = useState(false);

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startTimeRef = useRef<number>(Date.now());

  useEffect(() => {
    async function load() {
      try {
        const [wRes, exRes] = await Promise.all([
          fetch(`/api/athlete/forca/${id}`),
          fetch("/exercises.json"),
        ]);
        const wData: WorkoutData = wRes.ok ? await wRes.json() : null;
        const exJson: ExerciseJsonEntry[] = exRes.ok ? await exRes.json() : [];

        const gifMap: Record<string, string> = {};
        for (const e of exJson) {
          gifMap[normName(e.name)] = e.gifUrl ?? e.imageUrl ?? "";
        }

        if (wData?.strengthWorkout?.blocks) {
          setSessionLabel(wData.strengthWorkout.label ?? wData.title);
          setExercises(
            wData.strengthWorkout.blocks.map((b) => ({
              id: b.exercise.id,
              name: b.exercise.name,
              category: b.exercise.category,
              sets: b.sets,
              reps: b.reps,
              restSec: b.restSec ?? 60,
              targetRpe: b.rpe ?? null,
              gifUrl:
                gifMap[normName(b.exercise.name)] ||
                b.exercise.imageUrl ||
                undefined,
            }))
          );
        }
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [id]);

  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  useEffect(() => {
    if (phase === "done") {
      const t = setTimeout(() => setShowShare(true), 800);
      return () => clearTimeout(t);
    }
  }, [phase]);

  const exercise = exercises[exerciseIdx];
  const totalSets = exercise?.sets ?? 1;
  const isLastExercise = exerciseIdx === exercises.length - 1;
  const remainingExercises = exercises.slice(exerciseIdx + 1);

  const startRest = useCallback((secs: number, onFinish: () => void) => {
    setRestTotal(secs);
    setRestRemaining(secs);
    setPhase("resting");
    intervalRef.current = setInterval(() => {
      setRestRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(intervalRef.current!);
          intervalRef.current = null;
          playBeep();
          onFinish();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }, []);

  const stopRest = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  const completeSet = useCallback(() => {
    if (!exercise) return;
    if (currentSet < totalSets) {
      const nextSet = currentSet + 1;
      startRest(exercise.restSec, () => {
        setCurrentSet(nextSet);
        setPhase("working");
      });
    } else {
      // Last set — ask for RPE
      setPhase("rpe");
    }
  }, [currentSet, totalSets, exercise, startRest]);

  const confirmRpe = useCallback(() => {
    if (isLastExercise) {
      setPhase("done");
    } else {
      startRest(exercise?.restSec ?? 60, () => {
        setPhase("between");
      });
    }
  }, [isLastExercise, exercise, startRest]);

  const skipRest = useCallback(
    (onSkip: () => void) => {
      stopRest();
      onSkip();
    },
    [stopRest]
  );

  const nextExercise = useCallback(() => {
    setExerciseIdx((i) => i + 1);
    setCurrentSet(1);
    setPhase("working");
  }, []);

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!exercise) {
    return (
      <div className="mx-auto max-w-lg space-y-4 py-16 text-center">
        <Dumbbell className="mx-auto h-8 w-8 text-text-muted/40" />
        <p className="text-sm text-text-muted">Treino sem exercícios cadastrados.</p>
        <Link href={`/atleta/forca/treino/${id}`}>
          <Button variant="outline">Voltar</Button>
        </Link>
      </div>
    );
  }

  // ── Done screen ──────────────────────────────────────────────────────────────
  if (phase === "done") {
    const elapsedSec = Math.floor((Date.now() - startTimeRef.current) / 1000);
    const totalDuration = `${Math.floor(elapsedSec / 60)}min ${elapsedSec % 60}s`;

    return (
      <>
        <div className="mx-auto flex min-h-[70vh] max-w-lg flex-col items-center justify-center px-4 text-center">
          <motion.div
            initial={{ scale: 0.7, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring", stiffness: 260, damping: 20 }}
            className="mb-6 flex h-24 w-24 items-center justify-center rounded-full"
            style={{ backgroundColor: "rgba(132,204,22,0.15)", color: "#84cc16" }}
          >
            <CheckCircle2 className="h-12 w-12" />
          </motion.div>
          <h1 className="font-display text-3xl font-bold text-text">Treino concluído!</h1>
          <p className="mt-2 text-text-muted">
            Você completou todas as séries de{" "}
            <span className="text-text">{sessionLabel}</span>. Ótimo trabalho!
          </p>
          <Button
            size="lg"
            className="gradient-primary mt-8 w-full shadow-lg shadow-primary/30"
            onClick={() => router.push("/atleta/checkin")}
          >
            <CheckCircle2 className="h-5 w-5" />
            Fazer check-in pós-treino
          </Button>
          <Link
            href="/atleta/forca"
            className="mt-4 block text-sm text-text-muted hover:text-text"
          >
            Voltar para força
          </Link>
        </div>
        <WorkoutShareModal
          isOpen={showShare}
          onClose={() => setShowShare(false)}
          metrics={{ duration: totalDuration, sessionName: "Treino de Força", exerciseCount: exercises.length }}
          activityType="forca"
          isPersonalRecord={false}
        />
      </>
    );
  }

  // ── Progress ring params ─────────────────────────────────────────────────────
  const progressPct = (exerciseIdx / exercises.length) * 100;
  const restProgressPct = restTotal > 0 ? ((restTotal - restRemaining) / restTotal) * 100 : 0;
  const radius = 54;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (restProgressPct / 100) * circumference;

  // ── Main execution screen ────────────────────────────────────────────────────
  return (
    <div className="mx-auto max-w-lg space-y-5 pb-8">
      {/* Back */}
      <Link
        href={`/atleta/forca/treino/${id}`}
        className="flex items-center gap-1.5 text-sm text-text-muted transition-colors hover:text-text"
      >
        <ArrowLeft className="h-4 w-4" />
        Voltar
      </Link>

      {/* Progress bar */}
      <div>
        <div className="mb-1.5 flex items-center justify-between text-xs text-text-muted">
          <span>Exercício {exerciseIdx + 1} de {exercises.length}</span>
          <span className="max-w-[55%] truncate text-right">{sessionLabel}</span>
        </div>
        <div className="h-1.5 w-full overflow-hidden rounded-full bg-card-hover">
          <motion.div
            className="h-full rounded-full bg-primary"
            initial={false}
            animate={{ width: `${progressPct}%` }}
            transition={{ duration: 0.4, ease: "easeInOut" }}
          />
        </div>
      </div>

      {/* Exercise card */}
      <AnimatePresence mode="wait">
        <motion.div
          key={exerciseIdx}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.3 }}
        >
          <Card className="overflow-hidden border-primary/20">
            {/* Large GIF */}
            <div className="relative h-72 w-full bg-card-hover">
              {exercise.gifUrl ? (
                <img
                  src={exercise.gifUrl}
                  alt={exercise.name}
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center">
                  <Dumbbell className="h-16 w-16 text-text-muted/15" />
                </div>
              )}
              <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-transparent to-transparent" />
              <div className="absolute left-4 top-4 flex items-center gap-2">
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/80 text-sm font-bold text-white backdrop-blur-sm">
                  {exerciseIdx + 1}
                </span>
                <Badge variant="primary" className="backdrop-blur-sm">
                  {exercise.category}
                </Badge>
              </div>
            </div>

            <CardContent className="p-5">
              <h2 className="font-display text-xl font-bold text-text">{exercise.name}</h2>

              {/* Stats */}
              <div className="mt-3 flex flex-wrap gap-2 text-xs text-text-muted">
                <span className="flex items-center gap-1.5 rounded-lg border border-border bg-card-hover/60 px-2.5 py-1.5">
                  <Repeat className="h-3.5 w-3.5 text-primary" />
                  {exercise.sets} séries · {exercise.reps}
                </span>
                <span className="flex items-center gap-1.5 rounded-lg border border-border bg-card-hover/60 px-2.5 py-1.5">
                  <Timer className="h-3.5 w-3.5" style={{ color: "#38bdf8" }} />
                  Descanso {exercise.restSec}s
                </span>
                {exercise.targetRpe && (
                  <span className="flex items-center gap-1.5 rounded-lg border border-border bg-card-hover/60 px-2.5 py-1.5">
                    <Flame className="h-3.5 w-3.5" style={{ color: "#facc15" }} />
                    RPE {exercise.targetRpe}
                  </span>
                )}
              </div>

              {/* Phase area */}
              <AnimatePresence mode="wait">
                {/* WORKING */}
                {phase === "working" && (
                  <motion.div
                    key="working"
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -12 }}
                    transition={{ duration: 0.25 }}
                    className="mt-5 space-y-4"
                  >
                    <div className="flex items-center justify-center">
                      <span
                        className="inline-flex items-center gap-2 rounded-full border px-4 py-1.5 text-sm font-semibold"
                        style={{
                          borderColor: "rgba(132,204,22,0.3)",
                          backgroundColor: "rgba(132,204,22,0.1)",
                          color: "#84cc16",
                        }}
                      >
                        <span className="h-2 w-2 animate-pulse rounded-full" style={{ backgroundColor: "#84cc16" }} />
                        EXECUTAR
                      </span>
                    </div>
                    <div className="text-center">
                      <p className="text-xs uppercase tracking-widest text-text-muted">Série atual</p>
                      <p className="font-display text-6xl font-bold text-text">
                        {currentSet}
                        <span className="text-3xl text-text-muted">/{totalSets}</span>
                      </p>
                    </div>
                    <Button
                      size="lg"
                      className="gradient-primary w-full shadow-lg shadow-primary/30"
                      onClick={completeSet}
                    >
                      <CheckCircle2 className="h-5 w-5" />
                      Concluir série {currentSet} de {totalSets}
                    </Button>
                    {isLastExercise && (
                      <div className="flex justify-center pt-1">
                        <button
                          onClick={() => setPhase("done")}
                          className="text-xs text-text-muted transition-colors hover:text-text"
                        >
                          Encerrar sessão
                        </button>
                      </div>
                    )}
                  </motion.div>
                )}

                {/* RESTING */}
                {phase === "resting" && (
                  <motion.div
                    key="resting"
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -12 }}
                    transition={{ duration: 0.25 }}
                    className="mt-5 space-y-4"
                  >
                    <div className="flex items-center justify-center">
                      <span
                        className="inline-flex items-center gap-2 rounded-full border px-4 py-1.5 text-sm font-semibold"
                        style={{
                          borderColor: "rgba(56,189,248,0.3)",
                          backgroundColor: "rgba(56,189,248,0.1)",
                          color: "#38bdf8",
                        }}
                      >
                        <Timer className="h-3.5 w-3.5" />
                        DESCANSO
                      </span>
                    </div>
                    <div className="flex items-center justify-center">
                      <div className="relative flex h-36 w-36 items-center justify-center">
                        <svg className="-rotate-90" width="144" height="144" viewBox="0 0 144 144">
                          <circle cx="72" cy="72" r={radius} fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth="8" />
                          <motion.circle
                            cx="72" cy="72" r={radius}
                            fill="none" stroke="#38bdf8" strokeWidth="8"
                            strokeLinecap="round"
                            strokeDasharray={circumference}
                            animate={{ strokeDashoffset }}
                            transition={{ duration: 0.9, ease: "linear" }}
                          />
                        </svg>
                        <div className="absolute inset-0 flex flex-col items-center justify-center">
                          <span className="font-display text-3xl font-bold text-text">
                            {formatCountdown(restRemaining)}
                          </span>
                          <span className="text-[10px] uppercase tracking-widest text-text-muted">restante</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex justify-center">
                      <button
                        onClick={() =>
                          skipRest(() => {
                            if (currentSet < totalSets) {
                              setCurrentSet((s) => s + 1);
                              setPhase("working");
                            } else {
                              setPhase("rpe");
                            }
                          })
                        }
                        className="flex items-center gap-1.5 text-sm text-text-muted transition-colors hover:text-text"
                      >
                        Pular descanso
                        <SkipForward className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </motion.div>
                )}

                {/* RPE */}
                {phase === "rpe" && (
                  <motion.div
                    key="rpe"
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -12 }}
                    transition={{ duration: 0.25 }}
                    className="mt-5 space-y-4"
                  >
                    <div className="flex items-center justify-center">
                      <span
                        className="inline-flex items-center gap-2 rounded-full border px-4 py-1.5 text-sm font-semibold"
                        style={{
                          borderColor: "rgba(250,204,21,0.3)",
                          backgroundColor: "rgba(250,204,21,0.1)",
                          color: "#facc15",
                        }}
                      >
                        <Flame className="h-3.5 w-3.5" />
                        COMO FOI?
                      </span>
                    </div>
                    <div>
                      <p className="mb-3 text-center text-sm text-text-muted">
                        Avalie seu esforço neste exercício
                        {exercise.targetRpe && (
                          <span className="ml-1 text-text-muted/60">(esperado: RPE {exercise.targetRpe})</span>
                        )}
                      </p>
                      <div className="grid grid-cols-5 gap-2">
                        {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((v) => (
                          <button
                            key={v}
                            onClick={confirmRpe}
                            className={cn(
                              "rounded-xl border py-3 text-sm font-bold transition-colors",
                              RPE_COLORS[v]
                            )}
                          >
                            {v}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div className="flex justify-center">
                      <button
                        onClick={confirmRpe}
                        className="text-xs text-text-muted transition-colors hover:text-text"
                      >
                        Pular avaliação
                      </button>
                    </div>
                  </motion.div>
                )}

                {/* BETWEEN */}
                {phase === "between" && (
                  <motion.div
                    key="between"
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -12 }}
                    transition={{ duration: 0.25 }}
                    className="mt-5 space-y-4"
                  >
                    <div className="flex items-center justify-center">
                      <span
                        className="inline-flex items-center gap-2 rounded-full border px-4 py-1.5 text-sm font-semibold"
                        style={{
                          borderColor: "rgba(132,204,22,0.3)",
                          backgroundColor: "rgba(132,204,22,0.1)",
                          color: "#84cc16",
                        }}
                      >
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        EXERCÍCIO COMPLETO
                      </span>
                    </div>
                    <p className="text-center text-sm text-text-muted">
                      Todas as {totalSets} séries concluídas!
                    </p>
                    <Button
                      size="lg"
                      className="gradient-primary w-full shadow-lg shadow-primary/30"
                      onClick={nextExercise}
                    >
                      Próximo exercício
                      <ChevronRight className="h-5 w-5" />
                    </Button>
                  </motion.div>
                )}
              </AnimatePresence>
            </CardContent>
          </Card>
        </motion.div>
      </AnimatePresence>

      {/* Remaining pills */}
      {remainingExercises.length > 0 && (
        <div>
          <p className="mb-2.5 text-xs uppercase tracking-wider text-text-muted">Próximos exercícios</p>
          <div className="flex flex-wrap gap-2">
            {remainingExercises.map((ex, i) => (
              <span
                key={ex.id}
                className="flex items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1.5 text-xs text-text-muted"
              >
                <span className="flex h-4 w-4 items-center justify-center rounded-full bg-card-hover text-[10px] font-bold text-text">
                  {exerciseIdx + 2 + i}
                </span>
                <Dumbbell className="h-3 w-3 text-primary" />
                {ex.name}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
