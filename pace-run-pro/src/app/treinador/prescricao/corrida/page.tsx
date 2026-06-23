"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import {
  Activity,
  Bookmark,
  BookOpen,
  CheckCircle2,
  LayoutTemplate,
  Layers,
  Loader2,
  Plus,
  Send,
  Trash2,
  Users,
  X,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { runWorkoutTemplates } from "@/lib/mock-data";
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
import { WorkoutBlockEditor } from "@/components/coach/workout-block-editor";
import { defaultBlocks, type WorkoutBlock } from "@/lib/workout-blocks";

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
  onDelete,
}: {
  template: RunWorkoutTemplate;
  athletes: AthleteListItem[];
  onDelete?: (id: string) => void;
}) {
  const router = useRouter();
  const [expanded, setExpanded] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [applied, setApplied] = useState(false);
  const [navigating, setNavigating] = useState(false);
  const [startDate, setStartDate] = useState<string>("");

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

  async function handleApply() {
    if (selectedIds.length === 0 || !startDate) return;
    setApplied(true);
    try {
      const res = await fetch("/api/coach/prescriptions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          athleteIds: selectedIds,
          sessions: template.sessions,
          startDate,
          templateName: template.name,
        }),
      });
      if (!res.ok) throw new Error("Erro ao prescrever");
      setTimeout(() => {
        setApplied(false);
        setExpanded(false);
        setSelectedIds([]);
        setStartDate("");
      }, 2500);
    } catch {
      setApplied(false);
    }
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
          <div className="flex items-center gap-2 shrink-0">
            {template.isCustom && (
              <Badge variant="primary">
                <Bookmark className="h-3 w-3" />
                Meu template
              </Badge>
            )}
            {template.isCustom && onDelete && (
              <button
                onClick={() => onDelete(template.id)}
                className="rounded-lg p-1 text-text-muted hover:bg-danger/10 hover:text-danger transition-colors"
                title="Excluir template"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
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

                <label className="block">
                  <span className="mb-1 block text-[10px] font-semibold uppercase tracking-wider text-text-muted">
                    Semana de início (segunda-feira)
                  </span>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-text outline-none focus:border-primary/60"
                  />
                </label>

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
                        disabled={selectedIds.length === 0 || !startDate}
                        onClick={handleApply}
                      >
                        <Send className="h-3.5 w-3.5" />
                        {selectedIds.length === 0
                          ? "Selecione atletas…"
                          : !startDate
                          ? "Selecione a semana…"
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

function VdotReferenceTab({ athletes }: { athletes: AthleteListItem[] }) {
  const [athleteId, setAthleteId] = useState("");
  const [raceDistanceM, setRaceDistanceM] = useState<number>(RACE_DISTANCES[3].meters);
  const [raceTimeStr, setRaceTimeStr] = useState("");

  const athlete = useMemo(
    () => athletes.find((a) => a.id === athleteId) ?? athletes[0],
    [athleteId, athletes]
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
                {athletes.map((a) => (
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
                  para {athlete?.name?.split(" ")[0] ?? "atleta"}
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

type DraftSession = {
  dayLabel: string;
  title: string;
  zone: string;
  distanceKm: number;
};

const DAY_OPTIONS = ["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"];

export default function CorridaPage() {
  const [activeTab, setActiveTab] = useState<"referencia" | "templates" | "criar">("referencia");
  const [realAthletes, setRealAthletes] = useState<AthleteListItem[]>([]);
  const [customRunTemplates, setCustomRunTemplates] = useState<RunWorkoutTemplate[]>([]);
  const [runTemplatesLoading, setRunTemplatesLoading] = useState(true);
  const [showNewRunTemplate, setShowNewRunTemplate] = useState(false);
  const [newRtName, setNewRtName] = useState("");
  const [newRtDesc, setNewRtDesc] = useState("");
  const [newRtLevel, setNewRtLevel] = useState("Intermediário");
  const [newRtKm, setNewRtKm] = useState("40");
  const [newRtFocus, setNewRtFocus] = useState("Base aeróbica");
  const [savingRunTemplate, setSavingRunTemplate] = useState(false);

  // ── "Criar treino" form state ─────────────────────────────────────────────
  const [criarAthleteId, setCriarAthleteId] = useState("");
  const [criarDate, setCriarDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [criarTitle, setCriarTitle] = useState("");
  const [criarType, setCriarType] = useState("RODAGEM_LEVE");
  const [criarStructured, setCriarStructured] = useState(false);
  const [criarBlocks, setCriarBlocks] = useState<WorkoutBlock[]>(defaultBlocks());
  const [criarDistKm, setCriarDistKm] = useState("");
  const [criarDurMin, setCriarDurMin] = useState("");
  const [criarSaving, setCriarSaving] = useState(false);
  const [criarOk, setCriarOk] = useState(false);
  const [criarLastWorkout, setCriarLastWorkout] = useState<{ title: string; type: string; distKm: string; durMin: string } | null>(null);
  const [criarSavedLib, setCriarSavedLib] = useState(false);

  async function handleCriarTreino() {
    if (!criarAthleteId || !criarDate || !criarTitle.trim() || criarSaving) return;
    setCriarSaving(true);
    try {
      const res = await fetch("/api/coach/workouts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          athleteId: criarAthleteId,
          date: criarDate + "T12:00:00.000Z",
          title: criarTitle.trim(),
          type: criarType,
          structured: criarStructured,
          blocks: criarStructured ? criarBlocks : undefined,
          targetDistanceKm: criarDistKm ? parseFloat(criarDistKm) : undefined,
          targetDurationMin: criarDurMin ? parseInt(criarDurMin) : undefined,
        }),
      });
      if (res.ok) {
        setCriarLastWorkout({ title: criarTitle.trim(), type: criarType, distKm: criarDistKm, durMin: criarDurMin });
        setCriarSavedLib(false);
        setCriarOk(true);
        setCriarTitle("");
        setCriarDistKm("");
        setCriarDurMin("");
        setCriarStructured(false);
        setCriarBlocks(defaultBlocks());
        setTimeout(() => setCriarOk(false), 6000);
      }
    } finally {
      setCriarSaving(false);
    }
  }

  // Draft sessions for new template
  const [draftSessions, setDraftSessions] = useState<DraftSession[]>([]);
  const [newSessDay, setNewSessDay] = useState("Seg");
  const [newSessTitle, setNewSessTitle] = useState("");
  const [newSessZone, setNewSessZone] = useState("E");
  const [newSessDist, setNewSessDist] = useState("5");

  useEffect(() => {
    fetch("/api/coach/athletes")
      .then((r) => r.ok ? r.json() : [])
      .then((data: AthleteListItem[]) => setRealAthletes(data))
      .catch(() => null);
  }, []);

  useEffect(() => {
    fetch("/api/coach/templates/corrida")
      .then((r) => r.ok ? r.json() : [])
      .then((data: Array<{ id: string; name: string; description?: string; targetLevel: string; weeklyKm: number; sessionsPerWeek: number; focus: string; sessions: RunWorkoutTemplate["sessions"]; createdAt: string }>) => {
        setCustomRunTemplates(
          data.map((t) => ({ ...t, description: t.description ?? "", isCustom: true }))
        );
      })
      .catch(() => null)
      .finally(() => setRunTemplatesLoading(false));
  }, []);

  function handleAddSession() {
    if (!newSessTitle.trim()) return;
    setDraftSessions((prev) => [
      ...prev,
      { dayLabel: newSessDay, title: newSessTitle.trim(), zone: newSessZone, distanceKm: parseFloat(newSessDist) || 5 },
    ]);
    setNewSessTitle("");
    setNewSessDist("5");
  }

  function handleRemoveSession(idx: number) {
    setDraftSessions((prev) => prev.filter((_, i) => i !== idx));
  }

  async function handleCreateRunTemplate() {
    if (!newRtName.trim() || savingRunTemplate) return;
    setSavingRunTemplate(true);
    const payload = {
      name: newRtName.trim(),
      description: newRtDesc.trim(),
      targetLevel: newRtLevel,
      weeklyKm: parseFloat(newRtKm) || 40,
      sessionsPerWeek: draftSessions.length || 3,
      focus: newRtFocus,
      sessions: draftSessions,
    };
    try {
      const res = await fetch("/api/coach/templates/corrida", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        const saved = await res.json();
        setCustomRunTemplates((prev) => [{ ...saved, description: saved.description ?? "", isCustom: true }, ...prev]);
        setNewRtName("");
        setNewRtDesc("");
        setDraftSessions([]);
        setShowNewRunTemplate(false);
      }
    } finally {
      setSavingRunTemplate(false);
    }
  }

  async function handleDeleteRunTemplate(id: string) {
    setCustomRunTemplates((prev) => prev.filter((t) => t.id !== id));
    await fetch(`/api/coach/templates/corrida/${id}`, { method: "DELETE" });
  }

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
        <button
          onClick={() => setActiveTab("criar")}
          className={cn(
            "flex items-center gap-2 rounded-xl border px-4 py-2 text-sm font-medium transition-colors",
            activeTab === "criar"
              ? "border-primary/60 bg-primary/15 text-primary"
              : "border-border bg-card text-text-muted hover:border-primary/30 hover:text-text"
          )}
        >
          <Layers className="h-4 w-4" />
          Criar treino
        </button>
      </div>

      {activeTab === "referencia" && <VdotReferenceTab athletes={realAthletes} />}

      {activeTab === "criar" && (
        <div className="space-y-4">
          <p className="text-sm text-text-muted">
            Crie uma sessão de corrida diretamente no calendário do atleta — com blocos estruturados ou configuração simples.
          </p>
          <Card>
            <CardContent className="space-y-5 p-5">
              {/* Athlete + date */}
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="block">
                  <span className={labelClass}>Atleta *</span>
                  <select
                    value={criarAthleteId}
                    onChange={(e) => setCriarAthleteId(e.target.value)}
                    className={inputClass}
                  >
                    <option value="">Selecione o atleta…</option>
                    {realAthletes.map((a) => (
                      <option key={a.id} value={a.id} className="bg-card text-text">
                        {a.name}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="block">
                  <span className={labelClass}>Data *</span>
                  <input
                    type="date"
                    value={criarDate}
                    onChange={(e) => setCriarDate(e.target.value)}
                    className={inputClass}
                  />
                </label>
              </div>

              {/* Title + type */}
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="block">
                  <span className={labelClass}>Título *</span>
                  <input
                    value={criarTitle}
                    onChange={(e) => setCriarTitle(e.target.value)}
                    placeholder="Ex.: Tempo Run 45min"
                    className={inputClass}
                  />
                </label>
                <label className="block">
                  <span className={labelClass}>Tipo de treino</span>
                  <select
                    value={criarType}
                    onChange={(e) => setCriarType(e.target.value)}
                    className={inputClass}
                  >
                    {[
                      ["RODAGEM_LEVE", "Rodagem Leve"],
                      ["REGENERATIVO", "Regenerativo"],
                      ["PROGRESSIVO", "Progressivo"],
                      ["TEMPO_RUN", "Tempo Run"],
                      ["FARTLEK", "Fartlek"],
                      ["INTERVALADO_LONGO", "Intervalado Longo"],
                      ["INTERVALADO_CURTO", "Intervalado Curto"],
                      ["LONGAO", "Longão"],
                      ["SUBIDA", "Subida"],
                      ["TECNICA", "Técnica"],
                      ["PROVA", "Prova"],
                      ["FORCA", "Força"],
                      ["FUNCIONAL", "Funcional"],
                      ["MOBILIDADE", "Mobilidade"],
                      ["RECUPERACAO", "Recuperação"],
                    ].map(([v, l]) => (
                      <option key={v} value={v} className="bg-card text-text">{l}</option>
                    ))}
                  </select>
                </label>
              </div>

              {/* Structured toggle */}
              <div className="flex items-center gap-3 rounded-xl border border-border bg-card-hover/20 p-3">
                <button
                  type="button"
                  onClick={() => setCriarStructured((v) => !v)}
                  className={cn(
                    "relative flex h-6 w-11 shrink-0 items-center rounded-full transition-colors",
                    criarStructured ? "bg-primary" : "bg-border"
                  )}
                >
                  <span
                    className={cn(
                      "absolute h-4 w-4 rounded-full bg-white shadow transition-transform",
                      criarStructured ? "translate-x-6" : "translate-x-1"
                    )}
                  />
                </button>
                <div>
                  <p className="text-sm font-semibold text-text">Treino estruturado em blocos</p>
                  <p className="text-[11px] text-text-muted">
                    {criarStructured
                      ? "Defina aquecimento, estímulo e desaquecimento abaixo."
                      : "Defina apenas distância ou duração."}
                  </p>
                </div>
              </div>

              {/* Non-structured fields */}
              {!criarStructured && (
                <div className="grid gap-4 sm:grid-cols-2">
                  <label className="block">
                    <span className={labelClass}>Distância alvo (km)</span>
                    <input
                      type="number"
                      min={0}
                      step={0.5}
                      value={criarDistKm}
                      onChange={(e) => setCriarDistKm(e.target.value)}
                      placeholder="Ex.: 12"
                      className={inputClass}
                    />
                  </label>
                  <label className="block">
                    <span className={labelClass}>Duração alvo (min)</span>
                    <input
                      type="number"
                      min={0}
                      step={5}
                      value={criarDurMin}
                      onChange={(e) => setCriarDurMin(e.target.value)}
                      placeholder="Ex.: 60"
                      className={inputClass}
                    />
                  </label>
                </div>
              )}

              {/* Block editor */}
              {criarStructured && (
                <WorkoutBlockEditor blocks={criarBlocks} onChange={setCriarBlocks} />
              )}

              {/* Actions */}
              <div className="flex flex-wrap items-center gap-3">
                <Button
                  onClick={handleCriarTreino}
                  disabled={!criarAthleteId || !criarDate || !criarTitle.trim() || criarSaving}
                >
                  {criarSaving ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Send className="h-3.5 w-3.5" />
                  )}
                  {criarSaving ? "Salvando…" : "Prescrever treino"}
                </Button>
                {criarOk && (
                  <span className="flex items-center gap-1.5 text-sm text-success">
                    <CheckCircle2 className="h-4 w-4" />
                    Treino adicionado ao calendário!
                  </span>
                )}
                {criarOk && criarLastWorkout && !criarSavedLib && (
                  <button
                    onClick={async () => {
                      if (!criarLastWorkout) return;
                      await fetch("/api/coach/biblioteca", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                          name: criarLastWorkout.title,
                          workoutType: criarLastWorkout.type,
                          category: ["FORCA","FUNCIONAL","MOBILIDADE"].includes(criarLastWorkout.type) ? "FORCA" : "CORRIDA",
                          targetDistanceKm: criarLastWorkout.distKm ? parseFloat(criarLastWorkout.distKm) : undefined,
                          targetDurationMin: criarLastWorkout.durMin ? parseInt(criarLastWorkout.durMin) : undefined,
                        }),
                      });
                      setCriarSavedLib(true);
                    }}
                    className="flex items-center gap-1.5 rounded-xl border border-border px-3 py-2 text-xs font-medium text-text-muted transition-colors hover:border-primary/40 hover:bg-primary/5 hover:text-primary"
                  >
                    <Bookmark className="h-3.5 w-3.5" />
                    Salvar na biblioteca
                  </button>
                )}
                {criarSavedLib && (
                  <span className="flex items-center gap-1.5 text-xs text-primary">
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    Salvo na biblioteca!
                  </span>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {activeTab === "templates" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-text-muted">
              Selecione um template e clique em{" "}
              <span className="font-semibold text-text">Aplicar para atletas</span> — os paces são
              recalculados automaticamente para o VDOT de cada atleta.
            </p>
            <Button size="sm" variant="secondary" className="shrink-0 gap-1.5" onClick={() => setShowNewRunTemplate((v) => !v)}>
              <Plus className="h-3.5 w-3.5" />
              Novo template
            </Button>
          </div>

          {showNewRunTemplate && (
            <Card className="border-primary/30">
              <CardContent className="space-y-4 p-5">
                <div className="flex items-center justify-between">
                  <h3 className="font-display text-sm font-bold text-text">Criar template de corrida</h3>
                  <button onClick={() => setShowNewRunTemplate(false)} className="text-text-muted hover:text-text">
                    <X className="h-4 w-4" />
                  </button>
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <label className="block">
                    <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-text-muted">Nome *</span>
                    <input value={newRtName} onChange={(e) => setNewRtName(e.target.value)}
                      placeholder="Ex.: Bloco de Velocidade 8 semanas" className={inputClass} />
                  </label>
                  <label className="block">
                    <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-text-muted">Volume semanal (km)</span>
                    <input type="number" value={newRtKm} onChange={(e) => setNewRtKm(e.target.value)}
                      placeholder="40" className={inputClass} />
                  </label>
                </div>
                <label className="block">
                  <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-text-muted">Descrição</span>
                  <input value={newRtDesc} onChange={(e) => setNewRtDesc(e.target.value)}
                    placeholder="Descreva o objetivo e estrutura do template" className={inputClass} />
                </label>
                <div className="grid gap-3 sm:grid-cols-2">
                  <label className="block">
                    <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-text-muted">Foco</span>
                    <select value={newRtFocus} onChange={(e) => setNewRtFocus(e.target.value)} className={inputClass}>
                      <option>Base aeróbica</option>
                      <option>Limiar anaeróbico</option>
                      <option>VO₂máx</option>
                      <option>Velocidade</option>
                      <option>Pré-prova</option>
                      <option>Recuperação</option>
                    </select>
                  </label>
                  <div>
                    <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-text-muted">Nível</span>
                    <div className="flex gap-2">
                      {["Iniciante", "Intermediário", "Avançado"].map((l) => (
                        <button key={l} type="button" onClick={() => setNewRtLevel(l)}
                          className={cn("flex-1 rounded-lg border py-2 text-xs font-medium transition-all",
                            newRtLevel === l ? "border-primary/50 bg-primary/10 text-primary" : "border-border text-text-muted hover:border-primary/30")}>
                          {l === "Intermediário" ? "Inter." : l}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
                {/* Sessions editor */}
                <div className="space-y-2">
                  <span className="block text-xs font-semibold uppercase tracking-wider text-text-muted">
                    Sessões da semana {draftSessions.length > 0 && <span className="text-primary">({draftSessions.length})</span>}
                  </span>
                  {draftSessions.length > 0 && (
                    <div className="space-y-1">
                      {draftSessions.map((s, i) => (
                        <div key={i} className="flex items-center gap-2 rounded-lg border border-border bg-card-hover/30 px-3 py-2 text-xs">
                          <span className="w-7 shrink-0 font-mono font-bold text-primary">{s.dayLabel}</span>
                          <span className="flex-1 text-text">{s.title}</span>
                          <span className="text-text-muted">{s.distanceKm} km · Zona {s.zone}</span>
                          <button type="button" onClick={() => handleRemoveSession(i)} className="text-text-muted hover:text-danger transition-colors">
                            <X className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                  <div className="flex flex-wrap gap-2 rounded-xl border border-dashed border-border bg-background/50 p-3">
                    <select value={newSessDay} onChange={(e) => setNewSessDay(e.target.value)}
                      className="rounded-lg border border-border bg-background px-2 py-1.5 text-xs text-text outline-none focus:border-primary/60">
                      {DAY_OPTIONS.map((d) => <option key={d}>{d}</option>)}
                    </select>
                    <select value={newSessZone} onChange={(e) => setNewSessZone(e.target.value)}
                      className="rounded-lg border border-border bg-background px-2 py-1.5 text-xs text-text outline-none focus:border-primary/60">
                      {["E","M","T","I","R"].map((z) => <option key={z} value={z}>Zona {z}</option>)}
                    </select>
                    <input value={newSessTitle} onChange={(e) => setNewSessTitle(e.target.value)}
                      placeholder="Ex.: Rodagem leve"
                      onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); handleAddSession(); }}}
                      className="min-w-0 flex-1 rounded-lg border border-border bg-background px-2.5 py-1.5 text-xs text-text outline-none focus:border-primary/60 placeholder:text-text-muted/50" />
                    <input value={newSessDist} onChange={(e) => setNewSessDist(e.target.value)}
                      type="number" min={1} max={50} step={0.5} placeholder="km"
                      className="w-16 rounded-lg border border-border bg-background px-2 py-1.5 text-xs text-text outline-none focus:border-primary/60" />
                    <Button size="sm" variant="secondary" onClick={handleAddSession} disabled={!newSessTitle.trim()}>
                      <Plus className="h-3.5 w-3.5" /> Adicionar
                    </Button>
                  </div>
                  {draftSessions.length === 0 && (
                    <p className="text-[11px] text-text-muted">Adicione ao menos uma sessão para poder prescrever este template.</p>
                  )}
                </div>

                <div className="flex gap-3">
                  <Button size="sm" onClick={handleCreateRunTemplate} disabled={!newRtName.trim() || draftSessions.length === 0 || savingRunTemplate} className="gap-1.5">
                    <Bookmark className="h-3.5 w-3.5" />
                    {savingRunTemplate ? "Salvando…" : "Salvar template"}
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => { setShowNewRunTemplate(false); setDraftSessions([]); }}>Cancelar</Button>
                </div>
              </CardContent>
            </Card>
          )}

          <div className="grid gap-4 sm:grid-cols-2">
            {runTemplatesLoading ? (
              [1, 2].map((i) => (
                <div key={i} className="h-40 animate-pulse rounded-2xl bg-card-hover/60" />
              ))
            ) : (
              [...customRunTemplates, ...runWorkoutTemplates].map((tpl) => (
                <RunTemplateCard
                  key={tpl.id}
                  template={tpl}
                  athletes={realAthletes}
                  onDelete={tpl.isCustom ? handleDeleteRunTemplate : undefined}
                />
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
