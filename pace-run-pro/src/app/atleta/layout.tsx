import { auth } from "@/auth";
import type { Session } from "next-auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { AppShell } from "@/components/layout/app-shell";
import { BottomNav } from "@/components/layout/bottom-nav";
import { athleteNav, athleteMoreNav } from "@/components/layout/nav-config";

const GOAL_LABELS: Record<string, string> = {
  CINCO_KM: "5 km",
  DEZ_KM: "10 km",
  VINTE_E_UM_KM: "21 km — Meia Maratona",
  QUARENTA_E_DOIS_KM: "42 km — Maratona",
  ULTRAMARATONA: "Ultramaratona",
  EMAGRECIMENTO: "Emagrecimento",
  PERFORMANCE: "Performance",
  RETORNO_AS_CORRIDAS: "Retorno às corridas",
};

export default async function AtletaLayout({ children }: { children: React.ReactNode }) {
  let session: Session | null = null;
  try {
    session = await auth();
  } catch {
    redirect("/login");
  }
  if (!session?.user?.id) redirect("/login");
  if (session.user?.role === "ADMIN") redirect("/admin");
  if (session.user?.role === "COACH") redirect("/treinador/dashboard");

  let user: { name: string; avatarUrl: string | null; athlete: { goal: string | null } | null } | null = null;
  try {
    user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        name: true,
        avatarUrl: true,
        athlete: { select: { goal: true } },
      },
    });
  } catch {
    redirect("/login");
  }

  const goalLabel = GOAL_LABELS[user?.athlete?.goal ?? ""] ?? "Atleta";

  return (
    <AppShell
      nav={athleteNav}
      moreNav={athleteMoreNav}
      roleLabel="Atleta"
      userName={user?.name ?? session.user?.name ?? "Atleta"}
      userSubtitle={goalLabel}
      avatarUrl={user?.avatarUrl ?? undefined}
    >
      {children}
      <BottomNav items={athleteNav} />
    </AppShell>
  );
}
