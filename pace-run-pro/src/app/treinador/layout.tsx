import { auth } from "@/auth";
import type { Session } from "next-auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import TreinadorLayoutClient from "./_layout-client";

export default async function TreinadorLayout({ children }: { children: React.ReactNode }) {
  let session: Session | null = null;
  try {
    session = await auth();
  } catch {
    redirect("/login");
  }
  if (!session) redirect("/login");
  if (session.user?.role === "ADMIN") redirect("/admin");

  let user: { name: string; avatarUrl: string | null; coach: { credential: string | null } | null } | null = null;
  try {
    user = await prisma.user.findUnique({
      where: { id: session.user!.id },
      select: {
        name: true,
        avatarUrl: true,
        coach: { select: { credential: true } },
      },
    });
  } catch {
    redirect("/login");
  }

  return (
    <TreinadorLayoutClient
      userName={user?.name ?? session.user?.name ?? "Treinador"}
      userCredential={user?.coach?.credential ?? ""}
      userAvatarUrl={user?.avatarUrl ?? undefined}
    >
      {children}
    </TreinadorLayoutClient>
  );
}
