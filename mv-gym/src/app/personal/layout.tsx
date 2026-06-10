import { AuthGuard } from "@/components/layout/auth-guard";
import { BottomNav } from "@/components/layout/bottom-nav";
import { PERSONAL_NAV } from "@/components/layout/nav-items";

export default function PersonalLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthGuard allowedRoles={["personal"]}>
      <div className="mx-auto min-h-dvh max-w-md pb-24">{children}</div>
      <BottomNav items={PERSONAL_NAV} />
    </AuthGuard>
  );
}
