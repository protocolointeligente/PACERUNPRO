import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowRight, Mail, Phone, Users } from "lucide-react";
import { getSession } from "@/lib/auth-guard";
import { prisma } from "@/lib/prisma";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

function initials(name: string) {
  return name.split(" ").filter(Boolean).slice(0, 2).map((part) => part[0]?.toUpperCase()).join("");
}

export default async function CoachCrmPage() {
  const session = await getSession();
  if (!session?.user?.id) redirect("/login");

  const coach = await prisma.coach.findUnique({
    where: { userId: session.user.id },
    select: {
      id: true,
      leads: {
        orderBy: { createdAt: "desc" },
        select: { id: true, name: true, email: true, phone: true, source: true, stage: true, monthlyFeeCents: true },
      },
      athletes: {
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          status: true,
          adherenceRate: true,
          user: { select: { name: true, email: true, avatarUrl: true } },
          coachPlanPurchases: {
            orderBy: { createdAt: "desc" },
            take: 1,
            select: { status: true, plan: { select: { name: true } } },
          },
        },
      },
    },
  });

  if (!coach) redirect("/login");

  const activeAthletes = coach.athletes.filter((athlete) => athlete.status !== "inativo").length;
  const openLeads = coach.leads.filter((lead) => !["ganho", "perdido"].includes(lead.stage)).length;
  const payingAthletes = coach.athletes.filter((athlete) => athlete.coachPlanPurchases[0]?.status === "paid").length;

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <Badge variant="primary">CRM</Badge>
          <h1 className="mt-3 font-display text-3xl font-bold text-text">Atletas, leads e contratos</h1>
          <p className="mt-2 max-w-2xl text-sm text-text-muted">
            Pipeline real da assessoria: convites, leads, atletas ativos e planos contratados em um só lugar.
          </p>
        </div>
        <Link href="/treinador/gestao" className={cn(buttonVariants({ variant: "secondary", size: "sm" }))}>
          Gestão completa <ArrowRight className="h-4 w-4" />
        </Link>
      </div>

      <div className="grid gap-3 md:grid-cols-3">
        <Metric label="Atletas ativos" value={String(activeAthletes)} />
        <Metric label="Leads abertos" value={String(openLeads)} />
        <Metric label="Pagantes" value={String(payingAthletes)} />
      </div>

      <div className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
        <Card>
          <CardContent className="p-0">
            <SectionTitle title="Atletas" subtitle="Carteira atual do treinador." />
            <div className="divide-y divide-border">
              {coach.athletes.length === 0 ? (
                <Empty text="Nenhum atleta vinculado ainda." />
              ) : coach.athletes.map((athlete) => {
                const purchase = athlete.coachPlanPurchases[0];
                return (
                  <Link key={athlete.id} href={`/treinador/atletas/${athlete.id}`} className="flex items-center gap-3 px-5 py-4 transition-colors hover:bg-card-hover">
                    {athlete.user.avatarUrl ? (
                      <img src={athlete.user.avatarUrl} alt="" className="h-11 w-11 rounded-full object-cover" />
                    ) : (
                      <span className="flex h-11 w-11 items-center justify-center rounded-full bg-primary/12 text-sm font-bold text-primary">
                        {initials(athlete.user.name)}
                      </span>
                    )}
                    <span className="min-w-0 flex-1">
                      <span className="block truncate font-semibold text-text">{athlete.user.name}</span>
                      <span className="block truncate text-xs text-text-muted">{athlete.user.email}</span>
                    </span>
                    <span className="hidden text-right text-xs text-text-muted sm:block">
                      {purchase?.plan.name ?? "Sem plano"}
                      <span className="block">{Math.round((athlete.adherenceRate ?? 0) * 100)}% aderência</span>
                    </span>
                    <ArrowRight className="h-4 w-4 text-primary" />
                  </Link>
                );
              })}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-0">
            <SectionTitle title="Leads" subtitle="Contatos ainda não convertidos." />
            <div className="divide-y divide-border">
              {coach.leads.length === 0 ? (
                <Empty text="Nenhum lead registrado." />
              ) : coach.leads.map((lead) => (
                <div key={lead.id} className="space-y-2 px-5 py-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-semibold text-text">{lead.name}</p>
                      <p className="text-xs text-text-muted">{lead.source ?? "origem não informada"}</p>
                    </div>
                    <Badge variant={lead.stage === "ganho" ? "success" : lead.stage === "perdido" ? "danger" : "outline"}>{lead.stage}</Badge>
                  </div>
                  <div className="flex flex-wrap gap-3 text-xs text-text-muted">
                    {lead.email && <span className="inline-flex items-center gap-1"><Mail className="h-3.5 w-3.5" />{lead.email}</span>}
                    {lead.phone && <span className="inline-flex items-center gap-1"><Phone className="h-3.5 w-3.5" />{lead.phone}</span>}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <Card>
      <CardContent className="flex items-center justify-between p-5">
        <div>
          <p className="text-xs uppercase tracking-wide text-text-muted">{label}</p>
          <p className="mt-2 font-display text-3xl font-bold text-text">{value}</p>
        </div>
        <Users className="h-6 w-6 text-primary" />
      </CardContent>
    </Card>
  );
}

function SectionTitle({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <div className="border-b border-border px-5 py-4">
      <h2 className="font-display text-lg font-bold text-text">{title}</h2>
      <p className="text-sm text-text-muted">{subtitle}</p>
    </div>
  );
}

function Empty({ text }: { text: string }) {
  return <div className="px-5 py-10 text-sm text-text-muted">{text}</div>;
}
