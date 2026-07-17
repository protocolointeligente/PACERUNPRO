"use client";

import * as Sentry from "@sentry/nextjs";
import Link from "next/link";
import { useEffect } from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <html lang="pt-BR">
      <body>
        <main className="flex min-h-dvh items-center justify-center bg-background px-6 text-text">
          <section className="w-full max-w-lg rounded-2xl border border-border bg-card p-8 text-center shadow-2xl">
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-primary">
              PACERUNPRO
            </p>
            <h1 className="mt-6 font-display text-5xl font-extrabold">
              Ops
            </h1>
            <p className="mt-3 text-lg font-bold">Algo deu errado</p>
            <p className="mt-3 text-sm leading-6 text-text-muted">
              Registramos o erro para auditoria. Tente novamente; se persistir,
              o suporte pode localizar o evento pelo horário da ocorrência.
            </p>
            {error.digest ? (
              <p className="mt-4 rounded-lg border border-border bg-card-hover px-3 py-2 font-mono text-xs text-text-muted">
                Evento: {error.digest}
              </p>
            ) : null}
            <div className="mt-7 flex flex-col gap-3 sm:flex-row">
              <button
                type="button"
                onClick={reset}
                className="inline-flex h-12 flex-1 items-center justify-center rounded-xl bg-primary px-5 text-sm font-bold text-[var(--on-primary)] transition hover:brightness-105"
              >
                Tentar novamente
              </button>
              <Link
                href="/"
                className="inline-flex h-12 flex-1 items-center justify-center rounded-xl border border-border px-5 text-sm font-bold text-text transition hover:bg-card-hover"
              >
                Voltar ao inicio
              </Link>
            </div>
          </section>
        </main>
      </body>
    </html>
  );
}
