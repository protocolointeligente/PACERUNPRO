import { redirect } from "next/navigation";
import { auth } from "@/auth";

// Destino padrão pós-login (ex.: callback do Google OAuth), que redireciona
// para a área correta de acordo com o papel do usuário.
export default async function PainelRedirect() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const role = (session.user as { role?: string }).role;

  if (role === "ADMIN") redirect("/admin/dashboard");
  if (role === "COACH") redirect("/treinador/dashboard");
  redirect("/aluno/dashboard");
}
