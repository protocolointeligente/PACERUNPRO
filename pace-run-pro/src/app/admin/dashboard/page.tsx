"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  ArrowRight,
  Building2,
  CheckCircle2,
  Clock,
  DollarSign,
  Phone,
  TrendingUp,
  Users,
  XCircle,
  Zap,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { StatCard } from "@/components/dashboard/stat-card";
import { SectionHeader } from "@/components/shared/section-header";
import { BarTrend } from "@/components/charts/trend-chart";
import { cn } from "@/lib/utils";

const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  show: (i: number = 0) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.06, duration: 0.4, ease: "easeOut" as const },
  }),
};

interface AssessoriaItem {
  id: string;
  name: string;
  city: string;
  plan: string;
  coaches: number;
  athletes: number;
  mrr: number;
  status: "ativo" | "pendente" | "suspenso";
  contact: string;
  healthScore: number;
  churnRisk: "baixo" | "medio" | "alto";
  lastLoginDays: number;
  prescribedLast7d: number;
}

const PLAN_LABEL: Record<string, string> = {
  starter: "Starter", pro: "Pro", assessoria: "Assessoria", "white-label": "White Label",
};
const PLAN_VARIANT = (p: string) => {
  if (p.includes("white") || p.includes("unlimited")) return "danger" as const;
  if (p.includes("assessoria") || p.includes("premium")) return "warning" as const;
  if (p.includes("pro")) return "primary" as const;
  return "outline" as const;
};

function HealthBadge({ score }: { score: number }) {
  const color = score >= 75 ? "text-success" : score >= 50 ? "text-warning" : "text-danger";
  const ring = score >= 75 ? "border-success/40" : score >= 50 ? "border-warning/40" : "border-danger/40";
  return (
    <span className={cn("inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-bold", color, ring)}>
      {score}<span className="font-normal opacity-60">/100</span>
    </span>
  );
}

const today = new Date().toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" });

