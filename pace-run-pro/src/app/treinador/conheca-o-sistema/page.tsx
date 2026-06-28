import { getSession } from "@/lib/auth-guard";
import { prisma } from "@/lib/prisma";
import ConhecaOSistemaClient from "./_page-client";

function subPlanToBillingPlan(plan: string): string {
  if (plan === "TEAM") return "b2b-unlimited";
  if (plan === "COACH") return "b2b-pro";
  if (plan === "ATHLETE") return "b2b-starter";
  return "b2b-free";
}

export default async function ConhecaOSistemaPage() {
  const session = await getSession();

  let planId = "b2b-free";

  if (session?.user?.id) {
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
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
    const isActiveOrTrial = (sub?.status === "ACTIVE" || sub?.status === "TRIAL") && !isExpired;
    if (isActiveOrTrial && sub) {
      planId = subPlanToBillingPlan(sub.plan);
    }
  }

  return <ConhecaOSistemaClient planId={planId} />;
}
