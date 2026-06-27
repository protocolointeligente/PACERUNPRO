import { getSession } from "@/lib/auth-guard";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { canAccess } from "@/lib/coach-permissions";
import PlanosVendaClient from "./_planos-venda-client";

function subPlanToBillingPlan(plan: string): string {
  if (plan === "TEAM") return "b2b-unlimited";
  if (plan === "COACH") return "b2b-pro";
  if (plan === "ATHLETE") return "b2b-starter";
  return "b2b-free";
}

export default async function PlanosVendaPage() {
  const session = await getSession();
  if (!session?.user?.id) redirect("/login");

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      subscriptions: {
        orderBy: { startedAt: "desc" },
        take: 1,
        select: { plan: true, status: true, renewsAt: true },
      },
    },
  });

  const sub = user?.subscriptions?.[0];
  const now = new Date();
  const isExpired = sub?.renewsAt != null && sub.renewsAt < now;
  const isActiveOrTrial = (sub?.status === "ACTIVE" || sub?.status === "TRIAL") && !isExpired;
  const planId = isActiveOrTrial ? subPlanToBillingPlan(sub!.plan) : "b2b-free";

  if (!canAccess("owner", "planos-venda", planId)) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-24 text-center">
        <p className="text-lg font-semibold text-text">Recurso não disponível no seu plano</p>
        <p className="text-sm text-text-muted">
          Faça upgrade para o plano Starter ou superior para usar Planos de Venda.
        </p>
        <a
          href="/treinador/planos"
          className="rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-white"
        >
          Ver planos
        </a>
      </div>
    );
  }

  return <PlanosVendaClient />;
}
