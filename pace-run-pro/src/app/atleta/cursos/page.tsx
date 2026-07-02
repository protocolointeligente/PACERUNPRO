"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { BookOpen, Play, CheckCircle, ChevronRight } from "lucide-react";

interface Course {
  id: string;
  title: string;
  description: string;
  coverUrl?: string;
  totalLessons: number;
  completedLessons: number;
  progressPct: number;
  coach?: { user: { name: string; avatarUrl?: string } };
}

export default function AtletaCursosPage() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const res = await fetch("/api/atleta/courses");
    if (res.ok) setCourses(await res.json());
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <BookOpen className="w-6 h-6 text-indigo-600" />
          Meus Cursos
        </h1>
        <p className="text-sm text-gray-500 mt-1">Acesse o conteúdo dos cursos que você adquiriu</p>
      </div>

      {loading ? (
        <div className="text-center py-12 text-gray-400">Carregando…</div>
      ) : courses.length === 0 ? (
        <div className="text-center py-16 bg-gray-50 rounded-xl border-2 border-dashed border-gray-200">
          <BookOpen className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500 font-medium">Você ainda não tem cursos</p>
          <p className="text-sm text-gray-400 mt-1">Adquira cursos no marketplace do seu treinador</p>
          <Link
            href="/loja"
            className="mt-4 inline-block px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700"
          >
            Explorar cursos
          </Link>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {courses.map((c) => (
            <Link
              key={c.id}
              href={`/atleta/cursos/${c.id}`}
              className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden hover:shadow-md transition-shadow group"
            >
              <div className="h-36 bg-gradient-to-br from-indigo-100 to-indigo-200 flex items-center justify-center relative">
                {c.coverUrl ? (
                  <img src={c.coverUrl} alt={c.title} className="w-full h-full object-cover" />
                ) : (
                  <BookOpen className="w-12 h-12 text-indigo-300" />
                )}
                {c.progressPct === 100 && (
                  <div className="absolute top-2 right-2 bg-green-500 text-white text-xs px-2 py-0.5 rounded-full font-medium flex items-center gap-1">
                    <CheckCircle className="w-3 h-3" />
                    Concluído
                  </div>
                )}
              </div>
              <div className="p-4">
                <h3 className="font-semibold text-gray-900 group-hover:text-indigo-600 transition-colors">{c.title}</h3>
                <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{c.description}</p>
                {c.coach && (
                  <p className="text-xs text-gray-400 mt-1">por {c.coach.user.name}</p>
                )}

                <div className="mt-3">
                  <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
                    <span>{c.completedLessons}/{c.totalLessons} aulas</span>
                    <span className="font-medium text-indigo-600">{c.progressPct}%</span>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-1.5">
                    <div
                      className="bg-indigo-500 h-1.5 rounded-full transition-all"
                      style={{ width: `${c.progressPct}%` }}
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between mt-3">
                  <span className="text-xs text-gray-500">
                    {c.progressPct === 0 ? "Iniciar curso" : c.progressPct === 100 ? "Rever curso" : "Continuar"}
                  </span>
                  <div className="flex items-center gap-1 text-indigo-600">
                    <Play className="w-3.5 h-3.5" />
                    <ChevronRight className="w-3.5 h-3.5" />
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
