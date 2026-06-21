import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { ScrollText } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth-guard";
import { redirect } from "next/navigation";

const ACTION_VARIANT: Record<string, "success" | "danger" | "warning" | "info" | "primary"> = {
  "user.cadastro": "success",
  "treino.concluido": "primary",
  "atleta.vinculado": "info",
  "coach.cadastro": "primary",
};

function formatDate(d: Date) {
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(d);
}

export default async function LogsPage() {
  const session = await getSession();
  if (!session?.user?.id || session.user.role !== "ADMIN") redirect("/login");

  const [recentUsers, recentLogs] = await Promise.all([
    prisma.user.findMany({
      orderBy: { createdAt: "desc" },
      take: 25,
      select: { id: true, name: true, role: true, createdAt: true, email: true },
    }),
    prisma.workoutLog.findMany({
      orderBy: { createdAt: "desc" },
      take: 25,
      select: {
        id: true,
        createdAt: true,
        athlete: { select: { user: { select: { name: true } } } },
        workout: { select: { title: true, type: true } },
      },
    }),
  ]);

  type LogEntry = {
    id: string;
    action: string;
    actor: string;
    target: string;
    at: Date;
  };

  const entries: LogEntry[] = [
    ...recentUsers.map((u) => ({
      id: `user-${u.id}`,
      action: u.role === "COACH" ? "coach.cadastro" : "user.cadastro",
      actor: "sistema",
      target: `${u.name} (${u.email})`,
      at: u.createdAt,
    })),
    ...recentLogs.map((l) => ({
      id: `log-${l.id}`,
      action: "treino.concluido",
      actor: l.athlete.user.name,
      target: l.workout.title ?? l.workout.type,
      at: l.createdAt,
    })),
  ].sort((a, b) => b.at.getTime() - a.at.getTime()).slice(0, 50);

  return (
    <div className="mx-auto max-w-4xl space-y-7">
      <div>
        <Badge variant="primary" className="mb-2">
          <ScrollText className="h-3 w-3" /> Logs e auditoria
        </Badge>
        <h1 className="font-display text-2xl font-bold text-text sm:text-3xl">Histórico administrativo</h1>
        <p className="mt-1.5 text-sm text-text-muted">
          Registro das últimas ações e eventos no sistema.
        </p>
      </div>

      <Card>
        <CardContent className="p-0 divide-y divide-border/50">
          {entries.length === 0 ? (
            <div className="px-5 py-8 text-center text-sm text-text-muted">
              Nenhuma ação registrada ainda.
            </div>
          ) : entries.map((log) => (
            <div key={log.id} className="flex flex-wrap items-center justify-between gap-3 px-5 py-3.5">
              <div className="flex items-center gap-3">
                <Badge variant={ACTION_VARIANT[log.action] ?? "default"} className="font-mono text-[11px]">
                  {log.action}
                </Badge>
                <span className="text-sm text-text">{log.target}</span>
              </div>
              <div className="text-right">
                <p className="text-xs font-medium text-text-muted">{log.actor}</p>
                <p className="text-xs text-text-muted">{formatDate(log.at)}</p>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
