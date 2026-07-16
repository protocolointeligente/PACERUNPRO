import { redirect } from "next/navigation";
import type { ReactNode } from "react";
import { CreditCard, Users } from "lucide-react";
import { getSession } from "@/lib/auth-guard";
import { prisma } from "@/lib/prisma";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { CreateCoachPlanForm } from "../gestao/_management-forms";

export const dynamic = "force-dynamic";

function money(cents: number) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(cents / 100);
}

export default async function CoachSalesPlansPage() {
  const session = await getSession();
  if (!session?.user?.id) redirect("/login");

  const coach = await prisma.coach.findUnique({
    where: { userId: session.user.id },
    select: {
      plans: {
        orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
        select: {
          id: true,
          name: true,
          description: true,
          priceCents: true,
          period: true,
          features: true,
          active: true,
          maxSlots: true,
          usedSlots: true,
          purchases: { select: { status: true } },
        },
      },
    },
  });

  if (!coach) redirect("/login");

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div>
        <Badge variant="primary">Planos de venda</Badge>
        <h1 className="mt-3 font-display text-3xl font-bold text-text">Ofertas da assessoria</h1>
        <p className="mt-2 max-w-2xl text-sm text-text-muted">
          Crie quantos planos desejar para vender acompanhamento, controlar vagas e conectar cobrança com Asaas.
        </p>
      </div>

      <div className="grid gap-4 lg:grid-cols-[0.9fr_1.1fr]">
        <Card>
          <CardContent className="space-y-4 p-5">
            <div>
              <h2 className="font-display text-lg font-bold text-text">Criar plano</h2>
              <p className="text-sm text-text-muted">O plano aparece no convite e pode ser contratado pelo atleta.</p>
            </div>
            <CreateCoachPlanForm />
          </CardContent>
        </Card>

        <div className="space-y-3">
          {coach.plans.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-sm text-text-muted">
                Nenhum plano criado. Cadastre pelo menos uma oferta para o atleta conseguir comprar.
              </CardContent>
            </Card>
          ) : coach.plans.map((plan) => {
            const paid = plan.purchases.filter((purchase) => purchase.status === "paid").length;
            return (
              <Card key={plan.id}>
                <CardContent className="space-y-3 p-5">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <h2 className="font-display text-xl font-bold text-text">{plan.name}</h2>
                        <Badge variant={plan.active ? "success" : "outline"}>{plan.active ? "Ativo" : "Pausado"}</Badge>
                      </div>
                      <p className="mt-1 text-sm text-text-muted">{plan.description ?? "Sem descrição."}</p>
                    </div>
                    <p className="font-display text-2xl font-bold text-text">{money(plan.priceCents)}</p>
                  </div>
                  <div className="grid gap-2 text-sm sm:grid-cols-3">
                    <Info icon={<CreditCard className="h-4 w-4" />} label="Período" value={plan.period.toLowerCase()} />
                    <Info icon={<Users className="h-4 w-4" />} label="Vagas" value={`${plan.usedSlots}/${plan.maxSlots ?? "∞"}`} />
                    <Info icon={<Users className="h-4 w-4" />} label="Pagantes" value={String(paid)} />
                  </div>
                  {plan.features.length > 0 && (
                    <ul className="grid gap-1 text-sm text-text-muted sm:grid-cols-2">
                      {plan.features.map((feature) => <li key={feature}>• {feature}</li>)}
                    </ul>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function Info({ icon, label, value }: { icon: ReactNode; label: string; value: string }) {
  return (
    <div className="rounded-xl border border-border bg-card-hover/60 p-3">
      <p className="flex items-center gap-1 text-xs uppercase tracking-wide text-text-muted">{icon}{label}</p>
      <p className="mt-1 font-semibold text-text">{value}</p>
    </div>
  );
}
