"use client";

import { useState, useEffect } from "react";
import { Heart, Loader2, MessageCircle, Plus, Send, Share2, Users, Medal, ChevronUp, ChevronDown, Minus, CalendarDays } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
interface ActivityMetrics { distance: number; pace: string; duration: string; elevation?: number; calories?: number; avgHr?: number; splits?: { km: number; pace: string; elev?: number }[] }
interface ActivityPost {
  id: string; athleteName: string; athleteAvatar: string; avatarColor: string;
  timeAgo: string; caption: string; photoGradient: string;
  metrics: ActivityMetrics; likes: number;
  comments: { author: string; text: string; timeAgo: string }[];
}
type ChallengeType = "distance" | "sessions" | "elevation" | "speed";
interface MonthlyChallenge {
  id: string; month: string; emoji: string; title: string; theme: string;
  description: string; type: ChallengeType; target: number; unit: string;
  currentProgress: number; participants: number; prize: string; endsInDays: number;
  leaderboard: { rank: number; name: string; avatar: string; value: number; isYou?: boolean }[];
  color: string;
}
import { cn } from "@/lib/utils";

interface Club { id: string; name: string; members: number; location: string }
interface RankingEntry { position: number; name: string; value: string; trend: string; highlight?: boolean }

interface RealPost {
  id: string;
  content: string;
  imageUrl?: string | null;
  workoutSummary?: Record<string, unknown> | null;
  createdAt: string;
  author: { id: string; name: string; image?: string | null };
  likesCount: number;
  likedByMe: boolean;
  comments: { id: string; content: string; createdAt: string; author: { id: string; name: string } }[];
}

const CHALLENGES: MonthlyChallenge[] = [];
const CLUBS: Club[] = [];
const RANKING: RankingEntry[] = [];

function drawRoundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.arcTo(x + w, y, x + w, y + r, r);
  ctx.lineTo(x + w, y + h - r);
  ctx.arcTo(x + w, y + h, x + w - r, y + h, r);
  ctx.lineTo(x + r, y + h);
  ctx.arcTo(x, y + h, x, y + h - r, r);
  ctx.lineTo(x, y + r);
  ctx.arcTo(x, y, x + r, y, r);
  ctx.closePath();
}

async function sharePost(post: ActivityPost) {
  const canvas = document.createElement("canvas");
  canvas.width = 1080;
  canvas.height = 1920;
  const ctx = canvas.getContext("2d")!;
  const grad = ctx.createLinearGradient(0, 0, 1080, 1920);
  grad.addColorStop(0, "#1a1040");
  grad.addColorStop(1, "#050816");
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 1080, 1920);
  ctx.fillStyle = "rgba(255,255,255,0.05)";
  drawRoundRect(ctx, 80, 600, 920, 600, 32);
  ctx.fill();
  ctx.fillStyle = "#ffffff";
  ctx.font = "bold 180px sans-serif";
  ctx.textAlign = "center";
  ctx.fillText(`${post.metrics.distance.toFixed(2).replace(".", ",")} km`, 540, 800);
  ctx.font = "80px sans-serif";
  ctx.fillStyle = "rgba(255,255,255,0.8)";
  ctx.fillText(`${post.metrics.pace} /km  ·  ${post.metrics.duration}`, 540, 940);
  ctx.font = "48px sans-serif";
  ctx.fillStyle = "rgba(139,92,246,0.9)";
  ctx.fillText("⚡ PACE RUN PRO", 540, 1200);

  canvas.toBlob(async (blob) => {
    if (!blob) return;
    const file = new File([blob], "treino.png", { type: "image/png" });
    if (navigator.canShare?.({ files: [file] })) {
      await navigator.share({ files: [file], title: "Meu treino", text: post.caption });
    } else {
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `treino-${post.metrics.distance}km.png`;
      a.click();
      URL.revokeObjectURL(url);
    }
  });
}

function colorBorder(color: string) {
  if (color === "purple") return "border-l-purple-500";
  if (color === "emerald") return "border-l-emerald-500";
  if (color === "amber") return "border-l-amber-500";
  return "border-l-cyan-500";
}

