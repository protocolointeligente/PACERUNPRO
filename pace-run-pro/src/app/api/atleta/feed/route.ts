import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth-guard";
import { prisma } from "@/lib/prisma";

// GET /api/atleta/feed — list posts from athletes in same assessoria
export async function GET() {
  const session = await getSession();
  if (!session?.user?.id || session.user.role !== "ATHLETE") {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const athlete = await prisma.athlete.findUnique({
    where: { userId: session.user.id },
    select: { coachId: true },
  });

  // Build the author IDs: own posts + all athletes of the same coach
  let authorIds: string[] = [session.user.id];
  if (athlete?.coachId) {
    const coachmates = await prisma.athlete.findMany({
      where: { coachId: athlete.coachId },
      select: { userId: true },
    });
    authorIds = [...new Set([session.user.id, ...coachmates.map((a) => a.userId)])];

    // Also include the coach's own posts
    const coach = await prisma.coach.findUnique({
      where: { id: athlete.coachId },
      select: { userId: true },
    });
    if (coach) authorIds.push(coach.userId);
  }

  const posts = await prisma.feedPost.findMany({
    where: { authorId: { in: authorIds } },
    select: {
      id: true,
      content: true,
      imageUrl: true,
      workoutSummary: true,
      createdAt: true,
      author: { select: { id: true, name: true, image: true } },
      likes: { select: { userId: true } },
      comments: {
        select: {
          id: true,
          content: true,
          createdAt: true,
          author: { select: { id: true, name: true } },
        },
        orderBy: { createdAt: "asc" },
        take: 3,
      },
    },
    orderBy: { createdAt: "desc" },
    take: 30,
  });

  const result = posts.map((p) => ({
    id: p.id,
    content: p.content,
    imageUrl: p.imageUrl,
    workoutSummary: p.workoutSummary,
    createdAt: p.createdAt,
    author: p.author,
    likesCount: p.likes.length,
    likedByMe: p.likes.some((l) => l.userId === session.user?.id),
    comments: p.comments,
  }));

  return NextResponse.json({ posts: result });
}

// POST /api/atleta/feed — create a new post
export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session?.user?.id || session.user.role !== "ATHLETE") {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const body = await req.json().catch(() => ({}));
  const content = typeof body.content === "string" ? body.content.trim() : "";
  if (!content || content.length > 1000) {
    return NextResponse.json({ error: "Conteúdo inválido" }, { status: 400 });
  }

  const workoutSummary = body.workoutSummary ?? null;

  const post = await prisma.feedPost.create({
    data: {
      authorId: session.user.id,
      content,
      workoutSummary,
    },
    select: {
      id: true,
      content: true,
      createdAt: true,
      author: { select: { id: true, name: true, image: true } },
    },
  });

  return NextResponse.json({ post }, { status: 201 });
}
