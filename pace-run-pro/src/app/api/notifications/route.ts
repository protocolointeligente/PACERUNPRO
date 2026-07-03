import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth-guard";
import { prisma } from "@/lib/prisma";

// Unified notification endpoint — works for all roles (athlete, coach, admin)
// NotificationBell points here instead of /api/atleta/notificacoes which is
// blocked by middleware for non-athlete roles.

export async function GET() {
  const session = await getSession();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const notifications = await prisma.notification.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
    take: 30,
    select: { id: true, title: true, body: true, link: true, read: true, createdAt: true },
  });

  const unreadCount = notifications.filter((n) => !n.read).length;

  return NextResponse.json({ notifications, unreadCount });
}

export async function PATCH(req: Request) {
  const session = await getSession();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  let ids: string[] | undefined;
  try {
    const body = await req.json();
    ids = Array.isArray(body?.ids) ? body.ids : undefined;
  } catch {
    // no body — mark all
  }

  await prisma.notification.updateMany({
    where: {
      userId: session.user.id,
      ...(ids ? { id: { in: ids } } : {}),
    },
    data: { read: true },
  });

  return NextResponse.json({ ok: true });
}
