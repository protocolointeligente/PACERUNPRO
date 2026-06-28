"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Send, Bot, User, Loader2, MessageSquare } from "lucide-react";
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
  currentUserId: string;
  coachId: string;
  coachName: string | null;
  coachAvatar: string | null;
  messages: Message[];
}

export default function AtletaTreinadorPage() {
  const [conv, setConv] = useState<ConversationDetail | null>(null);
  const [convId, setConvId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [noCoach, setNoCoach] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const pollingRef = useRef<NodeJS.Timeout | null>(null);

  // Step 1: get the conversation id
  useEffect(() => {
    fetch("/api/messages")
      .then((r) => r.ok ? r.json() : [])
      .then((data: Array<{ id: string }>) => {
        if (data.length > 0) setConvId(data[0].id);
        else setNoCoach(true);
      })
      .catch(() => setNoCoach(true))
      .finally(() => { if (!convId) setLoading(false); });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Step 2: load conversation detail (and poll)
  const fetchDetail = useCallback(async (quiet = false) => {
    if (!convId) return;
    if (!quiet) setLoading(true);
    try {
      const res = await fetch(`/api/messages/${convId}`);
      if (!res.ok) return;
      const data: ConversationDetail = await res.json();
      setConv(data);
    } finally {
      if (!quiet) setLoading(false);
    }
  }, [convId]);

  useEffect(() => {
    if (!convId) return;
    fetchDetail();
    pollingRef.current = setInterval(() => fetchDetail(true), 6000);
    return () => { if (pollingRef.current) clearInterval(pollingRef.current); };
  }, [convId, fetchDetail]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [conv?.messages?.length]);

  async function send() {
    if (!text.trim() || sending || !convId) return;
    setSending(true);
    const content = text.trim();
    setText("");
    try {
      await fetch(`/api/messages/${convId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content }),
      });
      await fetchDetail(true);
    } finally {
      setSending(false);
    }
  }

  async function askAI() {
    if (!convId || aiLoading) return;
    setAiLoading(true);
    try {
      await fetch(`/api/messages/${convId}/ai`, { method: "POST" });
      await fetchDetail(true);
    } finally {
      setAiLoading(false);
    }
  }

  function handleKey(e: React.KeyboardEvent) {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); }
  }

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" style={{ color: "#C6F24E" }} />
      </div>
    );
  }

  if (noCoach || !conv) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 text-center px-4">
        <div
          className="flex h-16 w-16 items-center justify-center rounded-full"
          style={{ background: "rgba(198,242,78,0.12)" }}
        >
          <MessageSquare className="h-8 w-8" style={{ color: "#C6F24E" }} />
        </div>
        <div>
          <p className="font-semibold" style={{ color: "#ECEAE3" }}>Sem treinador vinculado</p>
          <p className="mt-1 text-sm" style={{ color: "#5C636B" }}>
            Você ainda não tem um treinador. Entre em contato com a sua assessoria.
          </p>
        </div>
      </div>
    );
  }

  const msgs = conv.messages;
  const myId = conv.currentUserId;
  const coachInitial = conv.coachName?.slice(0, 2).toUpperCase() ?? "TR";

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
        <div
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-bold"
          style={{ background: "rgba(198,242,78,0.15)", color: "#C6F24E" }}
        >
          {conv.coachAvatar ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={conv.coachAvatar} alt={conv.coachName ?? "Treinador"} className="h-full w-full rounded-full object-cover" />
          ) : coachInitial}
        </div>
        <div>
          <p className="text-sm font-semibold" style={{ color: "#ECEAE3" }}>
            {conv.coachName ?? "Seu Treinador"}
          </p>
          <p className="text-xs" style={{ color: "#5C636B" }}>Treinador</p>
        </div>
        <button
          onClick={askAI}
          disabled={aiLoading}
          title="Sugestão de resposta IA"
          className="ml-auto flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-semibold transition-opacity disabled:opacity-50"
          style={{ background: "rgba(70,224,200,0.12)", color: "#46E0C8" }}
        >
          {aiLoading
            ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
            : <Bot className="h-3.5 w-3.5" />
          }
          IA
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
        {msgs.length === 0 && (
          <div className="py-12 text-center">
            <p className="text-sm" style={{ color: "#5C636B" }}>
              Nenhuma mensagem ainda. Diga olá para o seu treinador!
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
                  style={{ background: m.isAI ? "rgba(70,224,200,0.15)" : "rgba(198,242,78,0.15)", color: m.isAI ? "#46E0C8" : "#C6F24E" }}
                >
                  {m.isAI ? <Bot className="h-3.5 w-3.5" /> : coachInitial}
                </div>
              )}
              <div
                className="max-w-[78%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed"
                style={{
                  background: isMine
                    ? "rgba(198,242,78,0.15)"
                    : m.isAI
                    ? "rgba(70,224,200,0.1)"
                    : "rgba(255,255,255,0.06)",
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
                  className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[10px] font-bold"
                  style={{ background: "rgba(198,242,78,0.15)", color: "#C6F24E" }}
                >
                  <User className="h-3.5 w-3.5" />
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
          placeholder="Mensagem para o treinador…"
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
