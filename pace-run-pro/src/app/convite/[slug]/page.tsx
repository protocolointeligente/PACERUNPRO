import Link from "next/link";
import { notFound } from "next/navigation";
import { CheckCircle2 } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Logo } from "@/components/logo";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

function money(cents: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(cents / 100);
}

export default async function ConvitePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const coach = await prisma.coach.findFirst({
    where: {
      OR: [{ slug }, { id: slug }],
      deletedAt: null,
    },
    select: {
      id: true,
      publicBio: true,
      specialties: true,
      user: { select: { id: true, name: true } },
      plans: {
        where: { active: true },
        orderBy: [{ highlight: "desc" }, { sortOrder: "asc" }, { priceCents: "asc" }],
        select: {
          id: true,
          name: true,
          description: true,
          priceCents: true,
          period: true,
          features: true,
          highlight: true,
        },
      },
    },
  });

  if (!coach) notFound();

  const cadastroHref = (planId?: string) =>
    `/cadastro?perfil=atleta&coach=${encodeURIComponent(coach.user.id)}${
      planId ? `&planoVenda=${encodeURIComponent(planId)}` : ""
    }`;

  return (
    <main className="min-h-screen bg-background px-5 py-8 text-text">
      <div className="mx-auto max-w-5xl space-y-8">
        <div className="flex items-center justify-between gap-4">
          <Logo />
          <Badge variant="primary">Convite do treinador</Badge>
        </div>

        <section className="space-y-3">
          <h1 className="font-display text-3xl font-bold sm:text-4xl">{coach.user.name}</h1>
          <p className="max-w-2xl text-sm leading-relaxed text-text-muted">
            Escolha um plano da assessoria para criar sua conta e receber os treinos diretamente no PACERUNPRO.
          </p>
          {coach.publicBio && <p className="max-w-3xl text-sm text-text-muted">{coach.publicBio}</p>}
        </section>

        <div className="grid gap-4 md:grid-cols-3">
          {coach.plans.length === 0 ? (
            <Card className="md:col-span-2">
              <CardContent className="space-y-4 p-6">
                <h2 className="font-display text-xl font-bold">Cadastro liberado</h2>
                <p className="text-sm text-text-muted">
                  Este treinador ainda não publicou planos pagos. Você pode criar sua conta gratuita e aguardar a vinculação do plano.
                </p>
                <Link href={cadastroHref()} className={cn(buttonVariants({ size: "sm" }))}>
                  Criar conta
                </Link>
              </CardContent>
            </Card>
          ) : (
            coach.plans.map((plan) => (
              <Card key={plan.id} className={plan.highlight ? "border-primary/50" : undefined}>
                <CardContent className="flex h-full flex-col gap-4 p-5">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between gap-3">
                      <h2 className="font-display text-xl font-bold">{plan.name}</h2>
                      {plan.highlight && <Badge variant="primary">Mais escolhido</Badge>}
                    </div>
                    <p className="font-display text-3xl font-bold">{money(plan.priceCents)}</p>
                    <p className="text-xs uppercase tracking-wide text-text-muted">{plan.period.toLowerCase()}</p>
                    {plan.description && <p className="text-sm text-text-muted">{plan.description}</p>}
                  </div>

                  <div className="space-y-2">
                    {plan.features.map((feature) => (
                      <div key={feature} className="flex items-start gap-2 text-sm text-text-muted">
                        <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                        <span>{feature}</span>
                      </div>
                    ))}
                  </div>

                  <Link href={cadastroHref(plan.id)} className={cn(buttonVariants({ size: "sm" }), "mt-auto")}>
                    Escolher plano
                  </Link>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    </main>
  );
}
