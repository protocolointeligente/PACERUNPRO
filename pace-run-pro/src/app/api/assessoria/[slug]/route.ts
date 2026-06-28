import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;

  const store = await prisma.marketplaceStore.findUnique({
    where: { slug, isActive: true },
    include: {
      coach: {
        select: {
          id: true,
          slug: true,
          bio: true,
          publicBio: true,
          logoUrl: true,
          whatsapp: true,
          user: { select: { name: true, avatarUrl: true } },
        },
      },
      products: {
        where: { published: true },
        orderBy: [{ featured: "desc" }, { purchases: "desc" }],
      },
    },
  });

  if (!store) {
    // Fallback: try to find by coach.slug and build a virtual store
    const coach = await prisma.coach.findUnique({
      where: { slug },
      select: {
        id: true,
        slug: true,
        bio: true,
        publicBio: true,
        logoUrl: true,
        whatsapp: true,
        user: { select: { name: true, avatarUrl: true } },
        planProducts: {
          where: { published: true },
          orderBy: [{ featured: "desc" }, { purchases: "desc" }],
          take: 20,
        },
      },
    });

    if (!coach) return NextResponse.json({ error: "Assessoria não encontrada" }, { status: 404 });

    return NextResponse.json({
      id: null,
      name: coach.user.name ?? coach.slug ?? "Assessoria",
      slug: coach.slug,
      description: coach.publicBio ?? coach.bio,
      logoUrl: coach.logoUrl,
      coach: { slug: coach.slug, user: coach.user, publicBio: coach.publicBio, whatsapp: coach.whatsapp },
      products: [],
      planProducts: coach.planProducts,
    });
  }

  return NextResponse.json({
    ...store,
    planProducts: [],
  });
}
