import { getSession } from "@/lib/auth-guard";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";

export default async function CalendarioIndexPage({
  searchParams,
}: {
  searchParams: Promise<{ addSport?: string }>;
}) {
  const session = await getSession();
  if (!session?.user?.id || session.user.role !== "COACH") redirect("/login");

  const { addSport } = await searchParams;

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
  const qs = addSport ? `?addSport=${encodeURIComponent(addSport)}` : "";
  if (first) redirect(`/treinador/calendario/${first.id}${qs}`);

  redirect("/treinador/atletas");
}
