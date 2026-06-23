"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Check, Copy, Link2, UserPlus } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface ConvidarAtletaClientProps {
  coachUserId: string;
}

export default function ConvidarAtletaClient({ coachUserId }: ConvidarAtletaClientProps) {
  const baseUrl = typeof window !== "undefined" ? window.location.origin : "";
  const inviteUrl = `${baseUrl}/cadastro?perfil=atleta&coach=${coachUserId}`;

  const [copied, setCopied] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [manualLoading, setManualLoading] = useState(false);
  const [manualError, setManualError] = useState("");
  const [manualSuccess, setManualSuccess] = useState<{ tempPassword?: string; existing?: boolean } | null>(null);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(inviteUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback: select text
    }
  }

  async function handleManualAdd(e: React.FormEvent) {
    e.preventDefault();
    setManualError("");
    setManualSuccess(null);
    setManualLoading(true);

    try {
      const res = await fetch("/api/coach/athletes/add", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email }),
      });
      const data = await res.json();

      if (!res.ok) {
        setManualError(data.error ?? "Erro ao adicionar atleta.");
        setManualLoading(false);
        return;
      }

      setManualSuccess({ tempPassword: data.tempPassword, existing: data.existing });
      setName("");
      setEmail("");
    } catch {
      setManualError("Erro ao conectar ao servidor. Tente novamente.");
    } finally {
      setManualLoading(false);
    }
  }

  const inputClass =
    "w-full rounded-xl border border-border bg-background px-3.5 py-2.5 text-sm text-text placeholder:text-text-muted/50 outline-none focus:border-primary/60 focus:ring-2 focus:ring-primary/20 transition-colors";

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      {/* Header */}
      <div>
        <Link
          href="/treinador/atletas"
          className="mb-4 inline-flex items-center gap-1.5 text-xs font-semibold text-text-muted transition-colors hover:text-text"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Voltar para atletas
        </Link>
        <Badge variant="primary" className="mb-2 block w-fit">
          <Link2 className="mr-1 inline h-3 w-3" />
          Compartilhar link de convite
        </Badge>
        <h1 className="font-display text-2xl font-bold text-text sm:text-3xl">Convidar atleta</h1>
        <p className="mt-1 text-sm text-text-muted">
          Adicione atletas ao seu perfil compartilhando um link ou inserindo os dados manualmente.
        </p>
      </div>

      {/* Invite link section */}
      <Card>
        <CardContent className="space-y-4 pt-5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <Link2 className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm font-semibold text-text">Link de convite</p>
              <p className="text-xs text-text-muted">Envie para o atleta se cadastrar automaticamente vinculado a você</p>
            </div>
          </div>

          <div className="flex items-center gap-2 rounded-xl border border-border bg-background/60 px-3.5 py-2.5">
            <span className="flex-1 truncate text-xs font-mono text-text-muted">{inviteUrl}</span>
            <button
              onClick={handleCopy}
              className="ml-2 flex flex-shrink-0 items-center gap-1.5 rounded-lg border border-border bg-card px-3 py-1.5 text-xs font-semibold text-text transition-colors hover:border-primary/40 hover:bg-card-hover"
            >
              {copied ? (
                <>
                  <Check className="h-3.5 w-3.5 text-green-400" />
                  <span className="text-green-400">Copiado!</span>
                </>
              ) : (
                <>
                  <Copy className="h-3.5 w-3.5" />
                  Copiar
                </>
              )}
            </button>
          </div>

          <div className="rounded-xl border border-border/50 bg-card-hover/30 px-4 py-3 space-y-1">
            <p className="text-xs font-semibold text-text">Como funciona</p>
            <p className="text-xs text-text-muted">
              Envie este link para o seu atleta. Quando ele se cadastrar, já ficará vinculado ao seu perfil automaticamente.
            </p>
            <p className="mt-1 text-xs text-text-muted">
              Você também pode gerar um QR code com este link para compartilhar presencialmente.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Manual add section */}
      <Card>
        <CardContent className="space-y-4 pt-5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-card-hover text-text-muted">
              <UserPlus className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm font-semibold text-text">Ou adicione manualmente</p>
              <p className="text-xs text-text-muted">Crie uma conta para o atleta com uma senha temporária</p>
            </div>
          </div>

          {manualSuccess ? (
            <div className="rounded-xl border border-green-500/30 bg-green-500/10 p-4 space-y-2">
              <p className="text-sm font-semibold text-green-400">
                {manualSuccess.existing ? "Atleta vinculado com sucesso!" : "Atleta adicionado com sucesso!"}
              </p>
              {!manualSuccess.existing && manualSuccess.tempPassword && (
                <div className="space-y-1">
                  <p className="text-xs text-text-muted">Senha temporária gerada:</p>
                  <code className="block rounded-lg border border-border bg-background px-3 py-2 text-xs font-mono text-text">
                    {manualSuccess.tempPassword}
                  </code>
                  <p className="text-xs text-text-muted">Compartilhe esta senha com o atleta para o primeiro acesso.</p>
                </div>
              )}
              <button
                onClick={() => setManualSuccess(null)}
                className="mt-2 text-xs font-semibold text-primary hover:text-primary/80 transition-colors"
              >
                Adicionar outro atleta
              </button>
            </div>
          ) : (
            <form onSubmit={handleManualAdd} className="space-y-4">
              <label className="block">
                <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-text-muted">
                  Nome completo
                </span>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ex.: João Silva"
                  required
                  className={inputClass}
                />
              </label>

              <label className="block">
                <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-text-muted">
                  E-mail
                </span>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="atleta@email.com"
                  required
                  className={inputClass}
                />
              </label>

              {manualError && (
                <p className="rounded-xl border border-red-500/30 bg-red-500/10 px-3.5 py-2.5 text-sm text-red-400">
                  {manualError}
                </p>
              )}

              <Button
                type="submit"
                variant="primary"
                disabled={manualLoading}
                className="w-full"
              >
                {manualLoading ? (
                  <span className="animate-spin border-2 border-white/30 border-t-white rounded-full h-4 w-4" />
                ) : (
                  "Adicionar atleta"
                )}
              </Button>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
