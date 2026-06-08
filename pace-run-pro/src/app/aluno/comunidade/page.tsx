"use client";

import { useState } from "react";
import { Heart, MessageCircle, Share2, Trophy, Users, Medal, ChevronUp, ChevronDown, Minus } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { clubs, communityFeed, monthlyChallenge, ranking } from "@/lib/mock-data";
import { cn } from "@/lib/utils";

export default function CommunityPage() {
  const [liked, setLiked] = useState<Record<string, boolean>>({});

  return (
    <div className="mx-auto max-w-6xl space-y-7">
      <div>
        <Badge variant="primary" className="mb-2">Comunidade</Badge>
        <h1 className="font-display text-2xl font-bold text-white sm:text-3xl">Desafios, ranking e clubes</h1>
        <p className="mt-1.5 text-sm text-text-muted">Conecte-se com outros corredores, participe de desafios mensais e acompanhe seu ranking.</p>
      </div>

      <div className="grid gap-5 lg:grid-cols-[1.5fr_1fr]">
        {/* Feed */}
        <div className="space-y-4">
          <Tabs defaultValue="feed">
            <TabsList>
              <TabsTrigger value="feed">Feed</TabsTrigger>
              <TabsTrigger value="desafios">Desafios</TabsTrigger>
              <TabsTrigger value="clubes">Clubes</TabsTrigger>
            </TabsList>

            <TabsContent value="feed">
              <div className="space-y-4">
                {communityFeed.map((post) => {
                  const isLiked = !!liked[post.id];
                  return (
                    <Card key={post.id}>
                      <CardContent className="p-5">
                        <div className="flex items-center gap-3">
                          <Avatar>
                            <AvatarImage src={post.avatarUrl} alt={post.author} />
                            <AvatarFallback>{post.author.slice(0, 2).toUpperCase()}</AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="text-sm font-semibold text-white">{post.author}</p>
                            <p className="text-xs text-text-muted">{post.time}</p>
                          </div>
                        </div>
                        <p className="mt-3 text-sm text-text-muted">{post.content}</p>
                        {post.workout && (
                          <Badge variant="info" className="mt-3">
                            <Trophy className="h-3 w-3" /> {post.workout}
                          </Badge>
                        )}
                        <div className="mt-4 flex items-center gap-5 border-t border-border pt-3 text-sm text-text-muted">
                          <button
                            onClick={() => setLiked((s) => ({ ...s, [post.id]: !s[post.id] }))}
                            className={cn("flex items-center gap-1.5 transition-colors hover:text-danger", isLiked && "text-danger")}
                          >
                            <Heart className={cn("h-4 w-4", isLiked && "fill-current")} />
                            {post.likes + (isLiked ? 1 : 0)}
                          </button>
                          <button className="flex items-center gap-1.5 transition-colors hover:text-white">
                            <MessageCircle className="h-4 w-4" />
                            {post.comments}
                          </button>
                          <button className="flex items-center gap-1.5 transition-colors hover:text-white">
                            <Share2 className="h-4 w-4" />
                            Compartilhar
                          </button>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </TabsContent>

            <TabsContent value="desafios">
              <Card className="border-primary/30 bg-gradient-to-br from-primary/12 to-card">
                <CardContent className="p-5">
                  <div className="flex items-center gap-3">
                    <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/15 text-primary">
                      <Trophy className="h-5 w-5" />
                    </span>
                    <div>
                      <h3 className="font-display text-lg font-bold text-white">{monthlyChallenge.title}</h3>
                      <p className="text-xs text-text-muted">{monthlyChallenge.participants.toLocaleString("pt-BR")} participantes · faltam {monthlyChallenge.daysLeft} dias</p>
                    </div>
                  </div>
                  <div className="mt-4">
                    <div className="mb-1.5 flex justify-between text-xs text-text-muted">
                      <span>Seu progresso</span>
                      <span className="font-semibold text-white">{Math.round(monthlyChallenge.progress * 100)}%</span>
                    </div>
                    <Progress value={monthlyChallenge.progress * 100} />
                  </div>
                  <p className="mt-3 text-xs text-text-muted">
                    Recompensa: <span className="text-white">{monthlyChallenge.reward}</span>
                  </p>
                  <Button className="mt-4 w-full sm:w-auto">Ver detalhes do desafio</Button>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="clubes">
              <div className="grid gap-3 sm:grid-cols-2">
                {clubs.map((c) => (
                  <Card key={c.id}>
                    <CardContent className="flex items-center gap-3 p-4">
                      <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-secondary/15 text-secondary">
                        <Users className="h-5 w-5" />
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold text-white">{c.name}</p>
                        <p className="text-xs text-text-muted">{c.members} membros · {c.location}</p>
                      </div>
                      <Button size="sm" variant="secondary">Entrar</Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>
          </Tabs>
        </div>

        {/* Ranking + medals */}
        <div className="space-y-5">
          <Card>
            <CardContent className="p-5">
              <h3 className="mb-4 flex items-center gap-2 font-display text-base font-semibold text-white">
                <Medal className="h-4 w-4 text-warning" />
                Ranking do mês
              </h3>
              <div className="space-y-2">
                {ranking.map((r) => {
                  const TrendIcon = r.trend === "up" ? ChevronUp : r.trend === "down" ? ChevronDown : Minus;
                  const trendColor = r.trend === "up" ? "text-success" : r.trend === "down" ? "text-danger" : "text-text-muted";
                  return (
                    <div
                      key={r.position}
                      className={cn(
                        "flex items-center gap-3 rounded-xl border p-2.5",
                        r.highlight ? "border-primary/50 bg-primary/10" : "border-border bg-card-hover/30"
                      )}
                    >
                      <span className={cn("font-display text-sm font-bold", r.position <= 3 ? "text-warning" : "text-text-muted")}>
                        #{r.position}
                      </span>
                      <span className="flex-1 truncate text-sm font-medium text-white">{r.name}</span>
                      <span className="text-xs text-text-muted">{r.value}</span>
                      <TrendIcon className={cn("h-4 w-4", trendColor)} />
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-5">
              <h3 className="mb-3 font-display text-base font-semibold text-white">Gamificação</h3>
              <p className="text-sm text-text-muted">
                Ganhe pontos completando treinos, mantendo sua sequência de adesão e participando de desafios. Troque
                pontos por medalhas exclusivas e benefícios no plano.
              </p>
              <div className="mt-4 flex items-center gap-2">
                {["🥇", "🥈", "🥉", "🔥", "⚡"].map((m, i) => (
                  <span key={i} className="flex h-10 w-10 items-center justify-center rounded-xl bg-card-hover text-lg">
                    {m}
                  </span>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
