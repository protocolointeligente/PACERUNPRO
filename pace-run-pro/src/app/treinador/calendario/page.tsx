import { getSession } from "@/lib/auth-guard";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";

export default async function CalendarioIndexPage() {
  const session = await getSession();
  if (!session?.user?.id || session.user.role !== "COACH") redirect("/login");

  const coach = await prisma.coach.findUnique({
    where: { userId: session.user.id },
    select: {
      athletes: {
        select: { id: true },
        orderBy: { user: { name: "asc" } },
        take: 1,
      },
    },
  });

  const first = coach?.athletes[0];
  if (first) redirect(`/treinador/calendario/${first.id}`);

  redirect("/treinador/atletas");
}
