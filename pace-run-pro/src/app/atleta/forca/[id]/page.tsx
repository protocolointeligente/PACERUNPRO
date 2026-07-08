import fs from "fs/promises";
import path from "path";
import { notFound } from "next/navigation";
import Link from "next/link";
import { AlertTriangle, ArrowLeft, CheckCircle2, Clock, Flame, Repeat, Target, Timer } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { getSession } from "@/lib/auth-guard";
import { prisma } from "@/lib/prisma";
import { resolveExerciseMedia } from "@/lib/exercise-media";

interface ExerciseEntry {
  id: string;
  name: string;
  category: string;
  gifUrl?: string;
  imageUrl?: string;
  description?: string;
  execution?: string;
  mistakes?: string;
  muscles?: string[];
  musclesWorked?: string[];
  commonMistakes?: string | null;
  sets?: number;
  reps?: string;
  rest?: string;
  rpe?: number;
  videos?: Array<{ url?: string | null; title?: string | null }> | null;
}

export default async function ExerciseDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getSession();

  if (!session?.user?.id || session.user.role !== "ATHLETE") {
    notFound();
  }

  let exercise: ExerciseEntry | null = null;
  let workoutBlock:
    | {
        id: string;
        sets?: number;
        reps?: string;
        rest?: string;
        rpe?: number;
        notes?: string | null;
        exercise: ExerciseEntry;
      }
    | null = null;

  try {
    const block = await prisma.strengthBlock.findUnique({
      where: { id },
      select: {
        id: true,
        sets: true,
        reps: true,
        restSec: true,
        rpe: true,
        notes: true,
        exercise: {
          select: {
            id: true,
            name: true,
            category: true,
            description: true,
            execution: true,
            commonMistakes: true,
            musclesWorked: true,
            imageUrl: true,
            videos: {
              select: {
                url: true,
                title: true,
              },
              take: 1,
            },
          },
        },
      },
    });

    if (block) {
      workoutBlock = {
        id: block.id,
        sets: block.sets,
        reps: block.reps,
        rest: block.restSec != null ? `${block.restSec}s` : undefined,
        rpe: block.rpe ?? undefined,
        notes: block.notes,
        exercise: {
          id: block.exercise.id,
          name: block.exercise.name,
          category: block.exercise.category,
          description: block.exercise.description ?? undefined,
          execution: undefined,
          mistakes: undefined,
          musclesWorked: [],
          imageUrl: block.exercise.imageUrl ?? undefined,
          videos: block.exercise.videos,
        },
      };
    } else {
      const dbExercise = await prisma.exercise.findUnique({
        where: { id },
        select: {
          id: true,
          name: true,
          category: true,
          description: true,
          execution: true,
          commonMistakes: true,
          musclesWorked: true,
          imageUrl: true,
          videos: {
            select: {
              url: true,
              title: true,
            },
            take: 1,
          },
        },
      });

      if (dbExercise) {
        exercise = {
          id: dbExercise.id,
          name: dbExercise.name,
          category: dbExercise.category,
          description: dbExercise.description ?? undefined,
          execution: dbExercise.execution ?? undefined,
          mistakes: dbExercise.commonMistakes ?? undefined,
          musclesWorked: dbExercise.musclesWorked ?? [],
          imageUrl: dbExercise.imageUrl ?? undefined,
          videos: dbExercise.videos,
        };
      }
    }
  } catch (error) {
    console.error("Erro ao buscar exercício da força", error);
  }

  if (!workoutBlock && !exercise) {
    try {
      const raw = await fs.readFile(path.join(process.cwd(), "public", "exercises.json"), "utf-8");
      const exercises: ExerciseEntry[] = JSON.parse(raw);
      exercise = exercises.find((e) => e.id === id) ?? null;
    } catch {
      exercise = null;
    }
  }

  if (!workoutBlock && !exercise) notFound();

  const resolvedExercise = workoutBlock?.exercise ?? exercise;
  const muscles = resolvedExercise?.musclesWorked ?? resolvedExercise?.muscles ?? [];
  const media = resolveExerciseMedia({
    imageUrl: resolvedExercise?.imageUrl,
    videos: resolvedExercise?.videos,
  });
  const blockSets = workoutBlock?.sets;
  const blockReps = workoutBlock?.reps;
  const blockRest = workoutBlock?.rest;
  const blockRpe = workoutBlock?.rpe;
  const blockNotes = workoutBlock?.notes;

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <Link
        href="/atleta/forca"
        className="mb-4 inline-flex items-center gap-1.5 text-sm text-text-muted hover:text-text transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        Voltar
      </Link>

      <Card className="overflow-hidden">
        <div className="relative flex items-center justify-center bg-card-hover/40" style={{ minHeight: "18rem" }}>
          {media.kind === "video" ? (
            <video
              src={media.url ?? undefined}
              className="max-h-72 w-full object-contain"
              controls
              playsInline
            />
          ) : media.kind === "image" ? (
            <img
              src={media.url ?? undefined}
              alt={resolvedExercise?.name ?? "Exercício"}
              className="max-h-72 w-full object-contain"
            />
          ) : (
            <div className="flex h-72 w-full flex-col items-center justify-center gap-2">
              <p className="text-xs text-text-muted/50">Demonstração em produção</p>
            </div>
          )}
          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-card/90 via-card/30 to-transparent p-5">
            <Badge variant="primary" className="mb-2">{resolvedExercise?.category}</Badge>
            <h1 className="font-display text-2xl font-bold text-text sm:text-3xl">{resolvedExercise?.name}</h1>
          </div>
        </div>

        <CardContent className="grid grid-cols-2 gap-3 p-5 sm:grid-cols-4">
          <Metric icon={Repeat} label="Séries × Reps" value={blockSets != null && blockReps ? `${blockSets}× ${blockReps}` : resolvedExercise?.sets ? `${resolvedExercise.sets}× ${resolvedExercise.reps}` : "—"} />
          <Metric icon={Timer} label="Descanso" value={blockRest ?? resolvedExercise?.rest ?? "—"} />
          <Metric icon={Flame} label="RPE alvo" value={blockRpe != null ? `${blockRpe}/10` : resolvedExercise?.rpe != null ? `${resolvedExercise.rpe}/10` : "—"} />
          <Metric icon={Clock} label="Carga" value="Conforme orientação" />
        </CardContent>
      </Card>

      <Card>
        <CardContent className="space-y-4 p-5">
          {resolvedExercise?.description && (
            <Block icon={Target} color="text-primary" title="Descrição" text={resolvedExercise.description} />
          )}
          {resolvedExercise?.execution && (
            <Block icon={CheckCircle2} color="text-success" title="Execução correta" text={resolvedExercise.execution} />
          )}
          {resolvedExercise?.mistakes && (
            <Block icon={AlertTriangle} color="text-danger" title="Erros comuns" text={resolvedExercise.mistakes} />
          )}
          {!resolvedExercise?.description && !resolvedExercise?.execution && !resolvedExercise?.mistakes && (
            <p className="text-sm text-text-muted">Instruções em breve.</p>
          )}
        </CardContent>
      </Card>

      {muscles.length > 0 && (
        <Card>
          <CardContent className="p-5">
            <h3 className="mb-3 font-display text-sm font-semibold uppercase tracking-wide text-text">
              Músculos envolvidos
            </h3>
            <div className="flex flex-wrap gap-2">
              {muscles.map((m) => (
                <Badge key={m} variant="outline">{m}</Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function Metric({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-xl border border-border bg-card-hover/40 p-3 text-center sm:text-left">
      <div className="flex items-center justify-center gap-1.5 text-text-muted sm:justify-start">
        <Icon className="h-3.5 w-3.5" />
        <span className="text-[10px] uppercase tracking-wider">{label}</span>
      </div>
      <p className="mt-1 font-display text-base font-bold text-text">{value}</p>
    </div>
  );
}

function Block({
  icon: Icon,
  color,
  title,
  text,
}: {
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  title: string;
  text: string;
}) {
  return (
    <div>
      <div className="mb-1.5 flex items-center gap-2">
        <Icon className={`h-4 w-4 ${color}`} />
        <h3 className="font-display text-sm font-semibold text-text">{title}</h3>
      </div>
      <p className="text-sm leading-relaxed text-text-muted">{text}</p>
    </div>
  );
}
