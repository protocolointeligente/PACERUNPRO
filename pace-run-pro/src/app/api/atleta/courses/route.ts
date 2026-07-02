import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth-guard";
import { prisma } from "@/lib/prisma";

async function getAthleteId(session: Awaited<ReturnType<typeof getSession>>) {
  if (!session?.user?.id) return null;
  const athlete = await prisma.athlete.findUnique({ where: { userId: session.user.id }, select: { id: true } });
  return athlete?.id ?? null;
}

// GET — athlete's enrolled courses with progress
export async function GET(req: NextRequest) {
  const session = await getSession();
  const athleteId = await getAthleteId(session);
  if (!athleteId) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const courseId = searchParams.get("courseId");

  if (courseId) {
    // Full course detail with progress
    const course = await prisma.marketplaceProduct.findFirst({
      where: { id: courseId, type: "CURSO" },
      include: {
        courseModules: {
          orderBy: { position: "asc" },
          include: {
            lessons: {
              orderBy: { position: "asc" },
              include: {
                progress: {
                  where: { athleteId },
                  select: { id: true, completedAt: true },
                },
              },
            },
          },
        },
        coach: { select: { user: { select: { name: true, avatarUrl: true } } } },
      },
    });
    if (!course) return NextResponse.json({ error: "Curso não encontrado" }, { status: 404 });

    const totalLessons = course.courseModules.reduce((s, m) => s + m.lessons.length, 0);
    const completedLessons = course.courseModules.reduce(
      (s, m) => s + m.lessons.filter((l) => l.progress.length > 0).length,
      0
    );

    return NextResponse.json({
      ...course,
      totalLessons,
      completedLessons,
      progressPct: totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0,
    });
  }

  // List: courses the athlete has purchased (via MarketplaceOrder items)
  const orders = await prisma.marketplaceOrderItem.findMany({
    where: {
      order: { athleteId, status: "PAID" },
      product: { type: "CURSO" },
    },
    include: {
      product: {
        include: {
          courseModules: {
            include: {
              lessons: {
                select: {
                  id: true,
                  progress: { where: { athleteId }, select: { id: true } },
                },
              },
            },
          },
          coach: { select: { user: { select: { name: true, avatarUrl: true } } } },
        },
      },
    },
  });

  const courses = orders.map(({ product }) => {
    const totalLessons = product.courseModules.reduce((s, m) => s + m.lessons.length, 0);
    const completedLessons = product.courseModules.reduce(
      (s, m) => s + m.lessons.filter((l) => l.progress.length > 0).length,
      0
    );
    return {
      ...product,
      totalLessons,
      completedLessons,
      progressPct: totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0,
    };
  });

  return NextResponse.json(courses);
}

// POST — mark lesson as completed / uncomplete
export async function POST(req: NextRequest) {
  const session = await getSession();
  const athleteId = await getAthleteId(session);
  if (!athleteId) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const { lessonId, completed } = await req.json();
  if (!lessonId) return NextResponse.json({ error: "lessonId obrigatório" }, { status: 400 });

  if (completed === false) {
    await prisma.courseLessonProgress.deleteMany({ where: { lessonId, athleteId } });
    return NextResponse.json({ ok: true, completed: false });
  }

  await prisma.courseLessonProgress.upsert({
    where: { lessonId_athleteId: { lessonId, athleteId } },
    create: { lessonId, athleteId },
    update: {},
  });

  return NextResponse.json({ ok: true, completed: true });
}
