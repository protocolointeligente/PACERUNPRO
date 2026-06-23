"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useCoachRole } from "@/context/coach-role-context";
import { canAccess } from "@/lib/coach-permissions";
import { AccessRestricted } from "@/components/shared/access-restricted";
import {
  Kanban,
  List,
  Plus,
  X,
  Share2,
  Globe,
  Users,
  Calendar,
  MessageCircle,
  ArrowRight,
  TrendingUp,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { type CrmLead, type LeadStage } from "@/lib/mock-data";
import { cn } from "@/lib/utils";

const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  show: (i: number = 0) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.06, duration: 0.35, ease: "easeOut" as const },
  }),
};

const STAGE_ORDER: LeadStage[] = ["novo", "contato", "proposta", "negociacao", "ganho", "perdido"];

const STAGE_LABELS: Record<LeadStage, string> = {
  novo: "Novo",
  contato: "Contato",
  proposta: "Proposta",
  negociacao: "Negociação",
  ganho: "Ganho",
  perdido: "Perdido",
};

const KANBAN_STAGES: LeadStage[] = ["novo", "contato", "proposta", "ganho"];

const STAGE_COLORS: Record<LeadStage, string> = {
  novo: "bg-slate-600 text-slate-100",
  contato: "bg-blue-700 text-blue-100",
  proposta: "bg-amber-700 text-amber-100",
  negociacao: "bg-orange-700 text-orange-100",
  ganho: "bg-emerald-700 text-emerald-100",
  perdido: "bg-red-900 text-red-200",
};

const AVATAR_COLORS: Record<LeadStage, string> = {
  novo: "bg-slate-700 text-slate-200",
  contato: "bg-blue-800 text-blue-200",
  proposta: "bg-amber-800 text-amber-200",
  negociacao: "bg-orange-800 text-orange-200",
  ganho: "bg-emerald-800 text-emerald-200",
  perdido: "bg-red-900 text-red-300",
};

const SOURCE_CONFIG: Record<CrmLead["source"], { label: string; icon: React.ReactNode; color: string }> = {
  instagram: {
    label: "Instagram",
    icon: <Share2 className="h-3 w-3" />,
    color: "bg-purple-900 text-purple-300",
  },
  indicacao: {
    label: "Indicação",
    icon: <Users className="h-3 w-3" />,
    color: "bg-emerald-900 text-emerald-300",
  },
  site: {
    label: "Site",
    icon: <Globe className="h-3 w-3" />,
    color: "bg-blue-900 text-blue-300",
  },
  evento: {
    label: "Evento",
    icon: <Calendar className="h-3 w-3" />,
    color: "bg-orange-900 text-orange-300",
  },
  whatsapp: {
    label: "WhatsApp",
    icon: <MessageCircle className="h-3 w-3" />,
    color: "bg-teal-900 text-teal-300",
  },
};

function formatDate(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString("pt-BR", { day: "2-digit", month: "short" });
}

interface ApiLead {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  source: string;
  stage: string;
  notes: string | null;
  monthlyFeeCents: number | null;
  createdAt: string;
  updatedAt: string;
}

const VALID_SOURCES = new Set(["instagram", "indicacao", "site", "evento", "whatsapp"]);

function toInitials(name: string) {
  return name.trim().split(/\s+/).slice(0, 2).map((w) => w[0]).join("").toUpperCase();
}

function apiLeadToCrmLead(l: ApiLead): CrmLead {
  return {
    id: l.id,
    name: l.name,
    email: l.email ?? "",
    phone: l.phone ?? "",
    source: VALID_SOURCES.has(l.source) ? (l.source as CrmLead["source"]) : "instagram",
    stage: (STAGE_ORDER as string[]).includes(l.stage) ? (l.stage as LeadStage) : "novo",
    value: l.monthlyFeeCents ? Math.round(l.monthlyFeeCents / 100) : 0,
    notes: l.notes ?? "",
    createdAt: l.createdAt.slice(0, 10),
    lastContact: l.updatedAt.slice(0, 10),
    avatar: toInitials(l.name) || "??",
  };
}

