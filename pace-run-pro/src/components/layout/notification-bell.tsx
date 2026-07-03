"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Bell, BellRing, X, CheckCheck } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

interface NotifItem {
  id: string;
  title: string;
  body: string;
  link?: string | null;
  read: boolean;
  createdAt: string;
}

const POLL_MS = 60_000;

export function NotificationBell() {
  const router = useRouter();
  const [unread, setUnread] = useState(0);
  const [items, setItems] = useState<NotifItem[]>([]);
  const [open, setOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  async function fetchNotifications() {
    try {
      const res = await fetch("/api/notifications", { credentials: "include" });
      if (!res.ok) return;
      const data = await res.json();
      setUnread(data.unreadCount ?? 0);
      setItems(data.notifications ?? []);
    } catch {
      // silent — network failures shouldn't break the UI
    }
  }

  useEffect(() => {
    fetchNotifications();
    const id = setInterval(fetchNotifications, POLL_MS);
    return () => clearInterval(id);
  }, []);

  // Close panel on outside click
  useEffect(() => {
    if (!open) return;
    function onPointerDown(e: PointerEvent) {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, [open]);

  async function markRead(ids?: string[]) {
    try {
      await fetch("/api/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: ids ? JSON.stringify({ ids }) : undefined,
      });
      if (ids) {
        setItems((prev) => prev.map((n) => ids.includes(n.id) ? { ...n, read: true } : n));
        setUnread((c) => Math.max(0, c - ids.length));
      } else {
        setUnread(0);
        setItems((prev) => prev.map((n) => ({ ...n, read: true })));
      }
    } catch {
      // silent
    }
  }

  async function handleNotifClick(n: NotifItem) {
    if (!n.read) await markRead([n.id]);
    setOpen(false);
    if (n.link) {
      router.push(n.link);
    }
  }

  function toggleOpen() {
    setOpen((v) => !v);
  }

  const relativeTime = (iso: string) => {
    const diff = Date.now() - new Date(iso).getTime();
    const mins = Math.floor(diff / 60_000);
    if (mins < 1) return "agora";
    if (mins < 60) return `${mins}m`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h`;
    return `${Math.floor(hrs / 24)}d`;
  };

  return (
    <div className="relative" ref={panelRef}>
      <button
        onClick={toggleOpen}
        aria-label="Notificações"
        className="relative rounded-lg p-2 text-text-muted hover:bg-card hover:text-text"
      >
        {unread > 0 ? <BellRing className="h-5 w-5 text-primary" /> : <Bell className="h-5 w-5" />}
        {unread > 0 && (
          <span className="absolute right-1 top-1 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-background">
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.96 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 top-full z-50 mt-2 w-80 origin-top-right rounded-2xl border border-border bg-card shadow-xl"
          >
            <div className="flex items-center justify-between border-b border-border px-4 py-3">
              <h3 className="text-sm font-semibold text-text">Notificações</h3>
              <div className="flex items-center gap-1">
                {unread > 0 && (
                  <button
                    onClick={() => markRead()}
                    title="Marcar todas como lidas"
                    className="rounded-lg p-1.5 text-text-muted hover:bg-card-hover hover:text-text"
                  >
                    <CheckCheck className="h-4 w-4" />
                  </button>
                )}
                <button
                  onClick={() => setOpen(false)}
                  className="rounded-lg p-1.5 text-text-muted hover:bg-card-hover hover:text-text"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>

            <div className="max-h-96 overflow-y-auto">
              {items.length === 0 ? (
                <div className="flex flex-col items-center gap-2 py-10 text-center">
                  <Bell className="h-8 w-8 text-text-muted/30" />
                  <p className="text-sm text-text-muted">Nenhuma notificação</p>
                </div>
              ) : (
                <ul>
                  {items.map((n) => (
                    <li key={n.id}>
                      <button
                        onClick={() => handleNotifClick(n)}
                        className={cn(
                          "flex w-full gap-3 border-b border-border/50 px-4 py-3 text-left last:border-0 transition-colors",
                          !n.read ? "bg-primary/5 hover:bg-primary/10" : "hover:bg-card-hover",
                          n.link && "cursor-pointer"
                        )}
                      >
                        <div className="mt-1 flex h-2 w-2 shrink-0 items-center justify-center">
                          {!n.read && <span className="h-2 w-2 rounded-full bg-primary" />}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-semibold text-text">{n.title}</p>
                          <p className="mt-0.5 text-[11px] leading-snug text-text-muted">{n.body}</p>
                          {n.link && (
                            <p className="mt-1 text-[10px] text-primary">Toque para abrir →</p>
                          )}
                        </div>
                        <span className="shrink-0 text-[10px] text-text-muted/60">{relativeTime(n.createdAt)}</span>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