function colorProgress(color: string) {
  if (color === "purple") return "bg-purple-500";
  if (color === "emerald") return "bg-emerald-500";
  if (color === "amber") return "bg-amber-500";
  return "bg-cyan-500";
}

function colorText(color: string) {
  if (color === "purple") return "text-purple-400";
  if (color === "emerald") return "text-emerald-400";
  if (color === "amber") return "text-amber-400";
  return "text-cyan-400";
}

function colorRing(color: string) {
  if (color === "purple") return "ring-purple-500";
  if (color === "emerald") return "ring-emerald-500";
  if (color === "amber") return "ring-amber-500";
  return "ring-cyan-500";
}

function SplitsBars({ splits }: { splits: { km: number; pace: string; elev?: number }[] }) {
  const paceToSec = (p: string) => {
    const [m, s] = p.split(":").map(Number);
    return m * 60 + (s || 0);
  };
  const paces = splits.map((s) => paceToSec(s.pace));
  const maxPace = Math.max(...paces);
  const minPace = Math.min(...paces);
  const range = maxPace - minPace || 1;

  return (
    <div className="flex items-end gap-0.5 h-8">
      {splits.map((s, i) => {
        const sec = paceToSec(s.pace);
        const height = Math.round(((maxPace - sec) / range) * 24 + 8);
        return (
          <div
            key={i}
            style={{ height: `${height}px` }}
            className="w-4 rounded-sm bg-white/30 flex-shrink-0"
            title={`km ${s.km}: ${s.pace}/km`}
          />
        );
      })}
    </div>
  );
}