function nextStage(stage: LeadStage): LeadStage {
  const idx = STAGE_ORDER.indexOf(stage);
  if (idx < STAGE_ORDER.length - 1) return STAGE_ORDER[idx + 1];
  return stage;
}

function SourceBadge({ source }: { source: CrmLead["source"] }) {
  const cfg = SOURCE_CONFIG[source];
  return (
    <span className={cn("inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium", cfg.color)}>
      {cfg.icon}
      {cfg.label}
    </span>
  );
}

function LeadCard({ lead, onAdvance, onConvert }: { lead: CrmLead; onAdvance: () => void; onConvert: () => void }) {
  const canAdvance = lead.stage !== "ganho" && lead.stage !== "perdido";
  const isWon = lead.stage === "ganho";
  const isConverted = lead.notes?.includes("[Convertido em atleta]") ?? false;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      className="rounded-xl border border-border bg-card p-3 space-y-2 cursor-default"
    >
      <div className="flex items-start gap-2">
        <span className={cn("flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold", AVATAR_COLORS[lead.stage])}>
          {lead.avatar}
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-text">{lead.name}</p>
          <SourceBadge source={lead.source} />
        </div>
      </div>
      <div className="flex items-center justify-between text-xs text-text-muted">
        <span className="font-medium text-emerald-400">R$ {lead.value}/mês</span>
        <span>{formatDate(lead.lastContact)}</span>
      </div>
      {canAdvance && (
        <button
          onClick={onAdvance}
          className="flex w-full items-center justify-center gap-1 rounded-lg border border-border py-1 text-xs text-text-muted transition-colors hover:border-primary hover:text-primary"
        >
          Mover
          <ArrowRight className="h-3 w-3" />
        </button>
      )}
      {isWon && !isConverted && (
        <button
          onClick={onConvert}
          className="flex w-full items-center justify-center gap-1 rounded-lg border border-emerald-500/40 bg-emerald-500/10 py-1 text-xs font-medium text-emerald-400 transition-colors hover:bg-emerald-500/20"
        >
          <Users className="h-3 w-3" />
          Converter em atleta
        </button>
      )}
      {isWon && isConverted && (
        <span className="flex w-full items-center justify-center gap-1 rounded-lg border border-emerald-600/20 bg-emerald-900/20 py-1 text-xs text-emerald-500">
          Atleta criado
        </span>
      )}
    </motion.div>
  );
}

function NewLeadForm({ onClose, onAdd }: { onClose: () => void; onAdd: (lead: CrmLead) => void }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [source, setSource] = useState<CrmLead["source"]>("instagram");
  const [value, setValue] = useState("290");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const monthlyFeeCents = Math.round((Number(value) || 290) * 100);
      const res = await fetch("/api/coach/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          email: email || null,
          phone: phone || null,
          source,
          stage: "novo",
          notes: notes || null,
          monthlyFeeCents,
        }),
      });
      if (res.ok) {
        const apiLead = (await res.json()) as ApiLead;
        onAdd(apiLeadToCrmLead(apiLead));
        onClose();
      }
    } finally {
      setSaving(false);
    }
  }

  const inputCls = "w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-text placeholder:text-text-muted focus:border-primary focus:outline-none";
  const labelCls = "mb-1 block text-xs font-medium text-text-muted";

  return (
    <motion.div
      initial={{ opacity: 0, x: 32 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 32 }}
      className="rounded-2xl border border-border bg-card p-5 space-y-4"
    >
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-text">Novo lead</h3>
        <button onClick={onClose} className="text-text-muted hover:text-text transition-colors">
          <X className="h-4 w-4" />
        </button>
      </div>
      <form onSubmit={handleSubmit} className="space-y-3">
        <div>
          <label className={labelCls}>Nome *</label>
          <input required value={name} onChange={(e) => setName(e.target.value)} placeholder="Nome completo" className={inputCls} />
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div>
            <label className={labelCls}>E-mail</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="email@exemplo.com" className={inputCls} />
          </div>
          <div>
            <label className={labelCls}>Telefone</label>
            <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="(00) 00000-0000" className={inputCls} />
          </div>
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div>
            <label className={labelCls}>Origem</label>
            <select value={source} onChange={(e) => setSource(e.target.value as CrmLead["source"])} className={inputCls}>
              <option value="instagram">Instagram</option>
              <option value="indicacao">Indicação</option>
              <option value="site">Site</option>
              <option value="evento">Evento</option>
              <option value="whatsapp">WhatsApp</option>
            </select>
          </div>
          <div>
            <label className={labelCls}>Valor R$/mês</label>
            <input type="number" value={value} onChange={(e) => setValue(e.target.value)} min={0} className={inputCls} />
          </div>
        </div>
        <div>
          <label className={labelCls}>Notas</label>
          <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} placeholder="Observações sobre o lead…" className={cn(inputCls, "resize-none")} />
        </div>
        <div className="flex gap-2 pt-1">
          <Button type="button" variant="ghost" className="flex-1" onClick={onClose}>Cancelar</Button>
          <button type="submit" disabled={saving} className="gradient-primary flex-1 rounded-xl px-4 py-2 text-sm font-semibold text-white disabled:opacity-60">
            {saving ? "Salvando…" : "Adicionar"}
          </button>
        </div>
      </form>
    </motion.div>
  );
}

