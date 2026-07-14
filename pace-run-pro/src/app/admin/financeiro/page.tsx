import type { ReactNode } from "react";
import { BadgeCheck, CreditCard, TrendingDown, WalletCards } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

function money(cents: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(cents / 100);
}

export default async function FinanceiroPage() {
  const financeData = await Promise.all([
      prisma.payment.aggregate({ where: { status: "PAID" }, _sum: { amountCents: true }, _count: true }),
      prisma.payment.aggregate({ where: { status: "PENDING" }, _sum: { amountCents: true }, _count: true }),
      prisma.payment.count({ where: { status: "FAILED" } }),
      prisma.subscription.count({ where: { status: "ACTIVE", deletedAt: null } }),
      prisma.coach.count({ where: { deletedAt: null } }),
      prisma.athlete.count({ where: { deletedAt: null } }),
      prisma.planPurchase.findMany({
        where: { status: "paid" },
        orderBy: { createdAt: "desc" },
        take: 8,
        select: {
          id: true,
          pricePaidCents: true,
          createdAt: true,
          athlete: { select: { user: { select: { name: true, email: true } } } },
          product: {
            select: {
              title: true,
              coach: { select: { user: { select: { name: true } } } },
            },
          },
        },
      }),
    ]).then((data) => ({ data, error: false })).catch(() => ({ data: null, error: true }));

  const [
    paidPayments,
    pendingPayments,
    failedPayments,
    activeSubscriptions,
    coaches,
    athletes,
    paidPurchases,
  ] = financeData.data ?? [
    { _sum: { amountCents: null }, _count: 0 },
    { _sum: { amountCents: null }, _count: 0 },
    0,
    0,
    0,
    0,
    [],
  ];

  const paidTotal = paidPayments._sum.amountCents ?? 0;
  const pendingTotal = pendingPayments._sum.amountCents ?? 0;
  const splitGross = paidPurchases.reduce((sum, purchase) => sum + purchase.pricePaidCents, 0);
  const platformSplit = Math.round(splitGross * 0.1);
  const coachSplit = splitGross - platformSplit;

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <div>
        <Badge variant="success">Financeiro</Badge>
        <h1 className="mt-3 font-display text-3xl font-bold text-text">Receita, assinaturas e split</h1>
        <p className="mt-2 max-w-2xl text-sm text-text-muted">
          Numeros vindos do banco. Quando Asaas entrar, esta tela deve consolidar assinatura do treinador,
          mensalidades dos atletas, webhooks e repasses 90/10.
        </p>
        {financeData.error && (
          <p className="mt-3 rounded-xl border border-warning/30 bg-warning/10 px-4 py-3 text-sm text-warning">
            Nao foi possivel carregar o financeiro agora. Confira variaveis do banco e migrations; a tela permanece acessivel para nao travar o admin.
          </p>
        )}
      </div>

      <div className="grid gap-3 md:grid-cols-4">
        <Metric icon={<CreditCard className="h-5 w-5" />} label="Pagamentos recebidos" value={money(paidTotal)} hint={`${paidPayments._count} registros pagos`} />
        <Metric icon={<WalletCards className="h-5 w-5" />} label="Pendente" value={money(pendingTotal)} hint={`${pendingPayments._count} pagamentos pendentes`} />
        <Metric icon={<BadgeCheck className="h-5 w-5" />} label="Assinaturas ativas" value={String(activeSubscriptions)} hint={`${coaches} treinadores cadastrados`} />
        <Metric icon={<TrendingDown className="h-5 w-5" />} label="Falhas" value={String(failedPayments)} hint={`${athletes} atletas no sistema`} />
      </div>

      <div className="grid gap-4 lg:grid-cols-[0.9fr_1.1fr]">
        <Card>
          <CardContent className="space-y-4 p-5">
            <div className="flex items-center justify-between">
              <h2 className="font-display text-lg font-bold text-text">Split de vendas dos treinadores</h2>
              <Badge variant="primary">90/10</Badge>
            </div>
            <div className="grid gap-3 sm:grid-cols-3">
              <SplitBox label="Bruto" value={money(splitGross)} />
              <SplitBox label="Plataforma" value={money(platformSplit)} />
              <SplitBox label="Treinadores" value={money(coachSplit)} />
            </div>
            <p className="text-xs leading-relaxed text-text-muted">
              Esta simulacao usa `PlanPurchase.status = paid`. Na integracao Asaas, cada webhook deve gravar
              o status e os IDs externos para reconciliacao.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-0">
            <div className="border-b border-border px-5 py-4">
              <h2 className="font-display text-lg font-bold text-text">Ultimas compras de planos</h2>
              <p className="text-sm text-text-muted">Origem real: produtos vendidos por treinadores.</p>
            </div>
            <div className="divide-y divide-border">
              {paidPurchases.length === 0 ? (
                <div className="px-5 py-8 text-sm text-text-muted">Nenhuma compra paga registrada ainda.</div>
              ) : (
                paidPurchases.map((purchase) => (
                  <div key={purchase.id} className="grid gap-3 px-5 py-4 md:grid-cols-[1fr_1fr_auto] md:items-center">
                    <div>
                      <p className="font-semibold text-text">{purchase.athlete.user.name}</p>
                      <p className="text-xs text-text-muted">{purchase.athlete.user.email}</p>
                    </div>
                    <div>
                      <p className="text-sm text-text">{purchase.product.title}</p>
                      <p className="text-xs text-text-muted">Treinador: {purchase.product.coach.user.name}</p>
                    </div>
                    <p className="font-display text-lg font-bold text-text">{money(purchase.pricePaidCents)}</p>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function Metric({ icon, label, value, hint }: { icon: ReactNode; label: string; value: string; hint: string }) {
  return (
    <Card>
      <CardContent className="flex items-center justify-between gap-3 p-5">
        <div>
          <p className="text-xs uppercase tracking-wide text-text-muted">{label}</p>
          <p className="mt-2 font-display text-2xl font-bold text-text">{value}</p>
          <p className="mt-1 text-xs text-text-muted">{hint}</p>
        </div>
        <div className="flex h-11 w-11 items-center justify-center rounded-full bg-primary/10 text-primary">
          {icon}
        </div>
      </CardContent>
    </Card>
  );
}

function SplitBox({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-border bg-background/60 p-4">
      <p className="text-xs uppercase tracking-wide text-text-muted">{label}</p>
      <p className="mt-2 font-display text-xl font-bold text-text">{value}</p>
    </div>
  );
}
