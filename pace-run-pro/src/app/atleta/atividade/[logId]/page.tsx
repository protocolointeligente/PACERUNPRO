import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Clock, Gauge, HeartPulse, Flame, Mountain, BarChart2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { WorkoutLogComments } from "@/components/workout-log-comments";
import { SplitsChart } from "@/components/charts/splits-chart";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth-guard";

function fmtPace(sec: number) {
  return `${Math.floor(sec / 60)}:${String(sec % 60).padStart(2, "0")}/km`;
}

function fmtDuration(sec: number) {
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = sec % 60;
  return h > 0 ? `${h}h${String(m).padStart(2, "0")}` : `${m}:${String(s).padStart(2, "0")}`;
}

const SOURCE_LABEL: Record<string, string> = {
  manual: "Manual",
  strava: "Strava",
  garmin: "Garmin",
  polar: "Polar",
  coros: "Coros",
  apple: "Apple Watch",
};

export default async function AtividadePage({ params }: { params: Promise<{ logId: string }> }) {
  const { logId } = await params;
  const session = await getSession();
  if (!session?.user?.id) redirect("/login");

  const athlete = await prisma.athlete.findUnique({
    where: { userId: session.user.id },
    select: { id: true },
  });
  if (!athlete) redirect("/login");

  const log = await prisma.workoutLog.findFirst({
    where: { id: logId, athleteId: athlete.id },
    include: {
      workout: { select: { title: true, type: true, objective: true, notes: true, date: true } },
    },
    // splits is a Json field — selected automatically via include
  });
  if (!log) notFound();

  const title = log.workout?.title ?? "Atividade";
  const date = new Date(log.workout?.date ?? log.finishedAt ?? log.createdAt).toLocaleDateString("pt-BR", {
    weekday: "long", day: "2-digit", month: "long", year: "numeric",
  });

  type SplitEntry = { km: number; pace: string; elev?: number };
  let splits: SplitEntry[] = [];
  if (log.splits) {
    try {
      const raw = log.splits as unknown;
      splits = Array.isArray(raw) ? (raw as SplitEntry[]) : [];
    } catch {
      splits = [];
    }
  }

  const stats = [
    log.distanceKm != null && {
      icon: Gauge, label: "Distância", value: `${log.distanceKm.toFixed(2)} km`,
    },
    log.durationSec != null && {
      icon: Clock, label: "Duração", value: fmtDuration(log.durationSec),
    },
    log.avgPaceSecPerKm != null && {
      icon: BarChart2, label: "Pace médio", value: fmtPace(log.avgPaceSecPerKm),
    },
    log.avgHr != null && {
      icon: HeartPulse, label: "FC média", value: `${log.avgHr} bpm`,
    },
    log.calories != null && {
      icon: Flame, label: "Calorias", value: `${log.calories} kcal`,
    },
    log.elevationGainM != null && {
      icon: Mountain, label: "Ganho alt.", value: `${log.elevationGainM} m`,
    },
  ].filter(Boolean) as { icon: typeof Gauge; label: string; value: string }[];

  return (
    <div className="mx-auto max-w-2xl space-y-6 px-4 py-8">
      <Link href="/atleta/calendario" className="flex items-center gap-1.5 text-xs font-semibold text-text-muted hover:text-text transition-colors">
        <ArrowLeft className="h-3.5 w-3.5" /> Voltar
      </Link>

      <div>
        <div className="flex items-center gap-2 mb-1">
          <Badge variant="primary" className="capitalize">{log.source in SOURCE_LABEL ? SOURCE_LABEL[log.source] : log.source}</Badge>
          {log.rpe != null && <Badge variant="default">RPE {log.rpe}</Badge>}
        </div>
        <h1 className="font-display text-2xl font-extrabold text-text">{title}</h1>
        <p className="mt-1 text-sm capitalize text-text-muted">{date}</p>
      </div>

      {/* Stats grid */}
      {stats.length > 0 && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {stats.map(({ icon: Icon, label, value }) => (
            <Card key={label}>
              <CardContent className="flex flex-col p-4">
                <div className="flex items-center gap-1.5 text-text-muted mb-1">
                  <Icon className="h-3.5 w-3.5" />
                  <span className="text-xs">{label}</span>
                </div>
                <p className="font-display text-lg font-bold text-text">{value}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Splits chart */}
      {splits.length > 0 && (
        <Card>
          <CardContent className="p-4">
            <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-text-muted">Pace por km</p>
            <SplitsChart splits={splits} />
          </CardContent>
        </Card>
      )}

      {/* Coach notes */}
      {log.workout?.objective && (
        <Card>
          <CardContent className="p-4">
            <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-text-muted">Objetivo</p>
            <p className="text-sm text-text">{log.workout.objective}</p>
          </CardContent>
        </Card>
      )}
      {log.workout?.notes && (
        <Card>
          <CardContent className="p-4">
            <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-text-muted">Observações do treinador</p>
            <p className="text-sm text-text">{log.workout.notes}</p>
          </CardContent>
        </Card>
      )}

      {/* Feeling */}
      {log.feeling && (
        <Card>
          <CardContent className="p-4">
            <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-text-muted">Como me senti</p>
            <p className="text-sm text-text">{log.feeling}</p>
          </CardContent>
        </Card>
      )}

      {/* Comments */}
      <Card>
        <CardContent className="p-4">
          <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-text-muted">Comentários</p>
          <WorkoutLogComments
            logId={log.id}
            currentUserId={session.user.id}
            currentUserRole={session.user.role}
          />
        </CardContent>
      </Card>
    </div>
  );
}
