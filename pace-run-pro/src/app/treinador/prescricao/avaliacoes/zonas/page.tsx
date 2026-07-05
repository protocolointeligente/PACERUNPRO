"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ChevronRight, Search, HeartPulse, Activity, Bike, Waves, Dumbbell } from "lucide-react";

interface AthleteSummary {
  id: string;
  name: string;
}

const SPORTS = [
  { icon: Activity, label: "Corrida", color: "#f97316" },
  { icon: Bike,     label: "Ciclismo", color: "#3b82f6" },
  { icon: Waves,    label: "Natação",  color: "#06b6d4" },
  { icon: Dumbbell, label: "Força",    color: "#a855f7" },
];

export default function ZonasAtletasPage() {
  const [athletes, setAthletes] = useState<AthleteSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");

  useEffect(() => {
    fetch("/api/coach/athletes")
      .then((r) => r.ok ? r.json() : [])
      .then((data: AthleteSummary[]) => setAthletes(data))
      .catch(() => null)
      .finally(() => setLoading(false));
  }, []);

  const filtered = athletes.filter((a) =>
    !query || a.name.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2">
          <HeartPulse className="h-5 w-5 text-primary" />
          <h1 className="font-display text-2xl font-bold text-text">Zonas de Intensidade</h1>
        </div>
        <p className="mt-1 text-sm text-text-muted">
          Configure zonas de FC, pace, potência e RPE por atleta e modalidade.
        </p>
      </div>

      {/* Sport legend */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {SPORTS.map(({ icon: Icon, label, color }) => (
          <div key={label} className="flex items-center gap-2 rounded-xl border border-border bg-card px-3 py-2.5">
            <Icon className="h-4 w-4 shrink-0" style={{ color }} />
            <span className="text-xs font-medium text-text-muted">{label}</span>
          </div>
        ))}
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted/50" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Buscar atleta…"
          className="w-full rounded-xl border border-border bg-card py-2.5 pl-10 pr-4 text-sm text-text placeholder:text-text-muted/50 outline-none focus:border-primary/60 focus:ring-2 focus:ring-primary/20"
        />
      </div>

      {/* Athlete list */}
      {loading ? (
        <div className="flex justify-center py-12">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-2xl border border-border bg-card p-8 text-center">
          <HeartPulse className="mx-auto mb-3 h-10 w-10 text-text-muted/30" />
          <p className="text-sm text-text-muted">{query ? "Nenhum atleta encontrado" : "Nenhum atleta cadastrado"}</p>
        </div>
      ) : (
        <div className="divide-y divide-border overflow-hidden rounded-2xl border border-border bg-card">
          {filtered.map((athlete) => (
            <Link
              key={athlete.id}
              href={`/treinador/atletas/${athlete.id}/zonas`}
              className="flex items-center justify-between gap-3 px-5 py-4 hover:bg-card-hover transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary">
                  {athlete.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <p className="text-sm font-semibold text-text">{athlete.name}</p>
                  <p className="text-[11px] text-text-muted">Editar zonas por modalidade</p>
                </div>
              </div>
              <ChevronRight className="h-4 w-4 text-text-muted/50 shrink-0" />
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
