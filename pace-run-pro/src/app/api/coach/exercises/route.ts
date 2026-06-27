import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth-guard";
import { prisma } from "@/lib/prisma";

const CATEGORY_MAP: Record<string, string> = {
  Força: "FORCA",
  Hipertrofia: "HIPERTROFIA",
  Core: "CORE",
  Mobilidade: "MOBILIDADE",
  Pliometria: "PLIOMETRIA",
  Prevenção: "PREVENCAO",
  Glúteos: "GLUTEOS",
  Panturrilhas: "PANTURRILHAS",
  Joelho: "JOELHO",
  Quadril: "QUADRIL",
  Tornozelo: "TORNOZELO",
};

export async function GET() {
  const session = await getSession();
  if (!session?.user?.id || session.user.role !== "COACH") {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const coach = await prisma.coach.findUnique({ where: { userId: session.user.id } });
  if (!coach) return NextResponse.json({ error: "Coach não encontrado" }, { status: 404 });

  const exercises = await prisma.exercise.findMany({
    where: { coachId: coach.id },
    include: { videos: true },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(
    exercises.map((e) => ({
      id: e.id,
      name: e.name,
      category: e.category,
      description: e.description,
      execution: e.execution,
      commonMistakes: e.commonMistakes,
      musclesWorked: e.musclesWorked,
      imageUrl: e.imageUrl,
      videoUrl: e.videos[0]?.url ?? null,
      videoTitle: e.videos[0]?.title ?? null,
      createdAt: e.createdAt,
    }))
  );
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session?.user?.id || session.user.role !== "COACH") {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const coach = await prisma.coach.findUnique({ where: { userId: session.user.id } });
  if (!coach) return NextResponse.json({ error: "Coach não encontrado" }, { status: 404 });

  const body = await req.json();
  const { name, category, description, execution, commonMistakes, musclesWorked, imageUrl, videoUrl, videoTitle } = body;

  if (!name?.trim() || !category) {
    return NextResponse.json({ error: "Nome e categoria são obrigatórios" }, { status: 400 });
  }

  const dbCategory = CATEGORY_MAP[category] ?? category;

  const exercise = await prisma.exercise.create({
    data: {
      coachId: coach.id,
      name: name.trim(),
      category: dbCategory as never,
      description: description?.trim() ?? null,
      execution: execution?.trim() ?? null,
      commonMistakes: commonMistakes?.trim() ?? null,
      musclesWorked: Array.isArray(musclesWorked) ? musclesWorked : [],
      imageUrl: imageUrl?.trim() || null,
      ...(videoUrl?.trim()
        ? {
            videos: {
              create: {
                url: videoUrl.trim(),
                title: videoTitle?.trim() || name.trim(),
              },
            },
          }
        : {}),
    },
    include: { videos: true },
  });

  return NextResponse.json({
    id: exercise.id,
    name: exercise.name,
    category: exercise.category,
    description: exercise.description,
    execution: exercise.execution,
    commonMistakes: exercise.commonMistakes,
    musclesWorked: exercise.musclesWorked,
    imageUrl: exercise.imageUrl,
    videoUrl: exercise.videos[0]?.url ?? null,
    videoTitle: exercise.videos[0]?.title ?? null,
    createdAt: exercise.createdAt,
  });
}
