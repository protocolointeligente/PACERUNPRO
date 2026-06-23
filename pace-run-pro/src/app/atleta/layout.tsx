import { getSession } from "@/lib/auth-guard";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import AtletaLayoutClient from "./_layout-client";

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
  const session = await getSession();
  if (!session?.user?.id) redirect("/login");
  if (session.user?.role === "ADMIN") redirect("/admin");
  if (session.user?.role === "COACH") redirect("/treinador/dashboard");

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      name: true,
      avatarUrl: true,
      athlete: { select: { goal: true } },
    },
  }).catch(() => null);

  const goalLabel = GOAL_LABELS[user?.athlete?.goal ?? ""] ?? "Atleta";

  return (
    <AtletaLayoutClient
      userName={user?.name ?? session.user?.name ?? "Atleta"}
      userSubtitle={goalLabel}
      avatarUrl={user?.avatarUrl ?? undefined}
    >
      {children}
    </AtletaLayoutClient>
  );
}
