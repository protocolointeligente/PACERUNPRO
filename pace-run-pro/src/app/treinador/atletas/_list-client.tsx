"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Search, SlidersHorizontal, ArrowUpDown, Users } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { InfoTooltip } from "@/components/ui/info-tooltip";
import { cn } from "@/lib/utils";

export interface AthleteRow {
  id: string;
  name: string;
  avatarUrl?: string | null;
  goal: string;
  level: string;
  status: "ativo" | "risco" | "inativo";
  adherence: number;
  weeklyLoad: number;
  lastCheckIn: string;
  raceDate: string;
}

const statusLabels = { ativo: "Ativo", risco: "Em risco", inativo: "Inativo" } as const;
const statusVariants = { ativo: "success", risco: "danger", inativo: "default" } as const;

const filters = ["Todos", "Ativos", "Em risco", "Inativos"] as const;

interface AthleteListClientProps {
  athletes: AthleteRow[];
}

export default function AthleteListClient({ athletes }: AthleteListClientProps) {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<(typeof filters)[number]>("Todos");

  const filtered = useMemo(() => {
    return athletes.filter((a) => {
      const matchesQuery =
        a.name.toLowerCase().includes(query.toLowerCase()) ||
        a.goal.toLowerCase().includes(query.toLowerCase());
      const matchesFilter =
        filter === "Todos" ||
        (filter === "Ativos" && a.status === "ativo") ||
        (filter === "Em risco" && a.status === "risco") ||
        (filter === "Inativos" && a.status === "inativo");
      return matchesQuery && matchesFilter;
    });
  }, [query, filter, athletes]);

  if (athletes.length === 0) {
    return (
      <div className="mx-auto max-w-6xl space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <Badge variant="primary" className="mb-2">Gestão de atletas</Badge>
            <h1 className="font-display text-2xl font-bold text-text sm:text-3xl">Seus atletas</h1>
            <p className="mt-1 text-sm text-text-muted">Nenhum atleta cadastrado ainda</p>
          </div>
          <Link href="/treinador/atletas/convidar">
            <Button variant="primary">Convidar atleta</Button>
          </Link>
        </div>

        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10">
            <Users className="h-8 w-8 text-primary" />
          </div>
          <h2 className="font-display text-lg font-bold text-text">Nenhum atleta ainda</h2>
          <p className="mt-2 max-w-xs text-sm text-text-muted">
            Compartilhe seu link de convite para que atletas se cadastrem sob sua orientação.
          </p>
          <Link href="/treinador/atletas/convidar" className="mt-6">
            <Button variant="primary">Convidar atleta</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <Badge variant="primary" className="mb-2">Gestão de atletas</Badge>
          <h1 className="font-display text-2xl font-bold text-text sm:text-3xl">Seus atletas</h1>
          <p className="mt-1 text-sm text-text-muted">{athletes.length} {athletes.length === 1 ? "atleta" : "atletas"} sob sua orientação</p>
        </div>
        <Link href="/treinador/atletas/convidar">
          <Button variant="primary">Convidar atleta</Button>
        </Link>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="flex flex-1 items-center gap-2 rounded-xl border border-border bg-card px-3.5 py-2.5">
          <Search className="h-4 w-4 text-text-muted" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Pesquisar por nome ou objetivo…"
            className="w-full bg-transparent text-sm text-text placeholder:text-text-muted/60 outline-none"
          />
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <SlidersHorizontal className="hidden h-4 w-4 text-text-muted sm:block" />
          {filters.map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={cn(
                "rounded-full border px-3.5 py-1.5 text-xs font-medium transition-colors",
                filter === f
                  ? "border-primary/60 bg-primary/15 text-primary"
                  : "border-border bg-card text-text-muted hover:border-primary/30"
              )}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {/* Table-like list */}
      <Card className="overflow-hidden">
        <div className="hidden grid-cols-[1.6fr_1fr_1fr_1fr_1fr_0.8fr] gap-3 border-b border-border bg-card-hover/40 px-5 py-3 text-[11px] font-semibold uppercase tracking-wider text-text-muted lg:grid">
          <span>Atleta</span>
          <span>Objetivo / Nível</span>
          <span className="flex items-center gap-1">Status</span>
          <span className="flex items-center gap-1">Adesão <ArrowUpDown className="h-3 w-3" /></span>
          <span className="flex items-center gap-1">
            Carga semanal
            <InfoTooltip text="UA = Unidades Arbitrárias. Mede a carga de treino combinando duração (min) e percepção de esforço (RPE de 1 a 10) de cada sessão, somadas na semana." />
          </span>
          <span>Próx. prova</span>
        </div>
        <div className="divide-y divide-border">
          {filtered.map((a) => (
            <Link key={a.id} href={`/treinador/atletas/${a.id}`} className="block transition-colors hover:bg-card-hover/40">
              <div className="grid grid-cols-1 gap-3 px-5 py-4 lg:grid-cols-[1.6fr_1fr_1fr_1fr_1fr_0.8fr] lg:items-center">
                <div className="flex items-center gap-3">
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={a.avatarUrl ?? undefined} alt={a.name} />
                    <AvatarFallback>{a.name.split(" ").map((n) => n[0]).slice(0, 2).join("")}</AvatarFallback>
                  </Avatar>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-text">{a.name}</p>
                    <p className="truncate text-xs text-text-muted">Check-in: {a.lastCheckIn}</p>
                  </div>
                </div>

                <div className="text-sm text-text-muted">
                  <span className="text-text">{a.goal}</span> · {a.level}
                </div>

                <div>
                  <Badge variant={statusVariants[a.status]}>{statusLabels[a.status]}</Badge>
                </div>

                <div className="flex items-center gap-2">
                  <Progress value={a.adherence * 100} className="h-1.5 max-w-[100px]" />
                  <span className="text-xs font-semibold text-text">{Math.round(a.adherence * 100)}%</span>
                </div>

                <div className="text-sm text-text">{a.weeklyLoad} <span className="text-xs text-text-muted">UA</span></div>

                <div className="text-sm text-text-muted">{a.raceDate}</div>
              </div>
            </Link>
          ))}
          {filtered.length === 0 && (
            <div className="px-5 py-10 text-center text-sm text-text-muted">Nenhum atleta encontrado para esses filtros.</div>
          )}
        </div>
      </Card>
    </div>
  );
}
