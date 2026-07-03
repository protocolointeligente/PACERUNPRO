"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  Bookmark,
  BookOpen,
  CheckCircle2,
  Dumbbell,
  LayoutTemplate,
  Link2,
  Loader2,
  Pencil,
  Plus,
  Search,
  Send,
  Trash2,
  Users,
  Video,
  X,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  strengthDivisions,
  workoutTemplates,
} from "@/lib/mock-data";
import type { AthleteListItem, ExerciseLibraryItem, WorkoutTemplate } from "@/lib/types";
import { cn } from "@/lib/utils";

const inputClass =
  "w-full rounded-xl border border-border bg-background px-3.5 py-2.5 text-sm text-text placeholder:text-text-muted/50 outline-none transition-colors focus:border-primary/60 focus:ring-2 focus:ring-primary/20";
const miniInputClass =
  "w-full rounded-lg border border-border bg-background px-2.5 py-1.5 text-xs text-text outline-none transition-colors focus:border-primary/60 focus:ring-2 focus:ring-primary/20";

interface PrescribedExercise {
  uid: string;
  libraryId: string;
  name: string;
  sets: number;
  reps: string;
  rest: string;
  rpe: number;
}

interface SessionBlock {
  id: string;
  label: string;
  dayLabels: string[];
  exercises: PrescribedExercise[];
}

const sessionLabelsByDivision: Record<string, string[]> = {
  AB: ["Treino A", "Treino B"],
  ABC: ["Treino A", "Treino B", "Treino C"],
  ABCD: ["Treino A", "Treino B", "Treino C", "Treino D"],
  ABCDE: ["Treino A", "Treino B", "Treino C", "Treino D", "Treino E"],
  "Full Body": ["Full Body"],
  "Upper/Lower": ["Upper", "Lower"],
  Personalizada: ["Treino 1"],
};

const defaultDayLabelsByDivision: Record<string, string[]> = {
  AB: ["Seg", "Qui"],
  ABC: ["Seg", "Qua", "Sex"],
  ABCD: ["Seg", "Ter", "Qui", "Sex"],
  ABCDE: ["Seg", "Ter", "Qua", "Qui", "Sex"],
  "Full Body": ["Seg", "Qua", "Sex"],
  "Upper/Lower": ["Seg", "Qui"],
  Personalizada: ["Seg"],
};

const WEEK_DAYS = ["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"] as const;

let uidCounter = 0;
function nextUid() {
  uidCounter += 1;
  return `pe-${uidCounter}`;
}

function buildSessions(division: string): SessionBlock[] {
  const labels = sessionLabelsByDivision[division] ?? ["Treino A"];
  const days = defaultDayLabelsByDivision[division] ?? ["Seg"];
  return labels.map((label, i) => ({
    id: `s-${division}-${i}`,
    label,
    dayLabels: [days[i] ?? "Seg"],
    exercises: [],
  }));
}

// ── Template card (self-contained state) ──────────────────────────────────

