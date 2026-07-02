"use client";

import { useState, useEffect, useCallback } from "react";
import { Calendar, Plus, Users, MapPin, Wifi, Eye, EyeOff, Trash2 } from "lucide-react";

interface Event {
  id: string;
  title: string;
  description: string;
  priceCents: number;
  published: boolean;
  eventDate?: string;
  maxParticipants?: number;
  format?: string;
  registrationCount: number;
  confirmedCount: number;
}

const emptyForm = {
  title: "",
  description: "",
  priceCents: 0,
  maxParticipants: "",
  eventDate: "",
  isOnline: false,
  location: "",
};

export default function EventosPage() {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const res = await fetch("/api/coach/events");
    if (res.ok) setEvents(await res.json());
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    await fetch("/api/coach/events", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...form,
        maxParticipants: form.maxParticipants ? Number(form.maxParticipants) : null,
      }),
    });
    setShowForm(false);
    setForm(emptyForm);
    load();
    setSaving(false);
  }

  async function togglePublish(id: string, current: boolean) {
    await fetch("/api/coach/events", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, published: !current }),
    });
    load();
  }

  async function handleDelete(id: string) {
    if (!confirm("Remover este evento?")) return;
    await fetch(`/api/coach/events?id=${id}`, { method: "DELETE" });
    load();
  }

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Calendar className="w-6 h-6 text-orange-500" />
            Meus Eventos
          </h1>
          <p className="text-sm text-gray-500 mt-1">Gerencie corridas, workshops e eventos presenciais ou online</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 text-sm font-medium"
        >
          <Plus className="w-4 h-4" />
          Novo Evento
        </button>
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <form
            onSubmit={handleCreate}
            className="bg-white rounded-xl shadow-xl p-6 w-full max-w-lg space-y-4 max-h-[90vh] overflow-y-auto"
          >
            <h2 className="text-lg font-semibold">Novo Evento</h2>
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
                rows={3}
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                className="w-full border rounded-lg px-3 py-2 text-sm"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Data do evento *</label>
                <input
                  required
                  type="datetime-local"
                  value={form.eventDate}
                  onChange={(e) => setForm({ ...form, eventDate: e.target.value })}
                  className="w-full border rounded-lg px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Vagas máximas</label>
                <input
                  type="number"
                  min={0}
                  value={form.maxParticipants}
                  onChange={(e) => setForm({ ...form, maxParticipants: e.target.value })}
                  placeholder="Ilimitado"
                  className="w-full border rounded-lg px-3 py-2 text-sm"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Preço (centavos)</label>
              <input
                type="number"
                min={0}
                value={form.priceCents}
                onChange={(e) => setForm({ ...form, priceCents: Number(e.target.value) })}
                className="w-full border rounded-lg px-3 py-2 text-sm"
              />
              <p className="text-xs text-gray-400 mt-1">R$ {(form.priceCents / 100).toFixed(2)}</p>
            </div>
            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <input
                type="checkbox"
                checked={form.isOnline}
                onChange={(e) => setForm({ ...form, isOnline: e.target.checked })}
                className="rounded"
              />
              Evento online
            </label>
            {!form.isOnline && (
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Local</label>
                <input
                  value={form.location}
                  onChange={(e) => setForm({ ...form, location: e.target.value })}
                  placeholder="Endereço ou nome do local"
                  className="w-full border rounded-lg px-3 py-2 text-sm"
                />
              </div>
            )}
            <div className="flex gap-3 justify-end pt-2">
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
                className="px-4 py-2 bg-orange-500 text-white rounded-lg text-sm font-medium hover:bg-orange-600 disabled:opacity-50"
              >
                {saving ? "Criando…" : "Criar Evento"}
              </button>
            </div>
          </form>
        </div>
      )}

      {loading ? (
        <div className="text-center py-12 text-gray-400">Carregando…</div>
      ) : events.length === 0 ? (
        <div className="text-center py-16 bg-gray-50 rounded-xl border-2 border-dashed border-gray-200">
          <Calendar className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500 font-medium">Nenhum evento criado</p>
          <button
            onClick={() => setShowForm(true)}
            className="mt-4 px-4 py-2 bg-orange-500 text-white rounded-lg text-sm font-medium hover:bg-orange-600"
          >
            Criar Primeiro Evento
          </button>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {events.map((ev) => (
            <div key={ev.id} className="bg-white border border-gray-200 rounded-xl shadow-sm p-5">
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-gray-900 truncate">{ev.title}</h3>
                  <p className="text-xs text-gray-400 mt-0.5 line-clamp-2">{ev.description}</p>
                </div>
                <span className={`ml-2 text-xs px-2 py-0.5 rounded-full font-medium flex-shrink-0 ${
                  ev.published ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"
                }`}>
                  {ev.published ? "Publicado" : "Rascunho"}
                </span>
              </div>

              {ev.eventDate && (
                <p className="text-xs text-gray-500 flex items-center gap-1 mt-2">
                  <Calendar className="w-3.5 h-3.5" />
                  {new Date(ev.eventDate).toLocaleString("pt-BR", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}
                </p>
              )}

              <div className="flex gap-3 text-xs text-gray-500 mt-2">
                <span className="flex items-center gap-1">
                  {ev.format === "online" ? <Wifi className="w-3.5 h-3.5" /> : <MapPin className="w-3.5 h-3.5" />}
                  {ev.format === "online" ? "Online" : ev.format ?? "Presencial"}
                </span>
                <span className="flex items-center gap-1">
                  <Users className="w-3.5 h-3.5" />
                  {ev.confirmedCount} inscritos
                  {ev.maxParticipants ? ` / ${ev.maxParticipants}` : ""}
                </span>
                <span className="ml-auto font-semibold text-gray-900">
                  {ev.priceCents === 0 ? "Gratuito" : `R$ ${(ev.priceCents / 100).toFixed(2)}`}
                </span>
              </div>

              <div className="flex gap-2 pt-3 mt-3 border-t border-gray-100">
                <button
                  onClick={() => togglePublish(ev.id, ev.published)}
                  className="flex items-center gap-1 text-xs font-medium py-1.5 px-3 border rounded-lg hover:bg-gray-50 text-gray-600"
                >
                  {ev.published ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  {ev.published ? "Ocultar" : "Publicar"}
                </button>
                <button
                  onClick={() => handleDelete(ev.id)}
                  className="flex items-center gap-1 text-xs font-medium py-1.5 px-3 border border-red-200 text-red-500 rounded-lg hover:bg-red-50 ml-auto"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Remover
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
