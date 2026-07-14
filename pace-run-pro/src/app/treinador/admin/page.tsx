import { redirect } from "next/navigation";

export default function TreinadorAdminRedirect() {
  redirect("/treinador/dashboard");
}
