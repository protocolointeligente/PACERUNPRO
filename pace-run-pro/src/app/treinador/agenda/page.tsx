"use client";

import { useState, useEffect, useCallback } from "react";
import { Clock, User, Video } from "lucide-react";

const DAYS = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

interface AvailabilitySlot {
  id?: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  slotMinutes: number;
  isActive: boolean;
}

interface Appointment {
  id: string;
  scheduledAt: string;
  durationMin: number;
  status: string;
  notes?: string;
  meetUrl?: string;
  athlete: { user: { name: string; email: string; avatarUrl?: string } };
  product?: { title: string; type: string };
}

const defaultSlot = (): AvailabilitySlot => ({
  dayOfWeek: 1,
  startTime: "08:00",
  endTime: "18:00",
  slotMinutes: 60,
  isActive: true,
});

const STATUS_LABELS: Record<string, string> = {
  PENDING: "Pendente",
  CONFIRMED: "Confirmado",
  CANCELLED: "Cancelado",
  COMPLETED: "Concluído",
};

const STATUS_COLORS: Record<string, string> = {
  PENDING: "bg-yellow-100 text-yellow-700",
  CONFIRMED: "bg-green-100 text-green-700",
  CANCELLED: "bg-red-100 text-red-600",
  COMPLETED: "bg-gray-100 text-gray-600",
};

