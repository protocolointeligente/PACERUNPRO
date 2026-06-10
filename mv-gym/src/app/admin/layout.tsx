import { AuthGuard } from "@/components/layout/auth-guard";
import { BottomNav } from "@/components/layout/bottom-nav";
import { ADMIN_NAV } from "@/components/layout/nav-items";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthGuard allowedRoles={["admin"]}>
      <div className="mx-auto min-h-dvh max-w-md pb-24">{children}</div>
      <BottomNav items={ADMIN_NAV} />
    </AuthGuard>
  );
}
