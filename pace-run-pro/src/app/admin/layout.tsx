import { getSession } from "@/lib/auth-guard";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import AdminLayoutClient from "./_layout-client";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  if (!session?.user?.id || session.user.role !== "ADMIN") redirect("/login");

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { name: true, avatarUrl: true },
  }).catch(() => null);

  return (
    <AdminLayoutClient
      userName={user?.name ?? session.user.name ?? "Admin"}
      avatarUrl={user?.avatarUrl ?? undefined}
    >
      {children}
    </AdminLayoutClient>
  );
}
