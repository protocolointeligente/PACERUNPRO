import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth-guard";

export async function GET() {
  try {
    const session = await getSession();
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "No session", session },
        { status: 401 }
      );
    }

    // Testar a query exata que o dashboard usa
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        name: true,
        email: true,
        coach: {
          select: {
            id: true,
            credential: true,
            athletes: {
              select: {
                id: true,
                adherenceRate: true,
                goal: true,
                level: true,
                user: { select: { name: true } },
              },
            },
          },
        },
      },
    });

    // Também buscar Ricardo por teste
    const ricardo = await prisma.user.findFirst({
      where: {
        name: { contains: "Ricardo", mode: "insensitive" }
      },
      select: {
        id: true,
        name: true,
        coach: {
          select: {
            id: true,
            credential: true,
            athletesCount: true,
            athletes: {
              select: {
                id: true,
                user: { select: { name: true } }
              },
              take: 5
            }
          }
        }
      }
    });

    return NextResponse.json({
      message: "Dashboard query test",
      sessionUser: {
        id: session.user.id,
        email: session.user.email,
      },
      currentUserData: user,
      ricardoData: ricardo,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    const stack = error instanceof Error ? error.stack : undefined;
    console.error("DEBUG ERROR:", error);
    return NextResponse.json(
      { error: message, stack },
      { status: 500 }
    );
  }
}
