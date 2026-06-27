import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth-guard";
import { prisma } from "@/lib/prisma";

// ─── GET — paginated public feed ──────────────────────────────────────────────

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const cursor = searchParams.get("cursor") ?? undefined;
  const take = 20;

  const posts = await prisma.feedPost.findMany({
    take,
    ...(cursor ? { skip: 1, cursor: { id: cursor } } : {}),
    orderBy: { createdAt: "desc" },
    include: {
      author: { select: { id: true, name: true, avatarUrl: true } },
      likes: { select: { userId: true } },
      comments: {
        orderBy: { createdAt: "asc" },
        take: 3,
        include: {
          author: { select: { name: true, avatarUrl: true } },
        },
      },
      _count: { select: { likes: true, comments: true } },
    },
  });

  const result = posts.map((p) => ({
    id: p.id,
    author: p.author,
    content: p.content,
    imageUrl: p.imageUrl,
    workoutSummary: p.workoutSummary,
    likeCount: p._count.likes,
    commentCount: p._count.comments,
    isLiked: p.likes.some((l) => l.userId === session.user!.id),
    comments: p.comments.map((c) => ({
      author: c.author,
      content: c.content,
      createdAt: c.createdAt.toISOString(),
    })),
    createdAt: p.createdAt.toISOString(),
  }));

  const nextCursor = posts.length === take ? posts[posts.length - 1].id : null;

  return NextResponse.json({ posts: result, nextCursor });
}

// ─── POST — create a feed post ────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const body = await req.json();
  const content = (body.content as string | undefined)?.trim();
  if (!content || content.length < 2) {
    return NextResponse.json({ error: "Texto muito curto" }, { status: 400 });
  }
  if (content.length > 1000) {
    return NextResponse.json({ error: "Texto muito longo (máx 1000 caracteres)" }, { status: 400 });
  }

  const post = await prisma.feedPost.create({
    data: {
      authorId: session.user.id,
      content,
      imageUrl: typeof body.imageUrl === "string" ? body.imageUrl : undefined,
      workoutSummary: body.workoutSummary ?? undefined,
    },
    include: {
      author: { select: { id: true, name: true, avatarUrl: true } },
      _count: { select: { likes: true, comments: true } },
    },
  });

  return NextResponse.json({
    id: post.id,
    author: post.author,
    content: post.content,
    imageUrl: post.imageUrl,
    workoutSummary: post.workoutSummary,
    likeCount: 0,
    commentCount: 0,
    isLiked: false,
    comments: [],
    createdAt: post.createdAt.toISOString(),
  }, { status: 201 });
}