export default function AdminDashboard() {
  const [assessoriaList, setAssessoriaList] = useState<AssessoriaItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [approvedIds, setApprovedIds] = useState<Set<string>>(new Set());
  const [refusedIds, setRefusedIds] = useState<Set<string>>(new Set());

  async function handleApprove(id: string) {
    setApprovedIds((prev) => new Set([...prev, id]));
    await fetch("/api/admin/approve", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ assessoriaId: id, action: "approve" }),
    }).catch(() => null);
  }

  useEffect(() => {
    fetch("/api/admin/coaches")
      .then((r) => r.ok ? r.json() : [])
      .then((data: AssessoriaItem[]) => setAssessoriaList(data))
      .catch(() => null)
      .finally(() => setLoading(false));
  }, []);

  const pendingApprovals = assessoriaList.filter(
    (a) => a.status === "pendente" && !approvedIds.has(a.id) && !refusedIds.has(a.id),
  );
  const visibleApprovals = pendingApprovals;

  const activeList = assessoriaList.filter(
    (a) => a.status === "ativo" || approvedIds.has(a.id),
  );
  const b2bMrr = activeList.reduce((s, a) => s + a.mrr, 0);
  const b2bActive = activeList.length;
  const avgHealth =
    b2bActive > 0
      ? Math.round(activeList.reduce((s, a) => s + a.healthScore, 0) / b2bActive)
      : 0;

  const atRiskAccounts = activeList.filter(
    (a) => a.churnRisk === "alto" || a.healthScore < 55,
  );

  const b2bSeries: { label: string; b2b: number }[] = [];

  return (
    <div className="mx-auto max-w-6xl space-y-8">
      {/* Header */}
      <motion.div variants={fadeUp} initial="hidden" animate="show" className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <Badge variant="danger" className="mb-2">Super Admin</Badge>
          <h1 className="font-display text-2xl font-bold text-text sm:text-3xl">Visão geral da plataforma</h1>
          <p className="mt-1 text-sm text-text-muted">{today}</p>
        </div>
      </motion.div>

      {/* B2B KPIs */}
      <motion.div custom={1} variants={fadeUp} initial="hidden" animate="show" className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard
          label="MRR B2B"
          value={`R$${b2bMrr.toLocaleString("pt-BR")}`}
          unit=""
          icon={TrendingUp}
          accent="primary"
        />
        <StatCard
          label="Assessorias ativas"
          value={loading ? "…" : `${b2bActive}`}
          unit={`${pendingApprovals.length} pendentes`}
          icon={Building2}
          accent="success"
        />
        <StatCard
          label="Treinadores ativos"
          value={loading ? "…" : `${activeList.reduce((s, a) => s + a.coaches, 0)}`}
          icon={Users}
          accent="info"
        />
        <StatCard
          label="Health score médio"
          value={`${avgHealth}`}
          unit="/ 100"
          icon={Zap}
          accent={avgHealth >= 70 ? "success" : avgHealth >= 50 ? "warning" : "danger"}
        />
      </motion.div>

      {/* Alertas operacionais */}
      <motion.div custom={2} variants={fadeUp} initial="hidden" animate="show">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            { label: "Contas em risco de churn", value: atRiskAccounts.length, color: "border-danger/30 bg-danger/5 text-danger", href: "/admin/assessorias" },
            { label: "Aprovações pendentes", value: visibleApprovals.length, color: "border-warning/30 bg-warning/5 text-warning", href: "/admin/aprovacoes" },
            { label: "Cobranças com falha", value: 0, color: "border-orange-500/30 bg-orange-500/5 text-orange-400", href: "/admin/financeiro" },
            { label: "ARR estimado", value: `R$${(b2bMrr * 12).toLocaleString("pt-BR")}`, color: "border-primary/30 bg-primary/5 text-primary", href: "/admin/financeiro" },
          ].map((item) => (
            <Link key={item.label} href={item.href}>
              <div className={cn("group rounded-2xl border p-4 transition-all hover:shadow-md", item.color)}>
                <p className="font-display text-2xl font-extrabold">{item.value}</p>
                <p className="mt-0.5 text-xs opacity-80 leading-snug">{item.label}</p>
                <ArrowRight className="mt-2 h-3.5 w-3.5 opacity-50 group-hover:opacity-100 transition-opacity" />
              </div>
            </Link>
          ))}
        </div>
      </motion.div>

      <div className="grid gap-6 lg:grid-cols-[1fr_22rem]">
        {/* Contas em risco */}
        <motion.div custom={3} variants={fadeUp} initial="hidden" animate="show" className="space-y-4">
          <SectionHeader
            title="Contas em risco de churn"
            subtitle={`${atRiskAccounts.length} assessoria(s) com health score baixo ou atividade reduzida`}
            href="/admin/assessorias"
          />
          {loading ? (
            <div className="flex justify-center py-8">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
            </div>
          ) : atRiskAccounts.length === 0 ? (
            <Card>
              <CardContent className="p-6 text-center text-sm text-success">
                Todas as assessorias estão saudáveis.
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {atRiskAccounts.map((a) => (
                <Card key={a.id} className="border-danger/20">
                  <CardContent className="flex flex-wrap items-center justify-between gap-3 p-4">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-9 w-9">
                        <AvatarFallback>{a.name.split(" ").map((n) => n[0]).slice(0, 2).join("")}</AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="text-sm font-semibold text-text">{a.name}</p>
                        <p className="text-xs text-text-muted">
                          {a.lastLoginDays === 0 ? "Online hoje" : `Último login: ${a.lastLoginDays}d atrás`}
                          {" · "}{a.prescribedLast7d} prescrições/sem
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={PLAN_VARIANT(a.plan)}>{PLAN_LABEL[a.plan] ?? a.plan}</Badge>
                      <HealthBadge score={a.healthScore} />
                      <Badge variant={a.churnRisk === "alto" ? "danger" : "warning"}>
                        {a.churnRisk === "alto" ? "Intervenção urgente" : "Atenção"}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {/* MRR B2B chart */}
          <div className="pt-2">
            <SectionHeader title="MRR B2B — evolução" subtitle="Receita mensal recorrente das assessorias" />
            <Card>
              <CardContent className="p-5">
                {b2bSeries.length === 0 ? (
                  <p className="py-4 text-center text-sm text-text-muted">Sem dados de MRR ainda.</p>
                ) : (
                  <BarTrend data={b2bSeries} dataKey="b2b" color="#C6F24E" unit="" />
                )}
              </CardContent>
            </Card>
          </div>
        </motion.div>

        {/* Aprovações + uso por plano */}
        <motion.div custom={4} variants={fadeUp} initial="hidden" animate="show" className="space-y-5">
          {/* Aprovações pendentes */}
          <Card>
            <CardContent className="p-5">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-display text-sm font-semibold text-text flex items-center gap-2">
                  <Clock className="h-4 w-4 text-warning" /> Aprovações pendentes
                </h3>
                <Link href="/admin/aprovacoes" className="text-xs text-text-muted hover:text-text">
                  Ver todas →
                </Link>
              </div>
              {visibleApprovals.length === 0 ? (
                <p className="text-xs text-text-muted">Nenhuma pendente.</p>
              ) : (
                <div className="space-y-3">
                  {visibleApprovals.slice(0, 3).map((a) => {
                    const isApproved = approvedIds.has(a.id);
                    return (
                      <div key={a.id} className="flex items-center justify-between gap-2">
                        <div>
                          <p className="text-xs font-semibold text-text">{a.name}</p>
                          <p className="text-xs text-text-muted">{a.city}</p>
                        </div>
                        {isApproved ? (
                          <Badge variant="success"><CheckCircle2 className="h-3 w-3" /> Aprovado</Badge>
                        ) : (
                          <div className="flex gap-1.5">
                            <Button
                              variant="success"
                              size="sm"
                              className="h-7 px-2.5 text-xs"
                              onClick={() => handleApprove(a.id)}
                            >
                              Aprovar
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-7 px-2 text-danger hover:text-danger"
                              onClick={() => setRefusedIds((prev) => new Set([...prev, a.id]))}
                            >
                              <XCircle className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Distribuição por plano */}
          <Card>
            <CardContent className="p-5">
              <h3 className="font-display text-sm font-semibold text-text mb-3 flex items-center gap-2">
                <DollarSign className="h-4 w-4 text-primary" /> MRR por plano
              </h3>
              {(["starter", "pro", "assessoria", "white-label"] as const).map((planId) => {
                const label = PLAN_LABEL[planId];
                const accounts = activeList.filter((a) => a.plan === planId);
                const planMrr = accounts.reduce((s, a) => s + a.mrr, 0);
                const pct = b2bMrr > 0 ? Math.round((planMrr / b2bMrr) * 100) : 0;
                return (
                  <div key={planId} className="mb-3">
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className="text-text-muted">{label} ({accounts.length})</span>
                      <span className="font-semibold text-text">R${planMrr.toLocaleString("pt-BR")}</span>
                    </div>
                    <div className="h-1.5 w-full rounded-full bg-card-hover overflow-hidden">
                      <div
                        className="h-full rounded-full bg-primary/70 transition-all"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </CardContent>
          </Card>

          {/* Health score geral */}
          <Card>
            <CardContent className="p-5">
              <h3 className="font-display text-sm font-semibold text-text mb-3 flex items-center gap-2">
                <Zap className="h-4 w-4 text-warning" /> Health score da base
              </h3>
              {activeList.length === 0 ? (
                <p className="text-xs text-text-muted">Nenhuma assessoria ativa ainda.</p>
              ) : (
                <div className="space-y-2.5">
                  {activeList.map((a) => (
                    <div key={a.id} className="flex items-center justify-between gap-2">
                      <span className="truncate text-xs text-text-muted max-w-[10rem]">{a.name}</span>
                      <HealthBadge score={a.healthScore} />
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* O que fazer hoje */}
      <motion.div custom={5} variants={fadeUp} initial="hidden" animate="show">
        <SectionHeader
          title="O que fazer hoje"
          subtitle="Ações priorizadas para crescimento e retenção das assessorias"
        />
        <div className="space-y-3">
          {/* Intervenção urgente em contas de risco */}
          {atRiskAccounts.length > 0 && (
            <Card className="border-danger/30 bg-danger/5">
              <CardContent className="flex flex-wrap items-start gap-4 p-4">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-danger/20 text-danger">
                  <Phone className="h-4 w-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-text">
                    Ligar para {atRiskAccounts.length} assessoria{atRiskAccounts.length > 1 ? "s" : ""} em risco de churn
                  </p>
                  <p className="mt-0.5 text-xs text-text-muted">
                    {atRiskAccounts.map((a) => a.name).slice(0, 3).join(", ")}
                    {atRiskAccounts.length > 3 ? ` e mais ${atRiskAccounts.length - 3}` : ""}
                    {" "}— health score abaixo de 55 ou sem atividade há +14 dias.
                    Entrar em contato, entender dificuldades e oferecer suporte ativo.
                  </p>
                  <Link href="/admin/assessorias" className="mt-1.5 inline-flex text-xs font-semibold text-danger hover:underline">
                    Ver assessorias em risco →
                  </Link>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Aprovações pendentes */}
          {pendingApprovals.length > 0 && (
            <Card className="border-warning/30 bg-warning/5">
              <CardContent className="flex flex-wrap items-start gap-4 p-4">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-warning/20 text-warning">
                  <Clock className="h-4 w-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-text">
                    Aprovar {pendingApprovals.length} cadastro{pendingApprovals.length > 1 ? "s" : ""} pendente{pendingApprovals.length > 1 ? "s" : ""}
                  </p>
                  <p className="mt-0.5 text-xs text-text-muted">
                    Novos treinadores aguardando aprovação. Quanto mais rápido ativar, menor a taxa de desistência no onboarding.
                  </p>
                  <Link href="/admin/aprovacoes" className="mt-1.5 inline-flex text-xs font-semibold text-warning hover:underline">
                    Ir para aprovações →
                  </Link>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Ações de crescimento — sempre visíveis */}
          {[
            {
              icon: TrendingUp,
              color: "text-primary bg-primary/20 border-primary/30",
              title: "Publicar conteúdo de captação",
              desc: "Poste um case de sucesso de atleta ou treinador nas redes. Conteúdo real gera +32% de conversão vs. anúncio pago.",
              href: null,
            },
            {
              icon: Users,
              color: "text-success bg-success/20 border-success/30",
              title: "Ligar para 5 leads frios",
              desc: "Treinadores que demonstraram interesse mas não converteram. Ligação direta tem taxa de conversão 3× maior que e-mail.",
              href: "/admin/assessorias",
            },
            {
              icon: DollarSign,
              color: "text-info bg-info/20 border-info/30",
              title: "Verificar inadimplências e cobranças com falha",
              desc: "Cheque o painel financeiro por cobranças pendentes ou recusadas. Cada dia de atraso reduz a chance de recuperação.",
              href: "/admin/financeiro",
            },
            {
              icon: Building2,
              color: "text-text-muted bg-card-hover border-border",
              title: "Atualizar planos e pricing",
              desc: "Revise se os planos refletem o valor entregue. Uma conversa de upsell com clientes Starter pode aumentar o MRR em 40%.",
              href: "/admin/planos",
            },
          ].map((item) => (
            <Card key={item.title} className={`border ${item.color.split(" ")[2]}`}>
              <CardContent className="flex flex-wrap items-start gap-4 p-4">
                <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${item.color.split(" ")[1]} ${item.color.split(" ")[0]}`}>
                  <item.icon className="h-4 w-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-text">{item.title}</p>
                  <p className="mt-0.5 text-xs text-text-muted">{item.desc}</p>
                  {item.href && (
                    <a href={item.href} className="mt-1.5 inline-flex text-xs font-semibold text-primary hover:underline">
                      Acessar →
                    </a>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </motion.div>
    </div>
  );
}
