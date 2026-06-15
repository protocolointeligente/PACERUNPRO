"use client";

import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Activity, CheckCircle2, ImageIcon, Send, Sparkles, Video, Wand2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { athleteList, getSubtypeColor } from "@/lib/mock-data";
import { formatPace } from "@/lib/utils";
import { cn } from "@/lib/utils";
import {
  calculateVDOT,
  getTrainingPaces,
  parseRaceTime,
  RACE_DISTANCES,
  TRAINING_ZONES,
  type TrainingZoneId,
} from "@/lib/vdot";

const runTypes = [
  { id: "rodagem-leve", label: "Rodagem leve", description: "Volume em ritmo confortável — Zona 1-2" },
  { id: "intervalado-curto", label: "Intervalado curto", description: "Tiros de 200-600 m em alta intensidade" },
  { id: "intervalado-longo", label: "Intervalado longo", description: "Tiros de 800 m-2 km perto do limiar" },
  { id: "tempo-run", label: "Tempo Run", description: "Bloco contínuo em ritmo de limiar" },
  { id: "fartlek", label: "Fartlek", description: "Variações livres de ritmo por percurso" },
  { id: "progressivo", label: "Progressivo", description: "Início confortável, final em alta intensidade" },
  { id: "longao", label: "Longão", description: "Maior volume da semana, ritmo controlado" },
  { id: "regenerativo", label: "Regenerativo", description: "Trote leve para recuperação ativa" },
  { id: "subida", label: "Subida", description: "Força específica em rampas e morros" },
  { id: "tecnica", label: "Técnica", description: "Drills de cadência, postura e mobilidade" },
  { id: "prova", label: "Prova", description: "Simulação de prova ou competição oficial" },
] as const;

type RunTypeId = (typeof runTypes)[number]["id"];

const hrZones = [
  "Zona 1 — Recuperação",
  "Zona 2 — Aeróbico leve",
  "Zona 3 — Aeróbico moderado",
  "Zona 4 — Limiar",
  "Zona 5 — VO2máx",
];

const basePaceByLevel: Record<string, number> = {
  "Iniciante": 390,
  "Intermediário": 318,
  "Avançado": 270,
};

const typeAdjustments: Record<RunTypeId, { paceDeltaSec: number; rpe: number; hrZone: string; distanceFactor: number }> = {
  "rodagem-leve": { paceDeltaSec: 50, rpe: 4, hrZone: hrZones[1], distanceFactor: 0.18 },
  "intervalado-curto": { paceDeltaSec: -35, rpe: 8, hrZone: hrZones[4], distanceFactor: 0.12 },
  "intervalado-longo": { paceDeltaSec: -20, rpe: 7, hrZone: hrZones[3], distanceFactor: 0.14 },
  "tempo-run": { paceDeltaSec: -10, rpe: 7, hrZone: hrZones[3], distanceFactor: 0.15 },
  fartlek: { paceDeltaSec: -15, rpe: 6, hrZone: hrZones[2], distanceFactor: 0.14 },
  progressivo: { paceDeltaSec: -5, rpe: 6, hrZone: hrZones[2], distanceFactor: 0.16 },
  longao: { paceDeltaSec: 35, rpe: 5, hrZone: hrZones[1], distanceFactor: 0.3 },
  regenerativo: { paceDeltaSec: 75, rpe: 3, hrZone: hrZones[0], distanceFactor: 0.1 },
  subida: { paceDeltaSec: 25, rpe: 7, hrZone: hrZones[2], distanceFactor: 0.12 },
  tecnica: { paceDeltaSec: 60, rpe: 4, hrZone: hrZones[1], distanceFactor: 0.09 },
  prova: { paceDeltaSec: -25, rpe: 9, hrZone: hrZones[3], distanceFactor: 0.25 },
};

