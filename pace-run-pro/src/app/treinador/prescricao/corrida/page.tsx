import Link from "next/link";
import { redirect } from "next/navigation";
import type { ReactNode } from "react";
import { Activity, CalendarPlus, ClipboardList, Route, Users } from "lucide-react";
import { getSession } from "@/lib/auth-guard";
import { prisma } from "@/lib/prisma";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

const RUN_TYPES = [
  "RODAGEM_LEVE",
  "INTERVALADO_CURTO",
  "INTERVALADO_LONGO",
  "TEMPO_RUN",
  "FARTLEK",
  "PROGRESSIVO",
  "LONGAO",
  "REGENERATIVO",
  "SUBIDA",
  "TECNICA",
  "PROVA",
] as const;

export default async function RunPrescriptionPage() {
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
          weeklyAvailability: true,
          availableMinutes: true,
          user: { select: { name: true, email: true, image: true } },
        },
      },
      runTemplates: {
        orderBy: { updatedAt: "desc" },
        take: 6,
        select: {
          id: true,
          name: true,
          description: true,
          targetLevel: true,
          weeklyKm: true,
          sessionsPerWeek: true,
          focus: true,
        },
      },
    },
  });

  if (!coach) redirect("/login");

  const upcomingRuns = await prisma.workout.findMany({
    where: {
      type: { in: [...RUN_TYPES] },
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
      targetDistanceKm: true,
      targetDurationMin: true,
      targetRpe: true,
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

  const totalWeeklySlots = coach.athletes.reduce((sum, athlete) => sum + (athlete.weeklyAvailability ?? 0), 0);

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <Badge variant="primary">Prescricao de corrida</Badge>
          <h1 className="mt-3 font-display text-3xl font-bold text-text">Corrida: atletas, modelos e agenda</h1>
          <p className="mt-2 max-w-2xl text-sm text-text-muted">
            Central para conferir volume semanal, modelos de corrida e proximas sessoes prescritas.
          </p>
        </div>
        <Link href="/treinador/atletas" className={cn(buttonVariants({ variant: "primary", size: "sm" }))}>
          <CalendarPlus className="h-4 w-4" /> Prescrever no calendario
        </Link>
      </div>

      <div className="grid gap-3 md:grid-cols-4">
        <Metric label="Atletas" value={String(coach.athletes.length)} icon={<Users className="h-5 w-5" />} />
        <Metric label="Slots semanais" value={String(totalWeeklySlots)} icon={<ClipboardList className="h-5 w-5" />} />
        <Metric label="Modelos" value={String(coach.runTemplates.length)} icon={<Route className="h-5 w-5" />} />
        <Metric label="Proximas corridas" value={String(upcomingRuns.length)} icon={<Activity className="h-5 w-5" />} />
      </div>

      <div className="grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
        <Card>
          <CardContent className="p-0">
            <div className="border-b border-border px-5 py-4">
              <h2 className="font-display text-lg font-bold text-text">Atletas para prescrever</h2>
              <p className="text-sm text-text-muted">Use nivel, disponibilidade e duracao para calibrar carga.</p>
            </div>
            <div className="divide-y divide-border">
              {coach.athletes.length === 0 ? (
                <Empty text="Nenhum atleta vinculado a este treinador." />
              ) : coach.athletes.map((athlete) => (
                <div key={athlete.id} className="grid gap-3 px-5 py-4 md:grid-cols-[1fr_auto_auto] md:items-center">
                  <div>
                    <p className="font-semibold text-text">{athlete.user.name}</p>
                    <p className="text-xs text-text-muted">{athlete.user.email}</p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Badge variant="outline">{athlete.level.toLowerCase()}</Badge>
                    <Badge variant="outline">{athlete.weeklyAvailability ?? 0}x/sem</Badge>
                    <Badge variant="outline">{athlete.availableMinutes ?? 0} min</Badge>
                  </div>
                  <Link href={`/treinador/atletas?athlete=${athlete.id}`} className="text-sm font-semibold text-primary">
                    Abrir calendario
                  </Link>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <div className="space-y-4">
          <Panel title="Modelos de corrida" empty="Nenhum modelo de corrida cadastrado.">
            {coach.runTemplates.map((template) => (
              <div key={template.id} className="rounded-xl border border-border bg-card-hover/60 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold text-text">{template.name}</p>
                    <p className="mt-1 text-xs text-text-muted">{template.description ?? "Sem descricao."}</p>
                  </div>
                  <Badge variant="info">{template.targetLevel}</Badge>
                </div>
                <div className="mt-3 flex flex-wrap gap-2 text-xs text-text-muted">
                  <span>{template.sessionsPerWeek} sessoes/sem</span>
                  <span>{template.weeklyKm.toFixed(1)} km/sem</span>
                  <span>{template.focus}</span>
                </div>
              </div>
            ))}
          </Panel>

          <Panel title="Proximas sessoes" empty="Nenhuma corrida futura encontrada.">
            {upcomingRuns.map((workout) => (
              <div key={workout.id} className="rounded-xl border border-border bg-card-hover/60 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold text-text">{workout.title}</p>
                    <p className="text-xs text-text-muted">
                      {workout.week.plan.athlete.user.name} · {workout.date.toLocaleDateString("pt-BR")}
                    </p>
                  </div>
                  <Badge variant="primary">{workout.type.replaceAll("_", " ")}</Badge>
                </div>
                <p className="mt-2 text-xs text-text-muted">
                  {workout.targetDistanceKm ? `${workout.targetDistanceKm} km` : "Distancia livre"}
                  {" · "}
                  {workout.targetDurationMin ? `${workout.targetDurationMin} min` : "Duracao livre"}
                  {workout.targetRpe ? ` · RPE ${workout.targetRpe}` : ""}
                </p>
              </div>
            ))}
          </Panel>
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

function Panel({ title, empty, children }: { title: string; empty: string; children: ReactNode }) {
  const items = Array.isArray(children) ? children.filter(Boolean) : children;
  const isEmpty = Array.isArray(items) ? items.length === 0 : !items;
  return (
    <Card>
      <CardContent className="space-y-3 p-5">
        <h2 className="font-display text-lg font-bold text-text">{title}</h2>
        {isEmpty ? <p className="text-sm text-text-muted">{empty}</p> : items}
      </CardContent>
    </Card>
  );
}

function Empty({ text }: { text: string }) {
  return <div className="px-5 py-10 text-sm text-text-muted">{text}</div>;
}
