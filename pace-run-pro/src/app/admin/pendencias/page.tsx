import type { ReactNode } from "react";
import Link from "next/link";
import { AlertTriangle, Clock, CreditCard, ShieldAlert, WalletCards } from "lucide-react";
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

export default async function PendenciasPage() {
  const pendingData = await Promise.all([
    prisma.payment.findMany({
      where: { status: "FAILED" },
      orderBy: { createdAt: "desc" },
      take: 8,
      select: {
        id: true,
        amountCents: true,
        method: true,
        createdAt: true,
        user: { select: { name: true, email: true } },
      },
    }),
    prisma.payment.findMany({
      where: { status: "PENDING" },
      orderBy: { createdAt: "desc" },
      take: 8,
      select: {
        id: true,
        amountCents: true,
        method: true,
        createdAt: true,
        user: { select: { name: true, email: true } },
      },
    }),
    prisma.subscription.findMany({
      where: { status: "PAST_DUE", deletedAt: null },
      orderBy: { startedAt: "desc" },
      take: 8,
      select: {
        id: true,
        plan: true,
        renewsAt: true,
        user: { select: { name: true, email: true } },
      },
    }),
    prisma.coach.findMany({
      where: { deletedAt: null },
      orderBy: { createdAt: "desc" },
      take: 50,
      select: {
        id: true,
        user: {
          select: {
            name: true,
            email: true,
            billingSettings: {
              select: {
                cpfCnpj: true,
                receivingMethod: true,
              },
            },
          },
        },
      },
    }),
  ]).then((data) => ({ data, error: false })).catch(() => ({ data: null, error: true }));

  const [failedPayments, pendingPayments, pastDueSubscriptions, coachesMissingBilling] = pendingData.data ?? [[], [], [], []];

  const billingIssues = coachesMissingBilling
    .filter((coach) => !coach.user.billingSettings?.cpfCnpj || !coach.user.billingSettings?.receivingMethod)
    .slice(0, 8);
  const total = failedPayments.length + pendingPayments.length + pastDueSubscriptions.length + billingIssues.length;

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div>
        <Badge variant={total > 0 ? "warning" : "success"}>
          <Clock className="h-3 w-3" /> Pendencias operacionais
        </Badge>
        <h1 className="mt-3 font-display text-3xl font-bold text-text">Fila operacional do SaaS</h1>
        <p className="mt-2 max-w-2xl text-sm text-text-muted">
          Lista real de itens que podem bloquear venda, repasse, acesso ou renovacao. Sem dados mockados.
        </p>
        {pendingData.error && (
          <p className="mt-3 rounded-xl border border-warning/30 bg-warning/10 px-4 py-3 text-sm text-warning">
            Nao foi possivel carregar as pendencias agora. Confira conexao do banco e migrations; a rota permanece acessivel.
          </p>
        )}
      </div>

      {total === 0 ? (
        <Card>
          <CardContent className="p-10 text-center">
            <ShieldAlert className="mx-auto mb-3 h-10 w-10 text-success" />
            <p className="font-display text-lg font-bold text-text">Sem pendencias criticas</p>
            <p className="mt-1 text-sm text-text-muted">Nenhum pagamento, assinatura ou conta de recebimento requer acao agora.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          <IssueGroup
            title="Pagamentos com falha"
            icon={<AlertTriangle className="h-4 w-4" />}
            items={failedPayments.map((payment) => ({
              id: payment.id,
              title: payment.user.name,
              subtitle: `${payment.user.email} - ${payment.method ?? "metodo nao informado"}`,
              meta: money(payment.amountCents),
              href: "/admin/financeiro",
            }))}
          />
          <IssueGroup
            title="Pagamentos pendentes"
            icon={<CreditCard className="h-4 w-4" />}
            items={pendingPayments.map((payment) => ({
              id: payment.id,
              title: payment.user.name,
              subtitle: `${payment.user.email} - ${payment.method ?? "metodo nao informado"}`,
              meta: money(payment.amountCents),
              href: "/admin/financeiro",
            }))}
          />
          <IssueGroup
            title="Assinaturas vencidas"
            icon={<Clock className="h-4 w-4" />}
            items={pastDueSubscriptions.map((subscription) => ({
              id: subscription.id,
              title: subscription.user.name,
              subtitle: `${subscription.user.email} - plano ${subscription.plan}`,
              meta: subscription.renewsAt ? subscription.renewsAt.toLocaleDateString("pt-BR") : "sem vencimento",
              href: "/admin/usuarios",
            }))}
          />
          <IssueGroup
            title="Treinadores sem recebimento"
            icon={<WalletCards className="h-4 w-4" />}
            items={billingIssues.map((coach) => ({
              id: coach.id,
              title: coach.user.name,
              subtitle: coach.user.email,
              meta: coach.user.billingSettings?.cpfCnpj ? "falta metodo" : "falta CPF/CNPJ",
              href: "/admin/assessorias",
            }))}
          />
        </div>
      )}
    </div>
  );
}

function IssueGroup({
  title,
  icon,
  items,
}: {
  title: string;
  icon: ReactNode;
  items: Array<{ id: string; title: string; subtitle: string; meta: string; href: string }>;
}) {
  return (
    <Card>
      <CardContent className="p-0">
        <div className="flex items-center gap-2 border-b border-border px-5 py-4">
          <span className="text-primary">{icon}</span>
          <h2 className="font-display text-base font-bold text-text">{title}</h2>
          <Badge variant={items.length > 0 ? "warning" : "success"} className="ml-auto">{items.length}</Badge>
        </div>
        <div className="divide-y divide-border">
          {items.length === 0 ? (
            <div className="px-5 py-6 text-sm text-text-muted">Nada nesta fila.</div>
          ) : (
            items.map((item) => (
              <Link key={item.id} href={item.href} className="grid gap-1 px-5 py-4 transition-colors hover:bg-card-hover/60">
                <div className="flex items-center justify-between gap-3">
                  <p className="font-semibold text-text">{item.title}</p>
                  <span className="text-xs font-semibold text-primary">{item.meta}</span>
                </div>
                <p className="text-xs text-text-muted">{item.subtitle}</p>
              </Link>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}
