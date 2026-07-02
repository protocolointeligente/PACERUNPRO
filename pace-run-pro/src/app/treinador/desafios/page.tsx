"use client";

import { useState, useEffect, useCallback } from "react";
import { Trophy, Plus, Users, Target, Trash2, Edit2 } from "lucide-react";

interface Challenge {
  id: string;
  title: string;
  description: string;
  type: string;
  targetValue?: number;
  targetUnit?: string;
  sport: string;
  startDate: string;
  endDate: string;
  isPublic: boolean;
  participantCount: number;
  completedCount: number;
}

const emptyForm = {
  title: "",
  description: "",
  type: "DISTANCIA",
  targetValue: "",
  targetUnit: "km",
  sport: "CORRIDA",
  startDate: "",
  endDate: "",
  isPublic: true,
};

const TYPES: Record<string, string> = {
  DISTANCIA: "Distância",
  TEMPO: "Tempo",
  FREQUENCIA: "Frequência",
  PACE: "Pace",
  OUTRO: "Outro",
};

const SPORTS: Record<string, string> = {
  CORRIDA: "Corrida",
  CICLISMO: "Ciclismo",
  NATACAO: "Natação",
  TRIATHLON: "Triathlon",
  OUTRO: "Outro",
};

export default function DesafiosCoachPage() {
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const res = await fetch("/api/coach/challenges");
    if (res.ok) setChallenges(await res.json());
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  function openEdit(c: Challenge) {
    setEditId(c.id);
    setForm({
      title: c.title,
      description: c.description,
      type: c.type,
      targetValue: c.targetValue?.toString() ?? "",
      targetUnit: c.targetUnit ?? "km",
      sport: c.sport,
      startDate: c.startDate.slice(0, 10),
      endDate: c.endDate.slice(0, 10),
      isPublic: c.isPublic,
    });
    setShowForm(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    const payload = {
      ...form,
      targetValue: form.targetValue ? Number(form.targetValue) : null,
    };
    if (editId) {
      await fetch("/api/coach/challenges", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: editId, ...payload }),
      });
    } else {
      await fetch("/api/coach/challenges", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
    }
    setShowForm(false);
    setEditId(null);
    setForm(emptyForm);
    load();
    setSaving(false);
  }

  async function handleDelete(id: string) {
    if (!confirm("Remover este desafio?")) return;
    await fetch(`/api/coach/challenges?id=${id}`, { method: "DELETE" });
    load();
  }

  const now = new Date();

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Trophy className="w-6 h-6 text-yellow-500" />
            Desafios
          </h1>
          <p className="text-sm text-gray-500 mt-1">Crie desafios para engajar e motivar seus atletas</p>
        </div>
        <button
          onClick={() => { setEditId(null); setForm(emptyForm); setShowForm(true); }}
          className="flex items-center gap-2 px-4 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 text-sm font-medium"
        >
          <Plus className="w-4 h-4" />
          Novo Desafio
        </button>
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <form
            onSubmit={handleSubmit}
            className="bg-white rounded-xl shadow-xl p-6 w-full max-w-lg space-y-4 max-h-[90vh] overflow-y-auto"
          >
            <h2 className="text-lg font-semibold">{editId ? "Editar" : "Novo"} Desafio</h2>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Título *</label>
              <input
                required
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                className="w-full border rounded-lg px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Descrição</label>
              <textarea
                rows={2}
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                className="w-full border rounded-lg px-3 py-2 text-sm"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Tipo</label>
                <select
                  value={form.type}
                  onChange={(e) => setForm({ ...form, type: e.target.value })}
                  className="w-full border rounded-lg px-3 py-2 text-sm"
                >
                  {Object.entries(TYPES).map(([k, v]) => (
                    <option key={k} value={k}>{v}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Esporte</label>
                <select
                  value={form.sport}
                  onChange={(e) => setForm({ ...form, sport: e.target.value })}
                  className="w-full border rounded-lg px-3 py-2 text-sm"
                >
                  {Object.entries(SPORTS).map(([k, v]) => (
                    <option key={k} value={k}>{v}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Meta</label>
                <input
                  type="number"
                  min={0}
                  value={form.targetValue}
                  onChange={(e) => setForm({ ...form, targetValue: e.target.value })}
                  placeholder="Ex: 100"
                  className="w-full border rounded-lg px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Unidade</label>
                <input
                  value={form.targetUnit}
                  onChange={(e) => setForm({ ...form, targetUnit: e.target.value })}
                  placeholder="km, min, treinos…"
                  className="w-full border rounded-lg px-3 py-2 text-sm"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Início *</label>
                <input
                  required
                  type="date"
                  value={form.startDate}
                  onChange={(e) => setForm({ ...form, startDate: e.target.value })}
                  className="w-full border rounded-lg px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Fim *</label>
                <input
                  required
                  type="date"
                  value={form.endDate}
                  onChange={(e) => setForm({ ...form, endDate: e.target.value })}
                  className="w-full border rounded-lg px-3 py-2 text-sm"
                />
              </div>
            </div>
            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <input
                type="checkbox"
                checked={form.isPublic}
                onChange={(e) => setForm({ ...form, isPublic: e.target.checked })}
                className="rounded"
              />
              Público (visível para todos os atletas)
            </label>
            <div className="flex gap-3 justify-end pt-2">
              <button
                type="button"
                onClick={() => { setShowForm(false); setEditId(null); }}
                className="px-4 py-2 border rounded-lg text-sm text-gray-700 hover:bg-gray-50"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={saving}
                className="px-4 py-2 bg-yellow-500 text-white rounded-lg text-sm font-medium hover:bg-yellow-600 disabled:opacity-50"
              >
                {saving ? "Salvando…" : editId ? "Salvar" : "Criar Desafio"}
              </button>
            </div>
          </form>
        </div>
      )}

      {loading ? (
        <div className="text-center py-12 text-gray-400">Carregando…</div>
      ) : challenges.length === 0 ? (
        <div className="text-center py-16 bg-gray-50 rounded-xl border-2 border-dashed border-gray-200">
          <Trophy className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500 font-medium">Nenhum desafio criado</p>
          <button
            onClick={() => setShowForm(true)}
            className="mt-4 px-4 py-2 bg-yellow-500 text-white rounded-lg text-sm font-medium hover:bg-yellow-600"
          >
            Criar Primeiro Desafio
          </button>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {challenges.map((c) => {
            const start = new Date(c.startDate);
            const end = new Date(c.endDate);
            const isActive = start <= now && end >= now;
            const isEnded = end < now;
            return (
              <div key={c.id} className="bg-white border border-gray-200 rounded-xl shadow-sm p-5">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-gray-900 truncate">{c.title}</h3>
                    <p className="text-xs text-gray-400 mt-0.5 line-clamp-2">{c.description}</p>
                  </div>
                  <span className={`ml-2 text-xs px-2 py-0.5 rounded-full font-medium flex-shrink-0 ${
                    isActive ? "bg-green-100 text-green-700" : isEnded ? "bg-gray-100 text-gray-500" : "bg-blue-100 text-blue-700"
                  }`}>
                    {isActive ? "Ativo" : isEnded ? "Encerrado" : "Em breve"}
                  </span>
                </div>

                <div className="flex gap-3 text-xs text-gray-500 mt-3">
                  <span className="flex items-center gap-1">
                    <Target className="w-3.5 h-3.5" />
                    {TYPES[c.type] ?? c.type}
                    {c.targetValue ? ` · ${c.targetValue} ${c.targetUnit ?? ""}` : ""}
                  </span>
                  <span className="flex items-center gap-1">
                    <Users className="w-3.5 h-3.5" />
                    {c.participantCount} participantes
                  </span>
                  {c.completedCount > 0 && (
                    <span className="text-green-600 font-medium">{c.completedCount} concluíram</span>
                  )}
                </div>

                <p className="text-xs text-gray-400 mt-1">
                  {start.toLocaleDateString("pt-BR")} → {end.toLocaleDateString("pt-BR")}
                  {c.isPublic ? " · Público" : " · Privado"}
                </p>

                <div className="flex gap-2 pt-3 mt-3 border-t border-gray-100">
                  <button
                    onClick={() => openEdit(c)}
                    className="flex items-center gap-1 text-xs font-medium py-1.5 px-3 border rounded-lg hover:bg-gray-50 text-gray-600"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                    Editar
                  </button>
                  <button
                    onClick={() => handleDelete(c.id)}
                    className="flex items-center gap-1 text-xs font-medium py-1.5 px-3 border border-red-200 text-red-500 rounded-lg hover:bg-red-50 ml-auto"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    Remover
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
