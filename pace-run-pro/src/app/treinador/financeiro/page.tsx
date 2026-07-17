import { redirect } from "next/navigation";
import type { ReactNode } from "react";
import { BadgeCheck, CreditCard, WalletCards } from "lucide-react";
import { getSession } from "@/lib/auth-guard";
import { prisma } from "@/lib/prisma";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { BillingSettingsForm } from "../gestao/_management-forms";

export const dynamic = "force-dynamic";

function money(cents: number) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(cents / 100);
}

export default async function CoachFinanceiroPage() {
  const session = await getSession();
  if (!session?.user?.id) redirect("/login");

  const coach = await prisma.coach.findUnique({
    where: { userId: session.user.id },
    select: {
      user: { select: { billingSettings: true } },
      plans: {
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          name: true,
          priceCents: true,
          period: true,
          usedSlots: true,
          purchases: {
            orderBy: { createdAt: "desc" },
            select: {
              status: true,
              pricePaidCents: true,
              createdAt: true,
              athlete: { select: { user: { select: { name: true, email: true } } } },
            },
          },
        },
      },
      expenses: {
        orderBy: { date: "desc" },
        take: 12,
        select: { id: true, description: true, amountCents: true, category: true, date: true, recurring: true },
      },
    },
  });

  if (!coach) redirect("/login");

  const purchases = coach.plans.flatMap((plan) =>
    plan.purchases.map((purchase) => ({
      ...purchase,
      planName: plan.name,
      expectedCents: plan.priceCents,
    }))
  );
  const paidPurchases = purchases.filter((purchase) => purchase.status === "paid");
  const pendingPurchases = purchases.filter((purchase) => purchase.status === "pending");
  const grossRevenue = paidPurchases.reduce((sum, purchase) => sum + (purchase.pricePaidCents || purchase.expectedCents), 0);
  const expensesTotal = coach.expenses.reduce((sum, expense) => sum + expense.amountCents, 0);
  const platformFee = Math.round(grossRevenue * 0.1);
  const netRevenue = grossRevenue - platformFee - expensesTotal;

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <div>
        <Badge variant="primary">Financeiro</Badge>
        <h1 className="mt-3 font-display text-3xl font-bold text-text">Receita, split e recebimento</h1>
        <p className="mt-2 max-w-2xl text-sm text-text-muted">
          Visão operacional do dinheiro da assessoria com base nos planos contratados e nos dados de recebimento cadastrados.
        </p>
      </div>

      <div className="grid gap-3 md:grid-cols-4">
        <Metric label="MRR bruto" value={money(grossRevenue)} icon={<CreditCard className="h-5 w-5" />} />
        <Metric label="Pendentes" value={String(pendingPurchases.length)} icon={<BadgeCheck className="h-5 w-5" />} />
        <Metric label="Taxa plataforma" value={money(platformFee)} icon={<WalletCards className="h-5 w-5" />} />
        <Metric label="Líquido previsto" value={money(netRevenue)} icon={<WalletCards className="h-5 w-5" />} />
      </div>

      <div className="grid gap-4 lg:grid-cols-[1fr_0.9fr]">
        <Card>
          <CardContent className="p-0">
            <div className="border-b border-border px-5 py-4">
              <h2 className="font-display text-lg font-bold text-text">Contratos recentes</h2>
              <p className="text-sm text-text-muted">Pagamentos vinculados aos planos do treinador.</p>
            </div>
            <div className="divide-y divide-border">
              {purchases.length === 0 ? (
                <div className="px-5 py-10 text-sm text-text-muted">Nenhuma contratação registrada.</div>
              ) : purchases.slice(0, 12).map((purchase, index) => (
                <div key={`${purchase.planName}-${purchase.athlete.user.email}-${index}`} className="grid gap-2 px-5 py-4 sm:grid-cols-[1fr_auto_auto] sm:items-center">
                  <div>
                    <p className="font-semibold text-text">{purchase.athlete.user.name}</p>
                    <p className="text-xs text-text-muted">{purchase.planName} · {purchase.athlete.user.email}</p>
                  </div>
                  <Badge variant={purchase.status === "paid" ? "success" : purchase.status === "pending" ? "warning" : "outline"}>
                    {purchase.status}
                  </Badge>
                  <p className="font-semibold text-text">{money(purchase.pricePaidCents || purchase.expectedCents)}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="space-y-4 p-5">
            <div>
              <h2 className="font-display text-lg font-bold text-text">Dados de recebimento</h2>
              <p className="text-sm text-text-muted">Dados mínimos para conciliação e repasse do treinador.</p>
            </div>
            <BillingSettingsForm initialSettings={coach.user.billingSettings} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function Metric({ label, value, icon }: { label: string; value: string; icon: ReactNode }) {
  return (
    <Card>
      <CardContent className="flex items-center justify-between p-5">
        <div>
          <p className="text-xs uppercase tracking-wide text-text-muted">{label}</p>
          <p className="mt-2 font-display text-2xl font-bold text-text">{value}</p>
        </div>
        <span className="text-primary">{icon}</span>
      </CardContent>
    </Card>
  );
}
