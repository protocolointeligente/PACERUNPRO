"use client";

import { useState, useEffect, useRef } from "react";
import { MessageSquare, Send, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";

type Comment = {
  id: string;
  text: string;
  createdAt: string;
  user: { id: string; name: string; avatarUrl: string | null; role: string };
};

type Props = {
  logId: string;
  currentUserId: string;
  currentUserRole: string;
};

function timeAgo(iso: string): string {
  const diff = (Date.now() - new Date(iso).getTime()) / 1000;
  if (diff < 60) return "agora";
  if (diff < 3600) return `${Math.floor(diff / 60)}min`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h`;
  return `${Math.floor(diff / 86400)}d`;
}

export function WorkoutLogComments({ logId, currentUserId, currentUserRole }: Props) {
  const [open, setOpen] = useState(false);
  const [comments, setComments] = useState<Comment[]>([]);
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open) return;
    setLoading(true);
    fetch(`/api/workout-logs/${logId}/comments`)
      .then((r) => r.json())
      .then((data) => setComments(Array.isArray(data) ? data : []))
      .finally(() => setLoading(false));
  }, [open, logId]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!text.trim() || submitting) return;
    setSubmitting(true);
    const res = await fetch(`/api/workout-logs/${logId}/comments`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text }),
    });
    if (res.ok) {
      const created: Comment = await res.json();
      setComments((prev) => [...prev, created]);
      setText("");
      inputRef.current?.focus();
    }
    setSubmitting(false);
  }

  async function handleDelete(commentId: string) {
    await fetch(`/api/workout-logs/${logId}/comments/${commentId}`, { method: "DELETE" });
    setComments((prev) => prev.filter((c) => c.id !== commentId));
  }

  const count = comments.length;

  return (
    <div className="mt-2">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-1.5 text-xs text-text-muted hover:text-text transition-colors"
      >
        <MessageSquare className="h-3.5 w-3.5" />
        {open ? "Fechar" : count > 0 ? `${count} comentário${count !== 1 ? "s" : ""}` : "Comentar"}
      </button>

      {open && (
        <div className="mt-3 space-y-3">
          {loading ? (
            <p className="text-xs text-text-muted">Carregando...</p>
          ) : comments.length === 0 ? (
            <p className="text-xs text-text-muted">Nenhum comentário ainda.</p>
          ) : (
            <div className="space-y-2">
              {comments.map((c) => (
                <div key={c.id} className="flex gap-2 group">
                  <div className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-primary/10 text-[10px] font-bold text-primary uppercase">
                    {c.user.name.charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-baseline gap-1.5">
                      <span className="text-xs font-semibold text-text">{c.user.name}</span>
                      {c.user.role === "COACH" && (
                        <span className="text-[10px] font-medium text-primary">Treinador</span>
                      )}
                      <span className="text-[10px] text-text-muted ml-auto">{timeAgo(c.createdAt)}</span>
                      {(c.user.id === currentUserId || currentUserRole === "ADMIN") && (
                        <button
                          type="button"
                          onClick={() => handleDelete(c.id)}
                          className="opacity-0 group-hover:opacity-100 transition-opacity text-text-muted hover:text-red-400"
                        >
                          <Trash2 className="h-3 w-3" />
                        </button>
                      )}
                    </div>
                    <p className="text-xs text-text-muted mt-0.5 leading-relaxed">{c.text}</p>
                  </div>
                </div>
              ))}
            </div>
          )}

          <form onSubmit={handleSubmit} className="flex gap-2">
            <input
              ref={inputRef}
              type="text"
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Escreva um comentário..."
              className="flex-1 rounded-lg border border-border bg-background px-3 py-1.5 text-xs text-text placeholder:text-text-muted/50 outline-none focus:border-primary/60 focus:ring-1 focus:ring-primary/20 transition-colors"
            />
            <Button
              type="submit"
              size="sm"
              variant="primary"
              disabled={!text.trim() || submitting}
              className="h-7 px-2"
            >
              <Send className="h-3.5 w-3.5" />
            </Button>
          </form>
        </div>
      )}
    </div>
  );
}
