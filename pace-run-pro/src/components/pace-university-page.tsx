"use client";

import { useMemo, useState } from "react";
import { BookOpen, CheckCircle2, ChevronDown, Clock, GraduationCap, PlayCircle } from "lucide-react";
import { getPaceCourses } from "@/lib/pace-university";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface PaceUniversityPageProps {
  audience: "athlete" | "coach";
}

export function PaceUniversityPage({ audience }: PaceUniversityPageProps) {
  const courses = getPaceCourses(audience);
  const totalMinutes = courses.reduce((sum, course) => sum + course.durationMin, 0);
  const [openCourseId, setOpenCourseId] = useState(courses[0]?.id ?? "");
  const [openLessonKey, setOpenLessonKey] = useState("");

  const openCourse = useMemo(
    () => courses.find((course) => course.id === openCourseId) ?? courses[0],
    [courses, openCourseId]
  );

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <Badge variant="primary" className="mb-3 gap-1.5">
            <GraduationCap className="h-3.5 w-3.5" />
            Pace University
          </Badge>
          <h1 className="font-display text-2xl font-bold text-text sm:text-3xl">
            Trilhas praticas de performance
          </h1>
          <p className="mt-2 max-w-2xl text-sm text-text-muted">
            Conteudo operacional para executar melhor os treinos, interpretar metricas e transformar feedback em decisao de treinamento.
          </p>
        </div>
        <div className="rounded-2xl border border-border bg-card px-4 py-3 text-sm text-text-muted">
          <span className="font-semibold text-text">{courses.length}</span> cursos · <span className="font-semibold text-text">{Math.round(totalMinutes / 60)}h</span> de conteudo inicial
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {courses.map((course) => {
          const Icon = course.icon;
          const isOpen = openCourse?.id === course.id;
          return (
            <Card
              key={course.id}
              className={cn(
                "overflow-hidden transition hover:border-primary/35 hover:bg-card-hover",
                isOpen && "border-primary/45 bg-primary/5"
              )}
            >
              <CardContent className="p-5">
                <button
                  type="button"
                  onClick={() => {
                    setOpenCourseId((current) => (current === course.id ? "" : course.id));
                    setOpenLessonKey("");
                  }}
                  className="flex w-full items-start gap-4 text-left"
                >
                  <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                    <Icon className="h-5 w-5" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="font-display text-lg font-bold text-text">{course.title}</h2>
                      <span className="rounded-full border border-border px-2 py-0.5 text-[11px] font-semibold text-text-muted">
                        {course.level}
                      </span>
                    </div>
                    <p className="mt-1 text-sm leading-relaxed text-text-muted">{course.description}</p>
                    <div className="mt-3 flex flex-wrap gap-2 text-xs text-text-muted">
                      <span className="inline-flex items-center gap-1 rounded-lg border border-border bg-card-hover/40 px-2 py-1">
                        <Clock className="h-3.5 w-3.5" />
                        {course.durationMin} min
                      </span>
                      <span className="inline-flex items-center gap-1 rounded-lg border border-border bg-card-hover/40 px-2 py-1">
                        <BookOpen className="h-3.5 w-3.5" />
                        {course.lessons.length} aulas
                      </span>
                    </div>
                  </div>
                  <ChevronDown className={cn("mt-3 h-5 w-5 shrink-0 text-text-muted transition", isOpen && "rotate-180 text-primary")} />
                </button>

                {isOpen ? (
                  <div className="mt-5 divide-y divide-border rounded-2xl border border-border bg-background/50">
                    {course.lessons.map((lesson, index) => {
                      const lessonKey = `${course.id}:${lesson.title}`;
                      const lessonOpen = openLessonKey === lessonKey;
                      return (
                        <button
                          key={lesson.title}
                          type="button"
                          onClick={() => setOpenLessonKey((current) => current === lessonKey ? "" : lessonKey)}
                          className="block w-full p-3 text-left transition hover:bg-card-hover/60"
                        >
                          <div className="grid gap-2 sm:grid-cols-[36px_1fr_72px] sm:items-center">
                            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-card text-xs font-bold text-text-muted">
                              {String(index + 1).padStart(2, "0")}
                            </span>
                            <div>
                              <p className="text-sm font-semibold text-text">{lesson.title}</p>
                              <p className="text-xs leading-relaxed text-text-muted">{lesson.objective}</p>
                            </div>
                            <span className="inline-flex items-center gap-1 text-xs font-semibold text-text-muted sm:justify-end">
                              <PlayCircle className="h-3.5 w-3.5" />
                              {lesson.durationMin} min
                            </span>
                          </div>
                          {lessonOpen ? (
                            <div className="mt-3 rounded-xl border border-primary/25 bg-primary/5 p-3 text-xs leading-6 text-text-muted sm:ml-11">
                              <p className="font-semibold text-text">Como aplicar agora</p>
                              <p className="mt-1">
                                Use esta aula como checklist rapido antes ou depois do treino. Leia o objetivo, compare com o treino prescrito e registre um feedback curto para orientar a proxima decisao.
                              </p>
                              <div className="mt-3 flex items-center gap-2 text-primary">
                                <CheckCircle2 className="h-4 w-4" />
                                <span className="font-semibold">Aula aberta</span>
                              </div>
                            </div>
                          ) : null}
                        </button>
                      );
                    })}
                  </div>
                ) : null}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
