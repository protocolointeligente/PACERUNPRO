import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;

  const coach = await prisma.coach.findUnique({
    where: { slug },
    include: {
      user: { select: { name: true, city: true, state: true } },
      plans: {
        where: { active: true },
        orderBy: { sortOrder: "asc" },
      },
    },
  });

  if (!coach) {
    return NextResponse.json({ error: "Assessoria não encontrada" }, { status: 404 });
  }

  return NextResponse.json({
    name: coach.user.name,
    city: coach.user.city,
    state: coach.user.state,
    bio: coach.publicBio ?? coach.bio,
    credential: coach.credential,
    specialties: coach.specialties,
    logoUrl: coach.logoUrl,
    whatsapp: coach.whatsapp,
    slug: coach.slug,
    plans: coach.plans.map((p) => ({
      id: p.id,
      name: p.name,
      description: p.description,
      priceCents: p.priceCents,
      period: p.period,
      features: p.features,
      highlight: p.highlight,
      maxSlots: p.maxSlots,
      usedSlots: p.usedSlots,
    })),
  });
}
