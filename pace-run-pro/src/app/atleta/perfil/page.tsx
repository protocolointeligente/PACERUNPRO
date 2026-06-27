"use client";

import { useEffect, useState } from "react";
import {
  Award,
  Bell,
  Camera,
  CheckCircle2,
  CreditCard,
  Globe,
  Loader2,
  LogOut,
  Pencil,
  RefreshCw,
  Shield,
  Smartphone,
  Target,
  User,
  XCircle,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
// Static integration metadata (connected status fetched from /api/integrations/status)
const INTEGRATIONS_LIST = [
  { id: "strava", name: "Strava", description: "Compartilhe e importe atividades automaticamente." },
  { id: "garmin", name: "Garmin Connect", description: "Sincronize treinos, FC e GPS automaticamente." },
  { id: "coros", name: "Coros", description: "Importe sessões de corrida e métricas de desempenho." },
  { id: "polar", name: "Polar Flow", description: "Sincronize dados de frequência cardíaca e treinos." },
  { id: "apple", name: "Apple Watch / HealthKit", description: "Sincronize treinos e dados de saúde do iPhone." },
];
const SOURCE_LABELS: Record<string, string> = { strava: "Strava", garmin: "Garmin", polar: "Polar", coros: "Coros", apple: "Apple Watch", manual: "Manual" };
const SOURCE_COLORS: Record<string, string> = { strava: "#FC4C02", garmin: "#00B9FF", polar: "#E63946", coros: "#1A1A2E", apple: "#555555", manual: "#94a3b8" };
import { cn } from "@/lib/utils";
import { signOut } from "next-auth/react";

const inputClass =
  "w-full rounded-xl border border-border bg-background px-3.5 py-2.5 text-sm text-text placeholder:text-text-muted/50 outline-none focus:border-primary/60 focus:ring-2 focus:ring-primary/20 transition-colors";

export default function ProfilePage() {
  // Profile data loaded from API
  const [profile, setProfile] = useState<{
    name?: string; city?: string; state?: string; phone?: string;
    avatarUrl?: string | null; bannerUrl?: string | null;
    weightKg?: number | null; heightCm?: number | null;
    raceDate?: string | null; goal?: string | null;
    level?: string | null; coachName?: string | null;
  }>({});

  const [notifs, setNotifsRaw] = useState({ workouts: true, community: false, coach: true });
  function setNotifs(val: typeof notifs) {
    setNotifsRaw(val);
    try { localStorage.setItem("notif-prefs", JSON.stringify(val)); } catch { /* storage unavailable */ }
  }
  const [activeTab, setActiveTab] = useState("dados");
  const [races, setRaces] = useState<Array<{ id: string; name: string; date: string; distanceKm: number; resultTime?: string | null }>>([]);
  const [achievements, setAchievements] = useState<Array<{ id: string; title: string; description?: string | null; icon?: string | null; earnedAt: string }>>([]);
  const [stravaConnected, setStravaConnected] = useState(false);
  const [stravaLastSync, setStravaLastSync] = useState<string | null>(null);
  const [stravaLoading, setStravaLoading] = useState<"sync" | "disconnect" | null>(null);
  const [banner, setBanner] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [comingSoonId, setComingSoonId] = useState<string | null>(null);
  const [settingsMsg, setSettingsMsg] = useState<string | null>(null);

  // Avatar & banner upload
  const [avatarSrc, setAvatarSrc] = useState("");
  const [bannerSrc, setBannerSrc] = useState("");
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [bannerUploading, setBannerUploading] = useState(false);

  async function resizeImage(file: File, maxW: number, maxH: number, quality = 0.82): Promise<string> {
    return new Promise((resolve) => {
      const img = new Image();
      const objUrl = URL.createObjectURL(file);
      img.onload = () => {
        const ratio = Math.min(maxW / img.width, maxH / img.height, 1);
        const canvas = document.createElement("canvas");
        canvas.width = Math.round(img.width * ratio);
        canvas.height = Math.round(img.height * ratio);
        canvas.getContext("2d")!.drawImage(img, 0, 0, canvas.width, canvas.height);
        URL.revokeObjectURL(objUrl);
        resolve(canvas.toDataURL("image/jpeg", quality));
      };
      img.src = objUrl;
    });
  }

  async function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setAvatarUploading(true);
    try {
      const dataUrl = await resizeImage(file, 400, 400);
      const res = await fetch("/api/atleta/avatar", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ dataUrl }),
      });
      if (res.ok) {
        setAvatarSrc(dataUrl);
        setBanner({ type: "success", text: "Foto atualizada!" });
      }
    } catch {
      setBanner({ type: "error", text: "Erro ao salvar foto." });
    } finally {
      setAvatarUploading(false);
      e.target.value = "";
    }
  }

  async function handleBannerChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setBannerUploading(true);
    try {
      const dataUrl = await resizeImage(file, 1200, 300, 0.78);
      const res = await fetch("/api/atleta/banner", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ dataUrl }),
      });
      if (res.ok) {
        setBannerSrc(dataUrl);
        setBanner({ type: "success", text: "Banner atualizado!" });
      }
    } catch {
      setBanner({ type: "error", text: "Erro ao salvar banner." });
    } finally {
      setBannerUploading(false);
      e.target.value = "";
    }
  }

  // Edit profile modal state
  const [editOpen, setEditOpen] = useState(false);
  const [editSaving, setEditSaving] = useState(false);
  const [editName, setEditName] = useState("");
  const [editCity, setEditCity] = useState("");
  const [editState, setEditState] = useState("");
  const [editPhone, setEditPhone] = useState("");
  const [editWeightKg, setEditWeightKg] = useState("");
  const [editHeightCm, setEditHeightCm] = useState("");
  const [editRaceDate, setEditRaceDate] = useState("");

  async function handleEditSave() {
    setEditSaving(true);
    try {
      const res = await fetch("/api/atleta/perfil", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: editName,
          city: editCity,
          state: editState,
          phone: editPhone,
          weightKg: editWeightKg ? parseFloat(editWeightKg) : null,
          heightCm: editHeightCm ? parseFloat(editHeightCm) : null,
          raceDate: editRaceDate || null,
        }),
      });
      if (res.ok) {
        setProfile((prev) => ({
          ...prev,
          name: editName,
          city: editCity,
          state: editState,
          phone: editPhone,
          weightKg: editWeightKg ? parseFloat(editWeightKg) : null,
          heightCm: editHeightCm ? parseFloat(editHeightCm) : null,
          raceDate: editRaceDate || null,
        }));
        setEditOpen(false);
        setBanner({ type: "success", text: "Perfil atualizado com sucesso!" });
        setActiveTab("dados");
      } else {
        setBanner({ type: "error", text: "Não foi possível salvar. Tente novamente." });
      }
    } catch {
      setBanner({ type: "error", text: "Erro de conexão. Tente novamente." });
    } finally {
      setEditSaving(false);
    }
  }

  useEffect(() => {
    try {
      const stored = localStorage.getItem("notif-prefs");
      if (stored) setNotifsRaw(JSON.parse(stored));
    } catch { /* storage unavailable */ }
  }, []);

  useEffect(() => {
    fetch("/api/atleta/perfil")
      .then((r) => (r.ok ? r.json() : null))
      .then((data: typeof profile | null) => {
        if (!data) return;
        setProfile(data);
        if (data.avatarUrl) setAvatarSrc(data.avatarUrl);
        if (data.bannerUrl) setBannerSrc(data.bannerUrl);
        setEditName(data.name ?? "");
        setEditCity(data.city ?? "");
        setEditState(data.state ?? "");
        setEditPhone(data.phone ?? "");
        setEditWeightKg(String(data.weightKg ?? ""));
        setEditHeightCm(String(data.heightCm ?? ""));
        setEditRaceDate(data.raceDate ?? "");
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const connected = params.get("connected");
    const error = params.get("error");

    if (params.get("tab") === "dispositivos" || connected || error) {
      setActiveTab("dispositivos");
    }

    if (connected === "strava") {
      setBanner({ type: "success", text: "Strava conectado com sucesso! Suas atividades serão sincronizadas." });
    } else if (error) {
      const messages: Record<string, string> = {
        strava_denied: "Conexão com o Strava cancelada.",
        strava_token: "Não foi possível concluir a conexão com o Strava. Tente novamente.",
        strava_not_configured: "A integração com o Strava ainda não foi configurada pelo administrador.",
      };
      setBanner({ type: "error", text: messages[error] ?? "Ocorreu um erro na integração." });
    }

    if (connected || error || params.get("tab")) {
      window.history.replaceState({}, "", "/atleta/perfil");
    }

    fetch("/api/integrations/status")
      .then((res) => (res.ok ? res.json() : null))
      .then((data: { devices?: { provider: string; lastSyncAt: string | null }[] } | null) => {
        const strava = data?.devices?.find((device) => device.provider === "STRAVA");
        if (strava) {
          setStravaConnected(true);
          setStravaLastSync(strava.lastSyncAt);
        }
      })
      .catch(() => {});

    fetch("/api/atleta/races")
      .then((r) => r.ok ? r.json() : [])
      .then((data: Array<{ id: string; name: string; date: string; distanceKm: number; resultTime?: string | null }>) => setRaces(data))
      .catch(() => null);

    fetch("/api/atleta/achievements")
      .then((r) => r.ok ? r.json() : [])
      .then((data: Array<{ id: string; title: string; description?: string | null; icon?: string | null; earnedAt: string }>) => setAchievements(data))
      .catch(() => null);
  }, []);

  async function handleStravaSync() {
    setStravaLoading("sync");
    try {
      const res = await fetch("/api/integrations/strava/sync", { method: "POST" });
      const data = await res.json();
      if (res.ok) {
        setStravaLastSync(data.lastSyncAt);
        setBanner({
          type: "success",
          text:
            data.count > 0
              ? `Sincronizado! ${data.count} atividade(s) recente(s) encontradas.`
              : "Sincronizado! Nenhuma atividade nova encontrada.",
        });
      } else {
        setBanner({ type: "error", text: "Não foi possível sincronizar com o Strava agora." });
      }
    } catch {
      setBanner({ type: "error", text: "Não foi possível sincronizar com o Strava agora." });
    } finally {
      setStravaLoading(null);
    }
  }

  async function handleStravaDisconnect() {
    setStravaLoading("disconnect");
    try {
      await fetch("/api/integrations/strava/disconnect", { method: "POST" });
      setStravaConnected(false);
      setStravaLastSync(null);
      setBanner({ type: "success", text: "Strava desconectado." });
    } catch {
      setBanner({ type: "error", text: "Não foi possível desconectar o Strava agora." });
    } finally {
      setStravaLoading(null);
    }
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      {/* Header */}
      <Card className="overflow-hidden">
        {/* Banner */}
        <div className="relative h-28">
          {bannerSrc
            ? <img src={bannerSrc} alt="" className="h-full w-full object-cover" />
            : <div className="h-full w-full bg-gradient-to-r from-primary/40 via-secondary/30 to-info/30" />
          }
          <label className="absolute right-3 top-3 cursor-pointer">
            <input type="file" accept="image/*" className="sr-only" onChange={handleBannerChange} disabled={bannerUploading} />
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-background/80 text-text shadow backdrop-blur-sm transition-colors hover:bg-background">
              {bannerUploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Camera className="h-4 w-4" />}
            </span>
          </label>
        </div>
        <CardContent className="-mt-12 relative z-10 bg-card flex flex-wrap items-end justify-between gap-4 p-5 sm:p-6">
          <div className="flex items-end gap-4">
            {/* Avatar with camera overlay */}
            <div className="relative">
              <Avatar className="h-24 w-24 border-4 border-card">
                <AvatarImage src={avatarSrc || profile.avatarUrl || ""} alt={profile.name ?? ""} />
                <AvatarFallback className="text-2xl">{(profile.name ?? "?").slice(0, 2).toUpperCase()}</AvatarFallback>
              </Avatar>
              <label className="absolute -bottom-1 -right-1 cursor-pointer">
                <input type="file" accept="image/*" className="sr-only" onChange={handleAvatarChange} disabled={avatarUploading} />
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-primary text-white shadow transition-colors hover:bg-primary/90">
                  {avatarUploading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Camera className="h-3.5 w-3.5" />}
                </span>
              </label>
            </div>
            <div>
              <h1 className="font-display text-xl font-bold text-text sm:text-2xl">{profile.name ?? "—"}</h1>
              <p className="text-sm text-text-muted">{profile.city ?? ""}</p>
              <div className="mt-1.5 flex flex-wrap gap-1.5">
                {profile.level && <Badge variant="primary">{profile.level}</Badge>}
              </div>
            </div>
          </div>
          <Button variant="secondary" size="sm" onClick={() => setEditOpen(true)}>
            <Pencil className="h-3.5 w-3.5" />
            Editar perfil
          </Button>
        </CardContent>
      </Card>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <div className="overflow-x-auto no-scrollbar -mx-1 px-1">
          <TabsList className="w-max">
            <TabsTrigger value="dados">Dados</TabsTrigger>
            <TabsTrigger value="objetivos">Objetivos</TabsTrigger>
            <TabsTrigger value="conquistas">Conquistas</TabsTrigger>
            <TabsTrigger value="dispositivos">Dispositivos</TabsTrigger>
            <TabsTrigger value="config">Config.</TabsTrigger>
          </TabsList>
        </div>

        {/* Personal data */}
        <TabsContent value="dados">
          <Card>
            <CardContent className="grid grid-cols-2 gap-4 p-5 sm:grid-cols-4">
              <InfoField label="Peso" value={profile.weightKg ? `${profile.weightKg} kg` : "—"} />
              <InfoField label="Altura" value={profile.heightCm ? `${profile.heightCm} cm` : "—"} />
              <InfoField label="Treinador" value={profile.coachName ?? "—"} />
              <InfoField label="Nível" value={profile.level ?? "—"} />
            </CardContent>
          </Card>
        </TabsContent>

        {/* Goals & history */}
        <TabsContent value="objetivos">
          <div className="space-y-4">
            <Card>
              <CardContent className="flex items-start gap-3 p-5">
                <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/15 text-primary">
                  <Target className="h-4 w-4" />
                </span>
                <div className="flex-1">
                  <h3 className="font-display text-sm font-semibold text-text">Objetivo atual</h3>
                  <p className="mt-1 text-sm text-text-muted">{profile.goal ?? "—"}</p>
                  {profile.raceDate && (
                    <p className="mt-1 text-xs text-text-muted">
                      Data da prova:{" "}
                      <span className="text-text">
                        {new Date(profile.raceDate + "T12:00:00").toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" })}
                      </span>
                    </p>
                  )}
                </div>
                <Button variant="secondary" size="sm" onClick={() => setEditOpen(true)}>
                  <Pencil className="h-3.5 w-3.5" />
                  Editar
                </Button>
              </CardContent>
            </Card>

            <div>
              <h3 className="mb-3 flex items-center gap-2 font-display text-sm font-semibold text-text">
                <Award className="h-4 w-4 text-warning" />
                Provas registradas
              </h3>
              {races.length === 0 ? (
                <p className="text-sm text-text-muted">Nenhuma prova registrada ainda.</p>
              ) : (
                <div className="grid gap-2.5 sm:grid-cols-2">
                  {races.map((r) => (
                    <Card key={r.id}>
                      <CardContent className="flex items-center justify-between p-3.5">
                        <div>
                          <p className="text-sm font-medium text-text">{r.name}</p>
                          <p className="text-xs text-text-muted">{r.distanceKm} km · {new Date(r.date).toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric" })}</p>
                        </div>
                        {r.resultTime && (
                          <span className="font-display text-sm font-bold text-text">{r.resultTime}</span>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          </div>
        </TabsContent>

        {/* Achievements */}
        <TabsContent value="conquistas">
          {achievements.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center gap-3 p-8 text-center">
                <Award className="h-10 w-10 text-text-muted/40" />
                <p className="text-sm text-text-muted">Nenhuma conquista ainda. Continue treinando!</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {achievements.map((a) => (
                <Card key={a.id}>
                  <CardContent className="flex items-start gap-3 p-4">
                    <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-warning/15 text-2xl">
                      {a.icon ?? "🏅"}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-text">{a.title}</p>
                      {a.description && (
                        <p className="mt-0.5 text-xs text-text-muted">{a.description}</p>
                      )}
                      <p className="mt-1.5 text-[11px] text-text-muted">
                        {new Date(a.earnedAt).toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric" })}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Devices */}
        <TabsContent value="dispositivos">
          <div className="space-y-6">
            {/* Status banner */}
            {banner && (
              <div
                className={cn(
                  "flex items-start gap-2.5 rounded-xl border px-4 py-3 text-sm",
                  banner.type === "success"
                    ? "border-success/30 bg-success/10 text-success"
                    : "border-danger/30 bg-danger/10 text-danger",
                )}
              >
                {banner.type === "success" ? (
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
                ) : (
                  <XCircle className="mt-0.5 h-4 w-4 shrink-0" />
                )}
                <p className="flex-1">{banner.text}</p>
                <button
                  type="button"
                  onClick={() => setBanner(null)}
                  className="text-text-muted transition-colors hover:text-text"
                  aria-label="Fechar"
                >
                  <XCircle className="h-4 w-4" />
                </button>
              </div>
            )}

            {/* Integration cards */}
            <div className="grid gap-3 sm:grid-cols-2">
              {INTEGRATIONS_LIST.map((d) => {
                const isStrava = d.id === "strava";
                const connected = isStrava ? stravaConnected : false;

                return (
                  <Card key={d.id}>
                    <CardContent className="flex items-center gap-3 p-4">
                      <span
                        className={cn(
                          "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl",
                          connected ? "bg-success/15 text-success" : "bg-card-hover text-text-muted",
                        )}
                      >
                        <Smartphone className="h-5 w-5" />
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold text-text">{d.name}</p>
                        <p className="truncate text-xs text-text-muted">{d.description}</p>
                        {isStrava && connected && stravaLastSync && (
                          <p className="mt-0.5 truncate text-[11px] text-text-muted">
                            Última sincronização: {new Date(stravaLastSync).toLocaleString("pt-BR")}
                          </p>
                        )}
                        {!isStrava && comingSoonId === d.id && (
                          <p className="mt-0.5 truncate text-[11px] text-warning">
                            Em breve — integração em desenvolvimento.
                          </p>
                        )}
                      </div>
                      <div className="flex shrink-0 flex-col items-end gap-1.5">
                        <Badge variant={connected ? "success" : "outline"}>
                          {connected ? "Conectado" : "Desconectado"}
                        </Badge>
                        {isStrava ? (
                          connected ? (
                            <div className="flex gap-1">
                              <button
                                type="button"
                                onClick={handleStravaSync}
                                disabled={stravaLoading !== null}
                                className="flex items-center gap-1 rounded-md px-2 py-0.5 text-[11px] text-info transition-colors hover:bg-info/10 disabled:opacity-50"
                              >
                                {stravaLoading === "sync" ? (
                                  <Loader2 className="h-3 w-3 animate-spin" />
                                ) : (
                                  <RefreshCw className="h-3 w-3" />
                                )}
                                Sincronizar agora
                              </button>
                              <button
                                type="button"
                                onClick={handleStravaDisconnect}
                                disabled={stravaLoading !== null}
                                className="rounded-md px-2 py-0.5 text-[11px] text-danger transition-colors hover:bg-danger/10 disabled:opacity-50"
                              >
                                {stravaLoading === "disconnect" ? "Desconectando..." : "Desconectar"}
                              </button>
                            </div>
                          ) : (
                            <a
                              href="/api/integrations/strava/connect"
                              className="rounded-md px-2 py-0.5 text-[11px] text-primary transition-colors hover:bg-primary/10"
                            >
                              Conectar
                            </a>
                          )
                        ) : connected ? (
                          <div className="flex gap-1">
                            <button
                              type="button"
                              onClick={() => setComingSoonId(d.id)}
                              className="flex items-center gap-1 rounded-md px-2 py-0.5 text-[11px] text-info transition-colors hover:bg-info/10"
                            >
                              <RefreshCw className="h-3 w-3" />
                              Sincronizar agora
                            </button>
                            <button
                              type="button"
                              onClick={() => setComingSoonId(d.id)}
                              className="rounded-md px-2 py-0.5 text-[11px] text-danger transition-colors hover:bg-danger/10"
                            >
                              Desconectar
                            </button>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => setComingSoonId(d.id)}
                            className="rounded-md px-2 py-0.5 text-[11px] text-primary transition-colors hover:bg-primary/10"
                          >
                            Conectar
                          </button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            {/* Synced activities */}
            <div>
              <h3 className="mb-3 font-display text-sm font-semibold text-text">
                Atividades sincronizadas
              </h3>
              {!stravaConnected ? (
                <Card>
                  <CardContent className="p-5 text-center text-sm text-text-muted">
                    Conecte o <span className="font-semibold text-text">Strava</span> para ver suas atividades sincronizadas automaticamente.
                  </CardContent>
                </Card>
              ) : (
                <Card>
                  <CardContent className="p-5 text-center text-sm text-text-muted">
                    Strava conectado. As atividades aparecerão aqui após a próxima sincronização.
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </TabsContent>

        {/* Settings */}
        <TabsContent value="config">
          <div className="space-y-4">
            <Card>
              <CardContent className="space-y-3 p-5">
                <h3 className="flex items-center gap-2 font-display text-sm font-semibold text-text">
                  <Bell className="h-4 w-4 text-primary" /> Notificações
                </h3>
                {(
                  [
                    { key: "workouts", label: "Lembretes de treino" },
                    { key: "community", label: "Atividade da comunidade" },
                    { key: "coach", label: "Mensagens do treinador" },
                  ] as const
                ).map((n) => (
                  <label key={n.key} className="flex items-center justify-between rounded-xl border border-border bg-card-hover/30 px-4 py-3">
                    <span className="text-sm text-text">{n.label}</span>
                    <button
                      type="button"
                      onClick={() => setNotifs({ ...notifs, [n.key]: !notifs[n.key] })}
                      className={cn("relative h-6 w-11 rounded-full transition-colors", notifs[n.key] ? "bg-primary" : "bg-card-hover")}
                    >
                      <span className={cn("absolute top-0.5 h-5 w-5 rounded-full bg-white transition-transform", notifs[n.key] ? "translate-x-5" : "translate-x-0.5")} />
                    </button>
                  </label>
                ))}
              </CardContent>
            </Card>

            <Card>
              <CardContent className="space-y-3 p-5">
                <h3 className="flex items-center gap-2 font-display text-sm font-semibold text-text">
                  <CreditCard className="h-4 w-4 text-primary" /> Plano contratado
                </h3>
                <div className="flex items-center justify-between rounded-xl border border-primary/30 bg-primary/5 px-4 py-3">
                  <div>
                    <p className="text-sm font-semibold text-text">Plano Ativo</p>
                    <p className="text-xs text-text-muted">Renovação automática · próxima cobrança em 12/07/2026</p>
                  </div>
                  <Button size="sm" variant="secondary">Gerenciar</Button>
                </div>
              </CardContent>
            </Card>

            {settingsMsg && (
              <div className="rounded-xl border border-border bg-card-hover px-4 py-3 text-sm text-text-muted">
                {settingsMsg}
              </div>
            )}
            <div className="grid gap-3 sm:grid-cols-2">
              <SettingsLink
                icon={Shield}
                label="Privacidade e segurança"
                onClick={() => setSettingsMsg("Configurações de privacidade e segurança em breve.")}
              />
              <SettingsLink
                icon={Globe}
                label="Idioma — Português (Brasil)"
                onClick={() => setSettingsMsg("Seleção de idioma disponível em breve.")}
              />
              <SettingsLink
                icon={User}
                label="Editar dados da conta"
                onClick={() => { setSettingsMsg(null); setEditOpen(true); }}
              />
              <SettingsLink
                icon={LogOut}
                label="Sair da conta"
                danger
                onClick={() => signOut({ callbackUrl: "/login" })}
              />
            </div>
          </div>
        </TabsContent>
      </Tabs>

      {/* Edit profile modal */}
      {editOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-background/80 backdrop-blur-sm" onClick={() => setEditOpen(false)} />
          <div className="relative w-full max-w-md rounded-2xl border border-border bg-card shadow-2xl">
            <div className="flex items-center justify-between border-b border-border px-5 py-4">
              <h2 className="font-display text-base font-bold text-text">Editar perfil</h2>
              <button onClick={() => setEditOpen(false)} className="text-text-muted hover:text-text">
                <XCircle className="h-5 w-5" />
              </button>
            </div>
            <div className="space-y-4 p-5">
              <label className="block">
                <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-text-muted">Nome completo</span>
                <input value={editName} onChange={(e) => setEditName(e.target.value)} className={inputClass} placeholder="Seu nome" />
              </label>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <label className="block">
                  <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-text-muted">Cidade</span>
                  <input value={editCity} onChange={(e) => setEditCity(e.target.value)} className={inputClass} placeholder="São Paulo" />
                </label>
                <label className="block">
                  <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-text-muted">Estado</span>
                  <input value={editState} onChange={(e) => setEditState(e.target.value)} className={inputClass} placeholder="SP" maxLength={2} />
                </label>
              </div>
              <label className="block">
                <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-text-muted">WhatsApp</span>
                <input value={editPhone} onChange={(e) => setEditPhone(e.target.value)} className={inputClass} placeholder="(11) 99999-9999" type="tel" />
              </label>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <label className="block">
                  <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-text-muted">Peso (kg)</span>
                  <input type="number" value={editWeightKg} onChange={(e) => setEditWeightKg(e.target.value)} className={inputClass} placeholder="70" />
                </label>
                <label className="block">
                  <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-text-muted">Altura (cm)</span>
                  <input type="number" value={editHeightCm} onChange={(e) => setEditHeightCm(e.target.value)} className={inputClass} placeholder="175" />
                </label>
              </div>
              <label className="block">
                <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-text-muted">Data da prova</span>
                <input type="date" value={editRaceDate} onChange={(e) => setEditRaceDate(e.target.value)} className={inputClass} />
              </label>
            </div>
            <div className="flex gap-3 border-t border-border px-5 py-4">
              <Button
                variant="primary"
                className="flex-1 gap-2"
                onClick={handleEditSave}
                disabled={editSaving}
              >
                {editSaving ? <><Loader2 className="h-4 w-4 animate-spin" /> Salvando…</> : <><CheckCircle2 className="h-4 w-4" /> Salvar</>}
              </Button>
              <Button variant="outline" onClick={() => setEditOpen(false)}>Cancelar</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function InfoField({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[11px] uppercase tracking-wider text-text-muted">{label}</p>
      <p className="mt-1 font-display text-base font-bold text-text">{value}</p>
    </div>
  );
}

function SettingsLink({ icon: Icon, label, danger, onClick }: { icon: React.ComponentType<{ className?: string }>; label: string; danger?: boolean; onClick?: () => void }) {
  return (
    <button
      onClick={onClick}
      className={cn("flex items-center gap-3 rounded-xl border border-border bg-card px-4 py-3.5 text-left text-sm font-medium transition-colors hover:border-primary/40", danger ? "text-danger hover:border-danger/40" : "text-text")}
    >
      <Icon className="h-4 w-4" />
      {label}
    </button>
  );
}
