import { getSession } from "@/lib/auth-guard";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import TreinadorLayoutClient from "./_layout-client";

export default async function TreinadorLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  if (!session?.user?.id) redirect("/login");
  if (session.user?.role === "ADMIN") redirect("/admin");
  if (session.user?.role !== "COACH") redirect("/atleta/dashboard");

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      name: true,
      avatarUrl: true,
      coach: { select: { credential: true } },
    },
  }).catch(() => null);

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
