"use client";

import { useState, useEffect, useCallback } from "react";
import { Calendar, Clock, User, CheckCircle, XCircle, ChevronLeft, ChevronRight } from "lucide-react";

const DAYS = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
const MONTHS = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro",
];

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

interface CoachUser { name: string; avatarUrl?: string }
interface AvailSlot { dayOfWeek: number; startTime: string; endTime: string; slotMinutes: number }
interface Coach { id: string; user: CoachUser; coachAvailability: AvailSlot[] }
interface Appointment {
  id: string;
  scheduledAt: string;
  durationMin: number;
  status: string;
  athleteNotes?: string;
  meetUrl?: string;
  coach: { user: CoachUser };
  product?: { title: string };
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleString("pt-BR", {
    day: "2-digit", month: "short", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

function toDateStr(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export default function AtletaAgendaPage() {
  const [tab, setTab] = useState<"appointments" | "book">("appointments");
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [coaches, setCoaches] = useState<Coach[]>([]);
  const [myCoachId, setMyCoachId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Booking flow state
  const [selectedCoach, setSelectedCoach] = useState<Coach | null>(null);
  const [calendarDate, setCalendarDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [slots, setSlots] = useState<string[]>([]);
  const [slotMinutes, setSlotMinutes] = useState(60);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
  const [notes, setNotes] = useState("");
  const [booking, setBooking] = useState(false);
  const [success, setSuccess] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const res = await fetch("/api/atleta/agenda");
    if (res.ok) {
      const data = await res.json();
      setAppointments(data.appointments ?? []);
      setCoaches(data.coaches ?? []);
      setMyCoachId(data.myCoachId ?? null);
    }
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  // Auto-select my coach if available
  useEffect(() => {
    if (coaches.length > 0 && myCoachId) {
      const mine = coaches.find((c) => c.id === myCoachId);
      if (mine) setSelectedCoach(mine);
    }
  }, [coaches, myCoachId]);

  // Load slots when date selected
  useEffect(() => {
    if (!selectedCoach || !selectedDate) { setSlots([]); return; }
    setLoadingSlots(true);
    fetch(`/api/atleta/agenda?coachId=${selectedCoach.id}&date=${toDateStr(selectedDate)}`)
      .then((r) => r.json())
      .then((d) => { setSlots(d.slots ?? []); setSlotMinutes(d.slotMinutes ?? 60); })
      .finally(() => setLoadingSlots(false));
  }, [selectedCoach, selectedDate]);

  async function cancelAppointment(id: string) {
    await fetch("/api/atleta/agenda", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, status: "CANCELLED" }),
    });
    load();
  }

  async function confirmBooking() {
    if (!selectedCoach || !selectedSlot) return;
    setBooking(true);
    const res = await fetch("/api/atleta/agenda", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ coachId: selectedCoach.id, scheduledAt: selectedSlot, notes }),
    });
    setBooking(false);
    if (res.ok) {
      setSuccess(true);
      setSelectedSlot(null);
      setSelectedDate(null);
      setNotes("");
      load();
      setTimeout(() => { setSuccess(false); setTab("appointments"); }, 2000);
    }
  }

  // Calendar helpers
  const year = calendarDate.getFullYear();
  const month = calendarDate.getMonth();
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Days of week with availability for selected coach
  const availableDays = new Set(selectedCoach?.coachAvailability.map((a) => a.dayOfWeek) ?? []);

  function isDayAvailable(day: number) {
    const d = new Date(year, month, day);
    if (d < today) return false;
    return availableDays.has(d.getDay());
  }

  const upcoming = appointments.filter((a) => a.status !== "CANCELLED" && a.status !== "COMPLETED" && new Date(a.scheduledAt) >= new Date());
  const past = appointments.filter((a) => a.status === "COMPLETED" || a.status === "CANCELLED" || new Date(a.scheduledAt) < new Date());

  if (loading) return <div className="p-8 text-center text-gray-400">Carregando…</div>;