function CrmContent() {
  const [leads, setLeads] = useState<CrmLead[]>([]);
  const [view, setView] = useState<"kanban" | "lista">("kanban");
  const [showForm, setShowForm] = useState(false);
  const [slug, setSlug] = useState<string | null>(null);
  const [quizCopied, setQuizCopied] = useState(false);

  useEffect(() => {
    fetch("/api/coach/profile")
      .then((r) => r.json())
      .then((d: { slug?: string | null }) => { if (d.slug) setSlug(d.slug); })
      .catch(() => null);
  }, []);

  useEffect(() => {
    fetch("/api/coach/leads")
      .then((r) => (r.ok ? r.json() : []))
      .then((data: ApiLead[]) => { setLeads(data.map(apiLeadToCrmLead)); })
      .catch(() => null);
  }, []);

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://www.pacerunpro.com.br";
  const quizUrl = slug ? `${appUrl}/quiz/${slug}` : null;

  function copyQuizUrl() {
    if (!quizUrl) return;
    void navigator.clipboard.writeText(quizUrl).then(() => {
      setQuizCopied(true);
      setTimeout(() => setQuizCopied(false), 2000);
    });
  }

  function advanceLead(id: string) {
    const lead = leads.find((l) => l.id === id);
    if (!lead) return;
    const newStage = nextStage(lead.stage);
    setLeads((prev) => prev.map((l) => l.id === id ? { ...l, stage: newStage } : l));
    void fetch("/api/coach/leads", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, stage: newStage }),
    }).catch(() => null);
  }

  async function convertLead(id: string) {
    const res = await fetch("/api/coach/leads/convert", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ leadId: id }),
    }).catch(() => null);
    if (res?.ok) {
      setLeads((prev) =>
        prev.map((l) =>
          l.id === id
            ? { ...l, stage: "ganho" as LeadStage, notes: (l.notes ? l.notes + "\n" : "") + "[Convertido em atleta]" }
            : l
        )
      );
    } else {
      const body = await res?.json().catch(() => ({})) as { error?: string };
      alert(body?.error ?? "Erro ao converter lead em atleta.");
    }
  }

  function updateLeadStage(id: string, stage: LeadStage) {
    setLeads((prev) => prev.map((l) => l.id === id ? { ...l, stage } : l));
    void fetch("/api/coach/leads", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, stage }),
    }).catch(() => null);
  }

  function addLead(lead: CrmLead) {
    setLeads((prev) => [lead, ...prev]);
  }

  const activeLeads = leads.filter((l) => l.stage !== "perdido");
  const wonLeads = leads.filter((l) => l.stage === "ganho");
  const conversionRate = leads.length > 0 ? Math.round((wonLeads.length / leads.length) * 100) : 0;
  const potentialRevenue = activeLeads.reduce((sum, l) => sum + l.value, 0);

  const oneWeekAgo = new Date();
  oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
  const newThisWeek = leads.filter((l) => new Date(l.createdAt) >= oneWeekAgo).length;

  const listLeads = leads.filter((l) => l.stage !== "perdido");

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <motion.div variants={fadeUp} initial="hidden" animate="show" className="flex flex-wrap items-start justify-between gap-4">
        <div className="space-y-1">
          <Badge variant="primary" className="mb-2">
            <Kanban className="h-3 w-3" />
            CRM de Leads
          </Badge>
          <h1 className="font-display text-2xl font-bold text-text sm:text-3xl">CRM de Leads</h1>
          <p className="text-sm text-text-muted">Gerencie o pipeline de novos atletas da sua assessoria.</p>
        </div>
        <button
          onClick={() => setShowForm((v) => !v)}
          className="gradient-primary inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold text-white"
        >
          <Plus className="h-4 w-4" />
          Novo lead
        </button>
      </motion.div>

      <AnimatePresence>
        {showForm && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <NewLeadForm onClose={() => setShowForm(false)} onAdd={addLead} />
          </motion.div>
        )}
      </AnimatePresence>

      <motion.div custom={1} variants={fadeUp} initial="hidden" animate="show" className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { label: "Total de leads", value: String(leads.length), color: "text-primary", icon: <Users className="h-4 w-4" /> },
          { label: "Taxa de conversão", value: `${conversionRate}%`, color: "text-emerald-400", icon: <TrendingUp className="h-4 w-4" /> },
          { label: "Receita potencial", value: `R$ ${potentialRevenue.toLocaleString("pt-BR")}`, color: "text-amber-400", icon: <TrendingUp className="h-4 w-4" /> },
          { label: "Leads esta semana", value: String(newThisWeek), color: "text-blue-400", icon: <Calendar className="h-4 w-4" /> },
        ].map((s) => (
          <Card key={s.label}>
            <CardContent className="p-4">
              <div className={cn("mb-1 flex items-center gap-1.5 text-xs font-medium", s.color)}>
                {s.icon}
                {s.label}
              </div>
              <p className="text-xl font-bold text-text">{s.value}</p>
            </CardContent>
          </Card>
        ))}
      </motion.div>

      {/* Isca digital / Quiz */}
      <motion.div custom={2} variants={fadeUp} initial="hidden" animate="show">
        <Card className="border-primary/20">
          <CardContent className="p-4 space-y-3">
            <div className="flex items-start gap-3">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/15 text-primary">
                <Share2 className="h-4 w-4" />
              </span>
              <div>
                <p className="text-sm font-semibold text-text">Isca digital para Instagram</p>
                <p className="text-xs text-text-muted">Compartilhe o link abaixo. Quem preencher o formulário entra automaticamente no seu CRM como lead.</p>
              </div>
            </div>
            {quizUrl ? (
              <div className="flex gap-2">
                <input readOnly value={quizUrl} className="min-w-0 flex-1 rounded-xl border border-border bg-card-hover px-3 py-2 text-sm font-mono text-primary focus:outline-none" />
                <Button size="sm" variant="secondary" onClick={copyQuizUrl} className="shrink-0 gap-1.5">
                  {quizCopied ? "Copiado!" : "Copiar"}
                </Button>
              </div>
            ) : (
              <p className="rounded-xl border border-border bg-card-hover/40 px-3 py-2 text-xs text-text-muted">
                Configure um slug em <a href="/treinador/minha-pagina" className="text-primary hover:underline">Minha página pública</a> para ativar seu link de isca.
              </p>
            )}
          </CardContent>
        </Card>
      </motion.div>

      <motion.div custom={3} variants={fadeUp} initial="hidden" animate="show" className="flex items-center gap-2">
        <button
          onClick={() => setView("kanban")}
          className={cn("inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-sm font-medium transition-colors", view === "kanban" ? "border-primary bg-primary/10 text-primary" : "border-border text-text-muted hover:text-primary")}
        >
          <Kanban className="h-4 w-4" />
          Kanban
        </button>
        <button
          onClick={() => setView("lista")}
          className={cn("inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-sm font-medium transition-colors", view === "lista" ? "border-primary bg-primary/10 text-primary" : "border-border text-text-muted hover:text-primary")}
        >
          <List className="h-4 w-4" />
          Lista
        </button>
      </motion.div>

      <AnimatePresence mode="wait">
        {view === "kanban" ? (
          <motion.div
            key="kanban"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex gap-4 overflow-x-auto pb-4 sm:grid sm:grid-cols-2 lg:grid-cols-4"
          >
            {KANBAN_STAGES.map((stage) => {
              const stageLeads = leads.filter((l) => l.stage === stage);
              return (
                <div key={stage} className="min-w-[260px] flex-shrink-0 space-y-3 rounded-2xl border border-border bg-card/50 p-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold text-text">{STAGE_LABELS[stage]}</span>
                    <span className={cn("rounded-full px-2 py-0.5 text-xs font-bold", STAGE_COLORS[stage])}>
                      {stageLeads.length}
                    </span>
                  </div>
                  <div className="space-y-2">
                    <AnimatePresence>
                      {stageLeads.map((lead) => (
                        <LeadCard key={lead.id} lead={lead} onAdvance={() => advanceLead(lead.id)} onConvert={() => convertLead(lead.id)} />
                      ))}
                    </AnimatePresence>
                    {stageLeads.length === 0 && (
                      <p className="py-4 text-center text-xs text-text-muted">Nenhum lead aqui</p>
                    )}
                  </div>
                </div>
              );
            })}
          </motion.div>
        ) : (
          <motion.div
            key="lista"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <Card>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-border">
                        {["Nome", "Origem", "Estágio", "Valor", "Último contato", "Notas", ""].map((h) => (
                          <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-text-muted">
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      <AnimatePresence>
                        {listLeads.map((lead, i) => (
                          <motion.tr
                            key={lead.id}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ delay: i * 0.03 }}
                            className="border-b border-border/50 last:border-0 hover:bg-white/5"
                          >
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-2">
                                <span className={cn("flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold", AVATAR_COLORS[lead.stage])}>
                                  {lead.avatar}
                                </span>
                                <div>
                                  <p className="text-sm font-medium text-text">{lead.name}</p>
                                  <p className="text-xs text-text-muted">{lead.email}</p>
                                </div>
                              </div>
                            </td>
                            <td className="px-4 py-3">
                              <SourceBadge source={lead.source} />
                            </td>
                            <td className="px-4 py-3">
                              <select
                                value={lead.stage}
                                onChange={(e) => updateLeadStage(lead.id, e.target.value as LeadStage)}
                                className="rounded-lg border border-border bg-background px-2 py-1 text-xs text-text focus:border-primary focus:outline-none"
                              >
                                {STAGE_ORDER.map((s) => (
                                  <option key={s} value={s}>{STAGE_LABELS[s]}</option>
                                ))}
                              </select>
                            </td>
                            <td className="px-4 py-3 text-sm font-medium text-emerald-400">
                              R$ {lead.value}/mês
                            </td>
                            <td className="px-4 py-3 text-sm text-text-muted">{formatDate(lead.lastContact)}</td>
                            <td className="max-w-[200px] px-4 py-3 text-xs text-text-muted">
                              <span className="line-clamp-2">{lead.notes}</span>
                            </td>
                            <td className="px-4 py-3">
                              {lead.stage === "ganho" && !lead.notes?.includes("[Convertido em atleta]") && (
                                <button
                                  onClick={() => convertLead(lead.id)}
                                  className="inline-flex items-center gap-1 rounded-lg border border-emerald-500/40 bg-emerald-500/10 px-2 py-1 text-xs font-medium text-emerald-400 hover:bg-emerald-500/20 transition-colors whitespace-nowrap"
                                >
                                  <Users className="h-3 w-3" />
                                  Converter
                                </button>
                              )}
                              {lead.notes?.includes("[Convertido em atleta]") && (
                                <span className="text-xs text-emerald-500">Atleta criado</span>
                              )}
                            </td>
                          </motion.tr>
                        ))}
                      </AnimatePresence>
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function CrmPage() {
  const { role } = useCoachRole();
  if (!canAccess(role, "crm")) {
    return <AccessRestricted feature="CRM de Leads" currentRole={role} requiredRoles={["autonomo", "owner"]} />;
  }
  return <CrmContent />;
}
