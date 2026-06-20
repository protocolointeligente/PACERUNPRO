"use client";

import { useState, useEffect } from "react";
import { Heart, MessageCircle, Share2, Users, Medal, ChevronUp, ChevronDown, Minus, CalendarDays } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { activityFeed, monthlyChallenges, clubs, ranking, type ActivityPost } from "@/lib/mock-data";
import { cn } from "@/lib/utils";

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
  ctx.roundRect(80, 600, 920, 600, 32);
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
  challenge: (typeof monthlyChallenges)[number];
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

export default function CommunityPage() {
  const [expandedChallenge, setExpandedChallenge] = useState<string | null>(null);
  const [posts, setPosts] = useState<ActivityPost[]>(activityFeed);
  const [joinedClubs, setJoinedClubs] = useState<Set<string>>(new Set());

  useEffect(() => {
    const pending = localStorage.getItem("newActivityPost");
    if (pending) {
      const post = JSON.parse(pending) as ActivityPost;
      setPosts((prev) => [post, ...prev]);
      localStorage.removeItem("newActivityPost");
    }
  }, []);

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
      <div className="grid gap-3 sm:grid-cols-2">
        {monthlyChallenges.slice(0, 2).map((c) => {
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

      <div className="grid gap-6 lg:grid-cols-[3fr_2fr]">
        <div className="space-y-4">
          <Tabs defaultValue="feed">
            <TabsList>
              <TabsTrigger value="feed">Feed</TabsTrigger>
              <TabsTrigger value="ranking">Ranking</TabsTrigger>
              <TabsTrigger value="clubes">Grupos</TabsTrigger>
            </TabsList>

            <TabsContent value="feed">
              <div className="space-y-5">
                {posts.map((post) => (
                  <ActivityCard key={post.id} post={post} />
                ))}
              </div>
            </TabsContent>

            <TabsContent value="ranking">
              <Card>
                <CardContent className="p-5">
                  <h3 className="mb-4 flex items-center gap-2 font-display text-base font-semibold text-text">
                    <Medal className="h-4 w-4 text-warning" />
                    Ranking do mês
                  </h3>
                  <div className="space-y-2">
                    {ranking.map((r) => {
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
                          <span
                            className={cn(
                              "font-display text-sm font-bold",
                              r.position <= 3 ? "text-warning" : "text-text-muted"
                            )}
                          >
                            #{r.position}
                          </span>
                          <span className="flex-1 truncate text-sm font-medium text-text">
                            {r.name}
                          </span>
                          <span className="text-xs text-text-muted">{r.value}</span>
                          <TrendIcon className={cn("h-4 w-4", trendColor)} />
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="clubes">
              <div className="space-y-3">
                <p className="text-sm text-text-muted">Entre em grupos de corrida e conecte-se com atletas que compartilham seus objetivos.</p>
                <div className="grid gap-3 sm:grid-cols-2">
                  {clubs.map((c) => {
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
              {monthlyChallenges.map((challenge) => (
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
              ))}
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
