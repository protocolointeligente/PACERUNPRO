"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Play, CheckCircle, ChevronDown, ChevronRight, FileText } from "lucide-react";

interface Lesson {
  id: string;
  title: string;
  videoUrl?: string;
  content?: string;
  duration?: number;
  isPreview: boolean;
  position: number;
  progress: { id: string; completedAt: string }[];
}

interface CourseModule {
  id: string;
  title: string;
  position: number;
  lessons: Lesson[];
}

interface Course {
  id: string;
  title: string;
  description: string;
  coverUrl?: string;
  totalLessons: number;
  completedLessons: number;
  progressPct: number;
  courseModules: CourseModule[];
  coach?: { user: { name: string; avatarUrl?: string } };
}

export default function CoursePlayerPage() {
  const { id } = useParams<{ id: string }>();
  const [course, setCourse] = useState<Course | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeLesson, setActiveLesson] = useState<Lesson | null>(null);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [marking, setMarking] = useState(false);

  const load = useCallback(async () => {
    const res = await fetch(`/api/atleta/courses?courseId=${id}`);
    if (res.ok) {
      const data = await res.json();
      setCourse(data);
      // Auto-expand first incomplete module, select first incomplete lesson
      const firstMod = data.courseModules?.[0];
      if (firstMod) {
        setExpanded({ [firstMod.id]: true });
        const firstIncomplete = firstMod.lessons.find((l: Lesson) => l.progress.length === 0);
        setActiveLesson(firstIncomplete ?? firstMod.lessons[0] ?? null);
      }
    }
    setLoading(false);
  }, [id]);

  useEffect(() => { load(); }, [load]);

  async function toggleComplete(lesson: Lesson) {
    setMarking(true);
    const isCompleted = lesson.progress.length > 0;
    await fetch("/api/atleta/courses", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ lessonId: lesson.id, completed: !isCompleted }),
    });
    load();
    setMarking(false);
  }

  if (loading) return <div className="p-8 text-center text-gray-400">Carregando…</div>;
  if (!course) return <div className="p-8 text-center text-red-500">Curso não encontrado ou acesso negado.</div>;

  const totalLessons = course.totalLessons;
  const completed = course.completedLessons;

  return (
    <div className="flex h-[calc(100vh-4rem)] overflow-hidden">
      {/* Sidebar */}
      <aside className="w-72 flex-shrink-0 border-r border-gray-200 bg-gray-50 overflow-y-auto flex flex-col">
        <div className="p-4 border-b border-gray-200">
          <Link href="/atleta/cursos" className="flex items-center gap-1 text-xs text-gray-500 hover:text-gray-800 mb-3">
            <ArrowLeft className="w-3.5 h-3.5" />
            Voltar
          </Link>
          <h2 className="font-semibold text-gray-900 text-sm leading-snug">{course.title}</h2>
          {course.coach && (
            <p className="text-xs text-gray-500 mt-0.5">por {course.coach.user.name}</p>
          )}
          <div className="mt-3">
            <div className="flex justify-between text-xs text-gray-500 mb-1">
              <span>{completed}/{totalLessons} aulas</span>
              <span className="text-indigo-600 font-medium">{course.progressPct}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-1.5">
              <div className="bg-indigo-500 h-1.5 rounded-full" style={{ width: `${course.progressPct}%` }} />
            </div>
          </div>
        </div>

        <div className="flex-1">
          {course.courseModules.map((mod, mi) => (
            <div key={mod.id}>
              <button
                onClick={() => setExpanded((p) => ({ ...p, [mod.id]: !p[mod.id] }))}
                className="w-full flex items-center gap-2 px-4 py-3 text-left bg-white border-b border-gray-100 hover:bg-gray-50"
              >
                {expanded[mod.id] ? <ChevronDown className="w-3.5 h-3.5 text-gray-400" /> : <ChevronRight className="w-3.5 h-3.5 text-gray-400" />}
                <span className="text-xs font-semibold text-gray-700 flex-1">
                  {mi + 1}. {mod.title}
                </span>
                <span className="text-xs text-gray-400">
                  {mod.lessons.filter((l) => l.progress.length > 0).length}/{mod.lessons.length}
                </span>
              </button>
              {expanded[mod.id] && mod.lessons.map((lesson) => {
                const isDone = lesson.progress.length > 0;
                const isActive = activeLesson?.id === lesson.id;
                return (
                  <button
                    key={lesson.id}
                    onClick={() => setActiveLesson(lesson)}
                    className={`w-full flex items-center gap-2 px-5 py-2.5 text-left border-b border-gray-100 text-xs ${
                      isActive ? "bg-indigo-50 text-indigo-700" : "text-gray-600 hover:bg-gray-50"
                    }`}
                  >
                    {isDone ? (
                      <CheckCircle className="w-3.5 h-3.5 text-green-500 flex-shrink-0" />
                    ) : lesson.videoUrl ? (
                      <Play className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                    ) : (
                      <FileText className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                    )}
                    <span className="flex-1 leading-snug">{lesson.title}</span>
                    {lesson.duration && (
                      <span className="text-gray-400 flex-shrink-0">{lesson.duration}m</span>
                    )}
                  </button>
                );
              })}
            </div>
          ))}
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-y-auto bg-white">
        {!activeLesson ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-400">
            <Play className="w-12 h-12 mb-3" />
            <p>Selecione uma aula para começar</p>
          </div>
        ) : (
          <div className="max-w-3xl mx-auto p-8">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">{activeLesson.title}</h1>
            {activeLesson.duration && (
              <p className="text-sm text-gray-400 mb-4">{activeLesson.duration} minutos</p>
            )}

            {activeLesson.videoUrl && (
              <div className="aspect-video bg-black rounded-xl overflow-hidden mb-6">
                <iframe
                  src={activeLesson.videoUrl}
                  className="w-full h-full"
                  allowFullScreen
                  allow="autoplay; fullscreen; picture-in-picture"
                />
              </div>
            )}

            {activeLesson.content && (
              <div className="prose prose-sm max-w-none text-gray-700 mb-8">
                <p className="whitespace-pre-wrap">{activeLesson.content}</p>
              </div>
            )}

            <div className="flex items-center gap-4 pt-4 border-t border-gray-100">
              <button
                onClick={() => toggleComplete(activeLesson)}
                disabled={marking}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  activeLesson.progress.length > 0
                    ? "bg-green-100 text-green-700 hover:bg-green-200"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                } disabled:opacity-50`}
              >
                <CheckCircle className="w-4 h-4" />
                {activeLesson.progress.length > 0 ? "Concluída" : "Marcar como concluída"}
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
