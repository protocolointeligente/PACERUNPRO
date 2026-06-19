"use client";

import { useState } from "react";
import { adminCoaches } from "@/lib/mock-data";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

const planFilters = ["Todos", "Starter", "Pro", "Assessoria"] as const;
type PlanFilter = (typeof planFilters)[number];

function getPlanVariant(plan: string): "outline" | "primary" | "warning" {
  if (plan === "Pro") return "primary";
  if (plan === "Assessoria") return "warning";
  return "outline";
}

function getStatusVariant(status: string): "success" | "danger" {
  return status === "ativo" ? "success" : "danger";
}

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

export default function AdminTreinadoresPage() {
  const [search, setSearch] = useState("");
  const [planFilter, setPlanFilter] = useState<PlanFilter>("Todos");

  const filtered = adminCoaches.filter((coach) => {
    const matchesSearch =
      search === "" ||
      coach.name.toLowerCase().includes(search.toLowerCase()) ||
      coach.credential.toLowerCase().includes(search.toLowerCase());
    const matchesPlan = planFilter === "Todos" || coach.plan === planFilter;
    return matchesSearch && matchesPlan;
  });

  return (
    <div className="mx-auto max-w-7xl space-y-8 px-4 py-8 sm:px-6">
      {/* Header */}
      <div className="space-y-1">
        <Badge variant="primary" className="mb-2">
          Painel Administrativo
        </Badge>
        <h1 className="font-display text-2xl font-bold text-text sm:text-3xl">
          Treinadores
        </h1>
        <p className="text-sm text-text-muted">
          Gerencie todos os treinadores cadastrados na plataforma.
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <input
          type="text"
          placeholder="Buscar por nome ou credencial..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full rounded-xl border border-border bg-card px-4 py-2.5 text-sm text-text placeholder-text-muted focus:border-primary/60 focus:outline-none sm:max-w-sm"
        />
        <div className="flex flex-wrap gap-2">
          {planFilters.map((plan) => (
            <button
              key={plan}
              onClick={() => setPlanFilter(plan)}
              className={cn(
                "rounded-full border px-4 py-1.5 text-xs font-medium transition-colors",
                planFilter === plan
                  ? "border-primary/60 bg-primary/10 text-primary"
                  : "border-border bg-transparent text-text-muted hover:border-primary/40 hover:text-text"
              )}
            >
              {plan}
            </button>
          ))}
        </div>
      </div>

      {/* Coaches list */}
      <Card>
        <CardContent className="p-0">
          {/* Table header */}
          <div className="hidden grid-cols-[2fr_1fr_1fr_1fr_1fr_auto] gap-4 border-b border-border px-6 py-3 text-xs font-semibold uppercase tracking-wider text-text-muted sm:grid">
            <span>Treinador</span>
            <span>Plano</span>
            <span>Atletas</span>
            <span>MRR</span>
            <span>Status</span>
            <span>Ações</span>
          </div>

          {/* Rows */}
          <div className="divide-y divide-border">
            {filtered.length === 0 ? (
              <div className="px-6 py-12 text-center text-sm text-text-muted">
                Nenhum treinador encontrado.
              </div>
            ) : (
              filtered.map((coach) => (
                <div
                  key={coach.id}
                  className="flex flex-col gap-2.5 px-4 py-4 sm:grid sm:grid-cols-[2fr_1fr_1fr_1fr_1fr_auto] sm:items-center sm:gap-4 sm:px-6"
                >
                  {/* Treinador */}
                  <div className="flex items-center gap-3">
                    <Avatar className="h-9 w-9 flex-shrink-0">
                      <AvatarFallback>{getInitials(coach.name)}</AvatarFallback>
                    </Avatar>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-text">
                        {coach.name}
                      </p>
                      <p className="truncate text-xs text-text-muted">
                        {coach.credential}
                      </p>
                    </div>
                  </div>

                  {/* Meta row: inline on mobile, grid cells on sm+ */}
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 sm:[display:contents]">
                    {/* Plano */}
                    <div>
                      <Badge variant={getPlanVariant(coach.plan)}>{coach.plan}</Badge>
                    </div>

                    {/* Atletas */}
                    <div className="flex items-center gap-1.5">
                      <span className="text-sm font-semibold text-text">
                        {coach.athletes}
                      </span>
                      <span className="text-xs text-text-muted">atletas</span>
                    </div>

                    {/* MRR */}
                    <div>
                      <span className="text-sm font-semibold text-success">
                        R$ {coach.mrr}
                      </span>
                      <span className="text-xs text-text-muted">/mês</span>
                    </div>

                    {/* Status */}
                    <div>
                      <Badge variant={getStatusVariant(coach.status)}>
                        {coach.status}
                      </Badge>
                    </div>

                    {/* Ações */}
                    <div>
                      <Button variant="secondary" size="sm">
                        Ver atletas
                      </Button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {/* Summary */}
      <p className="text-xs text-text-muted">
        Exibindo {filtered.length} de {adminCoaches.length} treinadores
      </p>
    </div>
  );
}
