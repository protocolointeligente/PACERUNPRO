"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft, Plus, Trash2, ChevronDown, ChevronRight,
  Video, FileText, Eye, EyeOff, Save, GripVertical,
} from "lucide-react";

interface Lesson {
  id: string;
  title: string;
  videoUrl?: string;
  content?: string;
  duration?: number;
  isPreview: boolean;
  position: number;
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
  published: boolean;
  courseModules: CourseModule[];
}

export default function CourseBuilderPage() {
  const { id } = useParams<{ id: string }>();
  const [course, setCourse] = useState<Course | null>(null);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [saving, setSaving] = useState(false);
  const [editingLesson, setEditingLesson] = useState<Lesson | null>(null);
  const [editingModule, setEditingModule] = useState<{ id: string; title: string } | null>(null);
  const [newModuleTitle, setNewModuleTitle] = useState("");
  const [showNewModule, setShowNewModule] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const res = await fetch(`/api/coach/courses/${id}/modules`);
    if (res.ok) setCourse(await res.json());
    setLoading(false);
  }, [id]);

  useEffect(() => { load(); }, [load]);

  async function addModule() {
    if (!newModuleTitle.trim()) return;
    setSaving(true);
    await fetch(`/api/coach/courses/${id}/modules`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: newModuleTitle }),
    });
    setNewModuleTitle("");
    setShowNewModule(false);
    load();
    setSaving(false);
  }

  async function deleteModule(moduleId: string) {
    if (!confirm("Remover este módulo e todas as aulas?")) return;
    await fetch(`/api/coach/courses/${id}/modules?moduleId=${moduleId}`, { method: "DELETE" });
    load();
  }

  async function deleteLesson(lessonId: string) {
    if (!confirm("Remover esta aula?")) return;
    await fetch(`/api/coach/courses/${id}/modules?lessonId=${lessonId}`, { method: "DELETE" });
    load();
  }

  async function saveLesson() {
    if (!editingLesson) return;
    setSaving(true);
    await fetch(`/api/coach/courses/${id}/modules`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ lessonId: editingLesson.id, ...editingLesson }),
    });
    setEditingLesson(null);
    load();
    setSaving(false);
  }

  async function saveModule() {
    if (!editingModule) return;
    await fetch(`/api/coach/courses/${id}/modules`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ moduleId: editingModule.id, title: editingModule.title }),
    });
    setEditingModule(null);
    load();
  }

  async function addLesson(moduleId: string) {
    await fetch(`/api/coach/courses/${id}/modules`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ moduleId, addLesson: true }),
    });
    // Actually, for adding a lesson we need a different approach — post to module endpoint
    // Use PATCH with a special field, or POST a new lesson via dedicated endpoint
    // For simplicity, let's POST a new module with lessons=[{title: "Nova aula"}]
    // Actually the modules route POST creates a module, not a lesson.
    // We need to update the lesson inline after creating it.
    // Let's do a module update that adds a lesson via Prisma nested create.
    // The PATCH endpoint only updates existing lessons — let's add a lesson via a sub-POST trick.
    // For now let's just reload and show that we need a POST to add lesson.
    // Better: call the module POST with just a lesson addition.
    // Actually looking at the code, we'd need a separate endpoint or to extend PATCH.
    // Let me create a quick workaround: PATCH with addLesson flag.
    load();
  }

  async function addLessonToModule(moduleId: string) {
    await fetch(`/api/coach/courses/${id}/modules`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        _action: "addLesson",
        moduleId,
        title: "Nova aula",
      }),
    });
    load();
  }

  if (loading) return <div className="p-8 text-center text-gray-400">Carregando…</div>;
  if (!course) return <div className="p-8 text-center text-red-500">Curso não encontrado</div>;

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/treinador/cursos" className="text-gray-400 hover:text-gray-700">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-xl font-bold text-gray-900">{course.title}</h1>
          <p className="text-xs text-gray-400">
            {course.courseModules.length} módulos ·{" "}
            {course.courseModules.reduce((s, m) => s + m.lessons.length, 0)} aulas
          </p>
        </div>
        <span className={`ml-auto text-xs px-2 py-0.5 rounded-full font-medium ${
          course.published ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"
        }`}>
          {course.published ? "Publicado" : "Rascunho"}
        </span>
      </div>

      {/* Modules */}
      <div className="space-y-3">
        {course.courseModules.map((mod, mi) => (
          <div key={mod.id} className="border border-gray-200 rounded-xl overflow-hidden bg-white">
            <div className="flex items-center gap-2 px-4 py-3 bg-gray-50">
              <GripVertical className="w-4 h-4 text-gray-300 flex-shrink-0" />
              <span className="text-xs font-mono text-gray-400 w-5">{mi + 1}</span>
              {editingModule?.id === mod.id ? (
                <input
                  autoFocus
                  value={editingModule.title}
                  onChange={(e) => setEditingModule({ ...editingModule, title: e.target.value })}
                  onBlur={saveModule}
                  onKeyDown={(e) => e.key === "Enter" && saveModule()}
                  className="flex-1 border-b border-indigo-300 bg-transparent text-sm font-semibold text-gray-900 focus:outline-none"
                />
              ) : (
                <button
                  className="flex-1 text-left text-sm font-semibold text-gray-900 hover:text-indigo-600"
                  onClick={() => setEditingModule({ id: mod.id, title: mod.title })}
                >
                  {mod.title}
                </button>
              )}
              <span className="text-xs text-gray-400">{mod.lessons.length} aulas</span>
              <button
                onClick={() => setExpanded((p) => ({ ...p, [mod.id]: !p[mod.id] }))}
                className="text-gray-400 hover:text-gray-700"
              >
                {expanded[mod.id] ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
              </button>
              <button onClick={() => deleteModule(mod.id)} className="text-red-400 hover:text-red-600">
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>

            {expanded[mod.id] && (
              <div className="divide-y divide-gray-100">
                {mod.lessons.map((lesson) => (
                  <div key={lesson.id} className="px-4 py-2.5 flex items-center gap-3">
                    <GripVertical className="w-3.5 h-3.5 text-gray-200 flex-shrink-0" />
                    {lesson.videoUrl ? (
                      <Video className="w-3.5 h-3.5 text-indigo-400 flex-shrink-0" />
                    ) : (
                      <FileText className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                    )}
                    <span className="flex-1 text-sm text-gray-800">{lesson.title}</span>
                    {lesson.isPreview && (
                      <span className="text-xs text-indigo-500 font-medium">Preview</span>
                    )}
                    {lesson.duration && (
                      <span className="text-xs text-gray-400">{lesson.duration}min</span>
                    )}
                    <button
                      onClick={() => setEditingLesson(lesson)}
                      className="text-xs text-indigo-600 hover:underline"
                    >
                      Editar
                    </button>
                    <button onClick={() => deleteLesson(lesson.id)} className="text-red-400 hover:text-red-600">
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                ))}
                <div className="px-4 py-2">
                  <button
                    onClick={() => addLessonToModule(mod.id)}
                    className="flex items-center gap-1 text-xs text-indigo-600 hover:text-indigo-800"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Adicionar aula
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}

        {showNewModule ? (
          <div className="border border-dashed border-indigo-300 rounded-xl p-4 flex gap-2">
            <input
              autoFocus
              placeholder="Nome do módulo"
              value={newModuleTitle}
              onChange={(e) => setNewModuleTitle(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && addModule()}
              className="flex-1 border-b border-indigo-300 bg-transparent text-sm focus:outline-none"
            />
            <button
              onClick={addModule}
              disabled={saving}
              className="px-3 py-1 bg-indigo-600 text-white text-xs rounded-lg hover:bg-indigo-700 disabled:opacity-50"
            >
              {saving ? "…" : "Adicionar"}
            </button>
            <button onClick={() => setShowNewModule(false)} className="text-gray-400 hover:text-gray-700 text-xs">
              Cancelar
            </button>
          </div>
        ) : (
          <button
            onClick={() => setShowNewModule(true)}
            className="w-full border-2 border-dashed border-gray-200 rounded-xl py-4 flex items-center justify-center gap-2 text-sm text-gray-400 hover:border-indigo-300 hover:text-indigo-500"
          >
            <Plus className="w-4 h-4" />
            Novo módulo
          </button>
        )}
      </div>

      {/* Edit Lesson Modal */}
      {editingLesson && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-lg space-y-4">
            <h2 className="text-lg font-semibold">Editar Aula</h2>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Título</label>
              <input
                value={editingLesson.title}
                onChange={(e) => setEditingLesson({ ...editingLesson, title: e.target.value })}
                className="w-full border rounded-lg px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">URL do vídeo</label>
              <input
                value={editingLesson.videoUrl ?? ""}
                onChange={(e) => setEditingLesson({ ...editingLesson, videoUrl: e.target.value })}
                placeholder="https://vimeo.com/..."
                className="w-full border rounded-lg px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Duração (minutos)</label>
              <input
                type="number"
                min={0}
                value={editingLesson.duration ?? ""}
                onChange={(e) => setEditingLesson({ ...editingLesson, duration: e.target.value ? Number(e.target.value) : undefined })}
                className="w-full border rounded-lg px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Conteúdo / descrição</label>
              <textarea
                rows={4}
                value={editingLesson.content ?? ""}
                onChange={(e) => setEditingLesson({ ...editingLesson, content: e.target.value })}
                className="w-full border rounded-lg px-3 py-2 text-sm"
              />
            </div>
            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <input
                type="checkbox"
                checked={editingLesson.isPreview}
                onChange={(e) => setEditingLesson({ ...editingLesson, isPreview: e.target.checked })}
                className="rounded text-indigo-600"
              />
              Aula de preview (visível sem compra)
            </label>
            <div className="flex gap-3 justify-end pt-2">
              <button
                onClick={() => setEditingLesson(null)}
                className="px-4 py-2 border rounded-lg text-sm text-gray-700 hover:bg-gray-50"
              >
                Cancelar
              </button>
              <button
                onClick={saveLesson}
                disabled={saving}
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 disabled:opacity-50 flex items-center gap-1"
              >
                <Save className="w-3.5 h-3.5" />
                {saving ? "Salvando…" : "Salvar"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
