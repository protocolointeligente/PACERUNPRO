import Link from "next/link";
import { Clock, MapPin, Lock, CheckCircle2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TYPE_LABELS, getSubtypeColor } from "@/lib/mock-data";
import { formatPace } from "@/lib/utils";
import type { WorkoutSummary } from "@/lib/types";
import { cn } from "@/lib/utils";

const statusConfig: Record<WorkoutSummary["status"], { label: string; variant: "success" | "primary" | "default" | "danger"; icon?: React.ReactNode }> = {
  concluido: { label: "Concluído", variant: "success", icon: <CheckCircle2 className="h-3 w-3" /> },
  liberado: { label: "Liberado", variant: "primary" },
  agendado: { label: "Bloqueado", variant: "default", icon: <Lock className="h-3 w-3" /> },
  perdido: { label: "Perdido", variant: "danger" },
};

function parseLocalDate(date: string) {
  const [year, month, day] = date.slice(0, 10).split("-").map(Number);
  if (year && month && day) return new Date(year, month - 1, day);
  return new Date(date);
}

export function WorkoutCard({ workout, href }: { workout: WorkoutSummary; href?: string }) {
  const status = statusConfig[workout.status];
  const date = parseLocalDate(workout.date);
  const weekday = date.toLocaleDateString("pt-BR", { weekday: "short" });
  const day = date.toLocaleDateString("pt-BR", { day: "2-digit", month: "short" });

  const content = (
    <Card hover={!!href} className="flex items-center gap-4 p-4">
      <div
        className="flex h-12 w-12 shrink-0 flex-col items-center justify-center rounded-xl border text-center"
        style={{ borderColor: `${workout.color}55`, backgroundColor: `${workout.color}1a` }}
      >
        <span className="text-[10px] uppercase text-text-muted">{weekday.replace(".", "")}</span>
        <span className="text-sm font-bold text-text">{day.split(" ")[0]}</span>
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <Badge style={{ borderColor: `${workout.color}55`, color: workout.color, backgroundColor: `${workout.color}1a` }} className="border">
            {TYPE_LABELS[workout.type]}
          </Badge>
          {workout.subtype && (
            <span
              className="inline-flex items-center gap-1.5 text-xs font-medium"
              style={{ color: getSubtypeColor(workout.type, workout.subtype) }}
            >
              <span
                className="h-1.5 w-1.5 rounded-full"
                style={{ backgroundColor: getSubtypeColor(workout.type, workout.subtype) }}
              />
              {workout.subtype}
            </span>
          )}
        </div>
        <p className="mt-1 truncate text-sm font-semibold text-text">{workout.title}</p>
        <div className="mt-1 flex flex-wrap items-center gap-3 text-xs text-text-muted">
          {workout.distanceKm && (
            <span className="flex items-center gap-1">
              <MapPin className="h-3 w-3" /> {workout.distanceKm} km
            </span>
          )}
          {workout.durationMin && (
            <span className="flex items-center gap-1">
              <Clock className="h-3 w-3" /> {workout.durationMin} min
            </span>
          )}
          {workout.targetPaceSecPerKm && <span>{formatPace(workout.targetPaceSecPerKm)}</span>}
        </div>
      </div>

      <Badge variant={status.variant} className={cn("shrink-0")}>
        {status.icon}
        {status.label}
      </Badge>
    </Card>
  );

  if (href) {
    return <Link href={href}>{content}</Link>;
  }
  return content;
}
