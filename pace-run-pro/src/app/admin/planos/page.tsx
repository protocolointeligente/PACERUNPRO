"use client";

import { Fragment, useState } from "react";
import { motion } from "framer-motion";
import { Check, Minus, Save } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  show: (i: number = 0) => ({ opacity: 1, y: 0, transition: { delay: i * 0.06, duration: 0.4, ease: "easeOut" as const } }),
};

const PLANS = [
  { id: "starter",    label: "Starter",    price: 97,   maxAthletes: 20,   maxCoaches: 1,   color: "text-text-muted",  highlight: false },
  { id: "pro",        label: "Pro",        price: 197,  maxAthletes: 80,   maxCoaches: 3,   color: "text-primary",     highlight: true  },
  { id: "assessoria", label: "Assessoria", price: 397,  maxAthletes: 250,  maxCoaches: 10,  color: "text-warning",     highlight: false },
  { id: "wl",         label: "White Label",price: 997,  maxAthletes: null, maxCoaches: null,color: "text-danger",      highlight: false },
] as const;

type PlanId = typeof PLANS[number]["id"];
type EditablePlan = {
  id: PlanId;
  label: string;
  price: number;
  maxAthletes: number | null;
  maxCoaches: number | null;
  color: string;
  highlight: boolean;
};

const MODULES: { group: string; items: { label: string; plans: Record<PlanId, boolean | string> }[] }[] = [
  {
    group: "Prescrição",
    items: [
      { label: "Corrida + VDOT",           plans: { starter: true,  pro: true,  assessoria: true,  wl: true  } },
      { label: "Periodização automática",  plans: { starter: true,  pro: true,  assessoria: true,  wl: true  } },
      { label: "Calendário do atleta",     plans: { starter: true,  pro: true,  assessoria: true,  wl: true  } },
      { label: "Treino de força",          plans: { starter: false, pro: true,  assessoria: true,  wl: true  } },
      { label: "Liberação semanal",        plans: { starter: false, pro: true,  assessoria: true,  wl: true  } },
    ],
  },
  {
    group: "Monitoramento",
    items: [
      { label: "Check-in do atleta",       plans: { starter: true,  pro: true,  assessoria: true,  wl: true  } },
      { label: "Alertas inteligentes",     plans: { starter: false, pro: true,  assessoria: true,  wl: true  } },
      { label: "Dashboard de risco",       plans: { starter: false, pro: true,  assessoria: true,  wl: true  } },
      { label: "Análise semanal da equipe",plans: { starter: false, pro: true,  assessoria: true,  wl: true  } },
    ],
  },
  {
    group: "Gestão",
    items: [
      { label: "Relatórios PDF profissionais", plans: { starter: true,  pro: true,  assessoria: true,  wl: true  } },
      { label: "Painel financeiro do roster",  plans: { starter: false, pro: false, assessoria: true,  wl: true  } },
      { label: "Multi-treinador",              plans: { starter: false, pro: "até 3", assessoria: "até 10", wl: "ilimitado" } },
      { label: "CRM de leads",                 plans: { starter: false, pro: false, assessoria: true,  wl: true  } },
      { label: "Link de convite por treinador",plans: { starter: false, pro: false, assessoria: true,  wl: true  } },
    ],
  },
  {
    group: "White Label",
    items: [
      { label: "Domínio próprio",          plans: { starter: false, pro: false, assessoria: false, wl: true  } },
      { label: "Logo e marca própria",     plans: { starter: false, pro: false, assessoria: false, wl: true  } },
      { label: "App com identidade da assessoria", plans: { starter: false, pro: false, assessoria: false, wl: true } },
      { label: "API completa",             plans: { starter: false, pro: false, assessoria: false, wl: true  } },
      { label: "SLA 99,9% + suporte 24 h", plans: { starter: false, pro: false, assessoria: false, wl: true } },
    ],
  },
];

function Cell({ value }: { value: boolean | string }) {
  if (value === true) return <Check className="mx-auto h-4 w-4 text-success" />;
  if (value === false) return <Minus className="mx-auto h-3.5 w-3.5 text-text-muted/30" />;
  return <span className="text-xs font-medium text-info">{value}</span>;
}

