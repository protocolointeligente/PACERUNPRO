"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  ChevronRight, Plus, Search, ClipboardList,
  Scale, TrendingUp, AlertCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface AthleteSummary {
  id: string;
  name: string;
  lastAssessment: string | null;
  assessmentCount: number;
}

function daysSince(dateStr: string | null) {
  if (!dateStr) return null;
  return Math.floor((Date.now() - new Date(dateStr).getTime()) / 86_400_000);
}

function AssessmentStatus({ days }: { days: number | null }) {
  if (days === null) return <span className="text-[11px] text-text-muted">Sem avaliação</span>;
  if (days <= 30) return <Badge className="text-[10px] bg-success/15 text-success border-success/30">Em dia</Badge>;
  if (days <= 90) return <Badge className="text-[10px] bg-warning/15 text-warning border-warning/30">Reavaliação recomendada</Badge>;
  return <Badge className="text-[10px] bg-danger/15 text-danger border-danger/30">Avaliação vencida</Badge>;
}

export default function AvaliacaoFisicaPage() {
  const [athletes, setAthletes] = useState<AthleteSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");

  useEffect(() => {
    fetch("/api/coach/athletes")
      .then((r) => r.ok ? r.json() : [])
      .then((data: { id: string; name: string }[]) => {
        setAthletes(data.map((a) => ({
          id: a.id,
          name: a.name,
          lastAssessment: null,
          assessmentCount: 0,
        })));
      })
      .catch(() => null)
      .finally(() => setLoading(false));
  }, []);

  const filtered = athletes.filter((a) =>
    !query || a.name.toLowerCase().includes(query.toLowerCase())
  );

  const noAssessment = athletes.filter((a) => a.lastAssessment === null).length;
  const overdue = athletes.filter((a) => {
    const d = daysSince(a.lastAssessment);
    return d !== null && d > 90;
  }).length;

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold text-text">Avaliação Física</h1>
          <p className="mt-1 text-sm text-text-muted">
            Composição corporal, circunferências, dobras, postura e mobilidade por atleta.
          </p>
        </div>
      </div>

      {/* Stats */}
      {!loading && athletes.length > 0 && (
        <div className="grid grid-cols-3 gap-3">
          <div className="rounded-xl border border-border bg-card p-3 text-center">
            <p className="text-[10px] uppercase tracking-wider text-text-muted">Total</p>
            <p className="mt-1 font-display text-2xl font-bold text-text">{athletes.length}</p>
          </div>
          <div className="rounded-xl border border-warning/30 bg-warning/5 p-3 text-center">
            <p className="text-[10px] uppercase tracking-wider text-warning/80">Sem avaliação</p>
            <p className="mt-1 font-display text-2xl font-bold text-warning">{noAssessment}</p>
          </div>
          <div className="rounded-xl border border-danger/30 bg-danger/5 p-3 text-center">
            <p className="text-[10px] uppercase tracking-wider text-danger/80">Vencidas (&gt;90d)</p>
            <p className="mt-1 font-display text-2xl font-bold text-danger">{overdue}</p>
          </div>
        </div>
      )}

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" />
        <input
          type="text"
          placeholder="Buscar atleta..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="w-full rounded-xl border border-border bg-background py-2.5 pl-10 pr-4 text-sm text-text outline-none focus:border-primary/60 focus:ring-1 focus:ring-primary/20"
        />
      </div>

      {/* Athlete list */}
      {loading ? (
        <div className="flex items-center justify-center py-16 text-text-muted text-sm">Carregando atletas…</div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center gap-2 py-16 text-text-muted">
          <AlertCircle className="h-8 w-8" />
          <p className="text-sm">Nenhum atleta encontrado.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((a) => {
            const days = daysSince(a.lastAssessment);
            return (
              <Link
                key={a.id}
                href={`/treinador/atletas/${a.id}/avaliacao`}
                className="flex items-center gap-3 rounded-xl border border-border bg-card p-4 hover:border-primary/30 hover:bg-card-hover transition-all group"
              >
                {/* Avatar */}
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary">
                  {a.name.slice(0, 2).toUpperCase()}
                </div>

                {/* Info */}
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-text truncate">{a.name}</p>
                  <p className="mt-0.5 text-xs text-text-muted">
                    {a.lastAssessment
                      ? `Última avaliação: ${new Date(a.lastAssessment).toLocaleDateString("pt-BR")} · há ${days}d`
                      : "Sem avaliação registrada"}
                  </p>
                </div>

                {/* Status */}
                <AssessmentStatus days={days} />

                {/* CTA */}
                <div className="flex items-center gap-2 shrink-0">
                  {a.lastAssessment === null ? (
                    <span className="flex items-center gap-1 rounded-lg bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary group-hover:bg-primary/20 transition-colors">
                      <Plus className="h-3 w-3" />Nova
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 rounded-lg bg-card-hover px-2.5 py-1 text-xs text-text-muted group-hover:bg-border/50 transition-colors">
                      <ClipboardList className="h-3 w-3" />Ver
                    </span>
                  )}
                  <ChevronRight className="h-4 w-4 text-text-muted" />
                </div>
              </Link>
            );
          })}
        </div>
      )}

      {/* Protocol cards */}
      <div>
        <h2 className="mb-3 font-display text-sm font-semibold text-text">O que é avaliado</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          {[
            { icon: Scale, label: "Composição corporal", items: "Peso · Gordura % · Massa Magra · Água · TMB · GET", color: "#f97316" },
            { icon: TrendingUp, label: "Circunferências", items: "Cintura · Quadril · Coxa · Braço · Panturrilha (13 medidas)", color: "#3b82f6" },
            { icon: ClipboardList, label: "Dobras cutâneas", items: "Jackson Pollock · Faulkner · Guedes · Petroski", color: "#8b5cf6" },
            { icon: TrendingUp, label: "Performance", items: "VO2máx · VDOT · FTP · CSS · 1RM · VAM · FC", color: "#22c55e" },
          ].map((item) => (
            <div key={item.label} className="rounded-xl border border-border bg-card p-4">
              <div className="mb-2 flex items-center gap-2">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg" style={{ background: `${item.color}20`, color: item.color }}>
                  <item.icon className="h-3.5 w-3.5" />
                </div>
                <span className="text-sm font-semibold text-text">{item.label}</span>
              </div>
              <p className="text-xs text-text-muted">{item.items}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
