"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Activity, ClipboardList, Dumbbell, FileBarChart,
  Plus, Waves, Bike, HeartPulse, TrendingUp, Users,
  AlertCircle, CheckCircle2, Clock, ChevronRight,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

// ── Types ────────────────────────────────────────────────────────────────────

interface AssessmentSummary {
  athleteId: string;
  athleteName: string;
  lastAssessmentDate: string | null;
  pendingTests: number;
  status: "ok" | "overdue" | "pending" | "none";
}

// ── Cards config ─────────────────────────────────────────────────────────────

const HUBS = [
  {
    href: "/treinador/prescricao/avaliacoes/testes",
    icon: Activity,
    color: "#f97316",
    bg: "#f9731615",
    border: "#f9731630",
    title: "Testes de Performance",
    desc: "Solicite testes a atletas. Zonas atualizam automaticamente com o resultado.",
    badge: "Corrida · Ciclismo · Natação · Força",
  },
  {
    href: "/treinador/prescricao/avaliacoes/fisica",
    icon: ClipboardList,
    color: "#3b82f6",
    bg: "#3b82f615",
    border: "#3b82f630",
    title: "Avaliação Física",
    desc: "Composição corporal, circunferências, dobras, postura e mobilidade.",
    badge: "Histórico · Comparativo · PDF",
  },
  {
    href: "/treinador/prescricao/avaliacoes/zonas",
    icon: HeartPulse,
    color: "#ef4444",
    bg: "#ef444415",
    border: "#ef444430",
    title: "Zonas de Intensidade",
    desc: "Defina zonas de FC, pace e potência por atleta e modalidade — manualmente ou via testes.",
    badge: "FC · Pace · FTP · CSS · RPE",
  },
  {
    href: "/treinador/relatorios",
    icon: FileBarChart,
    color: "#8b5cf6",
    bg: "#8b5cf615",
    border: "#8b5cf630",
    title: "Relatórios",
    desc: "Gere relatórios PDF com evolução, composição corporal e performance.",
    badge: "PDF · Comparativo · Histórico",
  },
];

const SPORT_TESTS = [
  { icon: Activity, label: "Corrida", tests: ["Cooper", "2400m", "3 km", "5 min", "VDOT", "VAM", "Prova recente"], color: "#f97316" },
  { icon: Bike,     label: "Ciclismo", tests: ["FTP 20 min", "Ramp Test", "Potência Crítica", "FC Limiar"], color: "#3b82f6" },
  { icon: Waves,    label: "Natação", tests: ["CSS", "400 + 200m", "1000m", "Pace crítico"], color: "#06b6d4" },
  { icon: Dumbbell, label: "Força", tests: ["1RM direto", "Estimativa", "Salto Vertical", "Potência"], color: "#a855f7" },
  { icon: TrendingUp, label: "Funcional", tests: ["Y Balance", "Hop Test", "Core", "Mobilidade"], color: "#22c55e" },
];

// ── Component ─────────────────────────────────────────────────────────────────

