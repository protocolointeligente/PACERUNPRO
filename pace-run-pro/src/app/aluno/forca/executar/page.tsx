"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowLeft,
  CheckCircle2,
  ChevronRight,
  Dumbbell,
  Flame,
  Repeat,
  SkipForward,
  Timer,
} from "lucide-react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { strengthSessionExample } from "@/lib/mock-data";
import { WorkoutShareModal } from "@/components/workout-share-modal";

type Phase = "working" | "resting" | "between" | "done";

function parseRestSeconds(rest: string): number {
  const match = rest.match(/\d+/);
  return match ? parseInt(match[0]) : 60;
}

function playBeep() {
  try {
    const AudioCtx = window.AudioContext || (window as Window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
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

const exercises = strengthSessionExample.exercises;

export default function StrengthExecutarPage() {
  const router = useRouter();

  const [exerciseIdx, setExerciseIdx] = useState(0);
  const [currentSet, setCurrentSet] = useState(1);
  const [phase, setPhase] = useState<Phase>("working");
  const [restRemaining, setRestRemaining] = useState(0);
  const [restTotal, setRestTotal] = useState(0);
  const [showShare, setShowShare] = useState(false);

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startTimeRef = useRef<number>(Date.now());

  const exercise = exercises[exerciseIdx];
  const totalSets = exercise?.sets ?? 1;
  const isLastExercise = exerciseIdx === exercises.length - 1;
  const remainingExercises = exercises.slice(exerciseIdx + 1);

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

  const startRest = useCallback(
    (onFinish: () => void) => {
      const secs = parseRestSeconds(exercise.rest);
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
    },
    [exercise]
  );

  const stopRest = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  const completeSet = useCallback(() => {
    if (currentSet < totalSets) {
      // More sets remain — rest then continue
      const nextSet = currentSet + 1;
      startRest(() => {
        setCurrentSet(nextSet);
        setPhase("working");
      });
    } else {
      // Last set of this exercise
      if (isLastExercise) {
        // All exercises done
        setPhase("done");
      } else {
        // Rest then show "between" so user can advance to next exercise
        startRest(() => {
          setPhase("between");
        });
      }
    }
  }, [currentSet, totalSets, isLastExercise, startRest]);

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

  const finish = useCallback(() => {
    router.push("/aluno/checkin");
  }, [router]);

  if (phase === "done") {
    const elapsedSeconds = Math.floor((Date.now() - startTimeRef.current) / 1000);
    const totalDuration = `${Math.floor(elapsedSeconds / 60)}min ${elapsedSeconds % 60}s`;

    return (
      <>
        <div className="mx-auto flex min-h-[70vh] max-w-lg flex-col items-center justify-center px-4 text-center">
          <motion.div
            initial={{ scale: 0.7, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring", stiffness: 260, damping: 20 }}
            className="mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-success/15"
            style={{ color: "var(--color-success, #84cc16)" }}
          >
            <CheckCircle2 className="h-12 w-12" style={{ color: "var(--color-success, #84cc16)" }} />
          </motion.div>
          <h1 className="font-display text-3xl font-bold text-white">Treino concluído!</h1>
          <p className="mt-2 text-text-muted">
            Você completou todas as séries de{" "}
            <span className="text-white">{strengthSessionExample.label}</span>. Ótimo trabalho!
          </p>
          <Button
            size="lg"
            className="gradient-primary mt-8 w-full shadow-lg shadow-primary/30"
            onClick={finish}
          >
            <CheckCircle2 className="h-5 w-5" />
            Fazer check-in pós-treino
          </Button>
          <Link href="/aluno/forca" className="mt-4 block text-sm text-text-muted hover:text-white">
            Voltar para força
          </Link>
        </div>
        <WorkoutShareModal
          isOpen={showShare}
          onClose={() => setShowShare(false)}
          metrics={{
            duration: totalDuration,
            sessionName: "Treino de Força",
            exerciseCount: exercises.length,
          }}
          activityType="forca"
        />
      </>
    );
  }

  // ── Progress ring params ───────────────────────────────────────────────────
  const progressPct = (exerciseIdx / exercises.length) * 100;
  const restProgressPct = restTotal > 0 ? ((restTotal - restRemaining) / restTotal) * 100 : 0;
  const radius = 54;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (restProgressPct / 100) * circumference;

  // ── Main execution screen ─────────────────────────────────────────────────
  return (
    <div className="mx-auto max-w-lg space-y-5 pb-8">
      {/* Back link */}
      <div className="flex items-center gap-2">
        <Link
          href="/aluno/forca"
          className="flex items-center gap-1.5 text-sm text-text-muted transition-colors hover:text-white"
        >
          <ArrowLeft className="h-4 w-4" />
          Voltar
        </Link>
      </div>

      {/* Progress bar */}
      <div>
        <div className="mb-1.5 flex items-center justify-between text-xs text-text-muted">
          <span>
            Exercício {exerciseIdx + 1} de {exercises.length}
          </span>
          <span className="max-w-[55%] truncate text-right">{strengthSessionExample.label}</span>
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
            {/* Exercise image with overlay */}
            <div
              className="h-48 w-full bg-cover bg-center"
              style={{ backgroundImage: `url('${exercise.imageUrl}')` }}
            >
              <div className="flex h-full w-full items-start justify-between bg-gradient-to-b from-black/60 to-transparent p-4">
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/80 text-sm font-bold text-white backdrop-blur-sm">
                  {exerciseIdx + 1}
                </span>
                <Badge variant="primary" className="backdrop-blur-sm">
                  {exercise.category}
                </Badge>
              </div>
            </div>

            <CardContent className="p-5">
              <h2 className="font-display text-xl font-bold text-white">{exercise.name}</h2>

              {/* Stats row */}
              <div className="mt-3 flex flex-wrap gap-2 text-xs text-text-muted">
                <span className="flex items-center gap-1.5 rounded-lg border border-border bg-card-hover/60 px-2.5 py-1.5">
                  <Repeat className="h-3.5 w-3.5 text-primary" />
                  {exercise.sets} séries · {exercise.reps}
                </span>
                <span className="flex items-center gap-1.5 rounded-lg border border-border bg-card-hover/60 px-2.5 py-1.5">
                  <Timer className="h-3.5 w-3.5 text-info" />
                  Descanso {exercise.rest}
                </span>
                <span className="flex items-center gap-1.5 rounded-lg border border-border bg-card-hover/60 px-2.5 py-1.5">
                  <Flame className="h-3.5 w-3.5 text-warning" />
                  RPE {exercise.rpe}
                </span>
              </div>

              {/* Phase-dependent action area */}
              <AnimatePresence mode="wait">
                {/* ── WORKING phase ── */}
                {phase === "working" && (
                  <motion.div
                    key="working"
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -12 }}
                    transition={{ duration: 0.25 }}
                    className="mt-5 space-y-4"
                  >
                    {/* Phase badge */}
                    <div className="flex items-center justify-center">
                      <span
                        className="inline-flex items-center gap-2 rounded-full border px-4 py-1.5 text-sm font-semibold"
                        style={{
                          borderColor: "rgba(132,204,22,0.3)",
                          backgroundColor: "rgba(132,204,22,0.1)",
                          color: "#84cc16",
                        }}
                      >
                        <span
                          className="h-2 w-2 animate-pulse rounded-full"
                          style={{ backgroundColor: "#84cc16" }}
                        />
                        EXECUTAR
                      </span>
                    </div>

                    {/* Set counter */}
                    <div className="text-center">
                      <p className="text-xs uppercase tracking-widest text-text-muted">Série atual</p>
                      <p className="font-display text-5xl font-bold text-white">
                        {currentSet}
                        <span className="text-2xl text-text-muted">/{totalSets}</span>
                      </p>
                    </div>

                    {/* Complete set button */}
                    <Button
                      size="lg"
                      className="gradient-primary w-full shadow-lg shadow-primary/30"
                      onClick={completeSet}
                    >
                      <CheckCircle2 className="h-5 w-5" />
                      Concluir série {currentSet} de {totalSets}
                    </Button>

                    {/* Early finish for last exercise */}
                    {isLastExercise && (
                      <div className="flex justify-center pt-1">
                        <button
                          onClick={finish}
                          className="text-xs text-text-muted transition-colors hover:text-white"
                        >
                          Encerrar sessão
                        </button>
                      </div>
                    )}
                  </motion.div>
                )}

                {/* ── RESTING phase ── */}
                {phase === "resting" && (
                  <motion.div
                    key="resting"
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -12 }}
                    transition={{ duration: 0.25 }}
                    className="mt-5 space-y-4"
                  >
                    {/* Phase badge */}
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

                    {/* Circular countdown */}
                    <div className="flex items-center justify-center">
                      <div className="relative flex h-36 w-36 items-center justify-center">
                        <svg className="-rotate-90" width="144" height="144" viewBox="0 0 144 144">
                          {/* Track */}
                          <circle
                            cx="72"
                            cy="72"
                            r={radius}
                            fill="none"
                            stroke="rgba(255,255,255,0.07)"
                            strokeWidth="8"
                          />
                          {/* Progress */}
                          <motion.circle
                            cx="72"
                            cy="72"
                            r={radius}
                            fill="none"
                            stroke="#38bdf8"
                            strokeWidth="8"
                            strokeLinecap="round"
                            strokeDasharray={circumference}
                            animate={{ strokeDashoffset }}
                            transition={{ duration: 0.9, ease: "linear" }}
                          />
                        </svg>
                        <div className="absolute inset-0 flex flex-col items-center justify-center">
                          <span className="font-display text-3xl font-bold text-white">
                            {formatCountdown(restRemaining)}
                          </span>
                          <span className="text-[10px] uppercase tracking-widest text-text-muted">
                            restante
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Skip rest */}
                    <div className="flex justify-center">
                      <button
                        onClick={() =>
                          skipRest(() => {
                            // Mirror the same logic as what the timer would do on finish
                            if (currentSet < totalSets) {
                              setCurrentSet((s) => s + 1);
                              setPhase("working");
                            } else if (isLastExercise) {
                              setPhase("done");
                            } else {
                              setPhase("between");
                            }
                          })
                        }
                        className="flex items-center gap-1.5 text-sm text-text-muted transition-colors hover:text-white"
                      >
                        Pular descanso
                        <SkipForward className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </motion.div>
                )}

                {/* ── BETWEEN phase — all sets done, advance to next exercise ── */}
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

      {/* Remaining exercises pills */}
      {remainingExercises.length > 0 && (
        <div>
          <p className="mb-2.5 text-xs uppercase tracking-wider text-text-muted">
            Próximos exercícios
          </p>
          <div className="flex flex-wrap gap-2">
            {remainingExercises.map((ex, i) => (
              <span
                key={ex.id}
                className="flex items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1.5 text-xs text-text-muted"
              >
                <span className="flex h-4 w-4 items-center justify-center rounded-full bg-card-hover text-[10px] font-bold text-white">
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