// Mapeia cada tipo de treino para a zona de Daniels (E/M/T/I/R) e a posição
// dentro da faixa de pace daquela zona — usado quando o VDOT do atleta está disponível.
const typeToZone: Record<RunTypeId, { zone: TrainingZoneId; position: "fast" | "mid" | "slow"; hrZone: string }> = {
  regenerativo: { zone: "E", position: "slow", hrZone: hrZones[0] },
  tecnica: { zone: "E", position: "slow", hrZone: hrZones[1] },
  "rodagem-leve": { zone: "E", position: "mid", hrZone: hrZones[1] },
  longao: { zone: "E", position: "fast", hrZone: hrZones[1] },
  subida: { zone: "M", position: "slow", hrZone: hrZones[2] },
  progressivo: { zone: "M", position: "mid", hrZone: hrZones[2] },
  "tempo-run": { zone: "T", position: "mid", hrZone: hrZones[3] },
  fartlek: { zone: "T", position: "fast", hrZone: hrZones[3] },
  "intervalado-longo": { zone: "I", position: "slow", hrZone: hrZones[4] },
  prova: { zone: "I", position: "mid", hrZone: hrZones[4] },
  "intervalado-curto": { zone: "R", position: "mid", hrZone: hrZones[4] },
};

// Resultado de prova recente (mock) usado para estimar o VDOT de cada atleta.
const recentRaceByAthlete: Record<string, { distanceM: number; timeSec: number }> = {
  "ath-1": { distanceM: 10000, timeSec: 47 * 60 + 52 }, // Camila Andrade
};