export default function AgendaPage() {
  const [availability, setAvailability] = useState<AvailabilitySlot[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editingAppt, setEditingAppt] = useState<Appointment | null>(null);
  const [apptForm, setApptForm] = useState({ status: "", meetUrl: "", notes: "" });

  const load = useCallback(async () => {
    setLoading(true);
    const res = await fetch("/api/coach/agenda");
    if (res.ok) {
      const data = await res.json();
      setAvailability(data.availability ?? []);
      setAppointments(data.appointments ?? []);
    }
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  function addSlot() {
    setAvailability((prev) => [...prev, defaultSlot()]);
  }

  function removeSlot(i: number) {
    setAvailability((prev) => prev.filter((_, idx) => idx !== i));
  }

  function updateSlot(i: number, field: keyof AvailabilitySlot, value: string | number | boolean) {
    setAvailability((prev) => prev.map((s, idx) => idx === i ? { ...s, [field]: value } : s));
  }

  async function saveAvailability() {
    setSaving(true);
    await fetch("/api/coach/agenda", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ availability }),
    });
    setSaving(false);
    load();
  }

  function openEditAppt(a: Appointment) {
    setEditingAppt(a);
    setApptForm({ status: a.status, meetUrl: a.meetUrl ?? "", notes: a.notes ?? "" });
  }

  async function saveAppt() {
    if (!editingAppt) return;
    await fetch("/api/coach/agenda", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: editingAppt.id, ...apptForm }),
    });
    setEditingAppt(null);
    load();
  }

  if (loading) return <div className="p-8 text-center text-gray-400">Carregando…</div>;

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-8">
      <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
        <Clock className="w-6 h-6 text-teal-600" />
        Agenda
      </h1>

      {/* Availability Config */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-semibold text-gray-800">Disponibilidade</h2>
            <p className="text-sm text-gray-500">Configure os horários em que você atende consultorias</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={addSlot}
              className="px-3 py-1.5 border border-teal-200 text-teal-600 rounded-lg text-xs font-medium hover:bg-teal-50"
            >
              + Janela
            </button>
            <button
              onClick={saveAvailability}
              disabled={saving}
              className="px-4 py-1.5 bg-teal-600 text-white rounded-lg text-xs font-medium hover:bg-teal-700 disabled:opacity-50"
            >
              {saving ? "Salvando…" : "Salvar"}
            </button>
          </div>
        </div>

        {availability.length === 0 ? (
          <div className="text-center py-8 bg-gray-50 rounded-xl border-2 border-dashed border-gray-200 text-gray-400 text-sm">
            Nenhuma janela configurada. Clique em &quot;+ Janela&quot; para adicionar.
          </div>
        ) : (
          <div className="space-y-3">
            {availability.map((slot, i) => (
              <div key={i} className="bg-white border border-gray-200 rounded-xl p-4 flex flex-wrap gap-3 items-center">
                <select
                  value={slot.dayOfWeek}
                  onChange={(e) => updateSlot(i, "dayOfWeek", Number(e.target.value))}
                  className="border rounded-lg px-2 py-1.5 text-sm text-gray-700"
                >
                  {DAYS.map((d, idx) => <option key={idx} value={idx}>{d}</option>)}
                </select>
                <input
                  type="time"
                  value={slot.startTime}
                  onChange={(e) => updateSlot(i, "startTime", e.target.value)}
                  className="border rounded-lg px-2 py-1.5 text-sm"
                />
                <span className="text-gray-400 text-sm">até</span>
                <input
                  type="time"
                  value={slot.endTime}
                  onChange={(e) => updateSlot(i, "endTime", e.target.value)}
                  className="border rounded-lg px-2 py-1.5 text-sm"
                />
                <select
                  value={slot.slotMinutes}
                  onChange={(e) => updateSlot(i, "slotMinutes", Number(e.target.value))}
                  className="border rounded-lg px-2 py-1.5 text-sm text-gray-700"
                >
                  {[30, 45, 60, 90, 120].map((m) => (
                    <option key={m} value={m}>{m} min</option>
                  ))}
                </select>
                <label className="flex items-center gap-1.5 text-sm text-gray-600 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={slot.isActive}
                    onChange={(e) => updateSlot(i, "isActive", e.target.checked)}
                    className="rounded"
                  />
                  Ativo
                </label>
                <button
                  onClick={() => removeSlot(i)}
                  className="ml-auto text-red-400 hover:text-red-600 text-xs"
                >
                  Remover
                </button>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Upcoming Appointments */}
      <section>
        <h2 className="text-lg font-semibold text-gray-800 mb-4">
          Próximos Agendamentos
          <span className="ml-2 text-sm font-normal text-gray-400">({appointments.length})</span>
        </h2>

        {appointments.length === 0 ? (
          <div className="text-center py-8 bg-gray-50 rounded-xl border-2 border-dashed border-gray-200 text-gray-400 text-sm">
            Nenhum agendamento futuro
          </div>
        ) : (
          <div className="space-y-3">
            {appointments.map((a) => (
              <div key={a.id} className="bg-white border border-gray-200 rounded-xl p-4 flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-teal-100 flex items-center justify-center flex-shrink-0">
                  <User className="w-5 h-5 text-teal-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-900 text-sm">{a.athlete.user.name}</p>
                  <p className="text-xs text-gray-500">
                    {new Date(a.scheduledAt).toLocaleString("pt-BR", {
                      day: "2-digit", month: "short", year: "numeric",
                      hour: "2-digit", minute: "2-digit",
                    })} · {a.durationMin} min
                  </p>
                  {a.product && (
                    <p className="text-xs text-gray-400">{a.product.title}</p>
                  )}
                </div>
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_COLORS[a.status] ?? "bg-gray-100 text-gray-600"}`}>
                  {STATUS_LABELS[a.status] ?? a.status}
                </span>
                {a.meetUrl && (
                  <a href={a.meetUrl} target="_blank" rel="noopener noreferrer" className="text-indigo-600 hover:text-indigo-800">
                    <Video className="w-4 h-4" />
                  </a>
                )}
                <button
                  onClick={() => openEditAppt(a)}
                  className="text-xs text-gray-500 hover:text-gray-800 border rounded-lg px-2 py-1"
                >
                  Gerir
                </button>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Edit appointment modal */}
      {editingAppt && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-md space-y-4">
            <h2 className="text-lg font-semibold">Gerenciar Agendamento</h2>
            <p className="text-sm text-gray-600">
              {editingAppt.athlete.user.name} ·{" "}
              {new Date(editingAppt.scheduledAt).toLocaleString("pt-BR")}
            </p>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Status</label>
              <select
                value={apptForm.status}
                onChange={(e) => setApptForm({ ...apptForm, status: e.target.value })}
                className="w-full border rounded-lg px-3 py-2 text-sm"
              >
                {Object.entries(STATUS_LABELS).map(([k, v]) => (
                  <option key={k} value={k}>{v}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Link da reunião</label>
              <input
                value={apptForm.meetUrl}
                onChange={(e) => setApptForm({ ...apptForm, meetUrl: e.target.value })}
                placeholder="https://meet.google.com/..."
                className="w-full border rounded-lg px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Notas internas</label>
              <textarea
                rows={3}
                value={apptForm.notes}
                onChange={(e) => setApptForm({ ...apptForm, notes: e.target.value })}
                className="w-full border rounded-lg px-3 py-2 text-sm"
              />
            </div>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setEditingAppt(null)}
                className="px-4 py-2 border rounded-lg text-sm text-gray-700 hover:bg-gray-50"
              >
                Cancelar
              </button>
              <button
                onClick={saveAppt}
                className="px-4 py-2 bg-teal-600 text-white rounded-lg text-sm font-medium hover:bg-teal-700"
              >
                Salvar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
