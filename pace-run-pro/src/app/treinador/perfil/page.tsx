import { getSession } from "@/lib/auth-guard";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import CoachProfileClient from "./_profile-client";

export default async function CoachProfilePage() {
  const session = await getSession();
  if (!session?.user?.id) redirect("/login");

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      name: true,
      email: true,
      phone: true,
      city: true,
      state: true,
      avatarUrl: true,
      coach: { select: { credential: true, bio: true, whatsapp: true, specialties: true } },
      subscriptions: {
        orderBy: { startedAt: "desc" },
        take: 1,
        select: { id: true, plan: true, status: true, renewsAt: true, autoRenew: true },
      },
    },
  });

  const sub = user?.subscriptions?.[0] ?? null;

  return (
    <CoachProfileClient
      initialName={user?.name ?? ""}
      initialEmail={user?.email ?? ""}
      initialPhone={user?.phone ?? ""}
      initialCity={user?.city ?? ""}
      initialState={user?.state ?? ""}
      initialAvatarUrl={user?.avatarUrl ?? null}
      initialCredential={user?.coach?.credential ?? ""}
      initialBio={user?.coach?.bio ?? ""}
      initialWhatsapp={user?.coach?.whatsapp ?? ""}
      initialSpecialties={user?.coach?.specialties ?? []}
      subscription={sub}
    />
  );
}
