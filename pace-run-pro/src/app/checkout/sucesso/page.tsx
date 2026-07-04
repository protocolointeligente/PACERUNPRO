"use client";

import { Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { BookOpen, CheckCircle2, Loader2, ShoppingBag } from "lucide-react";
import { Button } from "@/components/ui/button";

function SucessoContent() {
  const params = useSearchParams();
  const isFree = params.get("free") === "1";

  return (
    <div className="flex min-h-dvh items-center justify-center px-6">
      <div className="max-w-md w-full text-center space-y-6">
        <div className="flex justify-center">
          <span className="flex h-20 w-20 items-center justify-center rounded-3xl bg-success/15">
            <CheckCircle2 className="h-10 w-10 text-success" />
          </span>
        </div>

        <div>
          <h1 className="font-display text-2xl font-extrabold text-text sm:text-3xl">
            {isFree ? "Acesso liberado!" : "Pagamento confirmado!"}
          </h1>
          <p className="mt-2 text-text-muted">
            {isFree
              ? "O plano gratuito foi adicionado à sua conta."
              : "Seu pagamento foi processado com sucesso. O plano já está disponível na sua conta."}
          </p>
        </div>

        <div className="rounded-2xl border border-success/20 bg-success/5 p-4 text-sm text-text-muted">
          {isFree
            ? "Acesse seu painel de atleta para ver o plano e começar a treinar."
            : "Você receberá um e-mail de confirmação em instantes. Acesse seu painel para começar."}
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Link href="/atleta/compras">
            <Button className="w-full sm:w-auto gap-1.5">
              <BookOpen className="h-4 w-4" />
              Ver minhas compras
            </Button>
          </Link>
          <Link href="/marketplace">
            <Button variant="outline" className="w-full sm:w-auto gap-1.5">
              <ShoppingBag className="h-4 w-4" />
              Explorar mais produtos
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function SucessoPage() {
  return (
    <Suspense fallback={
      <div className="flex min-h-dvh items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    }>
      <SucessoContent />
    </Suspense>
  );
}
