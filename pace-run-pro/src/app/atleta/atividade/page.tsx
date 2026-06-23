"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Activity, Clock, Gauge, MessageSquare } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

type Log = {
  id: string;
  source: string;
  distanceKm: number | null;
  durationSec: number | null;
  avgPaceSecPerKm: number | null;
  rpe: number | null;
  finishedAt: string | null;
  createdAt: string;
  workout: { title: string; type: string; date: string } | null;
  _count: { comments: number };
};

function fmtPace(sec: number) {
  return `${Math.floor(sec / 60)}:${String(sec % 60).padStart(2, "0")}/km`;
}

function fmtDuration(sec: number) {
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  return h > 0 ? `${h}h${String(m).padStart(2, "0")}` : `${m}min`;
}

const SOURCE_BADGE: Record<string, string> = {
  strava: "Strava",
  garmin: "Garmin",
  polar: "Polar",
  coros: "Coros",
  apple: "Apple",
  manual: "Manual",
};

export default function AtividadesPage() {
  const [logs, setLogs] = useState<Log[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/atleta/logs")
      .then((r) => r.json())
      .then((d) => setLogs(d.logs ?? []))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="mx-auto max-w-2xl space-y-6 px-4 py-8">
      <div>
        <h1 className="font-display text-2xl font-extrabold text-text">Atividades</h1>
        <p className="mt-1 text-sm text-text-muted">Seus treinos e atividades registradas.</p>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-20 animate-pulse rounded-xl bg-card" />
          ))}
        </div>
      ) : logs.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Activity className="mx-auto h-8 w-8 text-text-muted/40 mb-3" />
            <p className="text-sm text-text-muted">Nenhuma atividade registrada ainda.</p>
            <p className="mt-1 text-xs text-text-muted">Complete treinos ou conecte o Strava para ver suas atividades aqui.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {logs.map((log) => {
            const title = log.workout?.title ?? "Atividade";
            const date = new Date(log.workout?.date ?? log.finishedAt ?? log.createdAt).toLocaleDateString("pt-BR", {
              day: "2-digit", month: "short", year: "numeric",
            });
            return (
              <Link key={log.id} href={`/atleta/atividade/${log.id}`}>
                <Card className="transition-colors hover:border-primary/40 hover:bg-card-hover cursor-pointer">
                  <CardContent className="flex items-center justify-between p-4">
                    <div className="flex items-center gap-3 min-w-0">
                      <span className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                        <Activity className="h-4 w-4" />
                      </span>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="text-sm font-semibold text-text truncate">{title}</p>
                          {log.source !== "manual" && (
                            <Badge variant="primary" className="text-[10px]">
                              {SOURCE_BADGE[log.source] ?? log.source}
                            </Badge>
                          )}
                          {log._count.comments > 0 && (
                            <span className="flex items-center gap-0.5 text-[10px] text-text-muted">
                              <MessageSquare className="h-3 w-3" />
                              {log._count.comments}
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-text-muted capitalize">{date}</p>
                      </div>
                    </div>
                    <div className="text-right text-xs text-text-muted flex-shrink-0 ml-3">
                      {log.distanceKm != null && (
                        <div className="flex items-center gap-1 justify-end">
                          <Gauge className="h-3 w-3" />
                          <span>{log.distanceKm.toFixed(2)} km</span>
                        </div>
                      )}
                      {log.durationSec != null && (
                        <div className="flex items-center gap-1 justify-end mt-0.5">
                          <Clock className="h-3 w-3" />
                          <span>{fmtDuration(log.durationSec)}</span>
                        </div>
                      )}
                      {log.avgPaceSecPerKm != null && (
                        <p className="mt-0.5 font-medium text-text">{fmtPace(log.avgPaceSecPerKm)}</p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
