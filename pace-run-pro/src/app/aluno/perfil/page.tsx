"use client";

import { useState } from "react";
import {
  Award,
  Bell,
  CreditCard,
  Globe,
  LogOut,
  Pencil,
  Shield,
  Smartphone,
  Target,
  User,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { currentAthlete, integrationsList, personalRecords } from "@/lib/mock-data";
import { cn } from "@/lib/utils";

export default function ProfilePage() {
  const [notifs, setNotifs] = useState({ workouts: true, community: false, coach: true });

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      {/* Header */}
      <Card className="overflow-hidden">
        <div className="h-28 bg-gradient-to-r from-primary/40 via-secondary/30 to-info/30" />
        <CardContent className="-mt-12 flex flex-wrap items-end justify-between gap-4 p-5 sm:p-6">
          <div className="flex items-end gap-4">
            <Avatar className="h-24 w-24 border-4 border-card">
              <AvatarImage src={currentAthlete.avatarUrl} alt={currentAthlete.name} />
              <AvatarFallback className="text-2xl">{currentAthlete.name.slice(0, 2).toUpperCase()}</AvatarFallback>
            </Avatar>
            <div>
              <h1 className="font-display text-xl font-bold text-white sm:text-2xl">{currentAthlete.name}</h1>
              <p className="text-sm text-text-muted">{currentAthlete.city}</p>
              <div className="mt-1.5 flex flex-wrap gap-1.5">
                <Badge variant="primary">{currentAthlete.level}</Badge>
                <Badge variant="outline">{currentAthlete.plan}</Badge>
              </div>
            </div>
          </div>
          <Button variant="secondary" size="sm">
            <Pencil className="h-3.5 w-3.5" />
            Editar perfil
          </Button>
        </CardContent>
      </Card>

      <Tabs defaultValue="dados">
        <TabsList>
          <TabsTrigger value="dados">Dados pessoais</TabsTrigger>
          <TabsTrigger value="objetivos">Objetivos &amp; histórico</TabsTrigger>
          <TabsTrigger value="dispositivos">Dispositivos</TabsTrigger>
          <TabsTrigger value="config">Configurações</TabsTrigger>
        </TabsList>

        {/* Personal data */}
        <TabsContent value="dados">
          <Card>
            <CardContent className="grid grid-cols-2 gap-4 p-5 sm:grid-cols-4">
              <InfoField label="Idade" value={`${currentAthlete.age} anos`} />
              <InfoField label="Peso" value={`${currentAthlete.weightKg} kg`} />
              <InfoField label="Altura" value={`${currentAthlete.heightCm} cm`} />
              <InfoField label="Treinador" value={currentAthlete.coach} />
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
                <div>
                  <h3 className="font-display text-sm font-semibold text-white">Objetivo atual</h3>
                  <p className="mt-1 text-sm text-text-muted">{currentAthlete.goal}</p>
                  <p className="mt-1 text-xs text-text-muted">
                    Data da prova: <span className="text-white">{new Date(currentAthlete.raceDate).toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" })}</span>
                  </p>
                </div>
              </CardContent>
            </Card>

            <div>
              <h3 className="mb-3 flex items-center gap-2 font-display text-sm font-semibold text-white">
                <Award className="h-4 w-4 text-warning" />
                Histórico de recordes
              </h3>
              <div className="grid gap-2.5 sm:grid-cols-2">
                {personalRecords.map((r) => (
                  <Card key={r.distance}>
                    <CardContent className="flex items-center justify-between p-3.5">
                      <span className="text-sm font-medium text-white">{r.distance}</span>
                      <span className="text-sm text-text-muted">
                        <span className="font-display font-bold text-white">{r.time}</span> · {r.pace}
                      </span>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </div>
        </TabsContent>

        {/* Devices */}
        <TabsContent value="dispositivos">
          <div className="grid gap-3 sm:grid-cols-2">
            {integrationsList.map((d) => (
              <Card key={d.id}>
                <CardContent className="flex items-center gap-3 p-4">
                  <span className={cn("flex h-10 w-10 items-center justify-center rounded-xl", d.connected ? "bg-success/15 text-success" : "bg-card-hover text-text-muted")}>
                    <Smartphone className="h-5 w-5" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-white">{d.name}</p>
                    <p className="truncate text-xs text-text-muted">{d.description}</p>
                  </div>
                  <Badge variant={d.connected ? "success" : "outline"}>{d.connected ? "Conectado" : "Conectar"}</Badge>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Settings */}
        <TabsContent value="config">
          <div className="space-y-4">
            <Card>
              <CardContent className="space-y-3 p-5">
                <h3 className="flex items-center gap-2 font-display text-sm font-semibold text-white">
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
                    <span className="text-sm text-white">{n.label}</span>
                    <button
                      type="button"
                      onClick={() => setNotifs((s) => ({ ...s, [n.key]: !s[n.key] }))}
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
                <h3 className="flex items-center gap-2 font-display text-sm font-semibold text-white">
                  <CreditCard className="h-4 w-4 text-primary" /> Plano contratado
                </h3>
                <div className="flex items-center justify-between rounded-xl border border-primary/30 bg-primary/5 px-4 py-3">
                  <div>
                    <p className="text-sm font-semibold text-white">{currentAthlete.plan}</p>
                    <p className="text-xs text-text-muted">Renovação automática · próxima cobrança em 12/07/2026</p>
                  </div>
                  <Button size="sm" variant="secondary">Gerenciar</Button>
                </div>
              </CardContent>
            </Card>

            <div className="grid gap-3 sm:grid-cols-2">
              <SettingsLink icon={Shield} label="Privacidade e segurança" />
              <SettingsLink icon={Globe} label="Idioma — Português (Brasil)" />
              <SettingsLink icon={User} label="Editar dados da conta" />
              <SettingsLink icon={LogOut} label="Sair da conta" danger />
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function InfoField({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[11px] uppercase tracking-wider text-text-muted">{label}</p>
      <p className="mt-1 font-display text-base font-bold text-white">{value}</p>
    </div>
  );
}

function SettingsLink({ icon: Icon, label, danger }: { icon: React.ComponentType<{ className?: string }>; label: string; danger?: boolean }) {
  return (
    <button className={cn("flex items-center gap-3 rounded-xl border border-border bg-card px-4 py-3.5 text-left text-sm font-medium transition-colors hover:border-primary/40", danger ? "text-danger hover:border-danger/40" : "text-white")}>
      <Icon className="h-4 w-4" />
      {label}
    </button>
  );
}
