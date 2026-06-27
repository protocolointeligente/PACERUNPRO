import { getSession } from "@/lib/auth-guard";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { canAccess } from "@/lib/coach-permissions";
import { Badge } from "@/components/ui/badge";
import { VoucherManager } from "@/components/vouchers/voucher-manager";

function subPlanToBillingPlan(plan: string): string {
  if (plan === "TEAM") return "b2b-unlimited";
  if (plan === "COACH") return "b2b-pro";
  if (plan === "ATHLETE") return "b2b-starter";
  return "b2b-free";
}

export default async function CoachVouchersPage() {
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

  if (!canAccess("owner", "vouchers", planId)) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-24 text-center">
        <p className="text-lg font-semibold text-text">Recurso não disponível no seu plano</p>
        <p className="text-sm text-text-muted">
          Faça upgrade para o plano Pro ou superior para usar Vouchers.
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

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div>
        <Badge variant="primary" className="mb-2">Promoções</Badge>
        <h1 className="font-display text-2xl font-bold text-text sm:text-3xl">Vouchers de desconto</h1>
        <p className="mt-1 text-sm text-text-muted">
          Crie cupons para presentear ou divulgar seus planos — desconto percentual ou meses grátis.
        </p>
      </div>

      <VoucherManager />
    </div>
  );
}
