"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Bot, Sparkles, Send, User } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const ATHLETE_CONTEXT = {
  name: "Camila Andrade",
  level: "Intermediária",
  weeklyVolume: "45 km/semana",
  currentPlan: "Preparatório São Silvestre 2025",
  nextRace: "10k Corrida da Saudade — 20 Jul 2025",
  recentPRs: { "5k": "24:15", "10k": "51:02" },
};

const SUGGESTED_QUESTIONS = [
  "Qual deve ser meu pace no treino longo desta semana?",
  "Como me preparar para a corrida da próxima semana?",
  "O que comer antes de um treino de qualidade?",
  "Como distribuir meu volume semanal?",
];

type Message = {
  role: "user" | "assistant";
  content: string;
};

export default function IATreinadoraPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  async function sendMessage(content: string) {
    if (!content.trim() || isTyping) return;

    const userMessage: Message = { role: "user", content: content.trim() };
    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    setInput("");
    setIsTyping(true);

    try {
      const res = await fetch("/api/ia-treinadora", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          messages: updatedMessages,
          athleteContext: ATHLETE_CONTEXT,
        }),
      });

      const data = await res.json();
      const assistantMessage: Message = {
        role: "assistant",
        content: data.reply ?? "Não consegui processar sua pergunta agora.",
      };
      setMessages((prev) => [...prev, assistantMessage]);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "Ocorreu um erro ao processar sua pergunta. Tente novamente.",
        },
      ]);
    } finally {
      setIsTyping(false);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  }

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-5">
      <div>
        <div className="mb-2 flex items-center gap-2">
          <Badge variant="primary" className="gap-1.5">
            <Bot className="h-3 w-3" />
            IA Treinadora
          </Badge>
        </div>
        <h1 className="font-display text-2xl font-bold text-text sm:text-3xl">
          IA Treinadora
        </h1>
        <p className="mt-1 text-sm text-text-muted">
          <Sparkles className="mr-1 inline h-3.5 w-3.5 text-primary" />
          Powered by Claude — sua assistente especializada em corrida
        </p>
      </div>

      <Card>
        <CardContent className="p-4">
          <p className="mb-2 text-[10px] font-medium uppercase tracking-wider text-text-muted">
            Contexto do atleta
          </p>
          <div className="grid grid-cols-2 gap-x-6 gap-y-1 sm:grid-cols-3">
            <div>
              <span className="text-[11px] text-text-muted">Atleta</span>
              <p className="text-sm font-semibold text-text">{ATHLETE_CONTEXT.name}</p>
            </div>
            <div>
              <span className="text-[11px] text-text-muted">Nível</span>
              <p className="text-sm font-semibold text-text">{ATHLETE_CONTEXT.level}</p>
            </div>
            <div>
              <span className="text-[11px] text-text-muted">Volume</span>
              <p className="text-sm font-semibold text-text">{ATHLETE_CONTEXT.weeklyVolume}</p>
            </div>
            <div>
              <span className="text-[11px] text-text-muted">PR 5k</span>
              <p className="text-sm font-semibold text-text">{ATHLETE_CONTEXT.recentPRs["5k"]}</p>
            </div>
            <div>
              <span className="text-[11px] text-text-muted">PR 10k</span>
              <p className="text-sm font-semibold text-text">{ATHLETE_CONTEXT.recentPRs["10k"]}</p>
            </div>
            <div>
              <span className="text-[11px] text-text-muted">Próxima prova</span>
              <p className="text-sm font-semibold text-text">{ATHLETE_CONTEXT.nextRace}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex min-h-[420px] flex-col rounded-2xl border border-border bg-card">
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          <AnimatePresence initial={false}>
            {messages.length === 0 && !isTyping && (
              <motion.div
                key="empty-state"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
                className="flex flex-col items-center justify-center py-12 text-center"
              >
                <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 ring-1 ring-primary/20">
                  <Bot className="h-7 w-7 text-primary" />
                </div>
                <p className="mb-1 font-semibold text-text">Olá, {ATHLETE_CONTEXT.name}!</p>
                <p className="mb-6 max-w-xs text-sm text-text-muted">
                  Sou sua IA Treinadora. Pergunte sobre treino, pace, nutrição ou sua próxima prova.
                </p>
                <div className="flex flex-wrap justify-center gap-2">
                  {SUGGESTED_QUESTIONS.map((q) => (
                    <button
                      key={q}
                      onClick={() => sendMessage(q)}
                      className="rounded-full border border-border bg-background px-3 py-1.5 text-xs text-text-muted transition-colors hover:border-primary/40 hover:text-text"
                    >
                      {q}
                    </button>
                  ))}
                </div>
              </motion.div>
            )}

            {messages.map((msg, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.25 }}
                className={`flex gap-3 ${msg.role === "user" ? "flex-row-reverse" : "flex-row"}`}
              >
                <div
                  className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${
                    msg.role === "user"
                      ? "bg-primary/20 ring-1 ring-primary/30"
                      : "bg-card-hover ring-1 ring-border"
                  }`}
                >
                  {msg.role === "user" ? (
                    <User className="h-4 w-4 text-primary" />
                  ) : (
                    <Bot className="h-4 w-4 text-text-muted" />
                  )}
                </div>

                <div
                  className={`max-w-[78%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                    msg.role === "user"
                      ? "gradient-primary text-white"
                      : "bg-background text-text"
                  }`}
                >
                  {msg.content.split("\n").map((line, i) => (
                    <span key={i}>
                      {line}
                      {i < msg.content.split("\n").length - 1 && <br />}
                    </span>
                  ))}
                </div>
              </motion.div>
            ))}

            {isTyping && (
              <motion.div
                key="typing"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="flex gap-3"
              >
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-card-hover ring-1 ring-border">
                  <Bot className="h-4 w-4 text-text-muted" />
                </div>
                <div className="flex items-center gap-1.5 rounded-2xl bg-background px-4 py-3">
                  {[0, 1, 2].map((i) => (
                    <motion.span
                      key={i}
                      className="h-2 w-2 rounded-full bg-text-muted"
                      animate={{ opacity: [0.3, 1, 0.3] }}
                      transition={{
                        duration: 1.2,
                        repeat: Infinity,
                        delay: i * 0.2,
                      }}
                    />
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
          <div ref={bottomRef} />
        </div>

        <div className="border-t border-border p-4">
          <div className="flex gap-3 items-end">
            <textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Pergunte sobre seu treino, pace, nutrição..."
              rows={1}
              className="flex-1 resize-none rounded-xl border border-border bg-background px-3.5 py-2.5 text-sm text-text placeholder:text-text-muted/50 outline-none focus:border-primary/60 focus:ring-2 focus:ring-primary/20 transition-colors"
              style={{ minHeight: "44px", maxHeight: "120px" }}
              onInput={(e) => {
                const target = e.currentTarget;
                target.style.height = "auto";
                target.style.height = `${Math.min(target.scrollHeight, 120)}px`;
              }}
            />
            <Button
              onClick={() => sendMessage(input)}
              disabled={!input.trim() || isTyping}
              size="sm"
              className="h-[44px] w-[44px] shrink-0 p-0"
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
          <p className="mt-2 text-[11px] text-text-muted/60">
            Enter para enviar · Shift+Enter para nova linha
          </p>
        </div>
      </div>
    </div>
  );
}
