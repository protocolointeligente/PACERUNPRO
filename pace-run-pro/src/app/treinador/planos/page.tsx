import Link from "next/link";
import { getSession } from "@/lib/auth-guard";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { CheckCircle2, Zap } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { b2bPlans } from "@/lib/mock-data";

const PLAN_CHECKOUT_MAP: Record<string, string> = {
  "b2b-starter": "b2b-starter",
  "b2b-pro": "b2b-pro",
  "b2b-assessoria": "b2b-assessoria",
  "b2b-unlimited": "b2b-unlimited",
};

export default async function TreinadorPlanosPage() {
  const session = await getSession();
  if (!session?.user?.id) redirect("/login");

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      name: true,
      subscriptions: {
        orderBy: { startedAt: "desc" },
        take: 1,
        select: { plan: true, status: true, renewsAt: true },
      },
    },
  }).catch(() => null);

  const sub = user?.subscriptions?.[0];
  const now = new Date();
  const isExpired = sub?.renewsAt != null && sub.renewsAt < now;
  const daysLeft = sub?.renewsAt
    ? Math.max(0, Math.ceil((sub.renewsAt.getTime() - now.getTime()) / 86400000))
    : 0;

  const paidPlans = b2bPlans.filter((p) => p.price > 0);

  return (
    <div className="min-h-dvh bg-background text-text">
      <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6">
        {/* Header */}
        <div className="mb-10 text-center">
          {isExpired ? (
            <>
              <Badge variant="danger" className="mb-4">
                <Zap className="h-3 w-3" /> Acesso expirado
              </Badge>
              <h1 className="font-display text-3xl font-extrabold text-text sm:text-4xl">
                Seu período gratuito encerrou
              </h1>
              <p className="mt-3 max-w-xl mx-auto text-sm text-text-muted">
                Escolha um plano para continuar usando o PACE RUN PRO. Seu histórico e dados estão preservados.
              </p>
            </>
          ) : (
            <>
              <Badge variant="primary" className="mb-4">
                <Zap className="h-3 w-3" /> {daysLeft} dias restantes
              </Badge>
              <h1 className="font-display text-3xl font-extrabold text-text sm:text-4xl">
                Faça upgrade do seu plano
              </h1>
              <p className="mt-3 max-w-xl mx-auto text-sm text-text-muted">
                Desbloqueie mais atletas, gestão financeira, CRM de leads e muito mais.
              </p>
            </>
          )}
        </div>

        {/* Plans grid */}
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {paidPlans.map((plan) => (
            <div
              key={plan.id}
              className={[
                "relative flex flex-col rounded-2xl border p-6",
                plan.highlight
                  ? "border-primary/60 bg-primary/10"
                  : "border-border bg-card",
              ].join(" ")}
            >
              {plan.badge && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <Badge variant="primary" className="shadow-lg shadow-primary/20 whitespace-nowrap text-[10px]">
                    {plan.badge}
                  </Badge>
                </div>
              )}

              <h3 className="font-display text-base font-bold text-text">{plan.name}</h3>
              <div className="mt-3 flex items-end gap-1">
                <span className="font-display text-3xl font-extrabold text-text">
                  R$ {plan.price}
                </span>
                <span className="mb-1 text-sm text-text-muted">/mês</span>
              </div>
              <p className="mt-1 text-xs text-text-muted">
                {plan.maxAthletes === null ? "Atletas ilimitados" : `Até ${plan.maxAthletes} atletas`}
              </p>

              <ul className="mt-4 flex-1 space-y-2">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-start gap-2 text-xs text-text-muted">
                    <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-success mt-0.5" />
                    {f}
                  </li>
                ))}
              </ul>

              <Link
                href={`/checkout/b2b?plano=${PLAN_CHECKOUT_MAP[plan.id] ?? plan.id}`}
                className={[
                  "mt-6 block w-full rounded-xl py-3 text-center text-sm font-bold transition-all",
                  plan.highlight
                    ? "bg-primary text-background hover:bg-primary/90"
                    : "border border-border bg-card-hover text-text hover:border-primary/40",
                ].join(" ")}
              >
                Assinar {plan.name}
              </Link>
            </div>
          ))}
        </div>

        {/* Free plan note */}
        <p className="mt-8 text-center text-xs text-text-muted">
          Precisa de um plano gratuito?{" "}
          <Link href="/treinador/dashboard" className="font-semibold text-primary hover:underline">
            Continuar com 1 atleta grátis
          </Link>
        </p>
      </div>
    </div>
  );
}
