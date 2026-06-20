"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  Bookmark,
  BookOpen,
  CheckCircle2,
  Dumbbell,
  LayoutTemplate,
  Pencil,
  Plus,
  Search,
  Send,
  Trash2,
  Users,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  athleteList,
  exerciseCategories,
  exerciseLibrary,
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

let uidCounter = 0;
function nextUid() {
  uidCounter += 1;
  return `pe-${uidCounter}`;
}

function buildSessions(division: string): SessionBlock[] {
  const labels = sessionLabelsByDivision[division] ?? ["Treino A"];
  return labels.map((label, i) => ({ id: `s-${division}-${i}`, label, exercises: [] }));
}

// ── Template card (self-contained state) ──────────────────────────────────

function TemplateCard({
  template,
  athletes,
  onLoad,
}: {
  template: WorkoutTemplate;
  athletes: AthleteListItem[];
  onLoad: (t: WorkoutTemplate) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [applied, setApplied] = useState(false);

  const totalExercises = template.sessions.reduce((acc, s) => acc + s.exercises.length, 0);

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
          {template.isCustom && (
            <Badge variant="primary" className="shrink-0">
              <Bookmark className="h-3 w-3" />
              Meu template
            </Badge>
          )}
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
                <div className="space-y-1">
                  {session.exercises.map((ex, i) => (
                    <div key={i} className="flex items-center gap-2 text-xs">
                      <span className="font-medium text-text min-w-0 flex-1 truncate">{ex.name}</span>
                      <span className="shrink-0 rounded bg-card px-1.5 py-0.5 text-text-muted">
                        {ex.sets}×{ex.reps}
                      </span>
                      <span className="shrink-0 text-text-muted">{ex.rest}</span>
                      <span className="shrink-0 rounded bg-primary/10 px-1.5 py-0.5 font-semibold text-primary">
                        {ex.rpe * 10}%
                      </span>
                    </div>
                  ))}
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
                        disabled={selectedIds.length === 0}
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
  const [activeTab, setActiveTab] = useState<"prescrever" | "templates">("prescrever");
  const [athleteId, setAthleteId] = useState(athleteList[0].id);
  const [division, setDivision] = useState(strengthDivisions[1]);
  const [sessions, setSessions] = useState<SessionBlock[]>(() =>
    buildSessions(strengthDivisions[1])
  );
  const [activeIndex, setActiveIndex] = useState(0);
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<string>("Todas");
  const [sent, setSent] = useState(false);
  const [savedAsTemplate, setSavedAsTemplate] = useState(false);
  const [customTemplates, setCustomTemplates] = useState<WorkoutTemplate[]>([]);
  const [showNewTemplate, setShowNewTemplate] = useState(false);
  const [newTplName, setNewTplName] = useState("");
  const [newTplDesc, setNewTplDesc] = useState("");
  const [newTplLevel, setNewTplLevel] = useState("Intermediário");
  const [newTplFocus, setNewTplFocus] = useState("Hipertrofia");

  function handleCreateTemplate() {
    if (!newTplName.trim()) return;
    const t: WorkoutTemplate = {
      id: `custom-${Date.now()}`,
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
      createdAt: new Date().toISOString(),
      isCustom: true,
    };
    setCustomTemplates((prev) => [t, ...prev]);
    setNewTplName("");
    setNewTplDesc("");
    setShowNewTemplate(false);
    setActiveTab("templates");
  }

  const skipDivisionEffect = useRef(false);

  const athlete = useMemo(
    () => athleteList.find((a) => a.id === athleteId) ?? athleteList[0],
    [athleteId]
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
    return exerciseLibrary.filter((ex) => {
      const matchesQuery =
        ex.name.toLowerCase().includes(query.toLowerCase()) ||
        ex.muscles.some((m) => m.toLowerCase().includes(query.toLowerCase()));
      const matchesCategory = category === "Todas" || ex.category === category;
      return matchesQuery && matchesCategory;
    });
  }, [query, category]);

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
      { id: `s-custom-${prev.length}`, label: `Treino ${prev.length + 1}`, exercises: [] },
    ]);
    setActiveIndex(sessions.length);
  }

  function submit() {
    setSent(true);
  }

  function handleSaveAsTemplate() {
    const totalExercises = sessions.reduce((acc, s) => acc + s.exercises.length, 0);
    if (totalExercises === 0) return;
    const t: WorkoutTemplate = {
      id: `custom-${Date.now()}`,
      name: `Template ${athlete.name} — ${division}`,
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
      createdAt: new Date().toISOString(),
      isCustom: true,
    };
    setCustomTemplates((prev) => [t, ...prev]);
    setSavedAsTemplate(true);
    setTimeout(() => setSavedAsTemplate(false), 2500);
  }

  function loadTemplate(template: WorkoutTemplate) {
    const matchDivision = strengthDivisions.includes(template.division)
      ? template.division
      : "Personalizada";

    const newSessions: SessionBlock[] = template.sessions.map((s, i) => ({
      id: `tpl-${template.id}-${i}`,
      label: s.label,
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
                  <Button size="sm" onClick={handleCreateTemplate} disabled={!newTplName.trim()} className="gap-1.5">
                    <Bookmark className="h-3.5 w-3.5" /> Salvar template
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => setShowNewTemplate(false)}>Cancelar</Button>
                </div>
              </CardContent>
            </Card>
          )}

          <div className="grid gap-4 sm:grid-cols-2">
            {[...customTemplates, ...workoutTemplates].map((tpl) => (
              <TemplateCard
                key={tpl.id}
                template={tpl}
                athletes={athleteList}
                onLoad={loadTemplate}
              />
            ))}
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
                  {athleteList.map((a) => (
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

                <div className="mb-4 flex flex-wrap gap-2">
                  {sessions.map((s, i) => (
                    <button
                      key={s.id}
                      onClick={() => setActiveIndex(i)}
                      className={cn(
                        "rounded-xl border px-3.5 py-1.5 text-xs font-semibold transition-colors",
                        activeIndex === i
                          ? "border-primary/60 bg-primary/15 text-primary"
                          : "border-border bg-card-hover/30 text-text-muted hover:border-primary/30"
                      )}
                    >
                      {s.label}{" "}
                      <span className="ml-1 text-[10px] font-normal text-text-muted">
                        ({s.exercises.length})
                      </span>
                    </button>
                  ))}
                </div>

                {activeSession && (
                  <div className="space-y-3">
                    <label className="block max-w-xs">
                      <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-text-muted">
                        Nome da sessão
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
                <h3 className="mb-3 flex items-center gap-2 font-display text-sm font-semibold text-text">
                  <Dumbbell className="h-4 w-4 text-primary" /> Biblioteca de exercícios
                </h3>
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

                <div className="max-h-[24rem] space-y-2.5 overflow-y-auto pr-1 sm:max-h-[34rem]">
                  {filteredLibrary.map((ex) => (
                    <div
                      key={ex.id}
                      className="rounded-xl border border-border bg-card-hover/30 p-3.5"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold text-text">{ex.name}</p>
                          <p className="truncate text-[11px] text-text-muted">
                            {ex.category} · {ex.muscles.slice(0, 2).join(", ")}
                          </p>
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
                      <p className="mt-1.5 text-[11px] text-text-muted">
                        {ex.sets}x {ex.reps} · descanso {ex.rest} · RPE {ex.rpe}
                      </p>
                    </div>
                  ))}
                  {filteredLibrary.length === 0 && (
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
                  <Button onClick={submit} size="lg" className="w-full">
                    <Send className="h-4 w-4" /> Enviar para{" "}
                    {athlete.name.split(" ")[0]}
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
                      <span className="font-semibold text-text">{athlete.name}</span> — divisão{" "}
                      <span className="font-semibold text-text">{division}</span>.
                    </CardContent>
                  </Card>
                </motion.div>
              )}
            </motion.div>
          </div>
        </div>
      )}
    </div>
  );
}
