"use client";

import { useEffect, useState } from "react";
import {
  Activity, Bike, Waves, Dumbbell, TrendingUp,
  Send, CheckCircle2, Clock, ChevronDown, ChevronUp,
  CalendarDays, Loader2, AlertCircle,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

// ── Test catalogue ─────────────────────────────────────────────────────────

interface TestProtocol {
  id: string;
  label: string;
  sport: string;
  description: string;
  metric: string;
  duration: string;
}

const TEST_CATALOGUE: { sport: string; icon: React.ComponentType<{ className?: string }>; color: string; tests: TestProtocol[] }[] = [
  {
    sport: "Corrida",
    icon: Activity,
    color: "#f97316",
    tests: [
      { id: "cooper", label: "Teste de Cooper", sport: "RUN", description: "Distância máxima em 12 minutos de corrida contínua", metric: "Distância (m)", duration: "12 min" },
      { id: "2400m", label: "Teste 2400m", sport: "RUN", description: "Tempo para completar 2400m no menor tempo possível", metric: "Tempo (min:ss)", duration: "~12–15 min" },
      { id: "3km", label: "Teste 3 km", sport: "RUN", description: "Tempo para completar 3km no menor tempo possível", metric: "Tempo (min:ss)", duration: "~9–18 min" },
      { id: "5min", label: "Teste 5 minutos", sport: "RUN", description: "Distância máxima percorrida em 5 minutos", metric: "Distância (m)", duration: "5 min" },
      { id: "vdot", label: "VDOT (prova recente)", sport: "RUN", description: "Baseado em prova de rua oficial (5k, 10k, 21k, 42k)", metric: "Tempo + distância", duration: "Resultado de prova" },
      { id: "vam", label: "VAM — Velocidade Aeróbica Máxima", sport: "RUN", description: "Velocidade no VO2máx pela fórmula Léger adaptada", metric: "Velocidade (km/h)", duration: "~6–10 min" },
    ],
  },
  {
    sport: "Ciclismo",
    icon: Bike,
    color: "#3b82f6",
    tests: [
      { id: "ftp20", label: "FTP — 20 minutos", sport: "BIKE", description: "95% da potência média sustentada por 20 minutos", metric: "Potência média (W)", duration: "20 min" },
      { id: "ramp", label: "Ramp Test", sport: "BIKE", description: "Incremento de potência até falha. FTP = 75% da potência máxima do último minuto completo", metric: "Potência máxima (W)", duration: "~20–25 min" },
      { id: "cp5", label: "Potência Crítica 5 min", sport: "BIKE", description: "Potência máxima sustentada por 5 minutos", metric: "Potência (W)", duration: "5 min" },
      { id: "cp20", label: "Potência Crítica 20 min", sport: "BIKE", description: "Potência máxima sustentada por 20 minutos (= FTP)", metric: "Potência (W)", duration: "20 min" },
      { id: "lthbike", label: "FC Limiar Ciclismo", sport: "BIKE", description: "Frequência cardíaca sustentada no limiar anaeróbico", metric: "FC média (bpm)", duration: "20 min" },
    ],
  },
  {
    sport: "Natação",
    icon: Waves,
    color: "#06b6d4",
    tests: [
      { id: "css", label: "CSS — Critical Swim Speed", sport: "SWIM", description: "Velocidade crítica de natação derivada de 400m e 200m", metric: "Pace por 100m (min:ss)", duration: "400m + 200m" },
      { id: "css1000", label: "CSS — 1000m", sport: "SWIM", description: "Tempo para completar 1000m no menor tempo possível", metric: "Tempo (min:ss)", duration: "1000m" },
      { id: "cpace", label: "Pace crítico natação", sport: "SWIM", description: "Pace máximo sustentável sem acúmulo de lactato", metric: "Pace por 100m (min:ss)", duration: "400m" },
    ],
  },
  {
    sport: "Força",
    icon: Dumbbell,
    color: "#a855f7",
    tests: [
      { id: "1rm", label: "1RM Direto", sport: "STRENGTH", description: "Carga máxima em uma repetição para o movimento prescrito", metric: "Carga (kg)", duration: "~30 min" },
      { id: "1rm_est", label: "1RM Estimado", sport: "STRENGTH", description: "Estimativa via reps com sub-máximo (Epley, Brzycki, Lombardi)", metric: "Reps × carga sub-máx", duration: "~15 min" },
      { id: "jump_v", label: "Salto Vertical", sport: "STRENGTH", description: "Altura máxima de salto vertical (squat jump ou CMJ)", metric: "Altura (cm)", duration: "5 min" },
      { id: "jump_h", label: "Salto Horizontal", sport: "STRENGTH", description: "Distância máxima de salto bilateral a partir da posição parada", metric: "Distância (cm)", duration: "5 min" },
    ],
  },
  {
    sport: "Funcional",
    icon: TrendingUp,
    color: "#22c55e",
    tests: [
      { id: "ybalance", label: "Y Balance Test", sport: "OTHER", description: "Equilíbrio dinâmico e controle neuromuscular do membro inferior", metric: "Alcance relativo (%)", duration: "10 min" },
      { id: "hop", label: "Hop Test", sport: "OTHER", description: "Simetria e potência do membro inferior em salto unipodal", metric: "Distância unipodal (cm)", duration: "10 min" },
      { id: "core", label: "Resistência de Core", sport: "OTHER", description: "Prancha frontal, lateral e extensão lombar até a fadiga", metric: "Tempo (s)", duration: "15 min" },
      { id: "mobility", label: "Mobilidade articular", sport: "OTHER", description: "Amplitude de movimento de tornozelo, quadril, ombro e coluna", metric: "Graus / pass-fail", duration: "20 min" },
    ],
  },
];

// ── Component ─────────────────────────────────────────────────────────────────

export default function TestesPerformancePage() {
  const [athletes, setAthletes] = useState<{ id: string; name: string }[]>([]);
  const [athleteId, setAthleteId] = useState("");
  const [selectedTest, setSelectedTest] = useState<TestProtocol | null>(null);
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [notes, setNotes] = useState("");
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [expandedSport, setExpandedSport] = useState<string>("Corrida");

  useEffect(() => {
    fetch("/api/coach/athletes")
      .then((r) => r.ok ? r.json() : [])
      .then((data: { id: string; name: string }[]) => {
        setAthletes(data);
        if (data.length > 0) setAthleteId(data[0].id);
      })
      .catch(() => null);
  }, []);

  async function handleSend() {
    if (!athleteId || !selectedTest) return;
    setSending(true);
    try {
      // POST to prescribe test as a workout
      const body = {
        athleteId,
        date,
        type: "PROVA",
        sport: selectedTest.sport,
        title: `Teste: ${selectedTest.label}`,
        objective: selectedTest.description,
        mainSet: `Protocolo: ${selectedTest.description}\nMétrica: ${selectedTest.metric}\nDuração estimada: ${selectedTest.duration}${notes ? `\n\nObservações: ${notes}` : ""}`,
        notes: notes || undefined,
      };
      const res = await fetch("/api/coach/workouts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error("Erro ao enviar");
      setSent(true);
      setTimeout(() => {
        setSent(false);
        setSelectedTest(null);
        setNotes("");
      }, 3000);
    } catch { /* ignore */ }
    finally { setSending(false); }
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      {/* Header */}
      <div>
        <h1 className="font-display text-2xl font-bold text-text">Testes de Performance</h1>
        <p className="mt-1 text-sm text-text-muted">
          Selecione o protocolo, escolha o atleta e envie. O sistema notifica o atleta e atualiza as zonas automaticamente ao receber o resultado.
        </p>
      </div>

      {/* Flow */}
      <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
        {/* Left: test catalogue */}
        <div className="space-y-3">
          {TEST_CATALOGUE.map((cat) => (
            <Card key={cat.sport} className="overflow-hidden">
              <button
                className="flex w-full items-center gap-3 px-5 py-4 text-left"
                onClick={() => setExpandedSport(expandedSport === cat.sport ? "" : cat.sport)}
              >
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg" style={{ background: `${cat.color}20`, color: cat.color }}>
                  <cat.icon className="h-4 w-4" />
                </div>
                <span className="flex-1 font-display text-sm font-semibold text-text">{cat.sport}</span>
                <Badge className="text-[10px]" style={{ color: cat.color, background: `${cat.color}15`, borderColor: `${cat.color}30` }}>
                  {cat.tests.length} protocolos
                </Badge>
                {expandedSport === cat.sport ? <ChevronUp className="h-4 w-4 text-text-muted" /> : <ChevronDown className="h-4 w-4 text-text-muted" />}
              </button>

              {expandedSport === cat.sport && (
                <CardContent className="grid gap-2 px-5 pb-5 pt-0">
                  {cat.tests.map((test) => {
                    const isSelected = selectedTest?.id === test.id;
                    return (
                      <button
                        key={test.id}
                        onClick={() => setSelectedTest(isSelected ? null : test)}
                        className={cn(
                          "rounded-xl border p-3 text-left transition-all",
                          isSelected
                            ? "border-primary/50 bg-primary/5"
                            : "border-border bg-card hover:border-primary/30 hover:bg-card-hover"
                        )}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <p className="text-sm font-semibold text-text">{test.label}</p>
                            <p className="mt-0.5 text-xs text-text-muted leading-relaxed">{test.description}</p>
                          </div>
                          {isSelected && <CheckCircle2 className="h-4 w-4 shrink-0 text-primary" />}
                        </div>
                        <div className="mt-2 flex gap-3">
                          <span className="flex items-center gap-1 text-[10px] text-text-muted">
                            <Clock className="h-3 w-3" />{test.duration}
                          </span>
                          <span className="text-[10px] text-text-muted">· {test.metric}</span>
                        </div>
                      </button>
                    );
                  })}
                </CardContent>
              )}
            </Card>
          ))}
        </div>

        {/* Right: send panel */}
        <div className="lg:sticky lg:top-20">
          <Card className={cn("transition-all", selectedTest ? "border-primary/30" : "border-border opacity-60")}>
            <CardContent className="space-y-4 p-5">
              <h3 className="font-display text-sm font-semibold text-text">
                {selectedTest ? selectedTest.label : "Selecione um protocolo"}
              </h3>

              {selectedTest && (
                <div className="rounded-xl bg-card-hover/60 p-3">
                  <p className="text-xs text-text-muted">{selectedTest.description}</p>
                  <div className="mt-2 flex gap-3 text-[10px] text-text-muted">
                    <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{selectedTest.duration}</span>
                    <span>· {selectedTest.metric}</span>
                  </div>
                </div>
              )}

              {/* Athlete */}
              <div>
                <label className="mb-1 block text-xs font-medium text-text-muted">Atleta</label>
                <select
                  value={athleteId}
                  onChange={(e) => setAthleteId(e.target.value)}
                  disabled={!selectedTest}
                  className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm text-text outline-none focus:border-primary/60 focus:ring-1 focus:ring-primary/20 disabled:opacity-50"
                >
                  {athletes.map((a) => (
                    <option key={a.id} value={a.id}>{a.name}</option>
                  ))}
                </select>
              </div>

              {/* Date */}
              <div>
                <label className="mb-1 block text-xs font-medium text-text-muted">
                  <CalendarDays className="mr-1 inline h-3 w-3" />Data para realizar
                </label>
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  disabled={!selectedTest}
                  className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm text-text outline-none focus:border-primary/60 focus:ring-1 focus:ring-primary/20 disabled:opacity-50"
                />
              </div>

              {/* Notes */}
              <div>
                <label className="mb-1 block text-xs font-medium text-text-muted">Observações (opcional)</label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  disabled={!selectedTest}
                  rows={3}
                  placeholder="Ex: realizar em pista oval, jejum de 2h..."
                  className="w-full resize-none rounded-xl border border-border bg-background px-3 py-2 text-sm text-text placeholder:text-text-muted/50 outline-none focus:border-primary/60 focus:ring-1 focus:ring-primary/20 disabled:opacity-50"
                />
              </div>

              {!selectedTest && (
                <div className="flex items-center gap-2 rounded-xl bg-card-hover p-3 text-xs text-text-muted">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  Selecione um protocolo na lista ao lado para continuar.
                </div>
              )}

              <Button
                variant="primary"
                size="sm"
                className="w-full gap-2"
                disabled={!selectedTest || !athleteId || sending}
                onClick={handleSend}
              >
                {sending ? (
                  <><Loader2 className="h-4 w-4 animate-spin" />Enviando…</>
                ) : sent ? (
                  <><CheckCircle2 className="h-4 w-4" />Teste prescrito!</>
                ) : (
                  <><Send className="h-4 w-4" />Enviar para atleta</>
                )}
              </Button>

              {sent && (
                <p className="text-center text-xs text-success">
                  O atleta receberá a notificação e poderá enviar o resultado diretamente pelo app.
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
