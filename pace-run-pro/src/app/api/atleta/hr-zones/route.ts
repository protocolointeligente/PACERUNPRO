import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth-guard";
import { prisma } from "@/lib/prisma";
import { maxHrTanaka, calculateHrZones } from "@/lib/calculations";

export async function GET() {
  const session = await getSession();
  if (!session?.user?.id || session.user.role !== "ATHLETE") {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }

  const athlete = await prisma.athlete.findUnique({
    where: { userId: session.user.id },
    select: {
      birthDate: true,
      loadParams: { select: { hrMax: true, hrRest: true } },
      metrics: {
        select: { restingHr: true },
        orderBy: { date: "desc" },
        take: 1,
      },
    },
  });

  if (!athlete) return NextResponse.json(null);

  // Age from birthDate
  let age: number | null = null;
  if (athlete.birthDate) {
    const today = new Date();
    const birth = new Date(athlete.birthDate);
    age = today.getFullYear() - birth.getFullYear();
    const hasBirthday =
      today.getMonth() > birth.getMonth() ||
      (today.getMonth() === birth.getMonth() && today.getDate() >= birth.getDate());
    if (!hasBirthday) age--;
  }

  // Max HR: use stored value from load params if available, else Tanaka estimate
  const hrMaxStored = athlete.loadParams?.hrMax ?? null;
  const hrMaxTanaka = age !== null ? maxHrTanaka(age) : null;
  const hrMax = hrMaxStored ?? hrMaxTanaka;

  // Resting HR: stored load param → latest metric → default 60
  const hrRest =
    athlete.loadParams?.hrRest ??
    athlete.metrics[0]?.restingHr ??
    60;

  if (!hrMax) return NextResponse.json({ zones: null, hrMax: null, hrRest, age, source: null });

  const zones = calculateHrZones(hrMax, hrRest);
  const source = hrMaxStored ? "medido" : "tanaka";

  return NextResponse.json({ zones, hrMax, hrRest, age, source });
}
