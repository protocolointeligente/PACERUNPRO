import { getSession } from "@/lib/auth-guard";
import { redirect } from "next/navigation";
import { headers } from "next/headers";
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

// Paths that skip the PAR-Q / initial-test gate (onboarding flow itself + profile)
const GATE_EXEMPT_PREFIXES = [
  "/atleta/parq",
  "/atleta/teste-inicial",
  "/atleta/perfil",
];

function ageFromBirthDate(birthDate: Date): number {
  const now = new Date();
  const diff = now.getFullYear() - birthDate.getFullYear();
  const hasBirthdayPassed =
    now.getMonth() > birthDate.getMonth() ||
    (now.getMonth() === birthDate.getMonth() && now.getDate() >= birthDate.getDate());
  return hasBirthdayPassed ? diff : diff - 1;
}

export default async function AtletaLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  if (!session?.user?.id) redirect("/login");
  if (session.user?.role === "ADMIN") redirect("/admin");
  if (session.user?.role === "COACH") redirect("/treinador/dashboard");

  const hdrs = await headers();
  const pathname = hdrs.get("x-pathname") ?? "";

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      name: true,
      avatarUrl: true,
      athlete: {
        select: {
          goal: true,
          birthDate: true,
          parqAccepted: true,
          _count: { select: { performanceTests: true } },
        },
      },
    },
  }).catch(() => null);

  const isExempt = GATE_EXEMPT_PREFIXES.some((p) => pathname.startsWith(p));

  if (!isExempt && user?.athlete) {
    const { goal, birthDate, parqAccepted } = user.athlete;

    // P0-3: PAR-Q gate — required for age >= 40 or high-distance goals
    const age = birthDate ? ageFromBirthDate(birthDate) : null;
    const isHighRisk =
      (age !== null && age >= 40) ||
      goal === "QUARENTA_E_DOIS_KM" ||
      goal === "ULTRAMARATONA";

    if (isHighRisk && !parqAccepted) {
      redirect("/atleta/parq");
    }

    // P0-4: Initial test gate — all athletes must have at least one PerformanceTest
    if (user.athlete._count.performanceTests === 0) {
      redirect("/atleta/teste-inicial");
    }
  }

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