export default function PlanosPage() {
  const [plans, setPlans] = useState<EditablePlan[]>(() => PLANS.map((plan) => ({ ...plan })));
  const [modules, setModules] = useState(() => MODULES.map((group) => ({
    ...group,
    items: group.items.map((item) => ({ ...item, plans: { ...item.plans } })),
  })));
  const [saved, setSaved] = useState(false);

  function updatePlan(id: PlanId, patch: Partial<{ price: number; maxAthletes: number | null; maxCoaches: number | null }>) {
    setSaved(false);
    setPlans((current) => current.map((plan) => (plan.id === id ? { ...plan, ...patch } : plan)));
  }

  function toggleModule(groupName: string, label: string, planId: PlanId) {
    setSaved(false);
    setModules((current) => current.map((group) => group.group !== groupName ? group : {
      ...group,
      items: group.items.map((item) => {
        if (item.label !== label) return item;
        const currentValue = item.plans[planId];
        return { ...item, plans: { ...item.plans, [planId]: currentValue === true ? false : true } };
      }),
    }));
  }

  return (
    <div className="mx-auto max-w-6xl space-y-8">
      <motion.div variants={fadeUp} initial="hidden" animate="show">
        <Badge variant="primary" className="mb-2">Planos & Módulos</Badge>
        <h1 className="font-display text-2xl font-bold text-text sm:text-3xl">Matriz de planos e módulos</h1>
        <p className="mt-1.5 text-sm text-text-muted">
          Controle quais funcionalidades estão disponíveis em cada plano.
        </p>
      </motion.div>

      {/* Plan cards */}
      <motion.div custom={1} variants={fadeUp} initial="hidden" animate="show" className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {plans.map((p) => (
          <Card key={p.id} className={p.highlight ? "border-primary/40 bg-primary/5" : ""}>
            <CardContent className="space-y-3 p-4">
              <p className={cn("font-display text-base font-bold", p.color)}>{p.label}</p>
              <p className="font-display text-2xl font-extrabold text-text mt-1">
                R${p.price}<span className="text-sm font-normal text-text-muted">/mês</span>
              </p>
              <p className="text-xs text-text-muted mt-1">
                {p.maxAthletes === null ? "Atletas ilimitados" : `até ${p.maxAthletes} atletas`}
              </p>
              <p className="text-xs text-text-muted">
                {p.maxCoaches === null ? "Treinadores ilimitados" : p.maxCoaches === 1 ? "1 treinador" : `até ${p.maxCoaches} treinadores`}
              </p>
              <label className="block space-y-1">
                <span className="text-xs font-semibold text-text-muted">Preco mensal</span>
                <input type="number" value={p.price} onChange={(event) => updatePlan(p.id, { price: Number(event.target.value) })} className="h-10 w-full rounded-xl border border-border bg-background px-3 text-sm text-text outline-none focus:border-primary" />
              </label>
              <label className="block space-y-1">
                <span className="text-xs font-semibold text-text-muted">Atletas</span>
                <input type="number" value={p.maxAthletes ?? ""} placeholder="Ilimitado" onChange={(event) => updatePlan(p.id, { maxAthletes: event.target.value ? Number(event.target.value) : null })} className="h-10 w-full rounded-xl border border-border bg-background px-3 text-sm text-text outline-none focus:border-primary" />
              </label>
              <label className="block space-y-1">
                <span className="text-xs font-semibold text-text-muted">Treinadores</span>
                <input type="number" value={p.maxCoaches ?? ""} placeholder="Ilimitado" onChange={(event) => updatePlan(p.id, { maxCoaches: event.target.value ? Number(event.target.value) : null })} className="h-10 w-full rounded-xl border border-border bg-background px-3 text-sm text-text outline-none focus:border-primary" />
              </label>
            </CardContent>
          </Card>
        ))}
      </motion.div>
      <div className="flex justify-end">
        <Button variant={saved ? "success" : "primary"} onClick={() => setSaved(true)}>
          <Save className="h-4 w-4" />
          {saved ? "Alteracoes salvas" : "Salvar alteracoes"}
        </Button>
      </div>

      {/* Module matrix */}
      <motion.div custom={2} variants={fadeUp} initial="hidden" animate="show">
        <Card>
          <CardContent className="p-0 overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="p-4 text-left font-semibold text-text w-1/3">Módulo / Funcionalidade</th>
                  {plans.map((p) => (
                    <th key={p.id} className={cn("p-4 text-center font-semibold", p.color)}>{p.label}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {modules.map((group) => (
                  <Fragment key={group.group}>
                    <tr key={group.group} className="bg-card-hover/40">
                      <td colSpan={5} className="px-4 py-2 text-xs font-bold uppercase tracking-widest text-text-muted">
                        {group.group}
                      </td>
                    </tr>
                    {group.items.map((item) => (
                      <tr key={item.label} className="border-b border-border/50 hover:bg-card-hover/20 transition-colors">
                        <td className="px-4 py-3 text-sm text-text-muted">{item.label}</td>
                        {plans.map((p) => (
                          <td key={p.id} className="px-4 py-3 text-center">
                            <button
                              type="button"
                              onClick={() => toggleModule(group.group, item.label, p.id)}
                              className="mx-auto flex h-8 min-w-8 items-center justify-center rounded-lg border border-transparent px-2 transition-colors hover:border-primary/40 hover:bg-primary/10"
                              title="Clique para ativar/desativar este modulo no plano"
                            >
                              <Cell value={item.plans[p.id]} />
                            </button>
                          </td>
                        ))}
                      </tr>
                    ))}
                  </Fragment>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
