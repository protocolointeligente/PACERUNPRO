"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { AlertTriangle, CheckCircle2, History, Info, Save } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScaleInput } from "@/components/checkin/scale-input";
import { checkInHistory, shoesList } from "@/lib/mock-data";
import { evaluateCheckInRules, type CheckInRecord } from "@/lib/calculations";
import { cn } from "@/lib/utils";

const fields = [
  { key: "rpe", label: "RPE — esforço percebido", emojis: ["😴", "🙂", "😊", "😅", "🥵"], low: "Muito leve", high: "Esforço máximo", accent: "#8b5cf6" },
  { key: "pain", label: "Dor / desconforto", emojis: ["🟢", "🟡", "🟠", "🔴", "⛔"], low: "Sem dor", high: "Dor intensa", accent: "#ef4444" },
  { key: "sleep", label: "Qualidade do sono", emojis: ["😩", "😐", "🙂", "😴", "😌"], low: "Péssimo", high: "Excelente", accent: "#38bdf8" },
  { key: "fatigue", label: "Fadiga", emojis: ["⚡", "🙂", "😐", "🥱", "🔋"], low: "Sem fadiga", high: "Exausto(a)", accent: "#facc15" },
  { key: "mood", label: "Humor", emojis: ["😞", "😐", "🙂", "😄", "🤩"], low: "Péssimo", high: "Ótimo", accent: "#84cc16" },
] as const;

type Key = (typeof fields)[number]["key"];

