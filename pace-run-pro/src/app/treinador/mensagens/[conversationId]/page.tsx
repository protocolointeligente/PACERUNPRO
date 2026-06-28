"use client";

import { useState, useEffect, useRef, useCallback, use } from "react";
import Link from "next/link";
import { ArrowLeft, Send, Bot, User, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Message {
  id: string;
  fromUserId: string;
  content: string;
  isAI: boolean;
  readAt: string | null;
  createdAt: string;
}

interface ConversationDetail {
  id: string;
  athleteName: string | null;
  athleteAvatar: string | null;
  messages: Message[];
  currentUserId: string;
}

export default function CoachConversationPage({
  params,
}: {
  params: Promise<{ conversationId: string }>;
}) {
  const { conversationId } = use(params);
  const [conv, setConv] = useState<ConversationDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const pollingRef = useRef<NodeJS.Timeout | null>(null);

  const fetchMessages = useCallback(async (quiet = false) => {
    if (!quiet) setLoading(true);
    try {
      const res = await fetch(`/api/messages/${conversationId}`);
      if (!res.ok) return;
      const data = await res.json();
      setConv(data);
    } finally {
      if (!quiet) setLoading(false);
    }
  }, [conversationId]);

  useEffect(() => {
    fetchMessages();
    pollingRef.current = setInterval(() => fetchMessages(true), 6000);
    return () => { if (pollingRef.current) clearInterval(pollingRef.current); };
  }, [fetchMessages]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [conv?.messages?.length]);

  async function send() {
    if (!text.trim() || sending || !conv) return;
    setSending(true);
    const content = text.trim();
    setText("");
    try {
      await fetch(`/api/messages/${conversationId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content }),
      });
      await fetchMessages(true);
    } finally {
      setSending(false);
    }
  }

  async function askAI() {
    if (!conv || aiLoading) return;
    setAiLoading(true);
    try {
      await fetch(`/api/messages/${conversationId}/ai`, { method: "POST" });
      await fetchMessages(true);
    } finally {
      setAiLoading(false);
    }
  }

  function handleKey(e: React.KeyboardEvent) {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); }
  }

  const msgs = conv?.messages ?? [];
  const myId = conv?.currentUserId;

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" style={{ color: "#C6F24E" }} />
      </div>
    );
  }

  return (
    <div
      className="flex flex-col"
      style={{ height: "calc(100dvh - 140px)", minHeight: 400 }}
    >
      {/* Header */}
      <div
        className="flex items-center gap-3 border-b px-4 py-3"
        style={{ borderColor: "rgba(255,255,255,0.07)" }}
      >
        <Link href="/treinador/mensagens" className="rounded-xl p-1.5 transition-colors hover:bg-white/5">
          <ArrowLeft className="h-5 w-5" style={{ color: "#5C636B" }} />
        </Link>
        <div
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-bold"
          style={{ background: "rgba(198,242,78,0.15)", color: "#C6F24E" }}
        >
          {conv?.athleteAvatar ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={conv.athleteAvatar} alt={conv.athleteName ?? ""} className="h-full w-full rounded-full object-cover" />
          ) : <User className="h-4 w-4" />}
        </div>
        <div className="flex-1">
          <p className="text-sm font-semibold" style={{ color: "#ECEAE3" }}>
            {conv?.athleteName ?? "Atleta"}
          </p>
        </div>
        <button
          onClick={askAI}
          disabled={aiLoading}
          title="Gerar resposta com IA"
          className="flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-semibold transition-opacity disabled:opacity-50"
          style={{ background: "rgba(70,224,200,0.12)", color: "#46E0C8" }}
        >
          {aiLoading
            ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
            : <Bot className="h-3.5 w-3.5" />
          }
          Sugestão IA
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
        {msgs.length === 0 && (
          <div className="py-12 text-center">
            <p className="text-sm" style={{ color: "#5C636B" }}>
              Nenhuma mensagem ainda. Responda seu atleta!
            </p>
          </div>
        )}
        {msgs.map((m) => {
          const isMine = m.fromUserId === myId;
          return (
            <div key={m.id} className={`flex gap-2 ${isMine ? "justify-end" : "justify-start"}`}>
              {!isMine && (
                <div
                  className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[10px] font-bold"
                  style={{ background: m.isAI ? "rgba(70,224,200,0.15)" : "rgba(198,242,78,0.12)", color: m.isAI ? "#46E0C8" : "#C6F24E" }}
                >
                  {m.isAI ? <Bot className="h-3.5 w-3.5" /> : <User className="h-3.5 w-3.5" />}
                </div>
              )}
              <div
                className="max-w-[78%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed"
                style={{
                  background: isMine
                    ? "rgba(198,242,78,0.12)"
                    : m.isAI
                    ? "rgba(70,224,200,0.08)"
                    : "rgba(255,255,255,0.05)",
                  color: isMine ? "#C6F24E" : "#ECEAE3",
                  borderRadius: isMine ? "18px 18px 4px 18px" : "18px 18px 18px 4px",
                }}
              >
                {m.isAI && (
                  <span className="mb-1 block text-[10px] font-semibold" style={{ color: "#46E0C8" }}>
                    IA Treinadora
                  </span>
                )}
                {m.content}
                <span className="ml-2 text-[10px] opacity-50">
                  {new Date(m.createdAt).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
                </span>
              </div>
              {isMine && (
                <div
                  className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[10px]"
                  style={{ background: "rgba(255,255,255,0.06)" }}
                >
                  <User className="h-3.5 w-3.5" style={{ color: "#5C636B" }} />
                </div>
              )}
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div
        className="flex items-end gap-2 border-t px-4 py-3"
        style={{ borderColor: "rgba(255,255,255,0.07)" }}
      >
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={handleKey}
          placeholder="Responder atleta…"
          rows={1}
          className="flex-1 resize-none rounded-2xl px-4 py-2.5 text-sm outline-none transition-colors"
          style={{
            background: "rgba(255,255,255,0.05)",
            border: "1px solid rgba(255,255,255,0.08)",
            color: "#ECEAE3",
            maxHeight: 120,
          }}
        />
        <Button
          onClick={send}
          disabled={sending || !text.trim()}
          className="h-10 w-10 shrink-0 rounded-full p-0"
          style={{ background: "#C6F24E", color: "#0A0C0F" }}
        >
          {sending
            ? <Loader2 className="h-4 w-4 animate-spin" />
            : <Send className="h-4 w-4" />
          }
        </Button>
      </div>
    </div>
  );
}
