import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import TreinadorLayoutClient from "./_layout-client";

export default async function TreinadorLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session) redirect("/login");
  if (session.user?.role === "ADMIN") redirect("/admin");

  const user = await prisma.user.findUnique({
    where: { id: session.user!.id },
    select: {
      name: true,
      avatarUrl: true,
      coach: { select: { credential: true } },
    },
  });

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