function TemplateCard({
  template,
  athletes,
  exerciseDb,
  onLoad,
  onDelete,
}: {
  template: WorkoutTemplate;
  athletes: AthleteListItem[];
  exerciseDb: ExerciseLibraryItem[];
  onLoad: (t: WorkoutTemplate) => void;
  onDelete?: (id: string) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [applied, setApplied] = useState(false);
  const [tplStartDate, setTplStartDate] = useState("");
  const [applyError, setApplyError] = useState("");

  const totalExercises = template.sessions.reduce((acc, s) => acc + s.exercises.length, 0);

  function toggleAthlete(id: string) {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  }

  async function handleApply() {
    if (selectedIds.length === 0 || !tplStartDate) {
      setApplyError("Selecione atletas e a data de início.");
      return;
    }
    setApplyError("");
    setApplied(true);
    try {
      await Promise.all(
        selectedIds.map((athleteId) =>
          fetch("/api/coach/prescriptions/forca", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              athleteId,
              sessions: template.sessions.map((s, i) => ({
                label: s.label,
                dayLabels: [defaultDayLabelsByDivision[template.division]?.[i] ?? "Seg"],
                exercises: s.exercises,
              })),
              startDate: tplStartDate,
              division: template.division,
            }),
          })
        )
      );
      setTimeout(() => {
        setApplied(false);
        setExpanded(false);
        setSelectedIds([]);
        setTplStartDate("");
      }, 2500);
    } catch {
      setApplied(false);
      setApplyError("Erro ao prescrever. Tente novamente.");
    }
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

        <div className="flex flex-wrap gap-1.5">
          <Badge variant="default">{template.division}</Badge>
          <Badge variant={levelVariant}>{template.targetLevel}</Badge>
          {template.focus.split(", ").map((f) => (
            <span
              key={f}
              className="rounded-full border border-border bg-card px-2.5 py-0.5 text-[11px] text-text-muted"
            >
              {f}
            </span>
          ))}
        </div>

        <p className="text-xs text-text-muted">
          {template.sessions.length}{" "}
          {template.sessions.length === 1 ? "sessão" : "sessões"} &middot; {totalExercises} exercícios
        </p>

        {/* Exercise detail per session */}
        <div className="space-y-3">
          {template.sessions.map((session) => (
            <div key={session.label} className="rounded-xl border border-border bg-background/40 p-3">
              <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-text-muted">{session.label}</p>
              {session.exercises.length === 0 ? (
                <p className="text-xs text-text-muted">Nenhum exercício</p>
              ) : (
                <div className="space-y-1.5">
                  {session.exercises.map((ex, i) => {
                    const libEx = exerciseDb.find((e) => e.id === ex.libraryId);
                    return (
                      <div key={i} className="flex items-center gap-2 text-xs">
                        {(libEx?.gifUrl ?? libEx?.imageUrl) ? (
                          <img
                            src={libEx!.gifUrl ?? libEx!.imageUrl!}
                            alt={ex.name}
                            className="h-10 w-14 shrink-0 rounded-md object-cover border border-border"
                            onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = "none"; }}
                          />
                        ) : (
                          <div className="h-10 w-14 shrink-0 rounded-md border border-border bg-card-hover/40" />
                        )}
                        <span className="font-medium text-text min-w-0 flex-1 truncate">{ex.name}</span>
                        <span className="shrink-0 rounded bg-card px-1.5 py-0.5 text-text-muted">
                          {ex.sets}×{ex.reps}
                        </span>
                        <span className="shrink-0 text-text-muted">{ex.rest}</span>
                        <span className="shrink-0 rounded bg-primary/10 px-1.5 py-0.5 font-semibold text-primary">
                          RPE {ex.rpe}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="flex flex-wrap gap-2">
          <Button size="sm" onClick={() => onLoad(template)}>
            <LayoutTemplate className="h-3.5 w-3.5" />
            Usar no prescritor
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

        <AnimatePresence>
          {expanded && (
            <motion.div
              key="athlete-select"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden"
            >
              <div className="space-y-3 rounded-xl border border-border bg-background/50 p-3">
                <p className="text-xs font-semibold uppercase tracking-wider text-text-muted">
                  Selecione os atletas
                </p>
                <label className="block">
                  <span className="mb-1 block text-[10px] font-semibold uppercase tracking-wider text-text-muted">
                    Semana de início (segunda-feira)
                  </span>
                  <input
                    type="date"
                    value={tplStartDate}
                    onChange={(e) => setTplStartDate(e.target.value)}
                    className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-text outline-none focus:border-primary/60"
                  />
                </label>
                <div className="space-y-1">
                  {athletes.map((a) => (
                    <label
                      key={a.id}
                      className="flex cursor-pointer items-center gap-2.5 rounded-lg px-2 py-1.5 transition-colors hover:bg-card-hover/50"
                    >
                      <input
                        type="checkbox"
                        checked={selectedIds.includes(a.id)}
                        onChange={() => toggleAthlete(a.id)}
                        className="h-4 w-4 rounded border-border accent-[color:var(--color-primary)]"
                      />
                      <Avatar className="h-6 w-6">
                        <AvatarImage src={a.avatarUrl} alt={a.name} />
                        <AvatarFallback className="text-[10px]">
                          {a.name
                            .split(" ")
                            .map((n) => n[0])
                            .slice(0, 2)
                            .join("")}
                        </AvatarFallback>
                      </Avatar>
                      <span className="text-sm text-text">{a.name}</span>
                      <span className="ml-auto text-xs text-text-muted">{a.level}</span>
                    </label>
                  ))}
                </div>

                {applyError && (
                  <p className="text-xs text-danger">{applyError}</p>
                )}
                <AnimatePresence mode="wait">
                  {applied ? (
                    <motion.div
                      key="success"
                      initial={{ opacity: 0, y: 4 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      className="flex items-center gap-2 rounded-lg bg-success/10 px-3 py-2 text-sm text-success"
                    >
                      <CheckCircle2 className="h-4 w-4 shrink-0" />
                      Aplicado para {selectedIds.length}{" "}
                      {selectedIds.length === 1 ? "atleta" : "atletas"}
                    </motion.div>
                  ) : (
                    <motion.div key="apply-btn" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                      <Button
                        size="sm"
                        className="w-full"
                        disabled={selectedIds.length === 0 || !tplStartDate}
                        onClick={handleApply}
                      >
                        <Send className="h-3.5 w-3.5" />
                        {selectedIds.length === 0
                          ? "Selecione atletas…"
                          : `Aplicar para ${selectedIds.length} ${selectedIds.length === 1 ? "atleta" : "atletas"}`}
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

// ── Main page ─────────────────────────────────────────────────────────────

export default function StrengthPrescriptionPage() {
  const [athletes, setAthletes] = useState<AthleteListItem[]>([]);
  const [athleteId, setAthleteId] = useState("");
  useEffect(() => {
    fetch("/api/coach/athletes")
      .then((r) => r.ok ? r.json() : [])
      .then((data: AthleteListItem[]) => {
        setAthletes(data);
        if (data.length > 0) setAthleteId(data[0].id);
      })
      .catch(() => null);
  }, []);

  const [exerciseDb, setExerciseDb] = useState<ExerciseLibraryItem[]>([]);
  const [exerciseCategories, setExerciseCategories] = useState<string[]>([]);
  useEffect(() => {
    fetch("/exercises.json")
      .then((r) => r.ok ? r.json() : [])
      .then((data: Array<{ id: string; name: string; category: string; gifUrl?: string; imageUrl?: string; description: string }>) => {
        const items: ExerciseLibraryItem[] = data.map((d) => ({
          id: d.id,
          name: d.name,
          category: d.category,
          muscles: [],
          gifUrl: d.gifUrl,
          imageUrl: d.imageUrl,
          description: d.description,
          execution: "",
          mistakes: "",
          sets: 3,
          reps: "10-12",
          rest: "60s",
          rpe: 7,
        }));
        setExerciseDb(items);
        const cats = Array.from(new Set(items.map((e) => e.category))).sort();
        setExerciseCategories(cats);
      })
      .catch(() => null);
  }, []);

  const [activeTab, setActiveTab] = useState<"prescrever" | "templates">("prescrever");
  const [division, setDivision] = useState(strengthDivisions[1]);
  const [sessions, setSessions] = useState<SessionBlock[]>(() =>
    buildSessions(strengthDivisions[1])
  );
  const [activeIndex, setActiveIndex] = useState(0);
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<string>("Todas");
  const [expandedExId, setExpandedExId] = useState<string | null>(null);
  const [startDate, setStartDate] = useState<string>("");
  const [sent, setSent] = useState(false);
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState("");
  const [savedAsTemplate, setSavedAsTemplate] = useState(false);
  const [customTemplates, setCustomTemplates] = useState<WorkoutTemplate[]>([]);
  const [templatesLoading, setTemplatesLoading] = useState(true);
  const [showNewTemplate, setShowNewTemplate] = useState(false);
  const [newTplName, setNewTplName] = useState("");
  const [newTplDesc, setNewTplDesc] = useState("");
  const [newTplLevel, setNewTplLevel] = useState("Intermediário");
  const [newTplFocus, setNewTplFocus] = useState("Hipertrofia");
  const [savingTemplate, setSavingTemplate] = useState(false);

  // Create exercise modal state
  const [showCreateExercise, setShowCreateExercise] = useState(false);
  const [newExName, setNewExName] = useState("");
  const [newExCategory, setNewExCategory] = useState("Hipertrofia");
  const [newExDesc, setNewExDesc] = useState("");
  const [newExVideoUrl, setNewExVideoUrl] = useState("");
  const [creatingExercise, setCreatingExercise] = useState(false);
  const [createExError, setCreateExError] = useState("");

  useEffect(() => {
    fetch("/api/coach/templates/forca")
      .then((r) => r.ok ? r.json() : [])
      .then((data: Array<{ id: string; name: string; description?: string; division?: string; targetLevel: string; focus: string; sessions: WorkoutTemplate["sessions"]; createdAt: string }>) => {
        setCustomTemplates(
          data.map((t) => ({ ...t, description: t.description ?? "", division: t.division ?? "", isCustom: true }))
        );
      })
      .catch(() => null)
      .finally(() => setTemplatesLoading(false));
  }, []);

  async function handleCreateTemplate() {
    if (!newTplName.trim() || savingTemplate) return;
    setSavingTemplate(true);
    const payload = {
      name: newTplName.trim(),
      description: newTplDesc.trim(),
      division,
      targetLevel: newTplLevel,
      focus: newTplFocus,
      sessions: sessions.map((s) => ({
        label: s.label,
        exercises: s.exercises.map((e) => ({
          libraryId: e.libraryId,
          name: e.name,
          sets: e.sets,
          reps: e.reps,
          rest: e.rest,
          rpe: e.rpe,
        })),
      })),
    };
    try {
      const res = await fetch("/api/coach/templates/forca", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        const saved = await res.json();
        setCustomTemplates((prev) => [{ ...saved, description: saved.description ?? "", division: saved.division ?? "", isCustom: true }, ...prev]);
        setNewTplName("");
        setNewTplDesc("");
        setShowNewTemplate(false);
        setActiveTab("templates");
      }
    } finally {
      setSavingTemplate(false);
    }
  }

  async function handleDeleteCustomTemplate(id: string) {
    setCustomTemplates((prev) => prev.filter((t) => t.id !== id));
    await fetch(`/api/coach/templates/forca/${id}`, { method: "DELETE" });
  }

  async function handleCreateExercise() {
    if (!newExName.trim() || creatingExercise) return;
    setCreateExError("");
    setCreatingExercise(true);
    try {
      const res = await fetch("/api/coach/exercises", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newExName.trim(),
          category: newExCategory,
          description: newExDesc.trim() || undefined,
          videoUrl: newExVideoUrl.trim() || undefined,
          videoTitle: newExName.trim(),
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        setCreateExError(err.error ?? "Erro ao criar exercício.");
        return;
      }
      const created = await res.json();
      // Add to local exerciseDb so it appears immediately in the library
      const item: ExerciseLibraryItem = {
        id: created.id,
        name: created.name,
        category: created.category,
        muscles: created.musclesWorked ?? [],
        gifUrl: created.videoUrl ?? undefined,
        imageUrl: created.imageUrl ?? undefined,
        description: created.description ?? "",
        execution: created.execution ?? "",
        mistakes: created.commonMistakes ?? "",
        sets: 3,
        reps: "10-12",
        rest: "60s",
        rpe: 7,
      };
      setExerciseDb((prev) => [item, ...prev]);
      setNewExName("");
      setNewExCategory("Hipertrofia");
      setNewExDesc("");
      setNewExVideoUrl("");
      setShowCreateExercise(false);
    } catch {
      setCreateExError("Erro de conexão. Tente novamente.");
    } finally {
      setCreatingExercise(false);
    }
  }

  const skipDivisionEffect = useRef(false);

  const athlete = useMemo(
    () => athletes.find((a) => a.id === athleteId) ?? athletes[0] ?? null,
    [athleteId, athletes]
  );
  const activeSession = sessions[activeIndex];

  useEffect(() => {
    if (skipDivisionEffect.current) {
      skipDivisionEffect.current = false;
      return;
    }
    setSessions(buildSessions(division));
    setActiveIndex(0);
    setSent(false);
  }, [division]);

  const filteredLibrary = useMemo(() => {
    return exerciseDb.filter((ex) => {
      const matchesQuery = ex.name.toLowerCase().includes(query.toLowerCase());
      const matchesCategory = category === "Todas" || ex.category === category;
      return matchesQuery && matchesCategory;
    });
  }, [exerciseDb, query, category]);

  function updateSessions(fn: (s: SessionBlock) => SessionBlock) {
    setSessions((prev) => prev.map((s, i) => (i === activeIndex ? fn(s) : s)));
    setSent(false);
  }

  function addExercise(ex: ExerciseLibraryItem) {
    updateSessions((s) => ({
      ...s,
      exercises: [
        ...s.exercises,
        {
          uid: nextUid(),
          libraryId: ex.id,
          name: ex.name,
          sets: ex.sets,
          reps: ex.reps,
          rest: ex.rest,
          rpe: ex.rpe,
        },
      ],
    }));
  }

  function patchExercise(uid: string, patch: Partial<PrescribedExercise>) {
    updateSessions((s) => ({
      ...s,
      exercises: s.exercises.map((e) => (e.uid === uid ? { ...e, ...patch } : e)),
    }));
  }

  function removeExercise(uid: string) {
    updateSessions((s) => ({
      ...s,
      exercises: s.exercises.filter((e) => e.uid !== uid),
    }));
  }

  function renameSession(label: string) {
    setSessions((prev) =>
      prev.map((s, i) => (i === activeIndex ? { ...s, label } : s))
    );
    setSent(false);
  }

  function addCustomSession() {
    setSessions((prev) => [
      ...prev,
      { id: `s-custom-${prev.length}`, label: `Treino ${prev.length + 1}`, dayLabels: ["Seg"], exercises: [] },
    ]);
    setActiveIndex(sessions.length);
  }

  async function submit() {
    if (!athlete || !startDate) {
      setSendError("Selecione um atleta e a data de início.");
      return;
    }
    const sessionsWithExercises = sessions.filter((s) => s.exercises.length > 0);
    if (sessionsWithExercises.length === 0) {
      setSendError("Adicione ao menos um exercício antes de enviar.");
      return;
    }
    setSending(true);
    setSendError("");
    try {
      const res = await fetch("/api/coach/prescriptions/forca", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          athleteId: athlete.id,
          sessions: sessions.map((s) => ({
            label: s.label,
            dayLabels: s.dayLabels,
            exercises: s.exercises.map((e) => ({
              libraryId: e.libraryId,
              name: e.name,
              sets: e.sets,
              reps: e.reps,
              rest: e.rest,
              rpe: e.rpe,
            })),
          })),
          startDate,
          division,
        }),
      });
      if (res.ok) {
        setSent(true);
      } else {
        const body = await res.json().catch(() => ({}));
        setSendError(body.error ?? "Erro ao prescrever treino.");
      }
    } catch {
      setSendError("Erro de rede. Tente novamente.");
    } finally {
      setSending(false);
    }
  }

  async function handleSaveAsTemplate() {
    const totalExercises = sessions.reduce((acc, s) => acc + s.exercises.length, 0);
    if (totalExercises === 0) return;
    const payload = {
      name: `Template ${athlete?.name ?? "Atleta"} — ${division}`,
      description: `Gerado em ${new Date().toLocaleDateString("pt-BR")}`,
      division,
      targetLevel: "Intermediário",
      focus: "Hipertrofia",
      sessions: sessions.map((s) => ({
        label: s.label,
        exercises: s.exercises.map((e) => ({
          libraryId: e.libraryId,
          name: e.name,
          sets: e.sets,
          reps: e.reps,
          rest: e.rest,
          rpe: e.rpe,
        })),
      })),
    };
    try {
      const res = await fetch("/api/coach/templates/forca", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        const saved = await res.json();
        setCustomTemplates((prev) => [{ ...saved, description: saved.description ?? "", division: saved.division ?? "", isCustom: true }, ...prev]);
      }
    } catch {
      // silently ignore — not critical path
    }
    setSavedAsTemplate(true);
    setTimeout(() => setSavedAsTemplate(false), 2500);
  }

  function loadTemplate(template: WorkoutTemplate) {
    const matchDivision = strengthDivisions.includes(template.division)
      ? template.division
      : "Personalizada";

    const defaultDays = defaultDayLabelsByDivision[matchDivision] ?? ["Seg"];
    const newSessions: SessionBlock[] = template.sessions.map((s, i) => ({
      id: `tpl-${template.id}-${i}`,
      label: s.label,
      dayLabels: [defaultDays[i] ?? "Seg"],
      exercises: s.exercises.map((e) => ({
        uid: nextUid(),
        libraryId: e.libraryId,
        name: e.name,
        sets: e.sets,
        reps: e.reps,
        rest: e.rest,
        rpe: e.rpe,
      })),
    }));

    if (matchDivision !== division) {
      skipDivisionEffect.current = true;
      setDivision(matchDivision);
    }
    setSessions(newSessions);
    setActiveIndex(0);
    setSent(false);
    setActiveTab("prescrever");
  }

  const totalExercises = sessions.reduce((acc, s) => acc + s.exercises.length, 0);

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div>
        <Badge variant="primary" className="mb-2">
          Prescrição de treino
        </Badge>
        <h1 className="font-display text-2xl font-bold text-text sm:text-3xl">
          Prescrever treino de força &amp; funcional
        </h1>
        <p className="mt-1.5 text-sm text-text-muted">
          Monte sessões com exercícios da biblioteca, personalize para cada atleta ou use um template pronto.
        </p>
      </div>

      {/* Tab switcher */}
      <div className="flex gap-1.5">
        <button
          onClick={() => setActiveTab("prescrever")}
          className={cn(
            "flex items-center gap-2 rounded-xl border px-4 py-2 text-sm font-medium transition-colors",
            activeTab === "prescrever"
              ? "border-primary/60 bg-primary/15 text-primary"
              : "border-border bg-card text-text-muted hover:border-primary/30 hover:text-text"
          )}
        >
          <Dumbbell className="h-4 w-4" />
          Prescrever
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
          Templates
          <span className="rounded-full bg-card-hover px-1.5 py-0.5 text-[11px] font-semibold">
            {workoutTemplates.length}
          </span>
        </button>
      </div>

      {/* ── Templates tab ─────────────────────────────────────────────────── */}
      {activeTab === "templates" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-text-muted">
              Selecione um template para carregar no prescritor ou aplique diretamente para múltiplos atletas.
            </p>
            <Button size="sm" variant="secondary" className="shrink-0 gap-1.5" onClick={() => setShowNewTemplate((v) => !v)}>
              <Plus className="h-3.5 w-3.5" />
              Novo template
            </Button>
          </div>

          {showNewTemplate && (
            <Card className="border-primary/30">
              <CardContent className="space-y-4 p-5">
                <div className="flex items-center justify-between">
                  <h3 className="font-display text-sm font-bold text-text">Criar novo template</h3>
                  <button onClick={() => setShowNewTemplate(false)} className="text-text-muted hover:text-text">
                    <BookOpen className="h-4 w-4" />
                  </button>
                </div>
                <p className="text-xs text-text-muted">
                  O template será criado com os exercícios da prescrição atual (divisão {division}).
                  Certifique-se de ter adicionado os exercícios no prescritor antes de salvar.
                </p>
                <div className="grid gap-3 sm:grid-cols-2">
                  <label className="block">
                    <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-text-muted">Nome do template *</span>
                    <input value={newTplName} onChange={(e) => setNewTplName(e.target.value)}
                      placeholder="Ex.: Full Body Iniciante" className={inputClass} />
                  </label>
                  <label className="block">
                    <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-text-muted">Foco</span>
                    <select value={newTplFocus} onChange={(e) => setNewTplFocus(e.target.value)} className={inputClass}>
                      <option>Hipertrofia</option>
                      <option>Força</option>
                      <option>Potência</option>
                      <option>Resistência</option>
                      <option>Funcional</option>
                    </select>
                  </label>
                </div>
                <label className="block">
                  <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-text-muted">Descrição</span>
                  <input value={newTplDesc} onChange={(e) => setNewTplDesc(e.target.value)}
                    placeholder="Descreva o objetivo deste template" className={inputClass} />
                </label>
                <div className="flex gap-2">
                  {["Iniciante", "Intermediário", "Avançado"].map((l) => (
                    <button key={l} type="button" onClick={() => setNewTplLevel(l)}
                      className={cn("flex-1 rounded-lg border py-2 text-xs font-medium transition-all",
                        newTplLevel === l ? "border-primary/50 bg-primary/10 text-primary" : "border-border text-text-muted hover:border-primary/30")}>
                      {l}
                    </button>
                  ))}
                </div>
                <div className="flex gap-3">
                  <Button size="sm" onClick={handleCreateTemplate} disabled={!newTplName.trim() || savingTemplate} className="gap-1.5">
                    <Bookmark className="h-3.5 w-3.5" />
                    {savingTemplate ? "Salvando…" : "Salvar template"}
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => setShowNewTemplate(false)}>Cancelar</Button>
                </div>
              </CardContent>
            </Card>
          )}

          <div className="grid gap-4 sm:grid-cols-2">
            {templatesLoading ? (
              [1, 2].map((i) => (
                <div key={i} className="h-48 animate-pulse rounded-2xl bg-card-hover/60" />
              ))
            ) : (
              [...customTemplates, ...workoutTemplates].map((tpl) => (
                <TemplateCard
                  key={tpl.id}
                  template={tpl}
                  athletes={athletes}
                  exerciseDb={exerciseDb}
                  onLoad={loadTemplate}
                  onDelete={tpl.isCustom ? handleDeleteCustomTemplate : undefined}
                />
              ))
            )}
          </div>
        </div>
      )}

      {/* ── Prescrever tab ────────────────────────────────────────────────── */}
      {activeTab === "prescrever" && (
        <div className="grid gap-5 lg:grid-cols-[1fr_22rem]">
          {/* Main builder */}
          <div className="space-y-5">
            <Card>
              <CardContent className="p-5">
                <h3 className="mb-3 font-display text-sm font-semibold text-text">Atleta</h3>
                <div className="flex flex-wrap gap-2">
                  {athletes.map((a) => (
                    <button
                      key={a.id}
                      onClick={() => {
                        setSent(false);
                        setAthleteId(a.id);
                      }}
                      className={cn(
                        "flex items-center gap-2.5 rounded-xl border px-3 py-2 text-left transition-colors",
                        athleteId === a.id
                          ? "border-primary/60 bg-primary/15"
                          : "border-border bg-card-hover/30 hover:border-primary/30"
                      )}
                    >
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={a.avatarUrl} alt={a.name} />
                        <AvatarFallback className="text-xs">
                          {a.name
                            .split(" ")
                            .map((n) => n[0])
                            .slice(0, 2)
                            .join("")}
                        </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0">
                        <p className="truncate text-xs font-semibold text-text">{a.name}</p>
                        <p className="truncate text-[11px] text-text-muted">
                          {a.goal} · {a.level}
                        </p>
                      </div>
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-5">
                <h3 className="mb-3 font-display text-sm font-semibold text-text">
                  Divisão de treino
                </h3>
                <div className="flex flex-wrap gap-2">
                  {strengthDivisions.map((d) => (
                    <button
                      key={d}
                      onClick={() => setDivision(d)}
                      className={cn(
                        "rounded-full border px-4 py-1.5 text-xs font-medium transition-colors",
                        division === d
                          ? "border-primary/60 bg-primary/15 text-primary"
                          : "border-border bg-card text-text-muted hover:border-primary/30"
                      )}
                    >
                      {d}
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-5">
                <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                  <h3 className="font-display text-sm font-semibold text-text">Sessões da semana</h3>
                  {division === "Personalizada" && (
                    <Button size="sm" variant="secondary" onClick={addCustomSession}>
                      <Plus className="h-3.5 w-3.5" /> Nova sessão
                    </Button>
                  )}
                </div>

                {/* All-sessions day assignment grid */}
                <div className="mb-4 space-y-2 rounded-xl border border-border bg-background/50 p-3">
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-text-muted">Distribuição semanal — selecione o dia de cada sessão</p>
                  {sessions.map((s, i) => (
                    <div key={s.id} className={cn(
                      "rounded-lg border p-2.5 transition-colors cursor-pointer",
                      activeIndex === i
                        ? "border-primary/40 bg-primary/5"
                        : "border-border hover:border-primary/20"
                    )} onClick={() => setActiveIndex(i)}>
                      <div className="flex flex-wrap items-center gap-2">
                        <span className={cn(
                          "min-w-[5rem] shrink-0 text-xs font-semibold",
                          activeIndex === i ? "text-primary" : "text-text"
                        )}>
                          {s.label}
                          <span className="ml-1 font-normal text-text-muted">({s.exercises.length})</span>
                        </span>
                        <div className="flex flex-wrap gap-1">
                          {WEEK_DAYS.map((d) => (
                            <button
                              key={d}
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setSessions((prev) =>
                                  prev.map((sess, idx) => {
                                    if (idx !== i) return sess;
                                    const has = sess.dayLabels.includes(d);
                                    return {
                                      ...sess,
                                      dayLabels: has
                                        ? sess.dayLabels.filter((x) => x !== d)
                                        : [...sess.dayLabels, d],
                                    };
                                  })
                                );
                                setSent(false);
                              }}
                              className={cn(
                                "rounded border px-2 py-0.5 text-[11px] font-medium transition-colors",
                                s.dayLabels.includes(d)
                                  ? "border-primary/60 bg-primary/20 text-primary font-bold"
                                  : "border-border bg-card text-text-muted hover:border-primary/30 hover:text-text"
                              )}
                            >
                              {d}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {activeSession && (
                  <div className="space-y-3">
                    <label className="block max-w-xs">
                      <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-text-muted">
                        Nome da sessão ativa
                      </span>
                      <input
                        value={activeSession.label}
                        onChange={(e) => renameSession(e.target.value)}
                        className={inputClass}
                      />
                    </label>

                    {activeSession.exercises.length === 0 && (
                      <div className="rounded-xl border border-dashed border-border px-4 py-8 text-center text-sm text-text-muted">
                        Nenhum exercício adicionado ainda. Selecione exercícios da biblioteca ao lado para
                        montar a sessão.
                      </div>
                    )}

                    {activeSession.exercises.map((ex) => (
                      <div
                        key={ex.uid}
                        className="rounded-xl border border-border bg-card-hover/30 p-3.5"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <label className="flex min-w-0 flex-1 items-center gap-2">
                            <Pencil className="h-3.5 w-3.5 shrink-0 text-text-muted" />
                            <input
                              value={ex.name}
                              onChange={(e) => patchExercise(ex.uid, { name: e.target.value })}
                              className="w-full truncate bg-transparent text-sm font-semibold text-text outline-none focus:underline"
                            />
                          </label>
                          <button
                            onClick={() => removeExercise(ex.uid)}
                            className="shrink-0 text-text-muted transition-colors hover:text-danger"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                        <div className="mt-3 grid grid-cols-2 gap-2.5 sm:grid-cols-4">
                          <label className="block">
                            <span className="mb-1 block text-[10px] uppercase tracking-wider text-text-muted">
                              Séries
                            </span>
                            <input
                              type="number"
                              min={1}
                              value={ex.sets}
                              onChange={(e) =>
                                patchExercise(ex.uid, { sets: Number(e.target.value) || 1 })
                              }
                              className={miniInputClass}
                            />
                          </label>
                          <label className="block">
                            <span className="mb-1 block text-[10px] uppercase tracking-wider text-text-muted">
                              Repetições
                            </span>
                            <input
                              value={ex.reps}
                              onChange={(e) => patchExercise(ex.uid, { reps: e.target.value })}
                              className={miniInputClass}
                            />
                          </label>
                          <label className="block">
                            <span className="mb-1 block text-[10px] uppercase tracking-wider text-text-muted">
                              Descanso
                            </span>
                            <input
                              value={ex.rest}
                              onChange={(e) => patchExercise(ex.uid, { rest: e.target.value })}
                              className={miniInputClass}
                            />
                          </label>
                          <label className="block">
                            <span className="mb-1 block text-[10px] uppercase tracking-wider text-text-muted">
                              RPE
                            </span>
                            <input
                              type="number"
                              min={1}
                              max={10}
                              value={ex.rpe}
                              onChange={(e) =>
                                patchExercise(ex.uid, { rpe: Number(e.target.value) || 1 })
                              }
                              className={miniInputClass}
                            />
                          </label>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Library sidebar */}
          <div className="space-y-5">
            <Card>
              <CardContent className="p-5">
                <div className="mb-3 flex items-center justify-between gap-2">
                  <h3 className="flex items-center gap-2 font-display text-sm font-semibold text-text">
                    <Dumbbell className="h-4 w-4 text-primary" /> Biblioteca de exercícios
                  </h3>
                  <button
                    onClick={() => setShowCreateExercise(true)}
                    title="Criar exercício"
                    className="flex items-center gap-1.5 rounded-lg border border-border px-2.5 py-1.5 text-[11px] font-semibold text-text-muted transition-colors hover:border-primary/60 hover:text-primary"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    Criar
                  </button>
                </div>
                <div className="mb-3 flex items-center gap-2 rounded-xl border border-border bg-background px-3 py-2">
                  <Search className="h-4 w-4 text-text-muted" />
                  <input
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Buscar exercício ou músculo…"
                    className="w-full bg-transparent text-sm text-text placeholder:text-text-muted/60 outline-none"
                  />
                </div>
                <div className="mb-4 flex flex-wrap gap-1.5">
                  {["Todas", ...exerciseCategories].map((c) => (
                    <button
                      key={c}
                      onClick={() => setCategory(c)}
                      className={cn(
                        "rounded-full border px-3 py-1 text-[11px] font-medium transition-colors",
                        category === c
                          ? "border-primary/60 bg-primary/15 text-primary"
                          : "border-border bg-card text-text-muted hover:border-primary/30"
                      )}
                    >
                      {c}
                    </button>
                  ))}
                </div>

                {exerciseDb.length === 0 && (
                  <div className="flex items-center justify-center py-6 text-sm text-text-muted">
                    <span className="animate-pulse">Carregando exercícios…</span>
                  </div>
                )}
                <div className="max-h-[24rem] space-y-2.5 overflow-y-auto pr-1 sm:max-h-[34rem]">
                  {filteredLibrary.map((ex) => {
                    const isExpanded = expandedExId === ex.id;
                    return (
                      <div
                        key={ex.id}
                        className="rounded-xl border border-border bg-card-hover/30 p-3"
                      >
                        {/* GIF preview when expanded */}
                        {isExpanded && ex.gifUrl && (
                          <div className="mb-2.5 overflow-hidden rounded-lg bg-black/5">
                            <img
                              src={ex.gifUrl}
                              alt={ex.name}
                              className="mx-auto block max-h-40 object-contain"
                              onError={(e) => { (e.currentTarget as HTMLImageElement).parentElement!.style.display = "none"; }}
                            />
                          </div>
                        )}

                        <div className="flex items-start gap-2">
                          {/* Thumbnail — click to toggle GIF */}
                          {ex.imageUrl && !isExpanded && (
                            <button
                              title="Ver demonstração"
                              onClick={() => setExpandedExId(ex.id)}
                              className="mt-0.5 h-10 w-10 shrink-0 overflow-hidden rounded-lg border border-border bg-card"
                            >
                              <img
                                src={ex.imageUrl}
                                alt=""
                                className="h-full w-full object-cover"
                                onError={(e) => { (e.currentTarget as HTMLImageElement).parentElement!.style.display = "none"; }}
                              />
                            </button>
                          )}
                          {isExpanded && (
                            <button
                              title="Fechar"
                              onClick={() => setExpandedExId(null)}
                              className="mt-0.5 h-10 w-10 shrink-0 rounded-lg border border-primary/40 bg-primary/10 text-xs font-bold text-primary"
                            >
                              ✕
                            </button>
                          )}
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-semibold text-text">{ex.name}</p>
                            <p className="truncate text-[11px] text-text-muted">{ex.category}</p>
                          </div>
                          <Button
                            size="sm"
                            variant="secondary"
                            onClick={() => addExercise(ex)}
                            className="shrink-0"
                          >
                            <Plus className="h-3.5 w-3.5" /> Adicionar
                          </Button>
                        </div>

                        {isExpanded && ex.description && (
                          <p className="mt-2 text-[11px] leading-relaxed text-text-muted line-clamp-4">
                            {ex.description}
                          </p>
                        )}
                      </div>
                    );
                  })}
                  {exerciseDb.length > 0 && filteredLibrary.length === 0 && (
                    <div className="px-4 py-8 text-center text-sm text-text-muted">
                      Nenhum exercício encontrado.
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            <motion.div initial={false} animate={{ opacity: 1 }}>
              <Card>
                <CardContent className="space-y-3 p-5">
                  <div className="flex items-center justify-between text-xs text-text-muted">
                    <span>Sessões montadas</span>
                    <span className="font-semibold text-text">{sessions.length}</span>
                  </div>
                  <div className="flex items-center justify-between text-xs text-text-muted">
                    <span>Exercícios prescritos</span>
                    <span className="font-semibold text-text">{totalExercises}</span>
                  </div>
                  <label className="block">
                    <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-text-muted">
                      Semana de início (segunda-feira)
                    </span>
                    <input
                      type="date"
                      value={startDate}
                      onChange={(e) => { setStartDate(e.target.value); setSendError(""); }}
                      className="w-full rounded-xl border border-border bg-background px-3.5 py-2.5 text-sm text-text outline-none focus:border-primary/60 focus:ring-2 focus:ring-primary/20"
                    />
                  </label>
                  {sendError && (
                    <p className="text-xs text-danger">{sendError}</p>
                  )}
                  <Button onClick={submit} size="lg" className="w-full" disabled={!athlete || sending}>
                    <Send className="h-4 w-4" />
                    {sending ? "Enviando…" : `Enviar para ${athlete?.name.split(" ")[0] ?? "atleta"}`}
                  </Button>
                  <AnimatePresence mode="wait">
                    {savedAsTemplate ? (
                      <motion.div
                        key="saved-tpl"
                        initial={{ opacity: 0, y: 4 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -4 }}
                        className="flex items-center justify-center gap-1.5 text-xs text-success"
                      >
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        Template salvo!
                      </motion.div>
                    ) : (
                      <motion.button
                        key="save-tpl-btn"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={handleSaveAsTemplate}
                        className="flex w-full items-center justify-center gap-1.5 rounded-xl border border-border py-2 text-xs font-medium text-text-muted transition-colors hover:border-primary/40 hover:text-text"
                      >
                        <Bookmark className="h-3.5 w-3.5" />
                        Salvar como template
                      </motion.button>
                    )}
                  </AnimatePresence>
                </CardContent>
              </Card>
              {sent && (
                <motion.div
                  initial={{ opacity: 0, y: -6 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-3"
                >
                  <Card className="border-success/30 bg-success/5">
                    <CardContent className="flex items-center gap-2.5 p-3.5 text-sm text-text-muted">
                      <CheckCircle2 className="h-4 w-4 shrink-0 text-success" />
                      Treino prescrito para{" "}
                      <span className="font-semibold text-text">{athlete?.name ?? "atleta"}</span> — divisão{" "}
                      <span className="font-semibold text-text">{division}</span>.
                    </CardContent>
                  </Card>
                </motion.div>
              )}
            </motion.div>
          </div>
        </div>
      )}

      {/* Create Exercise Modal */}
      <AnimatePresence>
        {showCreateExercise && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
              onClick={() => setShowCreateExercise(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 12 }}
              transition={{ type: "spring", damping: 28, stiffness: 320 }}
              className="fixed inset-x-4 top-1/2 z-50 mx-auto max-w-md -translate-y-1/2 rounded-2xl border border-border bg-card p-6 shadow-2xl"
            >
              <div className="mb-5 flex items-center justify-between">
                <h2 className="font-display text-base font-bold text-text">Criar exercício</h2>
                <button
                  onClick={() => setShowCreateExercise(false)}
                  className="flex h-8 w-8 items-center justify-center rounded-lg text-text-muted transition-colors hover:bg-card-hover hover:text-text"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="space-y-4">
                <label className="block">
                  <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-text-muted">Nome do exercício *</span>
                  <input
                    value={newExName}
                    onChange={(e) => setNewExName(e.target.value)}
                    placeholder="Ex: Agachamento búlgaro"
                    className={inputClass}
                  />
                </label>

                <label className="block">
                  <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-text-muted">Categoria</span>
                  <select
                    value={newExCategory}
                    onChange={(e) => setNewExCategory(e.target.value)}
                    className={inputClass}
                  >
                    {["Hipertrofia", "Força", "Core", "Mobilidade", "Pliometria", "Prevenção", "Glúteos", "Panturrilhas", "Joelho", "Quadril", "Tornozelo"].map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </label>

                <label className="block">
                  <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-text-muted">Descrição (opcional)</span>
                  <textarea
                    value={newExDesc}
                    onChange={(e) => setNewExDesc(e.target.value)}
                    placeholder="Breve descrição do exercício e músculos trabalhados…"
                    rows={3}
                    className={inputClass + " resize-none"}
                  />
                </label>

                <label className="block">
                  <span className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-text-muted">
                    <Video className="h-3.5 w-3.5" />
                    Link de vídeo (YouTube, Vimeo…)
                  </span>
                  <div className="flex items-center gap-2 rounded-xl border border-border bg-background px-3.5 py-2.5">
                    <Link2 className="h-4 w-4 shrink-0 text-text-muted" />
                    <input
                      value={newExVideoUrl}
                      onChange={(e) => setNewExVideoUrl(e.target.value)}
                      placeholder="https://youtube.com/watch?v=…"
                      className="w-full bg-transparent text-sm text-text placeholder:text-text-muted/50 outline-none"
                    />
                  </div>
                </label>

                {createExError && (
                  <p className="text-xs text-danger">{createExError}</p>
                )}

                <Button
                  onClick={handleCreateExercise}
                  disabled={!newExName.trim() || creatingExercise}
                  className="w-full"
                >
                  {creatingExercise ? (
                    <><Loader2 className="h-4 w-4 animate-spin" /> Criando…</>
                  ) : (
                    <><Plus className="h-4 w-4" /> Criar exercício</>
                  )}
                </Button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
