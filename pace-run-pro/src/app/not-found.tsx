import Link from "next/link";
import { Logo } from "@/components/logo";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center px-6 text-center">
      <Logo size={40} className="mb-8" />
      <p className="gradient-text font-display text-7xl font-extrabold">404</p>
      <h1 className="mt-3 font-display text-2xl font-bold text-text">Página não encontrada</h1>
      <p className="mt-2 max-w-md text-sm text-text-muted">
        O endereço que você tentou acessar não existe, foi movido ou você não tem permissão para vê-lo.
      </p>
      <Link href="/" className="mt-6">
        <Button size="lg">Voltar para o início</Button>
      </Link>
    </div>
  );
}
