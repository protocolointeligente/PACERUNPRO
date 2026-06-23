import { getSession } from "@/lib/auth-guard";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import TreinadorLayoutClient from "./_layout-client";

function subPlanToBillingPlan(plan: string): string {
  if (plan === "TEAM") return "b2b-unlimited";
  if (plan === "COACH") return "b2b-pro";
  if (plan === "ATHLETE") return "b2b-starter";
  return "b2b-free";
}

export default async function TreinadorLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  if (!session?.user?.id) redirect("/login");
  if (session.user?.role === "ADMIN") redirect("/admin");
  if (session.user?.role !== "COACH") redirect("/atleta/dashboard");

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      name: true,
      avatarUrl: true,
      coach: { select: { credential: true } },
      subscriptions: {
        orderBy: { startedAt: "desc" },
        take: 1,
        select: { plan: true, status: true },
      },
    },
  }).catch(() => null);

  const sub = user?.subscriptions?.[0];
  const planId =
    sub?.status === "ACTIVE" || sub?.status === "TRIAL"
      ? subPlanToBillingPlan(sub.plan)
      : "b2b-free";

  return (
    <TreinadorLayoutClient
      userName={user?.name ?? session.user?.name ?? "Treinador"}
      userCredential={user?.coach?.credential ?? ""}
      userAvatarUrl={user?.avatarUrl ?? undefined}
      planId={planId}
    >
      {children}
    </TreinadorLayoutClient>
  );
}
