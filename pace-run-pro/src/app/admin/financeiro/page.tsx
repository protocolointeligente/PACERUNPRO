"use client";

import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  DollarSign,
  Loader2,
  Plus,
  TrendingDown,
  TrendingUp,
  Users,
  X,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { StatCard } from "@/components/dashboard/stat-card";
import { SectionHeader } from "@/components/shared/section-header";
import { formatBRL } from "@/lib/utils";

const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  show: (i: number = 0) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.06, duration: 0.4, ease: "easeOut" as const },
  }),
};

// B2B plan monthly prices (reais)
const B2B_PRICES: Record<string, number> = {
  "b2b-starter": 99,
  "b2b-pro": 199,
  "b2b-assessoria": 349,
  "b2b-unlimited": 699,
};
const planPrice = (id: string) => B2B_PRICES[id] ?? 0;

const b2bBadgeVariant = (name: string) => {
  if (name === "White Label") return "danger" as const;
  if (name === "Assessoria") return "warning" as const;
  if (name === "Pro") return "primary" as const;
  return "outline" as const;
};

const EXPENSE_CATEGORIES = [
  { value: "software", label: "Software / SaaS" },
  { value: "marketing", label: "Marketing" },
  { value: "pessoal", label: "Pessoal / RH" },
  { value: "equipamento", label: "Equipamento" },
  { value: "fornecedor", label: "Fornecedor" },
  { value: "infraestrutura", label: "Infraestrutura" },
  { value: "outros", label: "Outros" },
];

interface AssessoriaItem {
  id: string; plan: string; mrr: number; status: string;
}

interface Expense {
  id: string;
  description: string;
  category: string;
  amountCents: number;
  date: string;
  supplier?: string;
  recurring: boolean;
}

const STORAGE_KEY = "pace_admin_expenses_v1";

