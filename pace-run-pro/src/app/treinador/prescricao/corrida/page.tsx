import { redirect } from "next/navigation";

export default function LegacyRunPrescriptionRedirect() {
  redirect("/treinador/prescricao/periodizacao");
}
