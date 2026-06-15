"use client";

import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { Building2, CheckCircle2, Users, DollarSign, Clock } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { StatCard } from "@/components/dashboard/stat-card";
import { SectionHeader } from "@/components/shared/section-header";
import { assessoriaList } from "@/lib/mock-data";
import { cn } from "@/lib/utils";

const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  show: (i: number = 0) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.06, duration: 0.4, ease: "easeOut" as const },
  }),
};

const planBadgeVariant = (plan: string) => {
  if (plan === "b2b-unlimited") return "danger" as const;
  if (plan === "b2b-premium") return "warning" as const;
  if (plan === "b2b-pro") return "primary" as const;
  return "outline" as const;
};

const planLabel = (plan: string) => {
  const map: Record<string, string> = {
    "b2b-starter": "Starter",
    "b2b-pro": "Pro",
    "b2b-premium": "Premium",
    "b2b-unlimited": "Ilimitado",
  };
  return map[plan] ?? plan;
};

const planFilters = [
  { id: "all", label: "Todos" },
  { id: "b2b-starter", label: "Starter" },
  { id: "b2b-pro", label: "Pro" },
  { id: "b2b-premium", label: "Premium" },
  { id: "b2b-unlimited", label: "Ilimitado" },
];

const statusFilters = [
  { id: "all", label: "Todas" },
  { id: "ativo", label: "Ativas" },
  { id: "pendente", label: "Pendentes" },
];

export default function AssessoriasPage() {
  const [search, setSearch] = useState("");
  const [planFilter, setPlanFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [approvedIds, setApprovedIds] = useState<Set<string>>(new Set());

  const stats = useMemo(() => {
    const active = assessoriaList.filter(
      (a) => a.status === "ativo" || approvedIds.has(a.id)
    );
    const pending = assessoriaList.filter(
      (a) => a.status === "pendente" && !approvedIds.has(a.id)
    );
    const mrr = assessoriaList.reduce((acc, a) => acc + a.mrr, 0);
    return { total: assessoriaList.length, active: active.length, pending: pending.length, mrr };
  }, [approvedIds]);

  const filtered = useMemo(() => {
    return assessoriaList.filter((a) => {
      const matchSearch =
        search === "" ||
        a.name.toLowerCase().includes(search.toLowerCase()) ||
        a.city.toLowerCase().includes(search.toLowerCase());
      const matchPlan = planFilter === "all" || a.plan === planFilter;
      const effectiveStatus =
        a.status === "pendente" && approvedIds.has(a.id) ? "ativo" : a.status;
      const matchStatus = statusFilter === "all" || effectiveStatus === statusFilter;
      return matchSearch && matchPlan && matchStatus;
    });
  }, [search, planFilter, statusFilter, approvedIds]);

  return (
    <div className="mx-auto max-w-6xl space-y-8">
      {/* Header */}
      <motion.div
        variants={fadeUp}
        initial="hidden"
        animate="show"
        className="flex flex-wrap items-start gap-4"
      >
        <div>
          <Badge variant="primary" className="mb-2">Assessorias</Badge>
          <h1 className="font-display text-2xl font-bold text-text sm:text-3xl">
            Gestão de assessorias
          </h1>
        </div>
      </motion.div>

      {/* Stats */}
      <motion.div
        custom={1}
        variants={fadeUp}
        initial="hidden"
        animate="show"
        className="grid grid-cols-2 gap-3 sm:grid-cols-4"
      >
        <StatCard label="Total" value={`${stats.total}`} icon={Building2} accent="primary" />
        <StatCard label="Ativas" value={`${stats.active}`} icon={CheckCircle2} accent="success" />
        <StatCard label="Pendentes" value={`${stats.pending}`} icon={Clock} accent="danger" />
        <StatCard label="MRR B2B" value={`R$${stats.mrr.toLocaleString("pt-BR")}`} icon={DollarSign} accent="info" />
      </motion.div>

      {/* Filters */}
      <motion.div
        custom={2}
        variants={fadeUp}
        initial="hidden"
        animate="show"
        className="space-y-3"
      >
        <input
          type="text"
          placeholder="Buscar assessoria ou cidade…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full rounded-xl border border-border bg-card px-4 py-2.5 text-sm text-text placeholder:text-text-muted focus:border-primary/50 focus:outline-none sm:max-w-sm"
        />
        <div className="flex flex-wrap gap-2">
          {planFilters.map((f) => (
            <button
              key={f.id}
              onClick={() => setPlanFilter(f.id)}
              className={cn(
                "rounded-full border px-3 py-1 text-xs font-medium transition-colors",
                planFilter === f.id
                  ? "border-primary/50 bg-primary/15 text-primary"
                  : "border-border bg-card text-text-muted hover:border-primary/30 hover:text-text"
              )}
            >
              {f.label}
            </button>
          ))}
        </div>
        <div className="flex flex-wrap gap-2">
          {statusFilters.map((f) => (
            <button
              key={f.id}
              onClick={() => setStatusFilter(f.id)}
              className={cn(
                "rounded-full border px-3 py-1 text-xs font-medium transition-colors",
                statusFilter === f.id
                  ? "border-primary/50 bg-primary/15 text-primary"
                  : "border-border bg-card text-text-muted hover:border-primary/30 hover:text-text"
              )}
            >
              {f.label}
            </button>
          ))}
        </div>
      </motion.div>

      {/* List */}
      <motion.div
        custom={3}
        variants={fadeUp}
        initial="hidden"
        animate="show"
      >
        <SectionHeader
          title="Assessorias"
          subtitle={`${filtered.length} resultado(s)`}
        />
        <div className="space-y-3">
          {filtered.map((a) => {
            const effectiveStatus =
              a.status === "pendente" && approvedIds.has(a.id) ? "ativo" : a.status;
            return (
              <Card key={a.id}>
                <CardContent className="flex flex-wrap items-center justify-between gap-4 p-4">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-10 w-10">
                      <AvatarFallback>
                        {a.name
                          .split(" ")
                          .map((n) => n[0])
                          .slice(0, 2)
                          .join("")}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="text-sm font-semibold text-text">
                        {a.name}
                      </p>
                      <p className="text-xs text-text-muted">{a.city}</p>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-3">
                    <Badge variant={planBadgeVariant(a.plan)}>
                      {planLabel(a.plan)}
                    </Badge>
                    <div className="flex items-center gap-1 text-xs text-text-muted">
                      <Users className="h-3.5 w-3.5" />
                      <span>{a.coaches} treinadores</span>
                    </div>
                    <div className="flex items-center gap-1 text-xs text-text-muted">
                      <Users className="h-3.5 w-3.5" />
                      <span>{a.athletes} atletas</span>
                    </div>
                    <span className="text-sm font-semibold text-text">
                      R${a.mrr}/mês
                    </span>
                    <Badge variant={effectiveStatus === "ativo" ? "success" : "warning"}>
                      {effectiveStatus === "ativo" ? "Ativo" : "Pendente"}
                    </Badge>
                    <Button variant="secondary" size="sm">
                      Detalhe
                    </Button>
                    {effectiveStatus === "pendente" && (
                      <Button
                        variant="success"
                        size="sm"
                        onClick={() =>
                          setApprovedIds((prev) => new Set([...prev, a.id]))
                        }
                      >
                        Aprovar
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
          {filtered.length === 0 && (
            <Card>
              <CardContent className="p-6 text-center text-sm text-text-muted">
                Nenhuma assessoria encontrada.
              </CardContent>
            </Card>
          )}
        </div>
      </motion.div>
    </div>
  );
}
