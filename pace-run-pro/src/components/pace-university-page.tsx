import { BookOpen, Clock, GraduationCap } from "lucide-react";
import { getPaceCourses } from "@/lib/pace-university";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";

interface PaceUniversityPageProps {
  audience: "athlete" | "coach";
}

export function PaceUniversityPage({ audience }: PaceUniversityPageProps) {
  const courses = getPaceCourses(audience);
  const totalMinutes = courses.reduce((sum, course) => sum + course.durationMin, 0);

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
          return (
            <Card key={course.id} className="overflow-hidden">
              <CardContent className="p-5">
                <div className="flex items-start gap-4">
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
                </div>

                <div className="mt-5 divide-y divide-border rounded-2xl border border-border bg-background/50">
                  {course.lessons.map((lesson, index) => (
                    <div key={lesson.title} className="grid gap-2 p-3 sm:grid-cols-[36px_1fr_64px] sm:items-center">
                      <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-card text-xs font-bold text-text-muted">
                        {String(index + 1).padStart(2, "0")}
                      </span>
                      <div>
                        <p className="text-sm font-semibold text-text">{lesson.title}</p>
                        <p className="text-xs leading-relaxed text-text-muted">{lesson.objective}</p>
                      </div>
                      <span className="text-xs font-semibold text-text-muted sm:text-right">{lesson.durationMin} min</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
