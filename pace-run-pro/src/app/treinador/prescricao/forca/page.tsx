import Link from "next/link";
import { redirect } from "next/navigation";
import type { ReactNode } from "react";
import { CalendarPlus, Dumbbell, Library, PlaySquare, Users } from "lucide-react";
import { getSession } from "@/lib/auth-guard";
import { prisma } from "@/lib/prisma";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

const STRENGTH_TYPES = ["FORCA", "FUNCIONAL", "MOBILIDADE"] as const;

function sessionCount(value: unknown) {
  return Array.isArray(value) ? value.length : 0;
}

export default async function StrengthPrescriptionPage() {
  const session = await getSession();
  if (!session?.user?.id) redirect("/login");

  const coach = await prisma.coach.findUnique({
    where: { userId: session.user.id },
    select: {
      id: true,
      athletes: {
        where: { deletedAt: null },
        orderBy: { user: { name: "asc" } },
        select: {
          id: true,
          level: true,
          user: { select: { name: true, email: true } },
        },
      },
      strengthTemplates: {
        orderBy: { updatedAt: "desc" },
        take: 8,
        select: {
          id: true,
          name: true,
          description: true,
          division: true,
          targetLevel: true,
          focus: true,
          sessions: true,
        },
      },
      exercises: {
        orderBy: { updatedAt: "desc" },
        take: 8,
        select: { id: true, name: true, category: true, musclesWorked: true, imageUrl: true, videos: { take: 1, select: { url: true, title: true } } },
      },
    },
  });

  if (!coach) redirect("/login");

  const upcomingStrength = await prisma.workout.findMany({
    where: {
      type: { in: [...STRENGTH_TYPES] },
      date: { gte: new Date() },
      week: { plan: { coachId: coach.id } },
    },
    orderBy: { date: "asc" },
    take: 8,
    select: {
      id: true,
      title: true,
      type: true,
      date: true,
      targetDurationMin: true,
      strengthWorkout: { select: { split: true, label: true } },
      week: {
        select: {
          plan: {
            select: {
              athlete: { select: { user: { select: { name: true } } } },
            },
          },
        },
      },
    },
  });

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <Badge variant="primary">Prescricao de forca</Badge>
          <h1 className="mt-3 font-display text-3xl font-bold text-text">Forca, funcional e mobilidade</h1>
          <p className="mt-2 max-w-2xl text-sm text-text-muted">
            Area para revisar templates, exercicios com midia e proximas sessoes antes de aplicar ao calendario.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link href="/treinador/biblioteca" className={cn(buttonVariants({ variant: "secondary", size: "sm" }))}>
            <Library className="h-4 w-4" /> Biblioteca
          </Link>
          <Link href="/treinador/atletas" className={cn(buttonVariants({ variant: "primary", size: "sm" }))}>
            <CalendarPlus className="h-4 w-4" /> Prescrever
          </Link>
        </div>
      </div>

      <div className="grid gap-3 md:grid-cols-4">
        <Metric label="Atletas" value={String(coach.athletes.length)} icon={<Users className="h-5 w-5" />} />
        <Metric label="Templates" value={String(coach.strengthTemplates.length)} icon={<Dumbbell className="h-5 w-5" />} />
        <Metric label="Exercicios" value={String(coach.exercises.length)} icon={<PlaySquare className="h-5 w-5" />} />
        <Metric label="Proximas sessoes" value={String(upcomingStrength.length)} icon={<CalendarPlus className="h-5 w-5" />} />
      </div>

      <div className="grid gap-4 lg:grid-cols-[1fr_0.9fr]">
        <Card>
          <CardContent className="space-y-4 p-5">
            <div>
              <h2 className="font-display text-lg font-bold text-text">Modelos prontos</h2>
              <p className="text-sm text-text-muted">Templates cadastrados para aplicar em atletas e periodizacoes.</p>
            </div>
            {coach.strengthTemplates.length === 0 ? (
              <p className="text-sm text-text-muted">Nenhum template de forca cadastrado.</p>
            ) : coach.strengthTemplates.map((template) => (
              <div key={template.id} className="rounded-xl border border-border bg-card-hover/60 p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold text-text">{template.name}</p>
                    <p className="mt-1 text-xs text-text-muted">{template.description ?? "Sem descricao."}</p>
                  </div>
                  <Badge variant="info">{template.targetLevel}</Badge>
                </div>
                <div className="mt-3 flex flex-wrap gap-2 text-xs text-text-muted">
                  <span>{template.division ?? "Divisao livre"}</span>
                  <span>{template.focus}</span>
                  <span>{sessionCount(template.sessions)} sessao(oes)</span>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <div className="space-y-4">
          <Card>
            <CardContent className="space-y-3 p-5">
              <h2 className="font-display text-lg font-bold text-text">Exercicios com midia</h2>
              {coach.exercises.length === 0 ? (
                <p className="text-sm text-text-muted">Cadastre exercicios com imagem/GIF para enriquecer a prescricao do atleta.</p>
              ) : coach.exercises.map((exercise) => (
                <div key={exercise.id} className="flex items-center justify-between gap-3 rounded-xl border border-border bg-card-hover/60 p-3">
                  <div>
                    <p className="font-semibold text-text">{exercise.name}</p>
                    <p className="text-xs text-text-muted">{exercise.category} · {exercise.musclesWorked.slice(0, 2).join(", ") || "musculos nao informados"}</p>
                  </div>
                  <Badge variant={exercise.imageUrl || exercise.videos.length > 0 ? "success" : "warning"}>
                    {exercise.imageUrl || exercise.videos.length > 0 ? "com midia" : "sem midia"}
                  </Badge>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardContent className="space-y-3 p-5">
              <h2 className="font-display text-lg font-bold text-text">Proximas sessoes</h2>
              {upcomingStrength.length === 0 ? (
                <p className="text-sm text-text-muted">Nenhuma sessao futura de forca encontrada.</p>
              ) : upcomingStrength.map((workout) => (
                <div key={workout.id} className="rounded-xl border border-border bg-card-hover/60 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-semibold text-text">{workout.strengthWorkout?.label ?? workout.title}</p>
                      <p className="text-xs text-text-muted">
                        {workout.week.plan.athlete.user.name} · {workout.date.toLocaleDateString("pt-BR")}
                      </p>
                    </div>
                    <Badge variant="primary">{workout.strengthWorkout?.split ?? workout.type}</Badge>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

function Metric({ label, value, icon }: { label: string; value: string; icon: ReactNode }) {
  return (
    <Card>
      <CardContent className="flex items-center justify-between p-5">
        <div>
          <p className="text-xs uppercase tracking-wide text-text-muted">{label}</p>
          <p className="mt-2 font-display text-2xl font-bold text-text">{value}</p>
        </div>
        <span className="text-primary">{icon}</span>
      </CardContent>
    </Card>
  );
}
