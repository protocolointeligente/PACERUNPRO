"use client";

import { useEffect } from "react";
import Link from "next/link";
import { Logo } from "@/components/logo";
import { Button } from "@/components/ui/button";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center px-6 text-center">
      <Logo size={40} className="mb-8" />
      <p className="gradient-text font-display text-7xl font-extrabold">Ops</p>
      <h1 className="mt-3 font-display text-2xl font-bold text-text">Algo deu errado</h1>
      <p className="mt-2 max-w-md text-sm text-text-muted">
        Encontramos um erro inesperado ao carregar esta página. Tente novamente — se o
        problema persistir, fale com o nosso suporte.
      </p>
      <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
        <Button size="lg" onClick={() => reset()}>
          Tentar novamente
        </Button>
        <Link href="/">
          <Button size="lg" variant="outline">
            Voltar para o início
          </Button>
        </Link>
      </div>
    </div>
  );
}
