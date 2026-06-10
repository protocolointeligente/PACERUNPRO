"use client";

import { useEffect, useRef, useState } from "react";
import { Sparkles, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Chip } from "@/components/ui/chip";
import { TopBar } from "@/components/layout/top-bar";
import { useAppStore } from "@/lib/store/useAppStore";

const SUGESTOES = [
  "Qual meu treino de hoje?",
  "Estou estagnado, o que faço?",
  "Dicas de nutrição",
  "Como funciona o RPE?",
];

export default function CoachPage() {
  const mensagensCoach = useAppStore((s) => s.mensagensCoach);
  const enviarMensagemCoach = useAppStore((s) => s.enviarMensagemCoach);

  const [texto, setTexto] = useState("");
  const fimRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fimRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [mensagensCoach.length]);

  function handleEnviar() {
    const valor = texto.trim();
    if (!valor) return;
    enviarMensagemCoach(valor);
    setTexto("");
  }

  function handleSugestao(sugestao: string) {
    enviarMensagemCoach(sugestao);
  }

  return (
    <div className="flex flex-col gap-4 px-4 py-4">
      <TopBar title="AI Coach" subtitle="Seu personal trainer com IA" showBack />

      <div className="flex-1 overflow-y-auto pb-32">
        {mensagensCoach.length === 0 ? (
          <div className="flex flex-col items-center gap-4 px-4 pt-12 text-center">
            <Sparkles className="h-12 w-12 text-primary" />
            <div>
              <p className="font-display text-lg font-bold text-text">Olá! Sou seu AI Coach 👋</p>
              <p className="mt-1 text-sm text-text-muted">
                Pergunte sobre seu treino, nutrição, progressão ou o que quiser.
              </p>
            </div>
            <div className="flex flex-wrap justify-center gap-2">
              {SUGESTOES.map((sugestao) => (
                <Chip key={sugestao} onClick={() => handleSugestao(sugestao)}>
                  {sugestao}
                </Chip>
              ))}
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {mensagensCoach.map((mensagem) => {
              if (mensagem.autor === "ia") {
                return (
                  <div key={mensagem.id} className="flex items-start gap-2">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/15 text-primary">
                      <Sparkles className="h-4 w-4" />
                    </div>
                    <div className="max-w-[80%] rounded-2xl rounded-tl-sm border border-border bg-card px-4 py-2.5 text-sm text-text">
                      {mensagem.texto}
                    </div>
                  </div>
                );
              }

              return (
                <div
                  key={mensagem.id}
                  className="ml-auto max-w-[80%] rounded-2xl rounded-tr-sm bg-primary px-4 py-2.5 text-sm text-background"
                >
                  {mensagem.texto}
                </div>
              );
            })}
            <div ref={fimRef} />
          </div>
        )}
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleEnviar();
        }}
        className="fixed inset-x-0 bottom-16 z-30 mx-auto flex max-w-md items-center gap-2 border-t border-border bg-background/95 p-3 backdrop-blur safe-bottom"
      >
        <Input
          value={texto}
          onChange={(e) => setTexto(e.target.value)}
          placeholder="Pergunte algo..."
          className="flex-1"
        />
        <Button type="submit" size="icon" variant="primary" aria-label="Enviar mensagem">
          <Send className="h-5 w-5" />
        </Button>
      </form>
    </div>
  );
}
