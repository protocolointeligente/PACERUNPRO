import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const sport  = searchParams.get("sport");
  const level  = searchParams.get("level");
  const goal   = searchParams.get("goal");

  const where: Record<string, unknown> = { published: true };
  if (sport)  where.sport  = sport;
  if (level)  where.level  = level;
  if (goal)   where.goal   = goal;

  const products = await prisma.planProduct.findMany({
    where,
    include: {
      coach: {
        select: {
          slug: true,
          user: { select: { name: true, avatarUrl: true } },
        },
      },
    },
    orderBy: [{ featured: "desc" }, { purchases: "desc" }, { createdAt: "desc" }],
    take: 60,
  });

  // Normalize platform products (null coach) for the response
  const normalized = products.map((p) => ({
    ...p,
    coach: p.coach ?? { slug: null, user: { name: "PACE RUN PRO", avatarUrl: null } },
    isPlatform: p.coachId === null,
  }));

  return NextResponse.json(normalized);
}
