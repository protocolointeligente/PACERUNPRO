"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { MessageSquare, X } from "lucide-react";
import { usePathname } from "next/navigation";

interface Toast {
  id: string;
  fromName: string;
  content: string;
  href: string;
}

export function MessageNotifier({ role }: { role: "ATHLETE" | "COACH" }) {
  const [toast, setToast] = useState<Toast | null>(null);
  const prevUnread = useRef(0);
  const pathname = usePathname();

  useEffect(() => {
    let mounted = true;

    async function poll() {
      if (!mounted) return;
      try {
        const res = await fetch("/api/messages/unread");
        if (!res.ok) return;
        const data: { total: number; conversations: { id: string; unread: number; fromName: string; lastMessage: string }[] } = await res.json();

        if (data.total > prevUnread.current) {
          const newConvs = data.conversations.filter((c) => c.unread > 0);
          if (newConvs.length > 0) {
            const first = newConvs[0];
            const isOnChatPage =
              role === "ATHLETE"
                ? pathname?.startsWith("/atleta/treinador")
                : pathname?.startsWith(`/treinador/mensagens/${first.id}`);

            if (!isOnChatPage) {
              setToast({
                id: first.id,
                fromName: first.fromName,
                content: first.lastMessage,
                href: role === "ATHLETE" ? "/atleta/treinador" : `/treinador/mensagens/${first.id}`,
              });
              setTimeout(() => setToast(null), 6000);
            }
          }
        }
        prevUnread.current = data.total;
      } catch {
        // silent — polling failure is non-critical
      }
    }

    poll();
    const interval = setInterval(poll, 8000);
    return () => { mounted = false; clearInterval(interval); };
  }, [pathname, role]);

  if (!toast) return null;

  return (
    <div
      className="fixed bottom-24 left-4 right-4 z-[60] mx-auto max-w-sm rounded-2xl border p-4 shadow-2xl"
      style={{
        background: "rgba(10,12,15,0.95)",
        border: "1px solid rgba(198,242,78,0.25)",
        backdropFilter: "blur(24px)",
        WebkitBackdropFilter: "blur(24px)",
      }}
    >
      <div className="flex items-start gap-3">
        <div
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full"
          style={{ background: "rgba(198,242,78,0.15)" }}
        >
          <MessageSquare className="h-4 w-4" style={{ color: "#C6F24E" }} />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-xs font-semibold" style={{ color: "#C6F24E" }}>
            Nova mensagem de {toast.fromName}
          </p>
          <p
            className="mt-0.5 truncate text-sm"
            style={{ color: "#ECEAE3" }}
          >
            {toast.content}
          </p>
          <Link
            href={toast.href}
            onClick={() => setToast(null)}
            className="mt-2 inline-block text-xs font-semibold underline"
            style={{ color: "#C6F24E" }}
          >
            Ver mensagem →
          </Link>
        </div>
        <button
          onClick={() => setToast(null)}
          className="shrink-0 rounded-lg p-1 transition-colors hover:bg-white/10"
        >
          <X className="h-4 w-4" style={{ color: "#5C636B" }} />
        </button>
      </div>
    </div>
  );
}
