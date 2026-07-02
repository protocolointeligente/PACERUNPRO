"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { BookOpen, Plus, Eye, EyeOff, Layers, Video } from "lucide-react";

interface Course {
  id: string;
  title: string;
  description: string;
  priceCents: number;
  isPublished: boolean;
  totalModules: number;
  totalLessons: number;
  coverUrl?: string;
  createdAt: string;
}

export default function CoachCoursesPage() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ title: "", description: "", priceCents: 0 });
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const res = await fetch("/api/coach/courses");
    if (res.ok) setCourses(await res.json());
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    // First create a MarketplaceProduct of type CURSO
    const res = await fetch("/api/coach/marketplace/products", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, type: "CURSO" }),
    });
    if (res.ok) {
      setShowForm(false);
      setForm({ title: "", description: "", priceCents: 0 });
      load();
    }
    setSaving(false);
  }

  async function togglePublish(id: string, current: boolean) {
    await fetch("/api/coach/marketplace/products", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, isPublished: !current }),
    });
    load();
  }

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <BookOpen className="w-6 h-6 text-indigo-600" />
            Meus Cursos
          </h1>
          <p className="text-sm text-gray-500 mt-1">Crie e gerencie seus cursos online</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 text-sm font-medium"
        >
          <Plus className="w-4 h-4" />
          Novo Curso
        </button>
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <form
            onSubmit={handleCreate}
            className="bg-white rounded-xl shadow-xl p-6 w-full max-w-md space-y-4"
          >
            <h2 className="text-lg font-semibold">Novo Curso</h2>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Título</label>
              <input
                required
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Descrição</label>
              <textarea
                rows={3}
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Preço (centavos)</label>
              <input
                type="number"
                min={0}
                value={form.priceCents}
                onChange={(e) => setForm({ ...form, priceCents: Number(e.target.value) })}
                className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-indigo-500 focus:border-indigo-500"
              />
              <p className="text-xs text-gray-400 mt-1">
                R$ {(form.priceCents / 100).toFixed(2)}
              </p>
            </div>
            <div className="flex gap-3 justify-end">
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="px-4 py-2 border rounded-lg text-sm text-gray-700 hover:bg-gray-50"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={saving}
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 disabled:opacity-50"
              >
                {saving ? "Criando…" : "Criar Curso"}
              </button>
            </div>
          </form>
        </div>
      )}

      {loading ? (
        <div className="text-center py-12 text-gray-400">Carregando…</div>
      ) : courses.length === 0 ? (
        <div className="text-center py-16 bg-gray-50 rounded-xl border-2 border-dashed border-gray-200">
          <BookOpen className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500 font-medium">Nenhum curso criado ainda</p>
          <p className="text-sm text-gray-400 mt-1">Crie seu primeiro curso e comece a monetizar seu conhecimento</p>
          <button
            onClick={() => setShowForm(true)}
            className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700"
          >
            Criar Primeiro Curso
          </button>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {courses.map((c) => (
            <div key={c.id} className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 flex flex-col gap-3">
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-gray-900 truncate">{c.title}</h3>
                  <p className="text-xs text-gray-400 mt-0.5 line-clamp-2">{c.description}</p>
                </div>
                <span
                  className={`ml-2 text-xs px-2 py-0.5 rounded-full font-medium ${
                    c.isPublished ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"
                  }`}
                >
                  {c.isPublished ? "Publicado" : "Rascunho"}
                </span>
              </div>

              <div className="flex gap-4 text-xs text-gray-500">
                <span className="flex items-center gap-1">
                  <Layers className="w-3.5 h-3.5" />
                  {c.totalModules} módulos
                </span>
                <span className="flex items-center gap-1">
                  <Video className="w-3.5 h-3.5" />
                  {c.totalLessons} aulas
                </span>
                <span className="ml-auto font-semibold text-gray-900">
                  {c.priceCents === 0 ? "Gratuito" : `R$ ${(c.priceCents / 100).toFixed(2)}`}
                </span>
              </div>

              <div className="flex gap-2 pt-1 border-t border-gray-100">
                <Link
                  href={`/treinador/cursos/${c.id}`}
                  className="flex-1 text-center text-xs font-medium py-1.5 border border-indigo-200 text-indigo-600 rounded-lg hover:bg-indigo-50"
                >
                  Editar conteúdo
                </Link>
                <button
                  onClick={() => togglePublish(c.id, c.isPublished)}
                  className="flex items-center gap-1 text-xs font-medium py-1.5 px-3 border rounded-lg hover:bg-gray-50 text-gray-600"
                >
                  {c.isPublished ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  {c.isPublished ? "Ocultar" : "Publicar"}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
