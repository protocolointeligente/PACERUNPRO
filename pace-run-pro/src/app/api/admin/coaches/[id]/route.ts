import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth-guard";
import { prisma } from "@/lib/prisma";

// DELETE /api/admin/coaches/[id] — hard-delete a coach user and all their data
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (session?.user?.role !== "ADMIN") {
    return NextResponse.json({ error: "Não autorizado." }, { status: 403 });
  }

  const { id } = await params;

  const user = await prisma.user.findUnique({
    where: { id },
    select: { id: true, role: true },
  });

  if (!user) {
    return NextResponse.json({ error: "Usuário não encontrado." }, { status: 404 });
  }
  if (user.role !== "COACH") {
    return NextResponse.json({ error: "Somente contas de treinador podem ser excluídas por esta rota." }, { status: 400 });
  }

  // Cascade handled by Prisma onDelete: Cascade on relations.
  // This deletes: User → Coach, Subscription, Payment, Notification, etc.
  await prisma.user.delete({ where: { id } });

  return NextResponse.json({ ok: true });
}

// PATCH /api/admin/coaches/[id] — block or unblock a coach
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (session?.user?.role !== "ADMIN") {
    return NextResponse.json({ error: "Não autorizado." }, { status: 403 });
  }

  const { id } = await params;
  const { action } = (await req.json()) as { action: "block" | "unblock" };

  if (action === "block") {
    await prisma.subscription.updateMany({
      where: { userId: id, status: { in: ["ACTIVE", "TRIAL"] } },
      data: { status: "CANCELED" },
    });
  } else {
    // Restore access for 30 days
    const renewsAt = new Date();
    renewsAt.setDate(renewsAt.getDate() + 30);
    await prisma.subscription.updateMany({
      where: { userId: id, status: "CANCELED" },
      data: { status: "ACTIVE", renewsAt },
    });
  }

  return NextResponse.json({ ok: true });
}
