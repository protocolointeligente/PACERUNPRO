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
  if (plan.includes("white") || plan.includes("unlimited")) return "danger" as const;
  if (plan.includes("assessoria") || plan.includes("premium")) return "warning" as const;
  if (plan.includes("pro")) return "primary" as const;
  return "outline" as const;
};

const planLabel = (plan: string) => {
  const map: Record<string, string> = {
    "starter": "Starter", "b2b-starter": "Starter",
    "pro": "Pro", "b2b-pro": "Pro",
    "assessoria": "Assessoria", "b2b-premium": "Assessoria",
    "white-label": "White Label", "b2b-unlimited": "White Label",
  };
  return map[plan] ?? plan;
};

function HealthBadge({ score }: { score: number }) {
  const cls = score >= 75 ? "text-success border-success/40" : score >= 50 ? "text-warning border-warning/40" : "text-danger border-danger/40";
  if (score === 0) return null;
  return (
    <span className={`inline-flex items-center gap-0.5 rounded-full border px-2 py-0.5 text-xs font-bold ${cls}`}>
      {score}<span className="font-normal opacity-60">/100</span>
    </span>
  );
}

const planFilters = [
  { id: "all", label: "Todos" },
  { id: "starter", label: "Starter" },
  { id: "pro", label: "Pro" },
  { id: "assessoria", label: "Assessoria" },
  { id: "white-label", label: "White Label" },
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
                <CardContent className="p-4 space-y-3">
                  {/* Row 1: Identity + status */}
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <Avatar className="h-10 w-10 shrink-0">
                        <AvatarFallback>
                          {a.name.split(" ").map((n) => n[0]).slice(0, 2).join("")}
                        </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-text">{a.name}</p>
                        <p className="truncate text-xs text-text-muted">{a.city}</p>
                      </div>
                    </div>
                    <div className="shrink-0 flex items-center gap-2">
                      <Badge variant={effectiveStatus === "ativo" ? "success" : "warning"}>
                        {effectiveStatus === "ativo" ? "Ativo" : "Pendente"}
                      </Badge>
                      <HealthBadge score={a.healthScore} />
                    </div>
                  </div>

                  {/* Row 2: Plan + athletes + MRR */}
                  <div className="flex flex-wrap items-center gap-2 text-xs text-text-muted">
                    <Badge variant={planBadgeVariant(a.plan)}>{planLabel(a.plan)}</Badge>
                    <span className="flex items-center gap-1"><Users className="h-3 w-3" />{a.coaches} trein. · {a.athletes} atletas</span>
                    <span className="font-semibold text-text ml-auto">R${a.mrr}/mês</span>
                  </div>

                  {/* Row 3: Actions */}
                  <div className="flex gap-2 pt-1 border-t border-border/40">
                    <Button variant="secondary" size="sm">Detalhe</Button>
                    {effectiveStatus === "pendente" && (
                      <Button
                        variant="success"
                        size="sm"
                        onClick={() => setApprovedIds((prev) => new Set([...prev, a.id]))}
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
