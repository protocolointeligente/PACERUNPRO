"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import { CheckCircle2, Loader2, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";

const inputClass =
  "w-full rounded-xl border border-white/20 bg-white/10 px-4 py-3 text-sm text-white placeholder:text-white/40 outline-none focus:border-primary/60 focus:ring-2 focus:ring-primary/20 transition-colors";

export default function QuizPage() {
  const { slug } = useParams<{ slug: string }>();
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name || !phone) return;
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ coachSlug: slug, name, phone, email: email || undefined }),
      });
      if (!res.ok) throw new Error("Erro ao enviar");
      setDone(true);
    } catch {
      setError("Algo deu errado. Tente novamente.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-dvh bg-gradient-to-br from-[#0a0f1e] via-[#0d1528] to-[#070b18] flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        {/* Logo / Brand */}
        <div className="mb-8 text-center">
          <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/20 border border-primary/30 mb-4">
            <Zap className="h-7 w-7 text-primary" />
          </div>
          <p className="text-xs font-semibold uppercase tracking-widest text-primary/80 mb-1">Pace Run Pro</p>
        </div>

        {done ? (
          <div className="rounded-2xl border border-white/10 bg-white/5 p-8 text-center backdrop-blur-sm">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-success/10 border border-success/30">
              <CheckCircle2 className="h-8 w-8 text-success" />
            </div>
            <h2 className="text-xl font-bold text-white mb-2">Você está dentro! 🎉</h2>
            <p className="text-sm text-white/60 leading-relaxed">
              Seus dados foram recebidos. O treinador vai entrar em contato em breve com o material exclusivo.
            </p>
          </div>
        ) : (
          <div className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-sm">
            <h1 className="text-2xl font-bold text-white mb-1 text-center">Acesse o material gratuito</h1>
            <p className="text-sm text-white/50 text-center mb-6 leading-relaxed">
              Preencha seus dados abaixo para receber o conteúdo exclusivo do seu treinador.
            </p>

            <form onSubmit={handleSubmit} className="space-y-3">
              <div>
                <label className="mb-1.5 block text-xs font-semibold text-white/60">Nome completo *</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Seu nome"
                  required
                  className={inputClass}
                />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-semibold text-white/60">WhatsApp / Telefone *</label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="(11) 99999-9999"
                  required
                  className={inputClass}
                />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-semibold text-white/60">E-mail (opcional)</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="seu@email.com"
                  className={inputClass}
                />
              </div>

              {error && <p className="text-xs text-danger">{error}</p>}

              <Button
                type="submit"
                disabled={loading || !name || !phone}
                className="mt-2 w-full"
                variant="primary"
              >
                {loading ? (
                  <><Loader2 className="h-4 w-4 animate-spin" /> Enviando…</>
                ) : (
                  "Quero receber agora →"
                )}
              </Button>
            </form>

            <p className="mt-4 text-center text-[10px] text-white/25">
              Seus dados estão seguros. Não enviamos spam.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
