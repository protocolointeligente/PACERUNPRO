"use client";

import { useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  BookOpen,
  CheckCircle2,
  Clock,
  GraduationCap,
  PlayCircle,
  Route,
} from "lucide-react";
import { getPaceCourses, type PaceCourse } from "@/lib/pace-university";
import { estimatePaceLessonMinutes, validatePaceLesson } from "@/lib/pace-university-content";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface PaceUniversityPageProps {
  audience: "athlete" | "coach";
}

function lessonKey(courseId: string, lessonTitle: string) {
  return `${courseId}:${lessonTitle}`;
}

function audienceCopy(audience: "athlete" | "coach") {
  if (audience === "coach") {
    return {
      title: "Trilhas para prescrever, analisar e vender melhor",
      subtitle:
        "Conteudo pratico para leitura de metricas, periodizacao multimodal, gestao da assessoria e tomada de decisao com dados reais.",
    };
  }

  return {
    title: "Trilhas para treinar melhor e entender seu plano",
    subtitle:
      "Aulas curtas para executar treinos, interpretar zonas, registrar feedback e transformar seus dados em evolucao consistente.",
  };
}

export function PaceUniversityPage({ audience }: PaceUniversityPageProps) {
  const courses = getPaceCourses(audience);
  const totalMinutes = courses.reduce((sum, course) => sum + course.durationMin, 0);
  const copy = audienceCopy(audience);
  const [selectedCourseId, setSelectedCourseId] = useState(courses[0]?.id ?? "");
  const [selectedLessonKey, setSelectedLessonKey] = useState("");
  const [completedLessonKeys, setCompletedLessonKeys] = useState<Set<string>>(() => new Set());
  const storageKey = `pace-university:${audience}:completed-lessons`;

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(storageKey);
      if (!raw) return;
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) setCompletedLessonKeys(new Set(parsed.filter((item) => typeof item === "string")));
    } catch {
      setCompletedLessonKeys(new Set());
    }
  }, [storageKey]);

  function persistCompleted(next: Set<string>) {
    setCompletedLessonKeys(next);
    try {
      window.localStorage.setItem(storageKey, JSON.stringify(Array.from(next)));
    } catch {
      // Local progress is a convenience; the course remains usable if storage is unavailable.
    }
  }

  const selectedCourse = useMemo(
    () => courses.find((course) => course.id === selectedCourseId) ?? courses[0],
    [courses, selectedCourseId]
  );
  const selectedCourseLessons = selectedCourse?.lessons ?? [];
  const resolvedLessonKey = selectedLessonKey || lessonKey(selectedCourse?.id ?? "", selectedCourseLessons[0]?.title ?? "");
  const selectedLesson =
    selectedCourseLessons.find((lesson) => lessonKey(selectedCourse?.id ?? "", lesson.title) === resolvedLessonKey) ??
    selectedCourseLessons[0];
  const selectedLessonIndex = selectedCourseLessons.findIndex((lesson) => lesson.title === selectedLesson?.title);
  const selectedLessonDone = selectedCourse && selectedLesson ? completedLessonKeys.has(lessonKey(selectedCourse.id, selectedLesson.title)) : false;
  const lessonQuality = selectedLesson ? validatePaceLesson(selectedLesson) : null;
  const selectedCourseDoneCount = selectedCourse ? selectedCourse.lessons.filter((lesson) =>
    completedLessonKeys.has(lessonKey(selectedCourse.id, lesson.title))
  ).length : 0;
  const totalDoneCount = courses.reduce(
    (sum, course) => sum + course.lessons.filter((lesson) => completedLessonKeys.has(lessonKey(course.id, lesson.title))).length,
    0
  );

  function toggleSelectedLesson() {
    if (!selectedLesson) return;
    const key = lessonKey(selectedCourse.id, selectedLesson.title);
    const next = new Set(completedLessonKeys);
    if (next.has(key)) next.delete(key);
    else next.add(key);
    persistCompleted(next);
  }

  function goToNextLesson() {
    if (!selectedCourse || !selectedLesson) return;
    const nextLesson = selectedCourse.lessons[selectedLessonIndex + 1];
    if (nextLesson) {
      setSelectedLessonKey(lessonKey(selectedCourse.id, nextLesson.title));
      return;
    }

    const courseIndex = courses.findIndex((course) => course.id === selectedCourse.id);
    const nextCourse = courses[courseIndex + 1] ?? courses[0];
    setSelectedCourseId(nextCourse.id);
    setSelectedLessonKey(lessonKey(nextCourse.id, nextCourse.lessons[0]?.title ?? ""));
  }

  if (!selectedCourse) {
    return (
      <div className="mx-auto max-w-5xl">
        <Card>
          <CardContent className="p-8 text-sm text-text-muted">
            Nenhuma trilha cadastrada para este perfil ainda.
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <Badge variant="primary" className="mb-3 gap-1.5">
            <GraduationCap className="h-3.5 w-3.5" />
            Pace University
          </Badge>
          <h1 className="font-display text-2xl font-bold text-text sm:text-3xl">{copy.title}</h1>
          <p className="mt-2 max-w-3xl text-sm leading-relaxed text-text-muted">{copy.subtitle}</p>
        </div>
        <div className="grid min-w-48 grid-cols-2 gap-2 rounded-2xl border border-border bg-card p-3 text-sm sm:grid-cols-3">
          <Metric value={String(courses.length)} label="trilhas" />
          <Metric value={`${Math.round(totalMinutes / 60)}h`} label="conteudo" />
          <Metric value={String(totalDoneCount)} label="aulas feitas" />
        </div>
      </div>

      {selectedLessonKey ? (
        <Button type="button" variant="outline" size="sm" onClick={() => setSelectedLessonKey("")} className="gap-2">
          <ArrowLeft className="h-4 w-4" />
          Voltar para as trilhas
        </Button>
      ) : null}

      <div className={cn("grid gap-4", selectedLessonKey ? "lg:grid-cols-1" : "lg:grid-cols-[0.9fr_1.4fr]")}>
        <div className={cn("space-y-3", selectedLessonKey && "hidden")}>
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-text-muted">
            <Route className="h-4 w-4" />
            Trilhas disponiveis
          </div>
          {courses.map((course) => (
            <CourseButton
              key={course.id}
              course={course}
              selected={course.id === selectedCourse.id}
              onSelect={() => {
                setSelectedCourseId(course.id);
                setSelectedLessonKey(lessonKey(course.id, course.lessons[0]?.title ?? ""));
              }}
              completedCount={course.lessons.filter((lesson) => completedLessonKeys.has(lessonKey(course.id, lesson.title))).length}
            />
          ))}
        </div>

        <Card className="overflow-hidden">
          <CardContent className="p-0">
            <div className="border-b border-border bg-card-hover/40 p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant="info">{selectedCourse.level}</Badge>
                    <span className="inline-flex items-center gap-1 text-xs text-text-muted">
                      <Clock className="h-3.5 w-3.5" />
                      {selectedCourse.durationMin} min
                    </span>
                    <span className="inline-flex items-center gap-1 text-xs text-text-muted">
                      <BookOpen className="h-3.5 w-3.5" />
                      {selectedCourse.lessons.length} aulas
                    </span>
                  </div>
                  <h2 className="mt-3 font-display text-2xl font-bold text-text">{selectedCourse.title}</h2>
                  <p className="mt-2 text-sm leading-relaxed text-text-muted">{selectedCourse.description}</p>
                  <p className="mt-3 text-xs font-semibold text-text-muted">
                    {selectedCourseDoneCount} de {selectedCourse.lessons.length} aulas estudadas nesta trilha
                  </p>
                </div>
                <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                  {(() => {
                    const SelectedIcon = selectedCourse.icon;
                    return <SelectedIcon className="h-5 w-5" />;
                  })()}
                </span>
              </div>
            </div>

            <div className="grid gap-0 lg:grid-cols-[0.9fr_1.1fr]">
              <div className={cn("border-b border-border lg:border-b-0 lg:border-r", selectedLessonKey && "hidden")}>
                {selectedCourse.lessons.map((lesson, index) => {
                  const key = lessonKey(selectedCourse.id, lesson.title);
                  const active = selectedLesson?.title === lesson.title;
                  const done = completedLessonKeys.has(key);
                  return (
                    <button
                      key={key}
                      type="button"
                      onClick={() => setSelectedLessonKey(key)}
                      className={cn(
                        "flex w-full items-start gap-3 border-b border-border px-4 py-3 text-left transition last:border-b-0 hover:bg-card-hover/50",
                        active && "bg-primary/10"
                      )}
                    >
                      <span className={cn(
                        "flex h-8 w-8 shrink-0 items-center justify-center rounded-xl text-xs font-bold",
                        active ? "bg-primary text-background" : "bg-card-hover text-text-muted"
                      )}>
                        {String(index + 1).padStart(2, "0")}
                      </span>
                      <span className="min-w-0">
                        <span className="flex items-center gap-2 text-sm font-semibold text-text">
                          {lesson.title}
                          {done ? <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-success" /> : null}
                        </span>
                        <span className="mt-1 block text-xs leading-relaxed text-text-muted">{lesson.objective}</span>
                      </span>
                    </button>
                  );
                })}
              </div>

              <div className={cn("space-y-4 p-5", selectedLessonKey && "lg:col-span-2 p-6 sm:p-8 lg:p-12")}>
                {selectedLesson ? (
                  <>
                    <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-text-muted">
                      <PlayCircle className="h-4 w-4" />
                      Aula aberta
                    </div>
                    <div>
                      <h3 className="font-display text-xl font-bold text-text">{selectedLesson.title}</h3>
                      <p className="mt-2 text-sm leading-relaxed text-text-muted">{selectedLesson.objective}</p>
                    </div>
                    {selectedLesson.content ? (
                      <div className="max-w-4xl text-base leading-8 text-text-muted">
                        <RichText text={selectedLesson.content} />
                      </div>
                    ) : (
                      <div className="rounded-2xl border border-warning/30 bg-warning/5 p-4">
                        <p className="font-semibold text-text">Conteúdo em revisão editorial</p>
                        <p className="mt-2 text-sm leading-relaxed text-text-muted">
                          Esta aula ainda não possui conteúdo completo publicado. O objetivo e a duração ficam visíveis,
                          mas a aula não deve ser considerada concluída como formação até a revisão editorial.
                        </p>
                      </div>
                    )}
                    {selectedLesson.example ? <Section title="Exemplo prático" text={selectedLesson.example} /> : null}
                    {selectedLesson.commonMistakes?.length ? (
                      <section className="rounded-2xl border border-warning/25 bg-warning/5 p-4">
                        <h4 className="font-semibold text-text">Erros comuns</h4>
                        <ul className="mt-2 list-disc space-y-1 pl-5 text-sm leading-relaxed text-text-muted">
                          {selectedLesson.commonMistakes.map((mistake) => <li key={mistake}>{mistake}</li>)}
                        </ul>
                      </section>
                    ) : null}
                    {selectedLesson.activity ? <Section title="Atividade" text={selectedLesson.activity} /> : null}
                    {selectedLesson.summary ? <Section title="Resumo" text={selectedLesson.summary} /> : null}
                    {selectedLesson.quiz?.length ? (
                      <section className="rounded-2xl border border-primary/25 bg-primary/5 p-4">
                        <h4 className="font-semibold text-text">Verificação de aprendizagem</h4>
                        {selectedLesson.quiz.map((question) => (
                          <div key={question.prompt} className="mt-3">
                            <p className="text-sm font-medium leading-relaxed text-text">{question.prompt}</p>
                            <ol className="mt-2 list-[upper-alpha] space-y-1 pl-5 text-sm text-text-muted">
                              {question.options.map((option) => <li key={option}>{option}</li>)}
                            </ol>
                            <p className="mt-2 text-xs leading-relaxed text-text-muted">Resposta esperada: alternativa A. {question.explanation}</p>
                          </div>
                        ))}
                      </section>
                    ) : null}
                    {selectedLesson.references?.length ? <Section title="Referências da aula" text={selectedLesson.references.join("\n")} /> : null}
                    {lessonQuality && !lessonQuality.valid ? (
                      <p className="text-xs text-warning">
                        Validação editorial: {lessonQuality.issues.join("; ")}. Estimativa atual: {estimatePaceLessonMinutes(selectedLesson)} min.
                      </p>
                    ) : null}
                    <div className="grid gap-2 sm:grid-cols-2">
                      <Info label="Duracao" value={`${selectedLesson.durationMin} min`} />
                      <Info label="Status" value={selectedLessonDone ? "Estudada" : "Disponivel"} />
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Button type="button" variant={selectedLessonDone ? "secondary" : "primary"} size="sm" onClick={toggleSelectedLesson} className="w-full sm:w-auto">
                        <CheckCircle2 className="h-4 w-4" />
                        {selectedLessonDone ? "Aula estudada" : "Marcar como estudada"}
                      </Button>
                      <Button type="button" variant="outline" size="sm" onClick={goToNextLesson} className="w-full sm:w-auto">
                        Proxima aula
                      </Button>
                    </div>
                  </>
                ) : null}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function CourseButton({
  course,
  selected,
  onSelect,
  completedCount,
}: {
  course: PaceCourse;
  selected: boolean;
  onSelect: () => void;
  completedCount: number;
}) {
  const Icon = course.icon;
  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn(
        "flex w-full items-start gap-3 rounded-2xl border border-border bg-card p-4 text-left transition hover:border-primary/35 hover:bg-card-hover",
        selected && "border-primary/45 bg-primary/10"
      )}
    >
      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary">
        <Icon className="h-5 w-5" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block font-semibold text-text">{course.title}</span>
        <span className="mt-1 line-clamp-2 block text-xs leading-relaxed text-text-muted">{course.description}</span>
        <span className="mt-3 flex flex-wrap gap-2 text-[11px] font-semibold text-text-muted">
          <span className="rounded-full border border-border px-2 py-0.5">{course.level}</span>
          <span className="rounded-full border border-border px-2 py-0.5">{course.lessons.length} aulas</span>
          <span className="rounded-full border border-border px-2 py-0.5">{completedCount}/{course.lessons.length} feitas</span>
        </span>
      </span>
    </button>
  );
}

function Metric({ value, label }: { value: string; label: string }) {
  return (
    <div className="rounded-xl border border-border bg-background/50 p-3">
      <p className="font-display text-2xl font-bold text-text">{value}</p>
      <p className="text-xs uppercase tracking-wide text-text-muted">{label}</p>
    </div>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-border bg-card-hover/40 p-3">
      <p className="text-xs uppercase tracking-wide text-text-muted">{label}</p>
      <p className="mt-1 font-semibold text-text">{value}</p>
    </div>
  );
}

function Section({ title, text }: { title: string; text: string }) {
  return (
    <section className="rounded-2xl border border-border bg-card-hover/30 p-4">
      <h4 className="font-semibold text-text">{title}</h4>
      <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-text-muted">{text}</p>
    </section>
  );
}

function RichText({ text }: { text: string }) {
  return (
    <div className="space-y-5">
      {text.split(/\n\n+/).map((block, index) => {
        const lines = block.split("\n");
        const heading = lines[0].match(/^##\s+(.+)/);
        if (heading) {
          return (
            <section key={`${heading[1]}-${index}`}>
              <h4 className="mb-2 font-display text-lg font-bold text-text">{heading[1]}</h4>
              <p className="whitespace-pre-line">{lines.slice(1).join("\n").trim()}</p>
            </section>
          );
        }
        return <p key={index} className="whitespace-pre-line">{block}</p>;
      })}
    </div>
  );
}
