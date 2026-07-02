import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth-guard";
import { prisma } from "@/lib/prisma";

type Params = { params: Promise<{ id: string }> };

async function getCoachId(session: Awaited<ReturnType<typeof getSession>>) {
  if (!session?.user?.id || session.user.role !== "COACH") return null;
  const coach = await prisma.coach.findUnique({ where: { userId: session.user.id }, select: { id: true } });
  return coach?.id ?? null;
}

// GET — full course structure (modules + lessons)
export async function GET(_req: NextRequest, { params }: Params) {
  const { id: productId } = await params;
  const session = await getSession();
  const coachId = await getCoachId(session);
  if (!coachId) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const course = await prisma.marketplaceProduct.findFirst({
    where: { id: productId, coachId, type: "CURSO" },
    include: {
      courseModules: {
        orderBy: { position: "asc" },
        include: { lessons: { orderBy: { position: "asc" } } },
      },
    },
  });
  if (!course) return NextResponse.json({ error: "Curso não encontrado" }, { status: 404 });

  return NextResponse.json(course);
}

// POST — add module
export async function POST(req: NextRequest, { params }: Params) {
  const { id: productId } = await params;
  const session = await getSession();
  const coachId = await getCoachId(session);
  if (!coachId) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const course = await prisma.marketplaceProduct.findFirst({ where: { id: productId, coachId } });
  if (!course) return NextResponse.json({ error: "Curso não encontrado" }, { status: 404 });

  const body = await req.json();
  const { title, lessons } = body;
  if (!title) return NextResponse.json({ error: "title obrigatório" }, { status: 400 });

  const maxPos = await prisma.courseModule.aggregate({ where: { productId }, _max: { position: true } });
  const position = (maxPos._max.position ?? -1) + 1;

  const courseModule = await prisma.courseModule.create({
    data: {
      productId,
      title,
      position,
      lessons: lessons?.length ? {
        create: lessons.map((l: { title: string; videoUrl?: string; duration?: number; isPreview?: boolean; content?: string }, i: number) => ({
          title: l.title,
          videoUrl: l.videoUrl ?? null,
          duration: l.duration ?? null,
          isPreview: l.isPreview ?? false,
          content: l.content ?? null,
          position: i,
        })),
      } : undefined,
    },
    include: { lessons: true },
  });

  return NextResponse.json(courseModule, { status: 201 });
}

// PATCH — update module or lesson
export async function PATCH(req: NextRequest, { params }: Params) {
  const { id: productId } = await params;
  const session = await getSession();
  const coachId = await getCoachId(session);
  if (!coachId) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const course = await prisma.marketplaceProduct.findFirst({ where: { id: productId, coachId } });
  if (!course) return NextResponse.json({ error: "Não encontrado" }, { status: 404 });

  const body = await req.json();
  const { moduleId, lessonId, ...data } = body;

  if (lessonId) {
    const lesson = await prisma.courseLesson.update({ where: { id: lessonId }, data });
    return NextResponse.json(lesson);
  }
  if (moduleId) {
    const mod = await prisma.courseModule.update({ where: { id: moduleId }, data });
    return NextResponse.json(mod);
  }

  return NextResponse.json({ error: "moduleId ou lessonId obrigatório" }, { status: 400 });
}

// DELETE — remove module or lesson
export async function DELETE(req: NextRequest, { params }: Params) {
  const { id: productId } = await params;
  const session = await getSession();
  const coachId = await getCoachId(session);
  if (!coachId) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const course = await prisma.marketplaceProduct.findFirst({ where: { id: productId, coachId } });
  if (!course) return NextResponse.json({ error: "Não encontrado" }, { status: 404 });

  const { searchParams } = new URL(req.url);
  const moduleId = searchParams.get("moduleId");
  const lessonId = searchParams.get("lessonId");

  if (lessonId) {
    await prisma.courseLesson.delete({ where: { id: lessonId } });
  } else if (moduleId) {
    await prisma.courseModule.delete({ where: { id: moduleId } });
  } else {
    return NextResponse.json({ error: "moduleId ou lessonId obrigatório" }, { status: 400 });
  }

  return NextResponse.json({ ok: true });
}