export default function AvaliacoesHubPage() {
  const [summaries, setSummaries] = useState<AssessmentSummary[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/coach/athletes")
      .then((r) => r.ok ? r.json() : [])
      .then((athletes: { id: string; name: string }[]) => {
        setSummaries(
          athletes.slice(0, 8).map((a) => ({
            athleteId: a.id,
            athleteName: a.name,
            lastAssessmentDate: null,
            pendingTests: 0,
            status: "none" as const,
          }))
        );
      })
      .catch(() => null)
      .finally(() => setLoading(false));
  }, []);

  const stats = {
    total: summaries.length,
    overdue: summaries.filter((s) => s.status === "overdue").length,
    pending: summaries.filter((s) => s.status === "pending").length,
    none: summaries.filter((s) => s.status === "none").length,
  };

  return (
    <div className="mx-auto max-w-5xl space-y-8">
      {/* Header */}
      <div>
        <div className="flex items-center justify-between gap-3">
          <div>
            <h1 className="font-display text-2xl font-bold text-text">Central de Avaliações</h1>
            <p className="mt-1 text-sm text-text-muted">
              Avalie, teste e acompanhe a evolução dos seus atletas em todas as modalidades.
            </p>
          </div>
          <Link href="/treinador/prescricao/avaliacoes/testes">
            <Button variant="primary" size="sm" className="gap-2 shrink-0">
              <Plus className="h-4 w-4" />
              Solicitar teste
            </Button>
          </Link>
        </div>

        {/* Status summary */}
        {!loading && (
          <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
            <StatCard label="Total de atletas" value={stats.total} icon={Users} color="#38bdf8" />
            <StatCard label="Sem avaliação" value={stats.none} icon={AlertCircle} color="#fb923c" />
            <StatCard label="Testes pendentes" value={stats.pending} icon={Clock} color="#eab308" />
            <StatCard label="Em dia" value={stats.total - stats.none - stats.pending - stats.overdue} icon={CheckCircle2} color="#22c55e" />
          </div>
        )}
      </div>

      {/* Hub cards */}
      <div className="grid gap-4 sm:grid-cols-2">
        {HUBS.map((hub) => (
          <Link key={hub.href} href={hub.href} className="group">
            <div
              className="flex h-full flex-col gap-3 rounded-2xl border p-5 transition-all hover:shadow-md hover:-translate-y-0.5"
              style={{ background: hub.bg, borderColor: hub.border }}
            >
              <div className="flex items-start justify-between">
                <div
                  className="flex h-10 w-10 items-center justify-center rounded-xl"
                  style={{ background: `${hub.color}25`, color: hub.color }}
                >
                  <hub.icon className="h-5 w-5" />
                </div>
                <ChevronRight className="h-4 w-4 text-text-muted transition-transform group-hover:translate-x-0.5" />
              </div>
              <div>
                <h3 className="font-display text-base font-semibold text-text">{hub.title}</h3>
                <p className="mt-0.5 text-sm text-text-muted leading-relaxed">{hub.desc}</p>
              </div>
              <Badge className="self-start text-[11px]" style={{ color: hub.color, background: `${hub.color}20`, borderColor: `${hub.color}40` }}>
                {hub.badge}
              </Badge>
            </div>
          </Link>
        ))}
      </div>

      {/* Sport tests overview */}
      <div>
        <h2 className="mb-4 font-display text-base font-semibold text-text">Protocolos disponíveis por modalidade</h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {SPORT_TESTS.map((sport) => (
            <Card key={sport.label} className="overflow-hidden">
              <div className="h-1 w-full" style={{ background: `linear-gradient(90deg, ${sport.color}, ${sport.color}66)` }} />
              <CardContent className="p-4">
                <div className="mb-3 flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg" style={{ background: `${sport.color}20`, color: sport.color }}>
                    <sport.icon className="h-4 w-4" />
                  </div>
                  <span className="font-display text-sm font-semibold text-text">{sport.label}</span>
                </div>
                <ul className="space-y-1">
                  {sport.tests.map((t) => (
                    <li key={t} className="flex items-center gap-1.5 text-xs text-text-muted">
                      <span className="h-1 w-1 rounded-full shrink-0" style={{ background: sport.color }} />
                      {t}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Athletes without assessment */}
      {summaries.length > 0 && (
        <div>
          <h2 className="mb-3 font-display text-base font-semibold text-text">Atletas — status de avaliação</h2>
          <div className="space-y-2">
            {summaries.map((s) => (
              <Link
                key={s.athleteId}
                href={`/treinador/atletas/${s.athleteId}/avaliacao`}
                className="flex items-center gap-3 rounded-xl border border-border bg-card p-3 hover:border-primary/30 hover:bg-card-hover transition-all"
              >
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                  {s.athleteName.slice(0, 2).toUpperCase()}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-text truncate">{s.athleteName}</p>
                  <p className="text-xs text-text-muted">
                    {s.lastAssessmentDate ? `Última: ${new Date(s.lastAssessmentDate).toLocaleDateString("pt-BR")}` : "Sem avaliação registrada"}
                  </p>
                </div>
                <StatusBadge status={s.status} pending={s.pendingTests} />
                <ChevronRight className="h-4 w-4 text-text-muted shrink-0" />
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function StatCard({ label, value, icon: Icon, color }: { label: string; value: number; icon: React.ComponentType<{ className?: string }>; color: string }) {
  return (
    <div className="rounded-xl border border-border bg-card p-3 text-center">
      <div className="flex items-center justify-center gap-1.5 text-text-muted">
        <span style={{ color }}><Icon className="h-3.5 w-3.5" /></span>
        <span className="text-[10px] uppercase tracking-wider">{label}</span>
      </div>
      <p className="mt-1 font-display text-2xl font-bold text-text">{value}</p>
    </div>
  );
}

function StatusBadge({ status, pending }: { status: string; pending: number }) {
  if (status === "ok") return <span className="text-[11px] font-medium text-success">Em dia</span>;
  if (status === "overdue") return <span className="text-[11px] font-medium text-danger">Vencida</span>;
  if (status === "pending" && pending > 0) return (
    <span className="rounded-full bg-warning/15 px-2 py-0.5 text-[11px] font-medium text-warning">{pending} pendente{pending > 1 ? "s" : ""}</span>
  );
  return <span className="text-[11px] text-text-muted">Sem avaliação</span>;
}
