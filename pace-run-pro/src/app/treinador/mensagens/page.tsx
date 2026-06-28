"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { MessageSquare, Loader2, User } from "lucide-react";

interface ConvItem {
  id: string;
  athleteId: string;
  updatedAt: string;
  athlete: { id: string; name: string | null; avatarUrl: string | null } | null;
  messages: Array<{ content: string; createdAt: string }>;
  unread: number;
}

export default function TreinadorMensagensPage() {
  const [convs, setConvs] = useState<ConvItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/messages")
      .then((r) => r.ok ? r.json() : [])
      .then((data) => { setConvs(data); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" style={{ color: "#C6F24E" }} />
      </div>
    );
  }

  return (
    <div style={{ color: "#ECEAE3" }}>
      <div className="mb-6">
        <h1
          className="text-2xl font-bold"
          style={{ fontFamily: "'Archivo', sans-serif", color: "#ECEAE3" }}
        >
          Mensagens
        </h1>
        <p className="mt-1 text-sm" style={{ color: "#5C636B" }}>
          Conversas diretas com seus atletas
        </p>
      </div>

      {convs.length === 0 ? (
        <div className="flex flex-col items-center gap-4 py-20 text-center">
          <div
            className="flex h-16 w-16 items-center justify-center rounded-full"
            style={{ background: "rgba(198,242,78,0.1)" }}
          >
            <MessageSquare className="h-8 w-8" style={{ color: "#C6F24E" }} />
          </div>
          <p className="text-sm" style={{ color: "#5C636B" }}>
            Nenhuma conversa ainda. Os atletas que enviarem mensagens aparecerão aqui.
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {convs.map((c) => {
            const lastMsg = c.messages?.[0];
            return (
              <Link
                key={c.id}
                href={`/treinador/mensagens/${c.id}`}
                className="flex items-center gap-3 rounded-2xl px-4 py-3 transition-colors"
                style={{
                  background: "rgba(255,255,255,0.03)",
                  border: "1px solid rgba(255,255,255,0.06)",
                }}
              >
                <div
                  className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-sm font-bold"
                  style={{ background: "rgba(198,242,78,0.12)", color: "#C6F24E" }}
                >
                  {c.athlete?.avatarUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={c.athlete.avatarUrl} alt={c.athlete.name ?? ""} className="h-full w-full rounded-full object-cover" />
                  ) : (
                    <User className="h-5 w-5" />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-semibold" style={{ color: "#ECEAE3" }}>
                      {c.athlete?.name ?? "Atleta"}
                    </p>
                    {lastMsg?.createdAt && (
                      <span className="text-[11px]" style={{ color: "#5C636B" }}>
                        {new Date(lastMsg.createdAt).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" })}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center justify-between gap-2 mt-0.5">
                    <p className="truncate text-xs" style={{ color: "#5C636B" }}>
                      {lastMsg?.content ?? "Nenhuma mensagem ainda"}
                    </p>
                    {c.unread > 0 && (
                      <span
                        className="flex h-5 min-w-[20px] shrink-0 items-center justify-center rounded-full px-1.5 text-[10px] font-bold"
                        style={{ background: "#C6F24E", color: "#0A0C0F" }}
                      >
                        {c.unread}
                      </span>
                    )}
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
