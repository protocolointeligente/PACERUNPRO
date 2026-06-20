import { auth } from "@/auth";
import { redirect } from "next/navigation";
import ConvidarAtletaClient from "./_convidar-client";

export default async function ConvidarAtletaPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");
  return <ConvidarAtletaClient coachUserId={session.user.id} />;
}
