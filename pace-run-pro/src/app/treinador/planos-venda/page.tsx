import { redirect } from "next/navigation";

export default function CoachSalesPlansRedirectPage() {
  redirect("/treinador/gestao#planos");
}
