"use client";

import { useEffect, useState } from "react";
import QRCode from "react-qr-code";
import { Copy, Download, Link2, Users, TrendingUp, AlertTriangle, UserPlus, Plus, Trash2, Receipt } from "lucide-react";
import { useCoachRole } from "@/context/coach-role-context";
import { canAccess } from "@/lib/coach-permissions";
import { AccessRestricted } from "@/components/shared/access-restricted";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Link from "next/link";
import { cn } from "@/lib/utils";

interface RosterStats {
  usedSlots: number;
  totalSlots: number;
  planName: string;
  newAthletes30d: number;
  inactiveCount: number;
  recentAthletes: { name: string; status: string; joinedAt: string }[];
}

interface ExpenseRow {
  id: string;
  description: string;
  amountCents: number;
  category: string;
  supplier?: string | null;
  date: string;
  recurring: boolean;
}

const EXPENSE_CATEGORIES: Record<string, string> = {
  software: "Software",
  marketing: "Marketing",
  pessoal: "Pessoal",
  equipamento: "Equipamento",
  fornecedor: "Fornecedor",
  outros: "Outros",
};

const CATEGORY_COLORS: Record<string, string> = {
  software: "bg-blue-700/60 text-blue-200",
  marketing: "bg-purple-700/60 text-purple-200",
  pessoal: "bg-amber-700/60 text-amber-200",
  equipamento: "bg-cyan-700/60 text-cyan-200",
  fornecedor: "bg-orange-700/60 text-orange-200",
  outros: "bg-slate-700/60 text-slate-200",
};

const inputClass =
  "w-full rounded-xl border border-border bg-background px-3 py-2 text-sm text-text placeholder:text-text-muted/50 outline-none focus:border-primary/60 transition-colors";

