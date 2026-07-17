import { redirect } from "next/navigation";

export default function LegacyStrengthPrescriptionRedirect() {
  redirect("/treinador/prescricao/periodizacao");
}
