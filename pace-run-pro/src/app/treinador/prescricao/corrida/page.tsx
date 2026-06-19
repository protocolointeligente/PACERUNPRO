"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import {
  Activity,
  Bookmark,
  BookOpen,
  CheckCircle2,
  LayoutTemplate,
  Loader2,
  Send,
  Users,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { athleteList, runWorkoutTemplates } from "@/lib/mock-data";
import { formatPace } from "@/lib/utils";
import { cn } from "@/lib/utils";
import {
  calculateVDOT,
  getTrainingPaces,
  parseRaceTime,
  RACE_DISTANCES,
  TRAINING_ZONES,
  type TrainingZoneId,
} from "@/lib/vdot";
import type { AthleteListItem, RunWorkoutTemplate } from "@/lib/types";

const runTypes = [
  { label: "Rodagem leve",      zone: "E", description: "Volume em ritmo confortável — base aeróbica" },
  { label: "Regenerativo",      zone: "E", description: "Trote leve — recuperação ativa pós-esforço" },
  { label: "Progressivo",       zone: "M", description: "Início confortável, final em ritmo de maratona" },
  { label: "Tempo Run",         zone: "T", description: "Bloco contínuo em ritmo de limiar" },
  { label: "Fartlek",           zone: "T", description: "Variações livres de ritmo no percurso" },
  { label: "Intervalado longo", zone: "I", description: "Tiros de 800 m–2 km próximos ao VO₂máx" },
  { label: "Intervalado curto", zone: "R", description: "Tiros de 200–600 m em velocidade máxima" },
  { label: "Longão",            zone: "E", description: "Maior sessão da semana — resistência geral" },
] as const;

const inputClass =
  "w-full rounded-xl border border-border bg-background px-3.5 py-2.5 text-sm text-text placeholder:text-text-muted/50 outline-none transition-colors focus:border-primary/60 focus:ring-2 focus:ring-primary/20";
const labelClass =
  "mb-1.5 block text-xs font-semibold uppercase tracking-wider text-text-muted";

function initials(name: string) {
  return name.split(" ").map((n) => n[0]).slice(0, 2).join("");
}

// ── Running template card ─────────────────────────────────────────────────

