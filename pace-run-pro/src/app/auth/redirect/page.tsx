"use client";

import { useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";

export default function AuthRedirect() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === "loading") return;
    const role = (session?.user as { role?: string })?.role;
    if (role === "ADMIN") router.replace("/admin/dashboard");
    else if (role === "COACH") router.replace("/treinador/dashboard");
    else router.replace("/atleta/dashboard");
  }, [status, session, router]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <span className="animate-spin border-2 border-primary/30 border-t-primary rounded-full h-10 w-10" />
    </div>
  );
}