function GestaoContent() {
  const [inviteEnabled, setInviteEnabled] = useState(true);
  const [copied, setCopied] = useState(false);
  const [slug, setSlug] = useState<string | null>(null);
  const [rosterStats, setRosterStats] = useState<RosterStats>({
    usedSlots: 0, totalSlots: 30, planName: "Treinador", newAthletes30d: 0, inactiveCount: 0, recentAthletes: [],
  });
  const [loadingRoster, setLoadingRoster] = useState(true);

  const [expenses, setExpenses] = useState<ExpenseRow[]>([]);
  const [loadingExpenses, setLoadingExpenses] = useState(true);
  const [showExpenseForm, setShowExpenseForm] = useState(false);
  const [expDesc, setExpDesc] = useState("");
  const [expAmount, setExpAmount] = useState("");
  const [expCategory, setExpCategory] = useState("outros");
  const [expSupplier, setExpSupplier] = useState("");
  const [expDate, setExpDate] = useState(new Date().toISOString().slice(0, 10));
  const [expRecurring, setExpRecurring] = useState(false);
  const [savingExpense, setSavingExpense] = useState(false);

  const inviteUrl = slug
    ? `https://pacerunpro.com.br/convite/${slug}`
    : "Configure seu slug na página pública para gerar o link";

  useEffect(() => {
    fetch("/api/coach/profile")
      .then((r) => r.json())
      .then((d: { slug?: string | null }) => { if (d.slug) setSlug(d.slug); })
      .catch(() => null);
  }, []);

  useEffect(() => {
    fetch("/api/coach/gestao/stats")
      .then((r) => r.ok ? r.json() : null)
      .then((d: RosterStats | null) => { if (d) setRosterStats(d); })
      .catch(() => null)
      .finally(() => setLoadingRoster(false));
  }, []);

  useEffect(() => {
    fetch("/api/coach/expenses")
      .then((r) => r.json())
      .then((d: ExpenseRow[]) => setExpenses(Array.isArray(d) ? d : []))
      .catch(() => [])
      .finally(() => setLoadingExpenses(false));
  }, []);

  async function addExpense() {
    if (!expDesc || !expAmount) return;
    setSavingExpense(true);
    try {
      const res = await fetch("/api/coach/expenses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          description: expDesc,
          amountCents: Math.round(parseFloat(expAmount.replace(",", ".")) * 100),
          category: expCategory,
          supplier: expSupplier || undefined,
          date: expDate,
          recurring: expRecurring,
        }),
      });
      if (res.ok) {
        const created = await res.json() as ExpenseRow;
        setExpenses((prev) => [created, ...prev]);
        setExpDesc(""); setExpAmount(""); setExpCategory("outros"); setExpSupplier(""); setExpRecurring(false);
        setShowExpenseForm(false);
      }
    } finally {
      setSavingExpense(false);
    }
  }

  async function deleteExpense(id: string) {
    await fetch(`/api/coach/expenses/${id}`, { method: "DELETE" });
    setExpenses((prev) => prev.filter((e) => e.id !== id));
  }

  function handleCopy() {
    if (!slug) return;
    void navigator.clipboard.writeText(inviteUrl).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  const slotPct = (rosterStats.usedSlots / rosterStats.totalSlots) * 100;
  const totalExpensesMonth = expenses.reduce((acc, e) => acc + e.amountCents, 0);

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="space-y-1">
          <Badge variant="primary">Gestão &amp; Vendas</Badge>
          <h1 className="font-display text-2xl font-bold text-text sm:text-3xl">
            Gestão financeira do roster
          </h1>
        </div>
      </div>

      <Tabs defaultValue="roster">
        <TabsList>
          <TabsTrigger value="roster">Roster</TabsTrigger>
          <TabsTrigger value="financeiro">Receitas</TabsTrigger>
          <TabsTrigger value="despesas">Despesas</TabsTrigger>
          <TabsTrigger value="convite">Link de convite</TabsTrigger>
        </TabsList>

        {/* ── Tab 1: Roster ─────────────────────────────────────────────── */}
        <TabsContent value="roster">
          <div className="space-y-4">
            {/* Stats row */}
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <StatCard
                icon={<Users className="h-4 w-4" />}
                label="Slots usados"
                value={loadingRoster ? "…" : `${rosterStats.usedSlots}/${rosterStats.totalSlots}`}
                color="text-info"
                bgColor="bg-info/15"
              />
              <StatCard
                icon={<UserPlus className="h-4 w-4" />}
                label="Novos 30d"
                value={loadingRoster ? "…" : `+${rosterStats.newAthletes30d}`}
                color="text-primary"
                bgColor="bg-primary/15"
              />
              <StatCard
                icon={<AlertTriangle className="h-4 w-4" />}
                label="Inativos"
                value={loadingRoster ? "…" : String(rosterStats.inactiveCount)}
                color="text-warning"
                bgColor="bg-warning/15"
              />
              <StatCard
                icon={<TrendingUp className="h-4 w-4" />}
                label="Plano"
                value={loadingRoster ? "…" : rosterStats.planName}
                color="text-success"
                bgColor="bg-success/15"
              />
            </div>

            {/* Slot progress */}
            <Card>
              <CardContent className="p-4 space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-text-muted">
                    Capacidade do plano <span className="font-semibold text-text">{rosterStats.planName}</span>
                  </span>
                  <span className="font-display font-bold text-text">
                    {rosterStats.usedSlots} / {rosterStats.totalSlots} atletas
                  </span>
                </div>
                <Progress value={slotPct} />
                <p className="text-xs text-text-muted">
                  {rosterStats.totalSlots - rosterStats.usedSlots} slots disponíveis
                </p>
              </CardContent>
            </Card>

            {/* Athlete list */}
            <div className="space-y-2">
              {loadingRoster ? (
                <p className="py-6 text-center text-sm text-text-muted">Carregando atletas…</p>
              ) : rosterStats.recentAthletes.length === 0 ? (
                <p className="py-6 text-center text-sm text-text-muted">
                  Nenhum atleta ainda. Compartilhe seu link de convite para adicionar atletas.
                </p>
              ) : (
                rosterStats.recentAthletes.map((athlete, i) => (
                  <Card key={i}>
                    <CardContent className="flex items-center gap-3 p-3 sm:p-4">
                      <div className="min-w-0 flex-1 space-y-0.5">
                        <p className="truncate font-display text-sm font-semibold text-text">
                          {athlete.name}
                        </p>
                        <Badge
                          variant={
                            athlete.status === "ativo"
                              ? "success"
                              : athlete.status === "risco"
                              ? "danger"
                              : "default"
                          }
                          className="text-[10px]"
                        >
                          {athlete.status}
                        </Badge>
                      </div>
                      <div className="hidden text-right lg:block">
                        <p className="text-xs text-text-muted">
                          Desde {new Date(athlete.joinedAt).toLocaleDateString("pt-BR")}
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
              {rosterStats.usedSlots > 10 && (
                <p className="text-center text-xs text-text-muted pt-1">
                  Mostrando 10 de {rosterStats.usedSlots} atletas.{" "}
                  <Link href="/treinador/atletas" className="text-primary hover:underline">Ver todos</Link>
                </p>
              )}
            </div>
          </div>
        </TabsContent>

        {/* ── Tab 2: Receitas ───────────────────────────────────────────── */}
        <TabsContent value="financeiro">
          <Card>
            <CardContent className="flex flex-col items-center gap-5 py-12 text-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                <TrendingUp className="h-7 w-7" />
              </div>
              <div>
                <p className="font-display text-lg font-bold text-text">Receitas da loja</p>
                <p className="mt-1.5 max-w-xs text-sm text-text-muted">
                  Acompanhe suas vendas de planilhas, receita total, histórico de transações e
                  ranking por produto no painel de receitas dedicado.
                </p>
              </div>
              <Link href="/treinador/receitas">
                <Button variant="primary" className="gap-2">
                  <TrendingUp className="h-4 w-4" /> Ver painel de receitas
                </Button>
              </Link>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Tab 3: Despesas ───────────────────────────────────────────── */}
        <TabsContent value="despesas">
          <div className="space-y-4">
            {/* Summary */}
            <div className="grid gap-3 sm:grid-cols-3">
              <StatCard icon={<Receipt className="h-4 w-4" />} label="Despesas cadastradas" value={`R$ ${(totalExpensesMonth / 100).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`} color="text-danger" bgColor="bg-danger/15" />
              <StatCard icon={<Users className="h-4 w-4" />} label="Atletas ativos" value={String(rosterStats.usedSlots - rosterStats.inactiveCount)} color="text-success" bgColor="bg-success/15" />
              <StatCard icon={<TrendingUp className="h-4 w-4" />} label="Receitas da loja" value="Ver →" color="text-primary" bgColor="bg-primary/15" />
            </div>

            {/* Add expense */}
            <Card>
              <CardContent className="p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="font-display text-sm font-semibold text-text">Despesas e fornecedores</h3>
                  <Button size="sm" variant="primary" onClick={() => setShowExpenseForm((v) => !v)}>
                    <Plus className="h-3.5 w-3.5" /> Nova despesa
                  </Button>
                </div>

                {showExpenseForm && (
                  <div className="rounded-xl border border-border bg-card-hover/30 p-4 space-y-3">
                    <div className="grid gap-3 sm:grid-cols-2">
                      <div>
                        <label className="mb-1 block text-xs font-semibold text-text-muted">Descrição *</label>
                        <input className={inputClass} value={expDesc} onChange={(e) => setExpDesc(e.target.value)} placeholder="Ex.: Assinatura Notion" />
                      </div>
                      <div>
                        <label className="mb-1 block text-xs font-semibold text-text-muted">Valor (R$) *</label>
                        <input className={inputClass} value={expAmount} onChange={(e) => setExpAmount(e.target.value)} placeholder="0,00" />
                      </div>
                      <div>
                        <label className="mb-1 block text-xs font-semibold text-text-muted">Categoria</label>
                        <select className={inputClass} value={expCategory} onChange={(e) => setExpCategory(e.target.value)}>
                          {Object.entries(EXPENSE_CATEGORIES).map(([k, v]) => (
                            <option key={k} value={k}>{v}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="mb-1 block text-xs font-semibold text-text-muted">Fornecedor</label>
                        <input className={inputClass} value={expSupplier} onChange={(e) => setExpSupplier(e.target.value)} placeholder="Nome da empresa (opcional)" />
                      </div>
                      <div>
                        <label className="mb-1 block text-xs font-semibold text-text-muted">Data</label>
                        <input type="date" className={inputClass} value={expDate} onChange={(e) => setExpDate(e.target.value)} />
                      </div>
                      <div className="flex items-center gap-2 pt-5">
                        <input type="checkbox" id="recurring" checked={expRecurring} onChange={(e) => setExpRecurring(e.target.checked)} className="h-4 w-4 accent-primary" />
                        <label htmlFor="recurring" className="text-sm text-text-muted">Recorrente (mensal)</label>
                      </div>
                    </div>
                    <div className="flex gap-2 justify-end">
                      <Button size="sm" variant="ghost" onClick={() => setShowExpenseForm(false)}>Cancelar</Button>
                      <Button size="sm" variant="primary" onClick={addExpense} disabled={savingExpense || !expDesc || !expAmount}>
                        {savingExpense ? "Salvando…" : "Salvar"}
                      </Button>
                    </div>
                  </div>
                )}

                {loadingExpenses ? (
                  <p className="text-center text-sm text-text-muted py-4">Carregando…</p>
                ) : expenses.length === 0 ? (
                  <p className="text-center text-sm text-text-muted py-6">Nenhuma despesa cadastrada. Comece adicionando seus custos fixos e variáveis.</p>
                ) : (
                  <div className="space-y-2">
                    {expenses.map((e) => (
                      <div key={e.id} className="flex items-center gap-3 rounded-xl border border-border bg-card-hover/30 px-3 py-2.5">
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-semibold text-text">{e.description}</p>
                          <div className="flex items-center gap-2 mt-0.5">
                            {e.supplier && <p className="text-xs text-text-muted">{e.supplier}</p>}
                            <span className={cn("inline-flex rounded-full px-2 py-0.5 text-[10px] font-semibold", CATEGORY_COLORS[e.category] ?? CATEGORY_COLORS.outros)}>
                              {EXPENSE_CATEGORIES[e.category] ?? e.category}
                            </span>
                            {e.recurring && <span className="text-[10px] text-primary font-semibold">↻ Recorrente</span>}
                          </div>
                        </div>
                        <p className="text-sm font-semibold text-danger shrink-0">
                          R$ {(e.amountCents / 100).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                        </p>
                        <p className="hidden text-xs text-text-muted sm:block shrink-0">
                          {new Date(e.date).toLocaleDateString("pt-BR")}
                        </p>
                        <button onClick={() => deleteExpense(e.id)} className="shrink-0 rounded-lg p-1.5 text-text-muted hover:bg-danger/10 hover:text-danger transition-colors">
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* ── Tab 4: Link de convite ─────────────────────────────────────── */}
        <TabsContent value="convite">
          <div className="space-y-4">
            {/* Explanation card */}
            <Card>
              <CardContent className="p-5 space-y-4">
                <div className="flex items-start gap-3">
                  <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/15 text-primary">
                    <Link2 className="h-4 w-4" />
                  </span>
                  <div>
                    <h3 className="font-display text-sm font-semibold text-text">
                      Link de convite personalizado
                    </h3>
                    <p className="mt-1 text-sm text-text-muted">
                      Compartilhe o link abaixo para que novos atletas se cadastrem diretamente
                      vinculados à sua conta.
                    </p>
                  </div>
                </div>

                {/* URL input + copy */}
                <div className="flex gap-2">
                  <input
                    readOnly
                    value={inviteUrl}
                    className="min-w-0 flex-1 rounded-xl border border-border bg-card-hover px-3 py-2 text-sm text-text-muted focus:outline-none"
                  />
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={handleCopy}
                    className="shrink-0"
                  >
                    <Copy className="h-3.5 w-3.5" />
                    {copied ? "Copiado!" : "Copiar"}
                  </Button>
                </div>

                {/* Toggle */}
                <div className="flex items-center justify-between rounded-xl border border-border bg-card-hover/30 px-4 py-3">
                  <span className="text-sm text-text">Aceitar novos cadastros via link</span>
                  <button
                    type="button"
                    onClick={() => setInviteEnabled((v) => !v)}
                    className={cn(
                      "relative h-6 w-11 rounded-full transition-colors",
                      inviteEnabled ? "bg-primary" : "bg-card-hover",
                    )}
                  >
                    <span
                      className={cn(
                        "absolute top-0.5 h-5 w-5 rounded-full bg-white transition-transform",
                        inviteEnabled ? "translate-x-5" : "translate-x-0.5",
                      )}
                    />
                  </button>
                </div>
              </CardContent>
            </Card>

            {/* Stats */}
            <div className="grid gap-3 sm:grid-cols-2">
              <Card>
                <CardContent className="p-4 text-center">
                  <p className="font-display text-2xl font-bold text-text">1</p>
                  <p className="text-xs text-text-muted">atleta cadastrou-se via link</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4 text-center">
                  <p className="font-display text-2xl font-bold text-success">100%</p>
                  <p className="text-xs text-text-muted">taxa de conversão</p>
                </CardContent>
              </Card>
            </div>

            {/* QR Code */}
            <Card>
              <CardContent className="flex flex-col items-center gap-4 p-6">
                <h3 className="font-display text-sm font-semibold text-text">QR Code do link de convite</h3>
                <div className="rounded-xl border border-border bg-white p-3">
                  <QRCode value={inviteUrl} size={160} />
                </div>
                <p className="text-center text-xs text-text-muted">
                  Imprima ou compartilhe para novos atletas se cadastrarem diretamente na sua conta
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-1.5 text-xs"
                  onClick={() => {
                    const svg = document.querySelector("#invite-qr svg") as SVGElement | null;
                    if (!svg) return;
                    const blob = new Blob([svg.outerHTML], { type: "image/svg+xml" });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement("a");
                    a.href = url;
                    a.download = "qrcode-convite.svg";
                    a.click();
                    URL.revokeObjectURL(url);
                  }}
                >
                  <Download className="h-3.5 w-3.5" /> Baixar SVG
                </Button>
                <div id="invite-qr" className="sr-only" aria-hidden>
                  <QRCode value={inviteUrl} size={400} />
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

interface StatCardProps {
  icon: React.ReactNode;
  label: string;
  value: string;
  color: string;
  bgColor: string;
}

function StatCard({ icon, label, value, color, bgColor }: StatCardProps) {
  return (
    <Card>
      <CardContent className="flex items-center gap-3 p-4">
        <span className={cn("flex h-9 w-9 shrink-0 items-center justify-center rounded-lg", bgColor, color)}>
          {icon}
        </span>
        <div className="min-w-0">
          <p className="text-[11px] uppercase tracking-wider text-text-muted">{label}</p>
          <p className="font-display text-base font-bold text-text">{value}</p>
        </div>
      </CardContent>
    </Card>
  );
}

export default function GestaoPage() {
  const { role } = useCoachRole();
  if (!canAccess(role, "gestao")) {
    return <AccessRestricted feature="Gestão & Vendas" currentRole={role} requiredRoles={["autonomo", "owner"]} />;
  }
  return <GestaoContent />;
}