function formatRaceTime(sec: number): string {
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = Math.round(sec % 60);
  if (h > 0) return `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  return `${m}:${String(s).padStart(2, "0")}`;
}

const inputClass =
  "w-full rounded-xl border border-border bg-background px-3.5 py-2.5 text-sm text-text placeholder:text-text-muted/50 outline-none transition-colors focus:border-primary/60 focus:ring-2 focus:ring-primary/20";
const textareaClass = cn(inputClass, "resize-none");
const labelClass = "mb-1.5 block text-xs font-semibold uppercase tracking-wider text-text-muted";

interface FormState {
  title: string;
  date: string;
  distanceKm: string;
  durationMin: string;
  pace: string;
  rpe: string;
  hrZone: string;
  objective: string;
  warmup: string;
  mainSet: string;
  cooldown: string;
  notes: string;
  videoUrl: string;
  imageUrl: string;
}

const emptyForm: FormState = {
  title: "",
  date: "",
  distanceKm: "",
  durationMin: "",
  pace: "",
  rpe: "",
  hrZone: hrZones[2],
  objective: "",
  warmup: "",
  mainSet: "",
  cooldown: "",
  notes: "",
  videoUrl: "",
  imageUrl: "",
};

function buildSuggestion(athlete: (typeof athleteList)[number], typeId: RunTypeId, vdot: number) {
  const adj = typeAdjustments[typeId];
  let paceSecPerKm: number;
  let hrZone = adj.hrZone;

  if (vdot > 0) {
    const zoneMap = typeToZone[typeId];
    const range = getTrainingPaces(vdot)[zoneMap.zone];
    paceSecPerKm =
      zoneMap.position === "fast"
        ? range.fastSecPerKm
        : zoneMap.position === "slow"
          ? range.slowSecPerKm
          : Math.round((range.fastSecPerKm + range.slowSecPerKm) / 2);
    hrZone = zoneMap.hrZone;
  } else {
    const basePace = basePaceByLevel[athlete.level] ?? 318;
    paceSecPerKm = Math.max(150, basePace + adj.paceDeltaSec);
  }

  const distanceKm = Math.max(3, Math.round(adj.distanceFactor * (athlete.weeklyLoad / 10)));
  const durationMin = Math.round((distanceKm * paceSecPerKm) / 60);
  return { paceSecPerKm, distanceKm, durationMin, rpe: adj.rpe, hrZone };
}

export default function RunPrescriptionPage() {
  const [athleteId, setAthleteId] = useState(athleteList[0].id);
  const [typeId, setTypeId] = useState<RunTypeId>("intervalado-curto");
  const [form, setForm] = useState<FormState>(emptyForm);
  const [sent, setSent] = useState(false);
  const [raceDistanceM, setRaceDistanceM] = useState<number>(RACE_DISTANCES[3].meters);
  const [raceTimeStr, setRaceTimeStr] = useState("");

  const athlete = useMemo(() => athleteList.find((a) => a.id === athleteId) ?? athleteList[0], [athleteId]);
  const selectedType = useMemo(() => runTypes.find((t) => t.id === typeId)!, [typeId]);

  // Pré-preenche o resultado de prova recente ao trocar de atleta
  useEffect(() => {
    const recent = recentRaceByAthlete[athleteId];
    if (recent) {
      setRaceDistanceM(recent.distanceM);
      setRaceTimeStr(formatRaceTime(recent.timeSec));
    } else {
      setRaceTimeStr("");
    }
  }, [athleteId]);

  const vdot = useMemo(() => calculateVDOT(raceDistanceM, parseRaceTime(raceTimeStr)), [raceDistanceM, raceTimeStr]);
  const trainingPaces = useMemo(() => (vdot > 0 ? getTrainingPaces(vdot) : null), [vdot]);
  const suggestion = useMemo(() => buildSuggestion(athlete, typeId, vdot), [athlete, typeId, vdot]);

  function update<K extends keyof FormState>(key: K, value: FormState[K]) {
    setSent(false);
    setForm((s) => ({ ...s, [key]: value }));
  }

  function applySuggestion() {
    setSent(false);
    setForm((s) => ({
      ...s,
      title: s.title || `${selectedType.label} — ${athlete.name.split(" ")[0]}`,
      distanceKm: String(suggestion.distanceKm),
      durationMin: String(suggestion.durationMin),
      pace: formatPace(suggestion.paceSecPerKm),
      rpe: String(suggestion.rpe),
      hrZone: suggestion.hrZone,
      objective:
        s.objective ||
        `Trabalhar o estímulo de ${selectedType.label.toLowerCase()} respeitando a fase atual de periodização e o histórico recente de check-ins de ${athlete.name.split(" ")[0]}.`,
    }));
  }

  function submit() {
    setSent(true);
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div>
        <Badge variant="primary" className="mb-2">Prescrição de treino</Badge>
        <h1 className="font-display text-2xl font-bold text-text sm:text-3xl">Prescrever treino de corrida</h1>
        <p className="mt-1.5 text-sm text-text-muted">
          Monte a sessão por tipo de estímulo, ajuste pace, RPE e estrutura, e use o motor de prescrição inteligente para
          sugerir valores com base no perfil e histórico do atleta.
        </p>
      </div>

      <div className="grid gap-5 lg:grid-cols-[1fr_22rem]">
        {/* Main form */}
        <div className="space-y-5">
          <Card>
            <CardContent className="p-5">
              <h3 className="mb-3 font-display text-sm font-semibold text-text">Atleta</h3>
              <div className="flex flex-wrap gap-2">
                {athleteList.map((a) => (
                  <button
                    key={a.id}
                    onClick={() => {
                      setSent(false);
                      setAthleteId(a.id);
                    }}
                    className={cn(
                      "flex items-center gap-2.5 rounded-xl border px-3 py-2 text-left transition-colors",
                      athleteId === a.id ? "border-primary/60 bg-primary/15" : "border-border bg-card-hover/30 hover:border-primary/30"
                    )}
                  >
                    <Avatar className="h-8 w-8">
                      <AvatarFallback className="text-xs">{a.name.split(" ").map((n) => n[0]).slice(0, 2).join("")}</AvatarFallback>
                    </Avatar>
                    <div className="min-w-0">
                      <p className="truncate text-xs font-semibold text-text">{a.name}</p>
                      <p className="truncate text-[11px] text-text-muted">{a.goal} · {a.level}</p>
                    </div>
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-5">
              <h3 className="mb-1 flex items-center gap-2 font-display text-sm font-semibold text-text">
                <Activity className="h-4 w-4 text-primary" /> Nível de fitness — VDOT (Daniels)
              </h3>
              <p className="mb-3 text-xs text-text-muted">
                Informe o resultado de uma prova recente de {athlete.name.split(" ")[0]} para calcular o VDOT e gerar as
                faixas de pace de treino (E, M, T, I, R) da metodologia de Jack Daniels.
              </p>
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="block">
                  <span className={labelClass}>Distância da prova</span>
                  <select
                    value={raceDistanceM}
                    onChange={(e) => setRaceDistanceM(Number(e.target.value))}
                    className={inputClass}
                  >
                    {RACE_DISTANCES.map((d) => (
                      <option key={d.id} value={d.meters} className="bg-card text-text">
                        {d.label}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="block">
                  <span className={labelClass}>Tempo (MM:SS ou H:MM:SS)</span>
                  <input
                    value={raceTimeStr}
                    onChange={(e) => setRaceTimeStr(e.target.value)}
                    placeholder="Ex.: 47:52"
                    className={inputClass}
                  />
                </label>
              </div>

              {trainingPaces && (
                <div className="mt-4 space-y-3">
                  <div className="flex items-center gap-2 rounded-xl border border-primary/30 bg-primary/10 px-3.5 py-2.5">
                    <span className="text-xs text-text-muted">VDOT estimado</span>
                    <span className="font-display text-lg font-bold text-text">{vdot.toFixed(1)}</span>
                  </div>
                  <div className="overflow-hidden rounded-xl border border-border">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="bg-card-hover/40 text-left text-[11px] uppercase tracking-wider text-text-muted">
                          <th className="px-3 py-2 font-medium">Zona</th>
                          <th className="px-3 py-2 font-medium">Pace alvo</th>
                          <th className="hidden px-3 py-2 font-medium sm:table-cell">Uso</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border">
                        {TRAINING_ZONES.map((z) => {
                          const range = trainingPaces[z.id];
                          return (
                            <tr key={z.id}>
                              <td className="px-3 py-2">
                                <span className="inline-flex items-center gap-2 font-semibold" style={{ color: z.color }}>
                                  <span className="h-2 w-2 rounded-full" style={{ backgroundColor: z.color }} />
                                  {z.label}
                                </span>
                              </td>
                              <td className="px-3 py-2 text-text">
                                {formatPace(range.fastSecPerKm).replace("/km", "")}–{formatPace(range.slowSecPerKm)}
                              </td>
                              <td className="hidden px-3 py-2 text-text-muted sm:table-cell">{z.description}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-5">
              <h3 className="mb-3 font-display text-sm font-semibold text-text">Tipo de treino</h3>
              <div className="grid gap-2.5 sm:grid-cols-2 xl:grid-cols-3">
                {runTypes.map((t) => {
                  const color = getSubtypeColor("corrida", t.label);
                  return (
                    <button
                      key={t.id}
                      onClick={() => {
                        setSent(false);
                        setTypeId(t.id);
                      }}
                      className={cn(
                        "rounded-xl border px-3.5 py-3 text-left transition-colors",
                        typeId === t.id ? "border-primary/60 bg-primary/15" : "border-border bg-card-hover/30 hover:border-primary/30"
                      )}
                    >
                      <p className="flex items-center gap-2 text-sm font-semibold text-text">
                        <span className="h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: color }} />
                        {t.label}
                      </p>
                      <p className="mt-0.5 text-[11px] text-text-muted">{t.description}</p>
                    </button>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="space-y-4 p-5">
              <h3 className="font-display text-sm font-semibold text-text">Detalhes da sessão</h3>
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="block">
                  <span className={labelClass}>Título do treino</span>
                  <input
                    value={form.title}
                    onChange={(e) => update("title", e.target.value)}
                    placeholder={`Ex.: ${selectedType.label} — ${athlete.name.split(" ")[0]}`}
                    className={inputClass}
                  />
                </label>
                <label className="block">
                  <span className={labelClass}>Data</span>
                  <input type="date" value={form.date} onChange={(e) => update("date", e.target.value)} className={inputClass} />
                </label>
              </div>

              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <label className="block">
                  <span className={labelClass}>Distância (km)</span>
                  <input value={form.distanceKm} onChange={(e) => update("distanceKm", e.target.value)} placeholder="Ex.: 9" inputMode="decimal" className={inputClass} />
                </label>
                <label className="block">
                  <span className={labelClass}>Duração (min)</span>
                  <input value={form.durationMin} onChange={(e) => update("durationMin", e.target.value)} placeholder="Ex.: 55" inputMode="numeric" className={inputClass} />
                </label>
                <label className="block">
                  <span className={labelClass}>Pace alvo (/km)</span>
                  <input value={form.pace} onChange={(e) => update("pace", e.target.value)} placeholder="Ex.: 4:42" className={inputClass} />
                </label>
                <label className="block">
                  <span className={labelClass}>RPE alvo</span>
                  <input value={form.rpe} onChange={(e) => update("rpe", e.target.value)} placeholder="1-10" inputMode="numeric" className={inputClass} />
                </label>
              </div>

              <label className="block">
                <span className={labelClass}>Zona de FC alvo</span>
                <select value={form.hrZone} onChange={(e) => update("hrZone", e.target.value)} className={inputClass}>
                  {hrZones.map((z) => (
                    <option key={z} value={z} className="bg-card text-text">
                      {z}
                    </option>
                  ))}
                </select>
              </label>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="space-y-4 p-5">
              <h3 className="font-display text-sm font-semibold text-text">Estrutura do treino</h3>
              <label className="block">
                <span className={labelClass}>Objetivo</span>
                <textarea rows={2} value={form.objective} onChange={(e) => update("objective", e.target.value)} placeholder="O que esse treino desenvolve no contexto do plano…" className={textareaClass} />
              </label>
              <label className="block">
                <span className={labelClass}>Aquecimento</span>
                <textarea rows={2} value={form.warmup} onChange={(e) => update("warmup", e.target.value)} placeholder="Ex.: 15 min de corrida leve em Zona 1-2 + mobilidade dinâmica…" className={textareaClass} />
              </label>
              <label className="block">
                <span className={labelClass}>Parte principal</span>
                <textarea rows={3} value={form.mainSet} onChange={(e) => update("mainSet", e.target.value)} placeholder="Ex.: 8 x 400 m a 4:20-4:30/km, com 90s de trote leve entre os tiros…" className={textareaClass} />
              </label>
              <label className="block">
                <span className={labelClass}>Volta à calma</span>
                <textarea rows={2} value={form.cooldown} onChange={(e) => update("cooldown", e.target.value)} placeholder="Ex.: 10 min de trote regenerativo + alongamento…" className={textareaClass} />
              </label>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="space-y-4 p-5">
              <h3 className="font-display text-sm font-semibold text-text">Mídia &amp; observações</h3>
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="block">
                  <span className={labelClass}><Video className="mr-1 inline h-3 w-3" /> Vídeo de apoio (URL)</span>
                  <input value={form.videoUrl} onChange={(e) => update("videoUrl", e.target.value)} placeholder="https://…" className={inputClass} />
                </label>
                <label className="block">
                  <span className={labelClass}><ImageIcon className="mr-1 inline h-3 w-3" /> Imagem de referência (URL)</span>
                  <input value={form.imageUrl} onChange={(e) => update("imageUrl", e.target.value)} placeholder="https://…" className={inputClass} />
                </label>
              </div>
              <label className="block">
                <span className={labelClass}>Observações para o atleta</span>
                <textarea rows={3} value={form.notes} onChange={(e) => update("notes", e.target.value)} placeholder="Ex.: Se sentir desconforto na canela, reduza a intensidade dos tiros e me avise no check-in…" className={textareaClass} />
              </label>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-5">
          <Card className="border-primary/30 bg-gradient-to-br from-primary/12 to-card">
            <CardContent className="p-5">
              <h3 className="mb-1 flex items-center gap-2 font-display text-sm font-semibold text-text">
                <Sparkles className="h-4 w-4 text-primary" /> Motor de prescrição inteligente
              </h3>
              <p className="text-xs text-text-muted">
                {vdot > 0 ? (
                  <>
                    Pace calculado pelas zonas de Daniels (VDOT {vdot.toFixed(1)}), carga semanal e objetivo de{" "}
                    {athlete.name.split(" ")[0]} para um treino de{" "}
                    <span className="text-text">{selectedType.label.toLowerCase()}</span>.
                  </>
                ) : (
                  <>
                    Sugestão calculada a partir do nível, pace de referência, carga semanal e objetivo de{" "}
                    {athlete.name.split(" ")[0]} para um treino de{" "}
                    <span className="text-text">{selectedType.label.toLowerCase()}</span>.
                  </>
                )}
              </p>

              <div className="mt-4 space-y-2 rounded-xl border border-border bg-background/40 p-3.5 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-text-muted">Distância sugerida</span>
                  <span className="font-semibold text-text">{suggestion.distanceKm} km</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-text-muted">Duração estimada</span>
                  <span className="font-semibold text-text">{suggestion.durationMin} min</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-text-muted">Pace alvo</span>
                  <span className="font-semibold text-text">{formatPace(suggestion.paceSecPerKm)} /km</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-text-muted">RPE alvo</span>
                  <span className="font-semibold text-text">{suggestion.rpe}/10</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-text-muted">Zona de FC</span>
                  <span className="font-semibold text-text">{suggestion.hrZone.split(" — ")[0]}</span>
                </div>
              </div>

              <Button onClick={applySuggestion} className="mt-4 w-full">
                <Wand2 className="h-4 w-4" /> Aplicar sugestão ao formulário
              </Button>
              <p className="mt-2 text-[11px] text-text-muted">
                A sugestão é apenas um ponto de partida — você pode editar livremente qualquer campo antes de prescrever.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-5">
              <h3 className="mb-3 font-display text-sm font-semibold text-text">Pré-visualização</h3>
              <div className="rounded-xl border border-border bg-card-hover/30 p-4">
                <div className="flex items-center justify-between">
                  {(() => {
                    const color = getSubtypeColor("corrida", selectedType.label);
                    return (
                      <Badge style={{ borderColor: `${color}55`, color, backgroundColor: `${color}1a` }} className="border">
                        {selectedType.label}
                      </Badge>
                    );
                  })()}
                  {form.rpe && <span className="text-xs text-text-muted">RPE {form.rpe}</span>}
                </div>
                <p className="mt-2 truncate text-sm font-semibold text-text">{form.title || `${selectedType.label} — ${athlete.name.split(" ")[0]}`}</p>
                <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-text-muted">
                  {form.distanceKm && <span>{form.distanceKm} km</span>}
                  {form.durationMin && <span>{form.durationMin} min</span>}
                  {form.pace && <span>{form.pace} /km</span>}
                  {form.hrZone && <span>{form.hrZone.split(" — ")[0]}</span>}
                </div>
              </div>
            </CardContent>
          </Card>

          <motion.div initial={false} animate={{ opacity: 1 }}>
            <Button onClick={submit} size="lg" className="w-full">
              <Send className="h-4 w-4" /> Enviar prescrição para {athlete.name.split(" ")[0]}
            </Button>
            {sent && (
              <motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} className="mt-3">
                <Card className="border-success/30 bg-success/5">
                  <CardContent className="flex items-center gap-2.5 p-3.5 text-sm text-text-muted">
                    <CheckCircle2 className="h-4 w-4 shrink-0 text-success" />
                    Treino prescrito para <span className="font-semibold text-text">{athlete.name}</span>. Ele aparecerá no
                    plano assim que a semana for liberada.
                  </CardContent>
                </Card>
              </motion.div>
            )}
          </motion.div>
        </div>
      </div>
    </div>
  );
}
