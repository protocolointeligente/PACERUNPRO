import Link from "next/link";
import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import {
  ArrowRight,
  BadgeCheck,
  Copy,
  CreditCard,
  Link2,
  Mail,
  ShieldCheck,
  UserPlus,
  Users,
  WalletCards,
} from "lucide-react";
import { getSession } from "@/lib/auth-guard";
import { prisma } from "@/lib/prisma";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

function money(cents: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(cents / 100);
}

function initials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}

export default async function GestaoPage() {
  const session = await getSession();
  if (!session?.user?.id) redirect("/login");

  let loadError = false;
  const coach = await prisma.coach.findUnique({
    where: { userId: session.user.id },
    select: {
      id: true,
      slug: true,
      whatsapp: true,
      user: {
        select: {
          name: true,
          email: true,
          billingSettings: {
            select: {
              cpfCnpj: true,
              pixKey: true,
              bankName: true,
              receivingMethod: true,
              autoChargeEnabled: true,
            },
          },
        },
      },
      athletes: {
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          status: true,
          adherenceRate: true,
          createdAt: true,
          user: {
            select: {
              name: true,
              email: true,
              avatarUrl: true,
            },
          },
          planPurchases: {
            orderBy: { createdAt: "desc" },
            take: 1,
            select: {
              status: true,
              pricePaidCents: true,
              product: {
                select: {
                  title: true,
                  priceCents: true,
                },
              },
            },
          },
        },
      },
      planProducts: {
        orderBy: { updatedAt: "desc" },
        select: {
          id: true,
          title: true,
          slug: true,
          sport: true,
          level: true,
          priceCents: true,
          published: true,
          purchases: true,
        },
      },
      leads: {
        orderBy: { updatedAt: "desc" },
        take: 6,
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          stage: true,
          source: true,
          monthlyFeeCents: true,
        },
      },
    },
  }).catch(() => {
    loadError = true;
    return null;
  });

  if (loadError) {
    return (
      <div className="mx-auto max-w-3xl space-y-4">
        <Badge variant="warning">CRM da assessoria</Badge>
        <Card>
          <CardContent className="space-y-3 p-6">
            <h1 className="font-display text-2xl font-bold text-text">Gestao temporariamente indisponivel</h1>
            <p className="text-sm leading-relaxed text-text-muted">
              A rota abriu sem quebrar a plataforma, mas os dados de atletas, planos e leads nao puderam ser carregados agora.
              Verifique a conexao do banco e rode as migrations antes de validar o CRM completo.
            </p>
            <Link href="/treinador/dashboard" className={cn(buttonVariants({ variant: "secondary", size: "sm" }))}>
              Voltar ao dashboard
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!coach) redirect("/login");

  const origin = process.env.NEXT_PUBLIC_APP_URL ?? "https://pacerunpro.com.br";
  const inviteUrl = `${origin}/convite/${coach.slug ?? coach.id}`;
  const activeAthletes = coach.athletes.filter((athlete) => athlete.status !== "inativo");
  const paidAthletes = coach.athletes.filter((athlete) =>
    athlete.planPurchases.some((purchase) => purchase.status === "paid")
  );
  const monthlyRevenue = paidAthletes.reduce((sum, athlete) => {
    const purchase = athlete.planPurchases[0];
    return sum + (purchase?.pricePaidCents || purchase?.product.priceCents || 0);
  }, 0);
  const platformFee = Math.round(monthlyRevenue * 0.1);
  const coachNet = monthlyRevenue - platformFee;
  const asaasReady = Boolean(
    coach.user.billingSettings?.cpfCnpj &&
      (coach.user.billingSettings.pixKey || coach.user.billingSettings.bankName)
  );

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <Badge variant="primary">CRM da assessoria</Badge>
          <h1 className="mt-3 font-display text-3xl font-bold text-text">
            Gestao dos alunos e vendas
          </h1>
          <p className="mt-2 max-w-2xl text-sm text-text-muted">
            Um unico painel para matricular atletas, acompanhar planos contratados e preparar cobrancas com split Asaas por treinador.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link href="/treinador/atletas" className={cn(buttonVariants({ variant: "secondary", size: "sm" }))}>
            <UserPlus className="h-4 w-4" />
            Inscrever manualmente
          </Link>
          <Link href="/treinador/gestao#planos" className={cn(buttonVariants({ variant: "primary", size: "sm" }))}>
            <CreditCard className="h-4 w-4" />
            Criar plano
          </Link>
        </div>
      </div>

      <div className="grid gap-3 md:grid-cols-4">
        <MetricCard label="Atletas ativos" value={String(activeAthletes.length)} icon={<Users className="h-5 w-5" />} tone="text-info" />
        <MetricCard label="Pagantes" value={String(paidAthletes.length)} icon={<BadgeCheck className="h-5 w-5" />} tone="text-success" />
        <MetricCard label="MRR bruto" value={money(monthlyRevenue)} icon={<CreditCard className="h-5 w-5" />} tone="text-primary" />
        <MetricCard label="Liquido treinador" value={money(coachNet)} icon={<WalletCards className="h-5 w-5" />} tone="text-warning" />
      </div>

      <div className="grid gap-4 lg:grid-cols-[1.4fr_0.9fr]">
        <Card className="overflow-hidden">
          <CardContent className="p-0">
            <div className="border-b border-border px-5 py-4">
              <h2 className="font-display text-lg font-bold text-text">Atletas e contratos</h2>
              <p className="text-sm text-text-muted">Cada linha fica isolada por coachId para evitar convites e pagamentos cruzados.</p>
            </div>
            <div className="divide-y divide-border">
              {coach.athletes.length === 0 ? (
                <div className="px-5 py-10 text-sm text-text-muted">Nenhum atleta inscrito ainda.</div>
              ) : (
                coach.athletes.map((athlete) => {
                  const purchase = athlete.planPurchases[0];
                  return (
                    <div key={athlete.id} className="grid gap-3 px-5 py-4 md:grid-cols-[1.2fr_0.8fr_0.8fr_auto] md:items-center">
                      <div className="flex min-w-0 items-center gap-3">
                        {athlete.user.avatarUrl ? (
                          <img src={athlete.user.avatarUrl} alt="" className="h-11 w-11 rounded-full object-cover" />
                        ) : (
                          <div className="flex h-11 w-11 items-center justify-center rounded-full bg-primary/15 text-sm font-bold text-primary">
                            {initials(athlete.user.name)}
                          </div>
                        )}
                        <div className="min-w-0">
                          <p className="truncate font-semibold text-text">{athlete.user.name}</p>
                          <p className="truncate text-xs text-text-muted">{athlete.user.email}</p>
                        </div>
                      </div>
                      <div>
                        <p className="text-xs uppercase tracking-wide text-text-muted">Plano</p>
                        <p className="text-sm font-semibold text-text">{purchase?.product.title ?? "Sem plano"}</p>
                      </div>
                      <div>
                        <p className="text-xs uppercase tracking-wide text-text-muted">Pagamento</p>
                        <Badge variant={purchase?.status === "paid" ? "success" : purchase ? "warning" : "outline"}>
                          {purchase?.status === "paid" ? "Pago" : purchase?.status ?? "Aguardando"}
                        </Badge>
                      </div>
                      <Link href={`/treinador/atletas?athlete=${athlete.id}`} className="text-sm font-semibold text-primary">
                        Abrir <ArrowRight className="inline h-4 w-4" />
                      </Link>
                    </div>
                  );
                })
              )}
            </div>
          </CardContent>
        </Card>

        <div className="space-y-4">
          <Card>
            <CardContent className="space-y-4 p-5">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <h2 className="font-display text-lg font-bold text-text">Convite seguro</h2>
                  <p className="text-sm text-text-muted">Link unico deste treinador.</p>
                </div>
                <Link2 className="h-5 w-5 text-primary" />
              </div>
              <div className="rounded-xl border border-border bg-background/70 p-3 text-sm text-text-muted">
                {inviteUrl}
              </div>
              <button className={cn(buttonVariants({ variant: "secondary", size: "sm" }), "w-full")}>
                <Copy className="h-4 w-4" />
                Copiar link
              </button>
              <div className="rounded-xl border border-info/25 bg-info/10 p-3 text-xs leading-relaxed text-info">
                O checkout Asaas deve receber o coachId do convite e criar a cobranca com split 90/10 antes de liberar o acesso do atleta.
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="space-y-4 p-5">
              <div className="flex items-center justify-between">
                <h2 className="font-display text-lg font-bold text-text">Asaas split</h2>
                <Badge variant={asaasReady ? "success" : "warning"}>{asaasReady ? "Dados prontos" : "Pendente"}</Badge>
              </div>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="rounded-xl border border-border p-3">
                  <p className="text-text-muted">Plataforma</p>
                  <p className="font-display text-2xl font-bold text-text">{money(platformFee)}</p>
                  <p className="text-xs text-text-muted">10%</p>
                </div>
                <div className="rounded-xl border border-border p-3">
                  <p className="text-text-muted">Treinador</p>
                  <p className="font-display text-2xl font-bold text-text">{money(coachNet)}</p>
                  <p className="text-xs text-text-muted">90%</p>
                </div>
              </div>
              <div className="flex items-start gap-2 text-xs leading-relaxed text-text-muted">
                <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-success" />
                Na proxima fase, gravar IDs Asaas de cliente/subconta/cobranca por coach e validar webhooks por assinatura.
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <div id="planos" className="grid gap-4 lg:grid-cols-[1fr_0.9fr]">
        <Card>
          <CardContent className="space-y-4 p-5">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h2 className="font-display text-lg font-bold text-text">Planos de venda</h2>
                <p className="text-sm text-text-muted">Produtos do treinador para contratar via convite.</p>
              </div>
              <CreditCard className="h-5 w-5 text-primary" />
            </div>
            <div className="space-y-3">
              {coach.planProducts.length === 0 ? (
                <div className="rounded-xl border border-dashed border-border p-5 text-sm text-text-muted">
                  Crie planos de assessoria para que o atleta receba o link de pagamento correto deste treinador.
                </div>
              ) : (
                coach.planProducts.map((plan) => (
                  <div key={plan.id} className="rounded-xl border border-border p-4">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <p className="font-semibold text-text">{plan.title}</p>
                        <p className="text-xs text-text-muted">{plan.sport} · {plan.level} · {plan.purchases} vendas</p>
                      </div>
                      <div className="text-right">
                        <p className="font-display text-lg font-bold text-text">{money(plan.priceCents)}</p>
                        <Badge variant={plan.published ? "success" : "outline"}>{plan.published ? "Publicado" : "Rascunho"}</Badge>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="space-y-4 p-5">
            <div className="flex items-center justify-between">
              <h2 className="font-display text-lg font-bold text-text">Leads</h2>
              <Mail className="h-5 w-5 text-primary" />
            </div>
            <div className="space-y-3">
              {coach.leads.length === 0 ? (
                <p className="rounded-xl border border-dashed border-border p-5 text-sm text-text-muted">
                  Os interessados por formulario, WhatsApp ou convite aparecem aqui antes de virar atleta.
                </p>
              ) : (
                coach.leads.map((lead) => (
                  <div key={lead.id} className="rounded-xl border border-border p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-semibold text-text">{lead.name}</p>
                        <p className="text-xs text-text-muted">{lead.email ?? lead.phone ?? "Sem contato"}</p>
                      </div>
                      <Badge variant="info">{lead.stage}</Badge>
                    </div>
                    <p className="mt-2 text-xs text-text-muted">
                      Origem: {lead.source} {lead.monthlyFeeCents ? `· proposta ${money(lead.monthlyFeeCents)}` : ""}
                    </p>
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

function MetricCard({
  label,
  value,
  icon,
  tone,
}: {
  label: string;
  value: string;
  icon: ReactNode;
  tone: string;
}) {
  return (
    <Card>
      <CardContent className="flex items-center justify-between gap-3 p-5">
        <div>
          <p className="text-xs uppercase tracking-wide text-text-muted">{label}</p>
          <p className="mt-2 font-display text-2xl font-bold text-text">{value}</p>
        </div>
        <div className={cn("flex h-11 w-11 items-center justify-center rounded-full bg-card-hover", tone)}>
          {icon}
        </div>
      </CardContent>
    </Card>
  );
}
