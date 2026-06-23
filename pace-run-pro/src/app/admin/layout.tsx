import { getSession } from "@/lib/auth-guard";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { AppShell } from "@/components/layout/app-shell";
import { BottomNav } from "@/components/layout/bottom-nav";
import { adminNav } from "@/components/layout/nav-config";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  if (!session?.user?.id || session.user.role !== "ADMIN") redirect("/login");

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { name: true, avatarUrl: true },
  }).catch(() => null);

  return (
    <AppShell
      nav={adminNav}
      roleLabel="Super Admin"
      userName={user?.name ?? session.user.name ?? "Admin"}
      userSubtitle="Super Admin"
      avatarUrl={user?.avatarUrl ?? undefined}
    >
      {children}
      <BottomNav items={adminNav} />
    </AppShell>
  );
}
