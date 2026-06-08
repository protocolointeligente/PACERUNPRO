"use client";

import { useState } from "react";
import Link from "next/link";
import { Dumbbell, Flame, ListChecks, Repeat, Timer } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { exerciseCategories, exerciseLibrary, strengthSessionExample } from "@/lib/mock-data";
import { cn } from "@/lib/utils";

export default function StrengthPage() {
  const [activeCategory, setActiveCategory] = useState<string | null>(null);

  const filtered = activeCategory ? exerciseLibrary.filter((e) => e.category === activeCategory) : exerciseLibrary;

  return (
    <div className="mx-auto max-w-6xl space-y-7">
      <div>
        <Badge variant="primary" className="mb-2">Força &amp; Funcional</Badge>
        <h1 className="font-display text-2xl font-bold text-white sm:text-3xl">Seu treino de força de hoje</h1>
        <p className="mt-1.5 text-sm text-text-muted">
          O diferencial do Pace Run Pro: sessões completas de força e funcional, criadas pelo seu treinador, com biblioteca de exercícios em vídeo.
        </p>
      </div>

      {/* Today's strength session */}
      <Card className="border-primary/30 bg-gradient-to-br from-primary/12 to-card">
        <CardContent className="p-5 sm:p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/15 text-primary">
                <Dumbbell className="h-5 w-5" />
              </span>
              <div>
                <p className="text-xs uppercase tracking-wider text-text-muted">Sessão de hoje · Divisão ABCD</p>
                <h2 className="font-display text-lg font-bold text-white">{strengthSessionExample.label}</h2>
              </div>
            </div>
            <Badge variant="success">Liberado pelo treinador</Badge>
          </div>

          <div className="mt-5 space-y-2.5">
            {strengthSessionExample.exercises.map((ex, i) => (
              <Link key={ex.id} href={`/aluno/forca/${ex.id}`}>
                <div className="flex items-center gap-3 rounded-xl border border-border bg-card-hover/40 p-3 transition-colors hover:border-primary/40">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-card text-sm font-bold text-text-muted">
                    {i + 1}
                  </span>
                  <div
                    className="h-12 w-16 shrink-0 rounded-lg bg-cover bg-center"
                    style={{ backgroundImage: `url('${ex.imageUrl}')` }}
                  />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-white">{ex.name}</p>
                    <p className="text-xs text-text-muted">{ex.category}</p>
                  </div>
                  <div className="hidden gap-4 text-xs text-text-muted sm:flex">
                    <span className="flex items-center gap-1"><Repeat className="h-3 w-3" /> {ex.sets}x {ex.reps}</span>
                    <span className="flex items-center gap-1"><Timer className="h-3 w-3" /> {ex.rest}</span>
                    <span className="flex items-center gap-1"><Flame className="h-3 w-3" /> RPE {ex.rpe}</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>

          <Button size="lg" className="mt-5 w-full sm:w-auto">
            <ListChecks className="h-4 w-4" />
            Iniciar sessão de força
          </Button>
        </CardContent>
      </Card>

      {/* Library */}
      <div>
        <h2 className="mb-3 font-display text-lg font-semibold text-white">Biblioteca de exercícios</h2>
        <div className="mb-4 flex flex-wrap gap-2">
          <button
            onClick={() => setActiveCategory(null)}
            className={cn(
              "rounded-full border px-3.5 py-1.5 text-xs font-medium transition-colors",
              activeCategory === null ? "border-primary/60 bg-primary/15 text-white" : "border-border bg-card text-text-muted hover:border-primary/30"
            )}
          >
            Todas
          </button>
          {exerciseCategories.map((c) => (
            <button
              key={c}
              onClick={() => setActiveCategory(c)}
              className={cn(
                "rounded-full border px-3.5 py-1.5 text-xs font-medium transition-colors",
                activeCategory === c ? "border-primary/60 bg-primary/15 text-white" : "border-border bg-card text-text-muted hover:border-primary/30"
              )}
            >
              {c}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((ex) => (
            <Link key={ex.id} href={`/aluno/forca/${ex.id}`}>
              <Card hover className="overflow-hidden">
                <div className="h-36 bg-cover bg-center" style={{ backgroundImage: `url('${ex.imageUrl}')` }} />
                <CardContent className="p-4">
                  <Badge variant="primary" className="mb-2">{ex.category}</Badge>
                  <p className="text-sm font-semibold text-white">{ex.name}</p>
                  <p className="mt-1 line-clamp-2 text-xs text-text-muted">{ex.description}</p>
                  <div className="mt-3 flex items-center gap-3 text-xs text-text-muted">
                    <span>{ex.sets}x {ex.reps}</span>
                    <span>·</span>
                    <span>{ex.rest} descanso</span>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