function RunTemplateCard({
  template,
  athletes,
}: {
  template: RunWorkoutTemplate;
  athletes: AthleteListItem[];
}) {
  const router = useRouter();
  const [expanded, setExpanded] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [applied, setApplied] = useState(false);
  const [navigating, setNavigating] = useState(false);

  const zones = useMemo(
    () =>
      [
        ...new Set(
          template.sessions
            .filter((s) => s.zone)
            .map((s) => s.zone as TrainingZoneId)
        ),
      ] as TrainingZoneId[],
    [template]
  );

  function toggleAthlete(id: string) {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  }

  function handleApply() {
    setApplied(true);
    setTimeout(() => {
      setApplied(false);
      setExpanded(false);
      setSelectedIds([]);
    }, 2500);
  }

  function handleNavigate() {
    setNavigating(true);
    setTimeout(() => router.push("/treinador/prescricao/periodizacao"), 800);
  }

  const levelVariant =
    template.targetLevel === "Avançado"
      ? "danger"
      : template.targetLevel === "Iniciante"
      ? "success"
      : "info";

  return (
    <Card>
      <CardContent className="space-y-4 p-5">
        {/* Header */}
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-1">
            <p className="font-display text-sm font-semibold text-text">{template.name}</p>
            <p className="text-xs leading-relaxed text-text-muted">{template.description}</p>
          </div>
          {template.isCustom && (
            <Badge variant="primary" className="shrink-0">
              <Bookmark className="h-3 w-3" />
              Meu template
            </Badge>
          )}
        </div>

        {/* Badges */}
        <div className="flex flex-wrap gap-1.5">
          <Badge variant={levelVariant}>{template.targetLevel}</Badge>
          <span className="rounded-full border border-border bg-card px-2.5 py-0.5 text-[11px] text-text-muted">
            ~{template.weeklyKm} km/sem
          </span>
          <span className="rounded-full border border-border bg-card px-2.5 py-0.5 text-[11px] text-text-muted">
            {template.sessionsPerWeek}×/sem
          </span>
          {template.focus.split(", ").map((f) => (
            <span
              key={f}
              className="rounded-full border border-border bg-card px-2.5 py-0.5 text-[11px] text-text-muted"
            >
              {f}
            </span>
          ))}
        </div>

        {/* Session schedule */}
        <div className="rounded-xl border border-border bg-background/40 p-3 space-y-1.5">
          {template.sessions.map((session, i) => {
            const zone = session.zone
              ? TRAINING_ZONES.find((z) => z.id === session.zone)
              : null;
            return (
              <div key={i} className="flex items-center gap-2.5 text-xs">
                <span className="w-7 shrink-0 font-mono text-text-muted">{session.dayLabel}</span>
                <span
                  className={cn("h-2 w-2 shrink-0 rounded-full", !zone && "bg-border")}
                  style={zone ? { backgroundColor: zone.color } : undefined}
                />
                <span className="flex-1 text-text">{session.title}</span>
                {session.intervals && (
                  <span className="rounded-full border border-border px-1.5 py-0.5 text-[10px] font-mono text-text-muted">
                    {session.intervals}
                  </span>
                )}
                {session.distanceKm && (
                  <span className="shrink-0 text-text-muted">{session.distanceKm} km</span>
                )}
              </div>
            );
          })}
        </div>

        {/* Actions */}
        <div className="flex flex-wrap gap-2">
          <Button size="sm" onClick={handleNavigate} disabled={navigating}>
            {navigating ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <LayoutTemplate className="h-3.5 w-3.5" />
            )}
            Usar na periodização
          </Button>
          <Button
            size="sm"
            variant="secondary"
            onClick={() => setExpanded((v) => !v)}
          >
            <Users className="h-3.5 w-3.5" />
            Aplicar para atletas
          </Button>
        </div>

        {/* Athlete VDOT expansion */}
        <AnimatePresence>
          {expanded && (
            <motion.div
              key="expand"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden"
            >
              <div className="space-y-3 rounded-xl border border-border bg-background/50 p-3">
                <p className="text-xs font-semibold uppercase tracking-wider text-text-muted">
                  Paces recalculados por VDOT
                </p>

                <div className="space-y-1.5">
                  {athletes
                    .filter((a) => a.vdot != null)
                    .map((a) => {
                      const paces = getTrainingPaces(a.vdot!);
                      const isSelected = selectedIds.includes(a.id);
                      return (
                        <div key={a.id}>
                          <label className="flex cursor-pointer items-center gap-2.5 rounded-lg px-2 py-1.5 transition-colors hover:bg-card-hover/50">
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => toggleAthlete(a.id)}
                              className="h-4 w-4 rounded border-border accent-[color:var(--color-primary)]"
                            />
                            <Avatar className="h-6 w-6">
                              <AvatarImage src={a.avatarUrl} alt={a.name} />
                              <AvatarFallback className="text-[10px]">
                                {initials(a.name)}
                              </AvatarFallback>
                            </Avatar>
                            <span className="text-sm text-text">{a.name}</span>
                            <span className="ml-auto text-xs font-mono font-semibold text-text-muted">
                              VDOT {a.vdot}
                            </span>
                          </label>

                          <AnimatePresence>
                            {isSelected && (
                              <motion.div
                                key="paces"
                                initial={{ opacity: 0, y: -4 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, height: 0 }}
                                className="mx-2 mb-1 flex flex-wrap gap-x-3 gap-y-1 rounded-lg bg-card-hover/40 px-3 py-2"
                              >
                                {zones.map((zId) => {
                                  const zone = TRAINING_ZONES.find((z) => z.id === zId);
                                  const range = paces[zId];
                                  return (
                                    <span
                                      key={zId}
                                      className="flex items-center gap-1 text-[11px]"
                                    >
                                      <span
                                        className="h-1.5 w-1.5 shrink-0 rounded-full"
                                        style={{ backgroundColor: zone?.color }}
                                      />
                                      <span
                                        className="font-semibold"
                                        style={{ color: zone?.color }}
                                      >
                                        Zona {zId}
                                      </span>
                                      <span className="font-mono text-text">
                                        {formatPace(range.fastSecPerKm).replace("/km", "")}
                                        &ndash;
                                        {formatPace(range.slowSecPerKm)}
                                      </span>
                                    </span>
                                  );
                                })}
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      );
                    })}
                </div>

                <AnimatePresence mode="wait">
                  {applied ? (
                    <motion.div
                      key="ok"
                      initial={{ opacity: 0, y: 4 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      className="flex items-center gap-2 rounded-lg bg-success/10 px-3 py-2 text-sm text-success"
                    >
                      <CheckCircle2 className="h-4 w-4 shrink-0" />
                      Prescrição gerada para {selectedIds.length}{" "}
                      {selectedIds.length === 1 ? "atleta" : "atletas"}
                    </motion.div>
                  ) : (
                    <motion.div key="btn" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                      <Button
                        size="sm"
                        className="w-full"
                        disabled={selectedIds.length === 0}
                        onClick={handleApply}
                      >
                        <Send className="h-3.5 w-3.5" />
                        {selectedIds.length === 0
                          ? "Selecione atletas…"
                          : `Prescrever para ${selectedIds.length} ${selectedIds.length === 1 ? "atleta" : "atletas"}`}
                      </Button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </CardContent>
    </Card>
  );
}

// ── VDOT reference tab ────────────────────────────────────────────────────

function VdotReferenceTab() {
  const [athleteId, setAthleteId] = useState(athleteList[0].id);
  const [raceDistanceM, setRaceDistanceM] = useState<number>(RACE_DISTANCES[3].meters);
  const [raceTimeStr, setRaceTimeStr] = useState("");

  const athlete = useMemo(
    () => athleteList.find((a) => a.id === athleteId) ?? athleteList[0],
    [athleteId]
  );
  const vdot = useMemo(
    () => calculateVDOT(raceDistanceM, parseRaceTime(raceTimeStr)),
    [raceDistanceM, raceTimeStr]
  );
  const trainingPaces = useMemo(
    () => (vdot > 0 ? getTrainingPaces(vdot) : null),
    [vdot]
  );

  return (
    <div className="space-y-5">
      <div className="grid gap-5 lg:grid-cols-2">
        {/* Atleta + prova */}
        <Card>
          <CardContent className="space-y-4 p-5">
            <h3 className="flex items-center gap-2 font-display text-sm font-semibold text-text">
              <Activity className="h-4 w-4 text-primary" /> Calcular VDOT
            </h3>

            <label className="block">
              <span className={labelClass}>Atleta</span>
              <select
                value={athleteId}
                onChange={(e) => {
                  setAthleteId(e.target.value);
                  setRaceTimeStr("");
                }}
                className={inputClass}
              >
                {athleteList.map((a) => (
                  <option key={a.id} value={a.id} className="bg-card text-text">
                    {a.name} — {a.level}{a.vdot ? ` (VDOT ${a.vdot})` : ""}
                  </option>
                ))}
              </select>
            </label>

            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block">
                <span className={labelClass}>Distância da prova</span>
                <select
                  value={raceDistanceM}
                  onChange={(e) => setRaceDistanceM(Number(e.target.value))}
                  className={inputClass}
                >
                  {RACE_DISTANCES.map((d) => (
                    <option key={d.id} value={d.meters} className="bg-card text-text">
                      {d.label}
                    </option>
                  ))}
                </select>
              </label>
              <label className="block">
                <span className={labelClass}>Tempo (MM:SS ou H:MM:SS)</span>
                <input
                  value={raceTimeStr}
                  onChange={(e) => setRaceTimeStr(e.target.value)}
                  placeholder="Ex.: 47:52"
                  className={inputClass}
                />
              </label>
            </div>

            {vdot > 0 && (
              <div className="flex items-center gap-3 rounded-xl border border-primary/30 bg-primary/10 px-4 py-3">
                <span className="text-sm text-text-muted">VDOT estimado de</span>
                <span className="font-display text-2xl font-bold text-text">
                  {vdot.toFixed(1)}
                </span>
                <span className="text-sm text-text-muted">
                  para {athlete.name.split(" ")[0]}
                </span>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Tipos de treino */}
        <Card>
          <CardContent className="space-y-3 p-5">
            <h3 className="font-display text-sm font-semibold text-text">Tipos de treino</h3>
            <div className="space-y-2">
              {runTypes.map((t) => {
                const zone = TRAINING_ZONES.find((z) => z.id === t.zone);
                const pace = trainingPaces
                  ? trainingPaces[t.zone as keyof typeof trainingPaces]
                  : null;
                return (
                  <div
                    key={t.label}
                    className="flex items-center gap-3 rounded-lg border border-border bg-card-hover/20 px-3 py-2.5"
                  >
                    <span
                      className="h-2.5 w-2.5 shrink-0 rounded-full"
                      style={{ backgroundColor: zone?.color ?? "#888" }}
                    />
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-semibold text-text">{t.label}</p>
                      <p className="text-[11px] text-text-muted">{t.description}</p>
                    </div>
                    {pace ? (
                      <span className="shrink-0 font-mono text-[11px] font-semibold text-text">
                        {formatPace(pace.fastSecPerKm).replace("/km", "–")}
                        {formatPace(pace.slowSecPerKm)}
                      </span>
                    ) : (
                      <span
                        className="shrink-0 text-[11px] font-semibold"
                        style={{ color: zone?.color ?? "#888" }}
                      >
                        Zona {t.zone}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Full VDOT zone table */}
      {trainingPaces && (
        <Card>
          <CardContent className="p-5">
            <h3 className="mb-4 font-display text-sm font-semibold text-text">
              Faixas de pace por zona — VDOT {vdot.toFixed(1)}
            </h3>
            <div className="overflow-hidden rounded-xl border border-border">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-card-hover/40 text-left text-[11px] uppercase tracking-wider text-text-muted">
                    <th className="px-4 py-3 font-medium">Zona</th>
                    <th className="px-4 py-3 font-medium">Pace alvo</th>
                    <th className="hidden px-4 py-3 font-medium sm:table-cell">Descrição</th>
                    <th className="hidden px-4 py-3 font-medium md:table-cell">Treinos indicados</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {TRAINING_ZONES.map((z) => {
                    const range = trainingPaces[z.id];
                    const types = runTypes
                      .filter((t) => t.zone === z.id)
                      .map((t) => t.label)
                      .join(", ");
                    return (
                      <tr key={z.id} className="transition-colors hover:bg-card-hover/20">
                        <td className="px-4 py-3">
                          <span
                            className="inline-flex items-center gap-2 font-semibold"
                            style={{ color: z.color }}
                          >
                            <span
                              className="h-2.5 w-2.5 rounded-full"
                              style={{ backgroundColor: z.color }}
                            />
                            {z.label}
                          </span>
                        </td>
                        <td className="px-4 py-3 font-mono font-semibold text-text">
                          {formatPace(range.fastSecPerKm).replace("/km", "")}–
                          {formatPace(range.slowSecPerKm)}
                        </td>
                        <td className="hidden px-4 py-3 text-text-muted sm:table-cell">
                          {z.description}
                        </td>
                        <td className="hidden px-4 py-3 text-xs text-text-muted md:table-cell">
                          {types || "—"}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <p className="mt-3 text-xs text-text-muted">
              Use esses valores como base na prescrição dentro da aba{" "}
              <span className="font-semibold text-text">Periodização</span>. O sistema aplica as
              zonas automaticamente ao gerar treinos com VDOT informado.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────

export default function CorridaPage() {
  const [activeTab, setActiveTab] = useState<"referencia" | "templates">("referencia");

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div>
        <Badge variant="primary" className="mb-2">
          Corrida
        </Badge>
        <h1 className="font-display text-2xl font-bold text-text sm:text-3xl">
          Prescrição de corrida
        </h1>
        <p className="mt-1.5 text-sm text-text-muted">
          Calcule o VDOT de cada atleta e aplique templates de semana de treino com paces personalizados.
        </p>
      </div>

      {/* Tab switcher */}
      <div className="flex gap-1.5">
        <button
          onClick={() => setActiveTab("referencia")}
          className={cn(
            "flex items-center gap-2 rounded-xl border px-4 py-2 text-sm font-medium transition-colors",
            activeTab === "referencia"
              ? "border-primary/60 bg-primary/15 text-primary"
              : "border-border bg-card text-text-muted hover:border-primary/30 hover:text-text"
          )}
        >
          <Activity className="h-4 w-4" />
          Referência VDOT
        </button>
        <button
          onClick={() => setActiveTab("templates")}
          className={cn(
            "flex items-center gap-2 rounded-xl border px-4 py-2 text-sm font-medium transition-colors",
            activeTab === "templates"
              ? "border-primary/60 bg-primary/15 text-primary"
              : "border-border bg-card text-text-muted hover:border-primary/30 hover:text-text"
          )}
        >
          <BookOpen className="h-4 w-4" />
          Templates de corrida
          <span className="rounded-full bg-card-hover px-1.5 py-0.5 text-[11px] font-semibold">
            {runWorkoutTemplates.length}
          </span>
        </button>
      </div>

      {activeTab === "referencia" && <VdotReferenceTab />}

      {activeTab === "templates" && (
        <div className="space-y-4">
          <p className="text-sm text-text-muted">
            Selecione um template e clique em{" "}
            <span className="font-semibold text-text">Aplicar para atletas</span> — os paces são
            recalculados automaticamente para o VDOT de cada atleta.
          </p>
          <div className="grid gap-4 sm:grid-cols-2">
            {runWorkoutTemplates.map((tpl) => (
              <RunTemplateCard key={tpl.id} template={tpl} athletes={athleteList} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