  return (
    <div className="p-4 max-w-3xl mx-auto">
      <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2 mb-4">
        <Calendar className="w-5 h-5 text-teal-600" />
        Agenda
      </h1>

      {/* Tabs */}
      <div className="flex border-b border-gray-200 mb-6">
        {(["appointments", "book"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors ${
              tab === t
                ? "border-teal-600 text-teal-700"
                : "border-transparent text-gray-500 hover:text-gray-700"
            }`}
          >
            {t === "appointments" ? "Meus agendamentos" : "Agendar consulta"}
          </button>
        ))}
      </div>

      {/* My Appointments */}
      {tab === "appointments" && (
        <div className="space-y-6">
          {upcoming.length === 0 && past.length === 0 && (
            <div className="text-center py-12 text-gray-400 text-sm">
              Nenhum agendamento. Clique em &quot;Agendar consulta&quot; para começar.
            </div>
          )}

          {upcoming.length > 0 && (
            <section>
              <h2 className="text-sm font-semibold text-gray-600 uppercase tracking-wide mb-3">Próximos</h2>
              <div className="space-y-3">
                {upcoming.map((a) => (
                  <div key={a.id} className="bg-white border border-gray-200 rounded-xl p-4 flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-teal-100 flex items-center justify-center flex-shrink-0">
                      <User className="w-5 h-5 text-teal-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-900 text-sm">{a.coach.user.name}</p>
                      <p className="text-xs text-gray-500">{formatDate(a.scheduledAt)} · {a.durationMin} min</p>
                      {a.product && <p className="text-xs text-gray-400">{a.product.title}</p>}
                      {a.meetUrl && (
                        <a href={a.meetUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-indigo-600 hover:underline">
                          Entrar na reunião
                        </a>
                      )}
                    </div>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_COLORS[a.status] ?? "bg-gray-100 text-gray-600"}`}>
                      {STATUS_LABELS[a.status] ?? a.status}
                    </span>
                    {(a.status === "PENDING" || a.status === "CONFIRMED") && (
                      <button
                        onClick={() => cancelAppointment(a.id)}
                        className="text-red-400 hover:text-red-600"
                        title="Cancelar"
                      >
                        <XCircle className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </section>
          )}

          {past.length > 0 && (
            <section>
              <h2 className="text-sm font-semibold text-gray-600 uppercase tracking-wide mb-3">Histórico</h2>
              <div className="space-y-2">
                {past.slice(0, 5).map((a) => (
                  <div key={a.id} className="bg-gray-50 border border-gray-100 rounded-xl p-3 flex items-center gap-3 opacity-70">
                    <CheckCircle className="w-4 h-4 text-gray-400 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-gray-700">{a.coach.user.name}</p>
                      <p className="text-xs text-gray-400">{formatDate(a.scheduledAt)}</p>
                    </div>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${STATUS_COLORS[a.status] ?? "bg-gray-100 text-gray-600"}`}>
                      {STATUS_LABELS[a.status] ?? a.status}
                    </span>
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>
      )}

      {/* Book */}
      {tab === "book" && (
        <div className="space-y-6">
          {success && (
            <div className="bg-green-50 border border-green-200 rounded-xl p-4 text-center text-green-700 text-sm font-medium">
              Agendamento solicitado com sucesso!
            </div>
          )}

          {/* Step 1: Coach */}
          <section>
            <h2 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-1.5">
              <span className="w-5 h-5 rounded-full bg-teal-600 text-white text-xs flex items-center justify-center">1</span>
              Treinador
            </h2>
            {coaches.length === 0 ? (
              <p className="text-sm text-gray-400 py-4 text-center">Nenhum treinador com agenda disponível.</p>
            ) : (
              <div className="space-y-2">
                {coaches.map((c) => (
                  <button
                    key={c.id}
                    onClick={() => { setSelectedCoach(c); setSelectedDate(null); setSelectedSlot(null); }}
                    className={`w-full flex items-center gap-3 p-3 rounded-xl border transition-colors text-left ${
                      selectedCoach?.id === c.id
                        ? "border-teal-500 bg-teal-50"
                        : "border-gray-200 bg-white hover:bg-gray-50"
                    }`}
                  >
                    <div className="w-9 h-9 rounded-full bg-teal-100 flex items-center justify-center flex-shrink-0">
                      <User className="w-4 h-4 text-teal-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">{c.user.name}</p>
                      <p className="text-xs text-gray-400">
                        {c.coachAvailability.map((a) => DAYS[a.dayOfWeek]).join(", ")}
                      </p>
                    </div>
                    {selectedCoach?.id === c.id && <CheckCircle className="w-4 h-4 text-teal-600 ml-auto" />}
                  </button>
                ))}
              </div>
            )}
          </section>

          {/* Step 2: Calendar */}
          {selectedCoach && (
            <section>
              <h2 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-1.5">
                <span className="w-5 h-5 rounded-full bg-teal-600 text-white text-xs flex items-center justify-center">2</span>
                Data
              </h2>
              <div className="bg-white border border-gray-200 rounded-xl p-4">
                {/* Month nav */}
                <div className="flex items-center justify-between mb-4">
                  <button onClick={() => setCalendarDate(new Date(year, month - 1, 1))} className="p-1 hover:bg-gray-100 rounded-lg">
                    <ChevronLeft className="w-4 h-4 text-gray-500" />
                  </button>
                  <span className="text-sm font-medium text-gray-800">{MONTHS[month]} {year}</span>
                  <button onClick={() => setCalendarDate(new Date(year, month + 1, 1))} className="p-1 hover:bg-gray-100 rounded-lg">
                    <ChevronRight className="w-4 h-4 text-gray-500" />
                  </button>
                </div>
                {/* Day headers */}
                <div className="grid grid-cols-7 mb-2">
                  {DAYS.map((d) => (
                    <div key={d} className="text-center text-xs text-gray-400 font-medium py-1">{d}</div>
                  ))}
                </div>
                {/* Calendar grid */}
                <div className="grid grid-cols-7 gap-1">
                  {Array.from({ length: firstDay }).map((_, i) => <div key={`e${i}`} />)}
                  {Array.from({ length: daysInMonth }).map((_, i) => {
                    const day = i + 1;
                    const available = isDayAvailable(day);
                    const d = new Date(year, month, day);
                    const isSelected = selectedDate?.toDateString() === d.toDateString();
                    return (
                      <button
                        key={day}
                        disabled={!available}
                        onClick={() => { setSelectedDate(d); setSelectedSlot(null); }}
                        className={`aspect-square rounded-lg text-sm transition-colors flex items-center justify-center ${
                          isSelected
                            ? "bg-teal-600 text-white font-semibold"
                            : available
                            ? "hover:bg-teal-50 text-gray-800 font-medium"
                            : "text-gray-300 cursor-not-allowed"
                        }`}
                      >
                        {day}
                      </button>
                    );
                  })}
                </div>
              </div>
            </section>
          )}

          {/* Step 3: Slots */}
          {selectedDate && (
            <section>
              <h2 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-1.5">
                <span className="w-5 h-5 rounded-full bg-teal-600 text-white text-xs flex items-center justify-center">3</span>
                Horário
                <span className="text-xs text-gray-400 font-normal ml-1">
                  {selectedDate.toLocaleDateString("pt-BR", { weekday: "long", day: "2-digit", month: "long" })}
                </span>
              </h2>
              {loadingSlots ? (
                <p className="text-sm text-gray-400">Carregando horários…</p>
              ) : slots.length === 0 ? (
                <p className="text-sm text-gray-400">Sem horários disponíveis neste dia.</p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {slots.map((slot) => {
                    const time = new Date(slot).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
                    return (
                      <button
                        key={slot}
                        onClick={() => setSelectedSlot(slot)}
                        className={`px-3 py-2 rounded-lg border text-sm font-medium transition-colors flex items-center gap-1.5 ${
                          selectedSlot === slot
                            ? "bg-teal-600 text-white border-teal-600"
                            : "bg-white border-gray-200 text-gray-700 hover:border-teal-400 hover:bg-teal-50"
                        }`}
                      >
                        <Clock className="w-3.5 h-3.5" />
                        {time}
                      </button>
                    );
                  })}
                </div>
              )}
              <p className="text-xs text-gray-400 mt-2">Duração: {slotMinutes} min</p>
            </section>
          )}

          {/* Step 4: Notes + Confirm */}
          {selectedSlot && (
            <section>
              <h2 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-1.5">
                <span className="w-5 h-5 rounded-full bg-teal-600 text-white text-xs flex items-center justify-center">4</span>
                Confirmar
              </h2>
              <div className="bg-teal-50 border border-teal-200 rounded-xl p-4 mb-4 text-sm text-teal-800">
                <p><strong>{selectedCoach?.user.name}</strong></p>
                <p className="text-teal-700">
                  {new Date(selectedSlot).toLocaleString("pt-BR", {
                    weekday: "long", day: "2-digit", month: "long",
                    hour: "2-digit", minute: "2-digit",
                  })} · {slotMinutes} min
                </p>
              </div>
              <div className="mb-4">
                <label className="block text-xs font-medium text-gray-700 mb-1">Notas para o treinador (opcional)</label>
                <textarea
                  rows={3}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Ex: Quero discutir meu treino de velocidade..."
                  className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400"
                />
              </div>
              <button
                onClick={confirmBooking}
                disabled={booking}
                className="w-full py-3 bg-teal-600 text-white rounded-xl text-sm font-semibold hover:bg-teal-700 disabled:opacity-50 transition-colors"
              >
                {booking ? "Agendando…" : "Confirmar agendamento"}
              </button>
            </section>
          )}
        </div>
      )}
    </div>
  );
}
