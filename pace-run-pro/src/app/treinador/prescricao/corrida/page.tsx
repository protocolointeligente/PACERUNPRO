"use client";

import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { CheckCircle2, ImageIcon, Send, Sparkles, Video, Wand2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { athleteList, getSubtypeColor } from "@/lib/mock-data";
import { formatPace } from "@/lib/utils";
import { cn } from "@/lib/utils";

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

const inputClass =
  "w-full rounded-xl border border-border bg-background px-3.5 py-2.5 text-sm text-white placeholder:text-text-muted/50 outline-none transition-colors focus:border-primary/60 focus:ring-2 focus:ring-primary/20";
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

function buildSuggestion(athlete: (typeof athleteList)[number], typeId: RunTypeId) {
  const adj = typeAdjustments[typeId];
  const basePace = basePaceByLevel[athlete.level] ?? 318;
  const paceSecPerKm = Math.max(150, basePace + adj.paceDeltaSec);
  const distanceKm = Math.max(3, Math.round(adj.distanceFactor * (athlete.weeklyLoad / 10)));
  const durationMin = Math.round((distanceKm * paceSecPerKm) / 60);
  return { paceSecPerKm, distanceKm, durationMin, rpe: adj.rpe, hrZone: adj.hrZone };
}

export default function RunPrescriptionPage() {
  const [athleteId, setAthleteId] = useState(athleteList[0].id);
  const [typeId, setTypeId] = useState<RunTypeId>("intervalado-curto");
  const [form, setForm] = useState<FormState>(emptyForm);
  const [sent, setSent] = useState(false);

  const athlete = useMemo(() => athleteList.find((a) => a.id === athleteId) ?? athleteList[0], [athleteId]);
  const selectedType = useMemo(() => runTypes.find((t) => t.id === typeId)!, [typeId]);
  const suggestion = useMemo(() => buildSuggestion(athlete, typeId), [athlete, typeId]);

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
        <h1 className="font-display text-2xl font-bold text-white sm:text-3xl">Prescrever treino de corrida</h1>
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
              <h3 className="mb-3 font-display text-sm font-semibold text-white">Atleta</h3>
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
                      <p className="truncate text-xs font-semibold text-white">{a.name}</p>
                      <p className="truncate text-[11px] text-text-muted">{a.goal} · {a.level}</p>
                    </div>
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-5">
              <h3 className="mb-3 font-display text-sm font-semibold text-white">Tipo de treino</h3>
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
                      <p className="flex items-center gap-2 text-sm font-semibold text-white">
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
              <h3 className="font-display text-sm font-semibold text-white">Detalhes da sessão</h3>
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
                    <option key={z} value={z} className="bg-card text-white">
                      {z}
                    </option>
                  ))}
                </select>
              </label>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="space-y-4 p-5">
              <h3 className="font-display text-sm font-semibold text-white">Estrutura do treino</h3>
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
              <h3 className="font-display text-sm font-semibold text-white">Mídia &amp; observações</h3>
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
              <h3 className="mb-1 flex items-center gap-2 font-display text-sm font-semibold text-white">
                <Sparkles className="h-4 w-4 text-primary" /> Motor de prescrição inteligente
              </h3>
              <p className="text-xs text-text-muted">
                Sugestão calculada a partir do nível, pace de referência, carga semanal e objetivo de {athlete.name.split(" ")[0]}{" "}
                para um treino de <span className="text-white">{selectedType.label.toLowerCase()}</span>.
              </p>

              <div className="mt-4 space-y-2 rounded-xl border border-border bg-background/40 p-3.5 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-text-muted">Distância sugerida</span>
                  <span className="font-semibold text-white">{suggestion.distanceKm} km</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-text-muted">Duração estimada</span>
                  <span className="font-semibold text-white">{suggestion.durationMin} min</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-text-muted">Pace alvo</span>
                  <span className="font-semibold text-white">{formatPace(suggestion.paceSecPerKm)} /km</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-text-muted">RPE alvo</span>
                  <span className="font-semibold text-white">{suggestion.rpe}/10</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-text-muted">Zona de FC</span>
                  <span className="font-semibold text-white">{suggestion.hrZone.split(" — ")[0]}</span>
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
              <h3 className="mb-3 font-display text-sm font-semibold text-white">Pré-visualização</h3>
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
                <p className="mt-2 truncate text-sm font-semibold text-white">{form.title || `${selectedType.label} — ${athlete.name.split(" ")[0]}`}</p>
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
                    Treino prescrito para <span className="font-semibold text-white">{athlete.name}</span>. Ele aparecerá no
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