export default function CheckInPage() {
  const router = useRouter();
  const [values, setValues] = useState<Record<Key, number>>({ rpe: 5, pain: 1, sleep: 7, fatigue: 4, mood: 7 });
  const [notes, setNotes] = useState("");
  const [selectedShoeId, setSelectedShoeId] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  const activeShoes = shoesList.filter((s) => s.active);
  const selectedShoe = activeShoes.find((s) => s.id === selectedShoeId);

  function update(key: Key, v: number) {
    setValues((s) => ({ ...s, [key]: v }));
  }

  const draftHistory: CheckInRecord[] = [
    ...checkInHistory.map((c) => ({ date: c.date, rpe: c.rpe, pain: c.pain, sleep: c.sleep, fatigue: c.fatigue, mood: c.mood, plannedRpe: c.plannedRpe })),
    { date: "hoje", rpe: values.rpe, pain: values.pain, sleep: values.sleep, fatigue: values.fatigue, mood: values.mood, plannedRpe: 7 },
  ];
  const ruleResults = evaluateCheckInRules(draftHistory);

  function save() {
    setSaved(true);
  }

  const severityStyles = {
    danger: { badge: "danger" as const, icon: AlertTriangle },
    warning: { badge: "warning" as const, icon: AlertTriangle },
    info: { badge: "info" as const, icon: Info },
  };

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <Badge variant="primary" className="mb-2">
          Check-in pós-treino
        </Badge>
        <h1 className="font-display text-2xl font-bold text-text sm:text-3xl">Como foi o seu treino hoje?</h1>
        <p className="mt-1.5 text-sm text-text-muted">
          Suas respostas alimentam o motor de prescrição inteligente — ele ajusta automaticamente a carga das próximas
          sessões com base no que você sentir.
        </p>
      </div>

      <div className="space-y-4">
        {fields.map((f) => (
          <ScaleInput
            key={f.key}
            label={f.label}
            value={values[f.key]}
            onChange={(v) => update(f.key, v)}
            emojis={[...f.emojis]}
            lowLabel={f.low}
            highLabel={f.high}
            accent={f.accent}
          />
        ))}

        <Card>
          <CardContent className="p-4 sm:p-5">
            <span className="mb-3 block text-sm font-semibold text-text">Qual tênis você usou neste treino?</span>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {activeShoes.map((shoe) => (
                <button
                  key={shoe.id}
                  type="button"
                  onClick={() => setSelectedShoeId((id) => (id === shoe.id ? null : shoe.id))}
                  className={cn(
                    "flex items-center gap-2.5 rounded-xl border p-3 text-left transition-all",
                    selectedShoeId === shoe.id
                      ? "border-primary bg-primary/10"
                      : "border-border bg-background hover:border-primary/40"
                  )}
                >
                  <span
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-xl"
                    style={{ backgroundColor: `${shoe.color}20`, border: `1.5px solid ${shoe.color}40` }}
                  >
                    {shoe.imageEmoji}
                  </span>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-text">
                      {shoe.brand} {shoe.model}
                    </p>
                    <p className="text-xs text-text-muted">{shoe.kmAccumulated.toLocaleString("pt-BR")} km</p>
                  </div>
                  {selectedShoeId === shoe.id && <CheckCircle2 className="ml-auto h-4 w-4 shrink-0 text-primary" />}
                </button>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 sm:p-5">
            <label className="block">
              <span className="mb-2 block text-sm font-semibold text-text">Observações (opcional)</span>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={4}
                placeholder="Ex.: Senti um leve incômodo na canela direita no final do treino…"
                className="w-full resize-none rounded-xl border border-border bg-background px-4 py-3 text-sm text-text placeholder:text-text-muted/50 outline-none transition-colors focus:border-primary/60 focus:ring-2 focus:ring-primary/20"
              />
            </label>
          </CardContent>
        </Card>
      </div>

      {/* Live intelligent feedback */}
      <AnimatePresence>
        {saved && (
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-3">
            <div className="flex items-center gap-2 text-sm font-semibold text-success">
              <CheckCircle2 className="h-4 w-4" />
              Check-in salvo no seu histórico
            </div>
            {selectedShoe && (
              <p className="text-sm text-text-muted">
                Tênis registrado: <span className="font-semibold text-text">{selectedShoe.brand} {selectedShoe.model}</span>
              </p>
            )}
            {ruleResults.map((r, i) => {
              const cfg = severityStyles[r.severity];
              return (
                <Card key={i} className={`border-${r.severity === "danger" ? "danger" : r.severity === "warning" ? "warning" : "info"}/30`}>
                  <CardContent className="flex items-start gap-3 p-4">
                    <Badge variant={cfg.badge} className="mt-0.5 shrink-0">
                      <cfg.icon className="h-3 w-3" />
                    </Badge>
                    <div>
                      <p className="text-sm font-semibold text-text">{r.title}</p>
                      <p className="mt-0.5 text-sm text-text-muted">{r.message}</p>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex flex-col gap-3 sm:flex-row">
        <Button size="lg" className="flex-1" onClick={save} disabled={saved}>
          <Save className="h-4 w-4" />
          {saved ? "Check-in registrado" : "Salvar check-in"}
        </Button>
        <Button size="lg" variant="secondary" onClick={() => router.push("/aluno/dashboard")}>
          Voltar ao início
        </Button>
      </div>

      {/* History */}
      <div>
        <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-text">
          <History className="h-4 w-4 text-text-muted" />
          Histórico recente
        </div>
        <div className="space-y-2">
          {checkInHistory
            .slice()
            .reverse()
            .map((c) => (
              <Card key={c.date}>
                <CardContent className="flex flex-wrap items-center gap-x-5 gap-y-2 p-4 text-xs text-text-muted">
                  <span className="font-medium text-text">
                    {new Date(c.date + "T12:00:00").toLocaleDateString("pt-BR", { day: "2-digit", month: "short", weekday: "short" })}
                  </span>
                  <span>RPE {c.rpe}</span>
                  <span>Dor {c.pain}</span>
                  <span>Sono {c.sleep}</span>
                  <span>Fadiga {c.fatigue}</span>
                  <span>Humor {c.mood}</span>
                </CardContent>
              </Card>
            ))}
        </div>
      </div>
    </div>
  );
}
