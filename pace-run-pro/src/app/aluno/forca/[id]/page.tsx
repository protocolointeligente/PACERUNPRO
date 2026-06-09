import { notFound } from "next/navigation";
import Link from "next/link";
import { AlertTriangle, ArrowLeft, CheckCircle2, Clock, Flame, PlayCircle, Repeat, Target, Timer } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { exerciseLibrary } from "@/lib/mock-data";

export default async function ExerciseDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const exercise = exerciseLibrary.find((e) => e.id === id);
  if (!exercise) notFound();

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <Link href="/aluno/forca" className="mb-4 inline-flex items-center gap-1.5 text-sm text-text-muted hover:text-white transition-colors">
        <ArrowLeft className="h-4 w-4" />
        Voltar
      </Link>
      <Card className="overflow-hidden">
        <div className="relative h-56 sm:h-72">
          <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: `url('${exercise.imageUrl}')` }} />
          <div className="absolute inset-0 bg-gradient-to-t from-card via-card/30 to-transparent" />
          <div className="absolute inset-x-0 bottom-0 flex items-end justify-between p-5">
            <div>
              <Badge variant="primary" className="mb-2">{exercise.category}</Badge>
              <h1 className="font-display text-2xl font-bold text-white sm:text-3xl">{exercise.name}</h1>
            </div>
            <Button variant="secondary" size="sm">
              <PlayCircle className="h-4 w-4" />
              Vídeo
            </Button>
          </div>
        </div>
        <CardContent className="grid grid-cols-2 gap-3 p-5 sm:grid-cols-4">
          <Metric icon={Repeat} label="Séries x Reps" value={`${exercise.sets}x ${exercise.reps}`} />
          <Metric icon={Timer} label="Intervalo" value={exercise.rest} />
          <Metric icon={Flame} label="RPE alvo" value={`${exercise.rpe}/10`} />
          <Metric icon={Clock} label="Carga" value="Conforme orientação" />
        </CardContent>
      </Card>

      <Card>
        <CardContent className="space-y-4 p-5">
          <Block icon={Target} color="text-primary" title="Descrição" text={exercise.description} />
          <Block icon={CheckCircle2} color="text-success" title="Execução correta" text={exercise.execution} />
          <Block icon={AlertTriangle} color="text-danger" title="Erros comuns" text={exercise.mistakes} />
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-5">
          <h3 className="mb-3 font-display text-sm font-semibold uppercase tracking-wide text-white">Músculos envolvidos</h3>
          <div className="flex flex-wrap gap-2">
            {exercise.muscles.map((m) => (
              <Badge key={m} variant="outline">{m}</Badge>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function Metric({ icon: Icon, label, value }: { icon: React.ComponentType<{ className?: string }>; label: string; value: string }) {
  return (
    <div className="rounded-xl border border-border bg-card-hover/40 p-3 text-center sm:text-left">
      <div className="flex items-center justify-center gap-1.5 text-text-muted sm:justify-start">
        <Icon className="h-3.5 w-3.5" />
        <span className="text-[10px] uppercase tracking-wider">{label}</span>
      </div>
      <p className="mt-1 font-display text-base font-bold text-white">{value}</p>
    </div>
  );
}

function Block({ icon: Icon, color, title, text }: { icon: React.ComponentType<{ className?: string }>; color: string; title: string; text: string }) {
  return (
    <div>
      <div className="mb-1.5 flex items-center gap-2">
        <Icon className={`h-4 w-4 ${color}`} />
        <h3 className="font-display text-sm font-semibold text-white">{title}</h3>
      </div>
      <p className="text-sm leading-relaxed text-text-muted">{text}</p>
    </div>
  );
}