function ActivityCard({ post }: { post: ActivityPost }) {
  const [isLiked, setIsLiked] = useState(false);

  return (
    <Card className="overflow-hidden">
      <div
        className="relative w-full"
        style={{
          background: post.photoGradient,
          aspectRatio: "4/5",
          maxHeight: 480,
        }}
      >
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />

        <div className="absolute top-3 left-3 flex items-center gap-2">
          <div
            className={cn(
              "flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold text-text",
              post.avatarColor
            )}
          >
            {post.athleteAvatar}
          </div>
          <span className="text-xs font-semibold text-text/90">{post.athleteName}</span>
        </div>

        <div className="absolute inset-x-0 bottom-0 p-4 flex flex-col gap-1">
          {post.metrics.splits && post.metrics.splits.length > 0 && (
            <div className="mb-2">
              <SplitsBars splits={post.metrics.splits} />
            </div>
          )}
          <p className="text-text font-bold text-center"
            style={{ fontSize: "2.5rem", lineHeight: 1.1 }}>
            {post.metrics.distance.toFixed(2).replace(".", ",")} <span className="text-2xl font-semibold">km</span>
          </p>
          <div className="flex items-center justify-center gap-4 text-text/80 text-sm font-medium">
            <span>{post.metrics.pace} /km</span>
            <span>·</span>
            <span>{post.metrics.duration}</span>
            {post.metrics.elevation !== undefined && post.metrics.elevation > 0 && (
              <>
                <span>·</span>
                <span>↑ {post.metrics.elevation}m</span>
              </>
            )}
          </div>
        </div>

        <div className="absolute bottom-3 right-3 text-text/40 text-xs font-semibold tracking-wide">
          ⚡ PACE RUN PRO
        </div>
      </div>

      <CardContent className="p-4">
        <div className="flex items-center gap-2 mb-2">
          <div
            className={cn(
              "flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold text-text flex-shrink-0",
              post.avatarColor
            )}
          >
            {post.athleteAvatar}
          </div>
          <div>
            <p className="text-sm font-semibold text-text leading-none">{post.athleteName}</p>
            <p className="text-xs text-text-muted">{post.timeAgo}</p>
          </div>
        </div>

        <p className="text-sm text-text-muted mb-3 leading-relaxed">{post.caption}</p>

        <div className="flex items-center gap-4 border-t border-border pt-3 text-sm text-text-muted">
          <button
            onClick={() => setIsLiked((v) => !v)}
            className={cn(
              "flex items-center gap-1.5 transition-colors hover:text-red-400",
              isLiked && "text-red-400"
            )}
          >
            <Heart className={cn("h-4 w-4 transition-transform", isLiked && "fill-current scale-110")} />
            {post.likes + (isLiked ? 1 : 0)}
          </button>
          <button className="flex items-center gap-1.5 transition-colors hover:text-text">
            <MessageCircle className="h-4 w-4" />
            {post.comments.length}
          </button>
          <button
            onClick={() => sharePost(post)}
            className="flex items-center gap-1.5 transition-colors hover:text-text ml-auto"
          >
            <Share2 className="h-4 w-4" />
            <span className="text-xs">Compartilhar</span>
          </button>
        </div>

        {post.comments.length > 0 && (
          <div className="mt-3 space-y-1.5 border-t border-border pt-3">
            {post.comments.map((c, i) => (
              <div key={i} className="text-xs text-text-muted">
                <span className="font-semibold text-text/80">{c.author}</span>{" "}
                {c.text}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function ChallengeCard({
  challenge,
  expanded,
  onToggle,
}: {
  challenge: MonthlyChallenge;
  expanded: boolean;
  onToggle: () => void;
}) {
  const [joined, setJoined] = useState(false);
  const progressPct = Math.round((challenge.currentProgress / challenge.target) * 100);

  return (
    <Card className={cn("border-l-4", colorBorder(challenge.color))}>
      <CardContent className="p-4">
        <div className="flex items-start gap-2 mb-3">
          <span className="text-2xl">{challenge.emoji}</span>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-text text-sm leading-tight">{challenge.title}</p>
            <Badge variant="default" className="mt-1 text-xs">{challenge.theme}</Badge>
          </div>
        </div>

        <div className="mb-2">
          <div className="flex justify-between text-xs text-text-muted mb-1">
            <span>
              {challenge.currentProgress} / {challenge.target} {challenge.unit}
            </span>
            <span className={cn("font-semibold", colorText(challenge.color))}>
              {progressPct}%
            </span>
          </div>
          <div className="h-2 w-full rounded-full bg-white/10 overflow-hidden">
            <div
              className={cn("h-full rounded-full transition-all", colorProgress(challenge.color))}
              style={{ width: `${Math.min(progressPct, 100)}%` }}
            />
          </div>
        </div>

        <div className="flex items-center justify-between text-xs text-text-muted mb-2">
          <span>{challenge.participants.toLocaleString("pt-BR")} participantes</span>
          <span>{challenge.endsInDays} dias restantes</span>
        </div>

        <button
          onClick={onToggle}
          className="flex items-center gap-1 text-xs text-text-muted hover:text-text transition-colors w-full mb-2"
        >
          {expanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
          <span>{expanded ? "Ocultar" : "Ver"} ranking do desafio</span>
        </button>

        {expanded && (
          <div className="space-y-1.5 mb-3">
            {challenge.leaderboard.map((entry) => (
              <div
                key={entry.rank}
                className={cn(
                  "flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs",
                  entry.isYou
                    ? cn("ring-1", colorRing(challenge.color), "bg-white/5")
                    : "bg-white/3"
                )}
              >
                <span
                  className={cn(
                    "font-bold w-5 text-center",
                    entry.rank <= 3 ? "text-warning" : "text-text-muted"
                  )}
                >
                  #{entry.rank}
                </span>
                <div
                  className={cn(
                    "flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold text-text flex-shrink-0",
                    entry.isYou ? colorProgress(challenge.color) : "bg-white/20"
                  )}
                >
                  {entry.avatar}
                </div>
                <span className={cn("flex-1 truncate", entry.isYou ? "text-text font-semibold" : "text-text/80")}>
                  {entry.name} {entry.isYou && "(você)"}
                </span>
                <span className={cn(entry.isYou ? colorText(challenge.color) : "text-text-muted")}>
                  {entry.value} {challenge.unit}
                </span>
              </div>
            ))}
          </div>
        )}

        <div className="mt-3 flex items-center justify-between gap-3">
          <p className="text-xs text-text-muted italic">
            Prêmio: <span className="text-text/70 not-italic">{challenge.prize}</span>
          </p>
          <Button
            size="sm"
            variant={joined ? "secondary" : "primary"}
            className={cn("shrink-0 text-xs", joined && "text-success")}
            onClick={() => setJoined((v) => !v)}
          >
            {joined ? "✓ Participando" : "Participar"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function RealPostCard({ post, onLike }: { post: RealPost; onLike: (id: string) => void }) {
  const [showComments, setShowComments] = useState(false);
  const [commentText, setCommentText] = useState("");
  const [sendingComment, setSendingComment] = useState(false);
  const [localComments, setLocalComments] = useState(post.comments);

  async function submitComment() {
    if (!commentText.trim() || sendingComment) return;
    setSendingComment(true);
    try {
      const res = await fetch(`/api/atleta/feed/${post.id}/comment`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: commentText.trim() }),
      });
      if (res.ok) {
        const d = await res.json();
        setLocalComments((prev) => [...prev, d.comment]);
        setCommentText("");
      }
    } finally {
      setSendingComment(false);
    }
  }

  function timeAgo(iso: string): string {
    const diff = (Date.now() - new Date(iso).getTime()) / 1000;
    if (diff < 60) return "agora";
    if (diff < 3600) return `${Math.floor(diff / 60)}min`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h`;
    return `${Math.floor(diff / 86400)}d`;
  }

  return (
    <Card>
      <CardContent className="p-4 space-y-3">
        {/* Author header */}
        <div className="flex items-center gap-2.5">
          <div className="h-9 w-9 rounded-full bg-primary/15 flex items-center justify-center text-sm font-bold text-primary shrink-0">
            {post.author.name?.[0]?.toUpperCase() ?? "?"}
          </div>
          <div>
            <p className="text-sm font-semibold text-text">{post.author.name}</p>
            <p className="text-[11px] text-text-muted">{timeAgo(post.createdAt)}</p>
          </div>
        </div>

        {/* Content */}
        <p className="text-sm text-text leading-relaxed">{post.content}</p>

        {/* Workout summary chips */}
        {post.workoutSummary && typeof post.workoutSummary === "object" && (
          <div className="flex flex-wrap gap-1.5">
            {Object.entries(post.workoutSummary).map(([k, v]) => (
              <span key={k} className="rounded-full bg-primary/10 px-2.5 py-0.5 text-[11px] font-semibold text-primary">
                {k}: {String(v)}
              </span>
            ))}
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center gap-4 pt-1">
          <button
            onClick={() => onLike(post.id)}
            className={cn(
              "flex items-center gap-1.5 text-xs font-semibold transition-colors",
              post.likedByMe ? "text-danger" : "text-text-muted hover:text-danger"
            )}
          >
            <Heart className={cn("h-4 w-4", post.likedByMe && "fill-danger")} />
            {post.likesCount}
          </button>
          <button
            onClick={() => setShowComments((v) => !v)}
            className="flex items-center gap-1.5 text-xs font-semibold text-text-muted hover:text-text transition-colors"
          >
            <MessageCircle className="h-4 w-4" />
            {localComments.length}
          </button>
        </div>

        {/* Comments */}
        {showComments && (
          <div className="space-y-2 border-t border-border pt-3">
            {localComments.map((c) => (
              <div key={c.id} className="flex gap-2">
                <span className="h-6 w-6 rounded-full bg-card-hover flex items-center justify-center text-[10px] font-bold text-text-muted shrink-0">
                  {c.author.name?.[0]?.toUpperCase() ?? "?"}
                </span>
                <div>
                  <span className="text-xs font-semibold text-text mr-1">{c.author.name}</span>
                  <span className="text-xs text-text-muted">{c.content}</span>
                </div>
              </div>
            ))}
            <div className="flex gap-2 pt-1">
              <input
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && submitComment()}
                placeholder="Escreva um comentário…"
                maxLength={500}
                className="flex-1 rounded-xl border border-border bg-background px-3 py-1.5 text-xs text-text placeholder:text-text-muted/50 outline-none focus:border-primary/60 focus:ring-1 focus:ring-primary/20"
              />
              <button
                onClick={submitComment}
                disabled={!commentText.trim() || sendingComment}
                className="flex items-center gap-1 rounded-xl bg-primary/90 px-3 py-1.5 text-xs font-semibold text-background disabled:opacity-50"
              >
                {sendingComment ? <Loader2 className="h-3 w-3 animate-spin" /> : <Send className="h-3 w-3" />}
              </button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default function CommunityPage() {
  const [expandedChallenge, setExpandedChallenge] = useState<string | null>(null);
  const [posts, setPosts] = useState<ActivityPost[]>([]);
  const [joinedClubs, setJoinedClubs] = useState<Set<string>>(new Set());
  const [realPosts, setRealPosts] = useState<RealPost[]>([]);
  const [feedLoading, setFeedLoading] = useState(true);
  const [composeText, setComposeText] = useState("");
  const [publishing, setPublishing] = useState(false);
  const [showCompose, setShowCompose] = useState(false);

  useEffect(() => {
    const pending = localStorage.getItem("newActivityPost");
    if (pending) {
      const post = JSON.parse(pending) as ActivityPost;
      setPosts((prev) => [post, ...prev]);
      localStorage.removeItem("newActivityPost");
    }

    fetch("/api/atleta/feed")
      .then((r) => r.ok ? r.json() : null)
      .then((d: { posts?: RealPost[] } | null) => {
        if (d?.posts) setRealPosts(d.posts);
      })
      .catch(() => null)
      .finally(() => setFeedLoading(false));
  }, []);

  async function handlePublish() {
    if (!composeText.trim() || publishing) return;
    setPublishing(true);
    try {
      const res = await fetch("/api/atleta/feed", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: composeText.trim() }),
      });
      if (res.ok) {
        const d = await res.json();
        setRealPosts((prev) => [{ ...d.post, likesCount: 0, likedByMe: false, comments: [] }, ...prev]);
        setComposeText("");
        setShowCompose(false);
      }
    } finally {
      setPublishing(false);
    }
  }

  function handleLike(postId: string) {
    fetch(`/api/atleta/feed/${postId}/like`, { method: "POST" })
      .then((r) => r.ok ? r.json() : null)
      .then((d: { liked?: boolean; likesCount?: number } | null) => {
        if (!d) return;
        setRealPosts((prev) =>
          prev.map((p) =>
            p.id === postId ? { ...p, likedByMe: d.liked ?? p.likedByMe, likesCount: d.likesCount ?? p.likesCount } : p
          )
        );
      })
      .catch(() => null);
  }

  function toggleClub(id: string) {
    setJoinedClubs((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  return (
    <div className="mx-auto max-w-6xl space-y-7">
      <div>
        <Badge variant="primary" className="mb-2">Comunidade</Badge>
        <h1 className="font-display text-2xl font-bold text-text sm:text-3xl">Desafios, feed e clubes</h1>
        <p className="mt-1.5 text-sm text-text-muted">
          Conecte-se com outros corredores, participe de desafios mensais e acompanhe seu ranking.
        </p>
      </div>

      {/* Quick join banner */}
      {CHALLENGES.length > 0 && (
        <div className="grid gap-3 sm:grid-cols-2">
          {CHALLENGES.slice(0, 2).map((c) => {
            const progressPct = Math.round((c.currentProgress / c.target) * 100);
            return (
              <div key={c.id} className={cn("rounded-2xl border-l-4 border border-border bg-card p-4 flex items-start gap-3", colorBorder(c.color))}>
                <span className="text-2xl shrink-0">{c.emoji}</span>
                <div className="min-w-0 flex-1 space-y-1.5">
                  <p className="text-sm font-semibold text-text leading-tight">{c.title}</p>
                  <div className="h-1.5 w-full rounded-full bg-white/10 overflow-hidden">
                    <div className={cn("h-full rounded-full", colorProgress(c.color))} style={{ width: `${Math.min(progressPct, 100)}%` }} />
                  </div>
                  <p className="text-[11px] text-text-muted">{progressPct}% · {c.endsInDays} dias restantes · {c.participants.toLocaleString()} participantes</p>
                </div>
                <button
                  onClick={() => setExpandedChallenge(c.id === expandedChallenge ? null : c.id)}
                  className={cn("shrink-0 rounded-xl px-3 py-1.5 text-xs font-semibold transition-colors", colorProgress(c.color), "text-white hover:opacity-90")}
                >
                  Participar
                </button>
              </div>
            );
          })}
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-[3fr_2fr]">
        <div className="space-y-4">
          <Tabs defaultValue="feed">
            <TabsList>
              <TabsTrigger value="feed">Feed</TabsTrigger>
              <TabsTrigger value="ranking">Ranking</TabsTrigger>
              <TabsTrigger value="clubes">Grupos</TabsTrigger>
            </TabsList>

            <TabsContent value="feed">
              <div className="space-y-4">
                {/* Compose box */}
                <div className="rounded-2xl border border-border bg-card p-4 space-y-3">
                  {!showCompose ? (
                    <button
                      onClick={() => setShowCompose(true)}
                      className="flex w-full items-center gap-3 text-left"
                    >
                      <div className="h-9 w-9 rounded-full bg-primary/15 flex items-center justify-center shrink-0">
                        <Plus className="h-4 w-4 text-primary" />
                      </div>
                      <span className="flex-1 rounded-xl border border-border bg-card-hover/40 px-3 py-2 text-sm text-text-muted">
                        Compartilhe um treino ou pensamento…
                      </span>
                    </button>
                  ) : (
                    <div className="space-y-2">
                      <textarea
                        value={composeText}
                        onChange={(e) => setComposeText(e.target.value)}
                        placeholder="O que você treinou hoje? Compartilhe com a comunidade…"
                        maxLength={1000}
                        rows={3}
                        autoFocus
                        className="w-full rounded-xl border border-border bg-background px-3.5 py-2.5 text-sm text-text placeholder:text-text-muted/50 outline-none focus:border-primary/60 focus:ring-2 focus:ring-primary/20 resize-none"
                      />
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs text-text-muted">{composeText.length}/1000</span>
                        <div className="flex gap-2">
                          <Button size="sm" variant="ghost" onClick={() => { setShowCompose(false); setComposeText(""); }}>
                            Cancelar
                          </Button>
                          <Button size="sm" variant="primary" onClick={handlePublish} disabled={!composeText.trim() || publishing}>
                            {publishing ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
                            Publicar
                          </Button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Real feed from API */}
                {feedLoading ? (
                  <div className="flex items-center justify-center py-10">
                    <Loader2 className="h-6 w-6 animate-spin text-text-muted" />
                  </div>
                ) : realPosts.length === 0 && posts.length === 0 ? (
                  <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-border py-12 text-center">
                    <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                      <Users className="h-6 w-6" />
                    </span>
                    <p className="text-sm font-semibold text-text">Nenhuma publicação ainda</p>
                    <p className="text-sm text-text-muted">Seja o primeiro a compartilhar um treino com a comunidade!</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {realPosts.map((p) => (
                      <RealPostCard key={p.id} post={p} onLike={handleLike} />
                    ))}
                  </div>
                )}

                {/* Legacy locally-shared posts */}
                {posts.length > 0 && (
                  posts.map((post) => <ActivityCard key={post.id} post={post} />)
                )}
              </div>
            </TabsContent>

            <TabsContent value="ranking">
              <Card>
                <CardContent className="p-5">
                  <h3 className="mb-4 flex items-center gap-2 font-display text-base font-semibold text-text">
                    <Medal className="h-4 w-4 text-warning" />
                    Ranking do mês
                  </h3>
                  {RANKING.length > 0 ? (
                    <div className="space-y-2">
                      {RANKING.map((r) => {
                        const TrendIcon = r.trend === "up" ? ChevronUp : r.trend === "down" ? ChevronDown : Minus;
                        const trendColor =
                          r.trend === "up"
                            ? "text-success"
                            : r.trend === "down"
                            ? "text-danger"
                            : "text-text-muted";
                        return (
                          <div
                            key={r.position}
                            className={cn(
                              "flex items-center gap-3 rounded-xl border p-2.5",
                              r.highlight
                                ? "border-primary/50 bg-primary/10"
                                : "border-border bg-card-hover/30"
                            )}
                          >
                            <span className={cn("font-display text-sm font-bold", r.position <= 3 ? "text-warning" : "text-text-muted")}>
                              #{r.position}
                            </span>
                            <span className="flex-1 truncate text-sm font-medium text-text">{r.name}</span>
                            <span className="text-xs text-text-muted">{r.value}</span>
                            <TrendIcon className={cn("h-4 w-4", trendColor)} />
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="flex flex-col items-center gap-3 py-8 text-center">
                      <Medal className="h-10 w-10 text-text-muted/30" />
                      <p className="text-sm text-text-muted">Ranking disponível em breve.</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="clubes">
              <div className="space-y-3">
                <p className="text-sm text-text-muted">Entre em grupos de corrida e conecte-se com atletas que compartilham seus objetivos.</p>
                {CLUBS.length > 0 ? (
                  <div className="grid gap-3 sm:grid-cols-2">
                    {CLUBS.map((c) => {
                      const joined = joinedClubs.has(c.id);
                      return (
                        <Card key={c.id} className={cn(joined && "border-primary/40")}>
                          <CardContent className="flex items-center gap-3 p-4">
                            <span className={cn("flex h-11 w-11 items-center justify-center rounded-xl", joined ? "bg-primary/20 text-primary" : "bg-secondary/15 text-secondary")}>
                              <Users className="h-5 w-5" />
                            </span>
                            <div className="min-w-0 flex-1">
                              <p className="truncate text-sm font-semibold text-text">{c.name}</p>
                              <p className="text-xs text-text-muted">
                                {c.members + (joined ? 1 : 0)} membros · {c.location}
                              </p>
                              {joined && <p className="text-xs text-primary font-semibold mt-0.5">✓ Participando</p>}
                            </div>
                            <Button size="sm" variant={joined ? "secondary" : "primary"} onClick={() => toggleClub(c.id)}>
                              {joined ? "Sair" : "Entrar"}
                            </Button>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                ) : (
                  <p className="rounded-2xl border border-dashed border-border py-8 text-center text-sm text-text-muted">Grupos disponíveis em breve.</p>
                )}
              </div>
            </TabsContent>
          </Tabs>
        </div>

        <div className="space-y-4">
          <div className="lg:sticky lg:top-6">
            <div className="flex items-center gap-2 mb-3">
              <CalendarDays className="h-4 w-4 text-primary" />
              <h2 className="font-display text-base font-semibold text-text">Desafios do Mês</h2>
            </div>

            <div className="space-y-3">
              {CHALLENGES.length > 0 ? (
                CHALLENGES.map((challenge) => (
                  <ChallengeCard
                    key={challenge.id}
                    challenge={challenge}
                    expanded={expandedChallenge === challenge.id}
                    onToggle={() =>
                      setExpandedChallenge((prev) =>
                        prev === challenge.id ? null : challenge.id
                      )
                    }
                  />
                ))
              ) : (
                <p className="rounded-xl border border-dashed border-border py-6 text-center text-sm text-text-muted">Desafios disponíveis em breve.</p>
              )}
            </div>

            <Card className="mt-4">
              <CardContent className="p-5">
                <h3 className="mb-3 font-display text-base font-semibold text-text">Gamificação</h3>
                <p className="text-sm text-text-muted">
                  Ganhe pontos completando treinos, mantendo sua sequência de adesão e participando de
                  desafios. Troque pontos por medalhas exclusivas e benefícios no plano.
                </p>
                <div className="mt-4 flex items-center gap-2">
                  {["🥇", "🥈", "🥉", "🔥", "⚡"].map((m, i) => (
                    <span
                      key={i}
                      className="flex h-10 w-10 items-center justify-center rounded-xl bg-card-hover text-lg"
                    >
                      {m}
                    </span>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
