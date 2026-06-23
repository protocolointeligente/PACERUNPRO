"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

const STORAGE_KEY = "cookie-consent";

export function CookieConsent() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    try {
      if (!localStorage.getItem(STORAGE_KEY)) {
        setVisible(true);
      }
    } catch {
      // localStorage indisponível (ex.: navegação privada) — não exibe o aviso
    }
  }, []);

  function accept() {
    try {
      localStorage.setItem(STORAGE_KEY, "accepted");
    } catch {
      // ignora falha de armazenamento
    }
    setVisible(false);
  }

  if (!visible) return null;

  return (
    <div className="fixed inset-x-0 bottom-0 z-[60] px-4 pb-4 sm:px-6">
      <div className="mx-auto flex max-w-3xl flex-col items-start gap-3 rounded-2xl border border-border bg-card/95 p-4 shadow-2xl shadow-black/40 backdrop-blur-xl sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-text-muted">
          Usamos cookies essenciais para o funcionamento da plataforma e, com seu consentimento,
          cookies de análise para melhorar sua experiência. Saiba mais na nossa{" "}
          <Link href="/privacidade" className="font-semibold text-primary hover:text-primary/80">
            Política de Privacidade
          </Link>
          .
        </p>
        <Button size="sm" onClick={accept} className="w-full shrink-0 sm:w-auto">
          Entendi
        </Button>
      </div>
    </div>
  );
}
