import { auth } from "@/auth";
import { redirect } from "next/navigation";
import TreinadorLayoutClient from "./_layout-client";

export default async function TreinadorLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session) redirect("/login");
  if (session.user?.role === "ADMIN") redirect("/admin");
  return <TreinadorLayoutClient>{children}</TreinadorLayoutClient>;
}
