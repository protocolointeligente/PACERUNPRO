import fs from "fs/promises";
import path from "path";
import { notFound } from "next/navigation";
import Link from "next/link";
import { AlertTriangle, ArrowLeft, CheckCircle2, Clock, Flame, Repeat, Target, Timer } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

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
  sets?: number;
  reps?: string;
  rest?: string;
  rpe?: number;
}

export default async function ExerciseDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const raw = await fs.readFile(
    path.join(process.cwd(), "public", "exercises.json"),
    "utf-8"
  );
  const exercises: ExerciseEntry[] = JSON.parse(raw);
  const exercise = exercises.find((e) => e.id === id);
  if (!exercise) notFound();

  const muscles = exercise.muscles ?? [];

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
          {exercise.gifUrl ? (
            <img
              src={exercise.gifUrl}
              alt={exercise.name}
              className="max-h-72 w-full object-contain"
            />
          ) : exercise.imageUrl ? (
            <img
              src={exercise.imageUrl}
              alt={exercise.name}
              className="max-h-72 w-full object-contain"
            />
          ) : (
            <div className="flex h-72 w-full flex-col items-center justify-center gap-2">
              <p className="text-xs text-text-muted/50">Demonstração em produção</p>
            </div>
          )}
          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-card/90 via-card/30 to-transparent p-5">
            <Badge variant="primary" className="mb-2">{exercise.category}</Badge>
            <h1 className="font-display text-2xl font-bold text-text sm:text-3xl">{exercise.name}</h1>
          </div>
        </div>

        <CardContent className="grid grid-cols-2 gap-3 p-5 sm:grid-cols-4">
          <Metric icon={Repeat} label="Séries × Reps" value={exercise.sets && exercise.reps ? `${exercise.sets}× ${exercise.reps}` : "—"} />
          <Metric icon={Timer} label="Descanso" value={exercise.rest ?? "—"} />
          <Metric icon={Flame} label="RPE alvo" value={exercise.rpe != null ? `${exercise.rpe}/10` : "—"} />
          <Metric icon={Clock} label="Carga" value="Conforme orientação" />
        </CardContent>
      </Card>

      <Card>
        <CardContent className="space-y-4 p-5">
          {exercise.description && (
            <Block icon={Target} color="text-primary" title="Descrição" text={exercise.description} />
          )}
          {exercise.execution && (
            <Block icon={CheckCircle2} color="text-success" title="Execução correta" text={exercise.execution} />
          )}
          {exercise.mistakes && (
            <Block icon={AlertTriangle} color="text-danger" title="Erros comuns" text={exercise.mistakes} />
          )}
          {!exercise.description && !exercise.execution && !exercise.mistakes && (
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