function loadExpenses(): Expense[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as Expense[]) : [];
  } catch { return []; }
}
function saveExpenses(list: Expense[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
}

const inputClass =
  "w-full rounded-xl border border-border bg-background px-3.5 py-2.5 text-sm text-text placeholder:text-text-muted/50 outline-none focus:border-primary/60 focus:ring-2 focus:ring-primary/20 transition-colors";

export default function FinanceiroPage() {
  const [assessoriaList, setAssessoriaList] = useState<AssessoriaItem[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [showExpenseForm, setShowExpenseForm] = useState(false);
  const [saving, setSaving] = useState(false);

  // Expense form state
  const [desc, setDesc] = useState("");
  const [category, setCategory] = useState("software");
  const [amount, setAmount] = useState("");
  const [supplier, setSupplier] = useState("");
  const [recurring, setRecurring] = useState(false);
  const [expDate, setExpDate] = useState(new Date().toISOString().slice(0, 10));

  useEffect(() => {
    setExpenses(loadExpenses());
    fetch("/api/admin/coaches")
      .then((r) => r.ok ? r.json() : [])
      .then((data: AssessoriaItem[]) => setAssessoriaList(data))
      .catch(() => null);
  }, []);

  const activeList = assessoriaList.filter((a) => a.status === "ativo");
  const b2bMrr = activeList.reduce((s, a) => s + a.mrr, 0);

  const b2bBreakdown = [
    { name: "Starter", planId: "b2b-starter" },
    { name: "Pro", planId: "b2b-pro" },
    { name: "Assessoria", planId: "b2b-assessoria" },
    { name: "White Label", planId: "b2b-unlimited" },
  ].map((row) => {
    const count = activeList.filter((a) => a.plan === row.name.toLowerCase()).length;
    const price = planPrice(row.planId);
    return { ...row, count, price, mrr: count * price };
  });

  const totalExpensesCents = useMemo(
    () => expenses.reduce((s, e) => s + e.amountCents, 0),
    [expenses],
  );
  const monthlyExpenses = expenses.filter((e) => e.recurring).reduce((s, e) => s + e.amountCents, 0) / 100;
  const netMrr = b2bMrr - monthlyExpenses;

  async function handleSaveExpense(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    const cents = Math.round(parseFloat(amount.replace(",", ".")) * 100);
    if (!cents || isNaN(cents)) { setSaving(false); return; }
    const newExp: Expense = {
      id: Date.now().toString(),
      description: desc,
      category,
      amountCents: cents,
      date: expDate,
      supplier: supplier || undefined,
      recurring,
    };
    const updated = [newExp, ...expenses];
    setExpenses(updated);
    saveExpenses(updated);
    setDesc(""); setAmount(""); setSupplier(""); setRecurring(false);
    setShowExpenseForm(false);
    setSaving(false);
  }

  function removeExpense(id: string) {
    const updated = expenses.filter((e) => e.id !== id);
    setExpenses(updated);
    saveExpenses(updated);
  }

  return (
    <div className="mx-auto max-w-6xl space-y-8">
      <motion.div variants={fadeUp} initial="hidden" animate="show" className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <Badge variant="success" className="mb-2">Financeiro</Badge>
          <h1 className="font-display text-2xl font-bold text-text sm:text-3xl">Receita e faturamento</h1>
        </div>
      </motion.div>

      {/* KPI Cards */}
      <motion.div custom={1} variants={fadeUp} initial="hidden" animate="show" className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard label="MRR B2B" value={`R$${b2bMrr.toLocaleString("pt-BR")}`} icon={TrendingUp} accent="primary" />
        <StatCard label="Despesas fixas/mês" value={`R$${monthlyExpenses.toLocaleString("pt-BR")}`} icon={TrendingDown} accent="danger" />
        <StatCard label="Resultado líquido" value={`R$${netMrr.toLocaleString("pt-BR")}`} icon={DollarSign} accent={netMrr >= 0 ? "success" : "danger"} />
        <StatCard label="Assessorias ativas" value={`${activeList.length}`} icon={Users} accent="info" />
      </motion.div>

      <motion.div custom={2} variants={fadeUp} initial="hidden" animate="show" className="grid gap-5 lg:grid-cols-2">
        {/* B2B by Plan */}
        <div className="space-y-3">
          <SectionHeader title="Distribuição B2B por plano" />
          <Card>
            <CardContent className="p-5">
              <div className="space-y-3">
                <div className="grid grid-cols-3 gap-2 border-b border-border pb-2">
                  <span className="text-xs font-semibold uppercase tracking-wider text-text-muted">Plano</span>
                  <span className="text-xs font-semibold uppercase tracking-wider text-text-muted text-center">Qtd</span>
                  <span className="text-xs font-semibold uppercase tracking-wider text-text-muted text-right">MRR</span>
                </div>
                {b2bBreakdown.map((row) => (
                  <div key={row.name} className="grid grid-cols-3 items-center gap-2 py-1">
                    <Badge variant={b2bBadgeVariant(row.name)} className="w-fit">{row.name}</Badge>
                    <p className="text-center text-sm text-text-muted">{row.count}×R${formatBRL(row.price)}</p>
                    <p className="text-right text-sm font-semibold text-text">R${formatBRL(row.mrr)}</p>
                  </div>
                ))}
                <div className="grid grid-cols-3 items-center gap-2 border-t border-border pt-2">
                  <span className="text-sm font-bold text-text">Total</span>
                  <p className="text-center text-sm font-bold text-text">{b2bBreakdown.reduce((acc, r) => acc + r.count, 0)}</p>
                  <p className="text-right text-sm font-bold text-primary">R${formatBRL(b2bMrr)}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Revenue vs expenses bar */}
          <Card>
            <CardContent className="p-5 space-y-4">
              <p className="text-sm font-semibold text-text">Receita vs. despesas</p>
              <div>
                <div className="flex justify-between text-xs text-text-muted mb-1">
                  <span>MRR B2B</span>
                  <span>R${b2bMrr.toLocaleString("pt-BR")}</span>
                </div>
                <Progress value={100} colorClassName="bg-primary" />
              </div>
              <div>
                <div className="flex justify-between text-xs text-text-muted mb-1">
                  <span>Despesas recorrentes</span>
                  <span>R${monthlyExpenses.toLocaleString("pt-BR")}</span>
                </div>
                <Progress
                  value={b2bMrr > 0 ? Math.min(100, (monthlyExpenses / b2bMrr) * 100) : 0}
                  colorClassName="bg-danger"
                />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Expenses */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <SectionHeader title="Despesas cadastradas" />
            <Button size="sm" onClick={() => setShowExpenseForm(true)} className="gap-1.5">
              <Plus className="h-3.5 w-3.5" /> Nova despesa
            </Button>
          </div>

          {showExpenseForm && (
            <Card className="border-primary/30">
              <CardContent className="p-5">
                <div className="flex items-center justify-between mb-4">
                  <p className="text-sm font-semibold text-text">Registrar despesa</p>
                  <button onClick={() => setShowExpenseForm(false)} className="text-text-muted hover:text-text">
                    <X className="h-4 w-4" />
                  </button>
                </div>
                <form onSubmit={handleSaveExpense} className="space-y-3">
                  <input value={desc} onChange={(e) => setDesc(e.target.value)} placeholder="Descrição da despesa" required className={inputClass} />
                  <div className="grid grid-cols-2 gap-3">
                    <select value={category} onChange={(e) => setCategory(e.target.value)} className={inputClass}>
                      {EXPENSE_CATEGORIES.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
                    </select>
                    <input value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="Valor (R$)" required type="number" step="0.01" min="0" className={inputClass} />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <input value={supplier} onChange={(e) => setSupplier(e.target.value)} placeholder="Fornecedor (opcional)" className={inputClass} />
                    <input value={expDate} onChange={(e) => setExpDate(e.target.value)} type="date" className={inputClass} />
                  </div>
                  <label className="flex items-center gap-2 text-sm text-text-muted cursor-pointer">
                    <input type="checkbox" checked={recurring} onChange={(e) => setRecurring(e.target.checked)} className="rounded" />
                    Despesa recorrente (mensal)
                  </label>
                  <Button type="submit" disabled={saving} className="w-full">
                    {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "Registrar despesa"}
                  </Button>
                </form>
              </CardContent>
            </Card>
          )}

          {expenses.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center text-sm text-text-muted">
                Nenhuma despesa registrada ainda.
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-2">
              {expenses.map((exp) => (
                <Card key={exp.id}>
                  <CardContent className="flex items-start justify-between gap-3 p-4">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-sm font-semibold text-text truncate">{exp.description}</p>
                        {exp.recurring && <Badge variant="info" className="text-[10px]">Recorrente</Badge>}
                      </div>
                      <p className="text-xs text-text-muted mt-0.5">
                        {EXPENSE_CATEGORIES.find((c) => c.value === exp.category)?.label ?? exp.category}
                        {exp.supplier ? ` · ${exp.supplier}` : ""} · {new Date(exp.date).toLocaleDateString("pt-BR")}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-sm font-bold text-danger">
                        −R${(exp.amountCents / 100).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                      </span>
                      <button onClick={() => removeExpense(exp.id)} className="text-text-muted hover:text-danger transition-colors">
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </CardContent>
                </Card>
              ))}
              <div className="rounded-xl border border-border bg-card-hover px-4 py-3 flex items-center justify-between">
                <span className="text-sm font-semibold text-text">Total de despesas</span>
                <span className="font-bold text-danger">−R${(totalExpensesCents / 100).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</span>
              </div>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}
