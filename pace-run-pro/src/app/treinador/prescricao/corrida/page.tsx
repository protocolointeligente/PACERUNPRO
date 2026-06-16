"use client";

import { useMemo, useState } from "react";
import { Activity } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { athleteList } from "@/lib/mock-data";
import { formatPace } from "@/lib/utils";
import { cn } from "@/lib/utils";
import {
  calculateVDOT,
  getTrainingPaces,
  parseRaceTime,
  RACE_DISTANCES,
  TRAINING_ZONES,
} from "@/lib/vdot";

const runTypes = [
  { label: "Rodagem leve",     zone: "E", description: "Volume em ritmo confortável — base aeróbica" },
  { label: "Regenerativo",     zone: "E", description: "Trote leve — recuperação ativa pós-esforço" },
  { label: "Progressivo",      zone: "M", description: "Início confortável, final em ritmo de maratona" },
  { label: "Tempo Run",        zone: "T", description: "Bloco contínuo em ritmo de limiar" },
  { label: "Fartlek",          zone: "T", description: "Variações livres de ritmo no percurso" },
  { label: "Intervalado longo",zone: "I", description: "Tiros de 800 m–2 km próximos ao VO₂máx" },
  { label: "Intervalado curto",zone: "R", description: "Tiros de 200–600 m em velocidade máxima" },
  { label: "Longão",           zone: "E", description: "Maior sessão da semana — resistência geral" },
] as const;

const inputClass =
  "w-full rounded-xl border border-border bg-background px-3.5 py-2.5 text-sm text-text placeholder:text-text-muted/50 outline-none transition-colors focus:border-primary/60 focus:ring-2 focus:ring-primary/20";
const labelClass = "mb-1.5 block text-xs font-semibold uppercase tracking-wider text-text-muted";

export default function VdotReferencePage() {
  const [athleteId, setAthleteId] = useState(athleteList[0].id);
  const [raceDistanceM, setRaceDistanceM] = useState<number>(RACE_DISTANCES[3].meters);
  const [raceTimeStr, setRaceTimeStr] = useState("");

  const athlete = useMemo(() => athleteList.find((a) => a.id === athleteId) ?? athleteList[0], [athleteId]);
  const vdot = useMemo(() => calculateVDOT(raceDistanceM, parseRaceTime(raceTimeStr)), [raceDistanceM, raceTimeStr]);
  const trainingPaces = useMemo(() => (vdot > 0 ? getTrainingPaces(vdot) : null), [vdot]);

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div>
        <Badge variant="primary" className="mb-2">Referência</Badge>
        <h1 className="font-display text-2xl font-bold text-text sm:text-3xl">
          Tabela de intensidade VDOT
        </h1>
        <p className="mt-1.5 text-sm text-text-muted">
          Informe o resultado de uma prova recente para calcular o VDOT (método Jack Daniels) e obter as faixas de
          pace ideais para cada zona de treinamento. Use esses valores na prescrição dentro da periodização.
        </p>
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        {/* Atleta + prova */}
        <Card>
          <CardContent className="space-y-4 p-5">
            <h3 className="font-display text-sm font-semibold text-text flex items-center gap-2">
              <Activity className="h-4 w-4 text-primary" /> Calcular VDOT
            </h3>

            <label className="block">
              <span className={labelClass}>Atleta</span>
              <select
                value={athleteId}
                onChange={(e) => { setAthleteId(e.target.value); setRaceTimeStr(""); }}
                className={inputClass}
              >
                {athleteList.map((a) => (
                  <option key={a.id} value={a.id} className="bg-card text-text">
                    {a.name} — {a.level}
                  </option>
                ))}
              </select>
            </label>

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

            {vdot > 0 && (
              <div className="flex items-center gap-3 rounded-xl border border-primary/30 bg-primary/10 px-4 py-3">
                <span className="text-sm text-text-muted">VDOT estimado de</span>
                <span className="font-display text-2xl font-bold text-text">{vdot.toFixed(1)}</span>
                <span className="text-sm text-text-muted">para {athlete.name.split(" ")[0]}</span>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Tipos de treino */}
        <Card>
          <CardContent className="p-5 space-y-3">
            <h3 className="font-display text-sm font-semibold text-text">Tipos de treino</h3>
            <div className="space-y-2">
              {runTypes.map((t) => {
                const zone = TRAINING_ZONES.find((z) => z.id === t.zone);
                const pace = trainingPaces ? trainingPaces[t.zone as keyof typeof trainingPaces] : null;
                return (
                  <div key={t.label} className="flex items-center gap-3 rounded-lg border border-border bg-card-hover/20 px-3 py-2.5">
                    <span
                      className="h-2.5 w-2.5 rounded-full shrink-0"
                      style={{ backgroundColor: zone?.color ?? "#888" }}
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-text">{t.label}</p>
                      <p className="text-[11px] text-text-muted">{t.description}</p>
                    </div>
                    {pace ? (
                      <span className="text-[11px] font-mono font-semibold text-text shrink-0">
                        {formatPace(pace.fastSecPerKm).replace("/km","–")}{formatPace(pace.slowSecPerKm)}
                      </span>
                    ) : (
                      <span
                        className="text-[11px] font-semibold shrink-0"
                        style={{ color: zone?.color ?? "#888" }}
                      >
                        Zona {t.zone}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Full VDOT zone table */}
      {trainingPaces && (
        <Card>
          <CardContent className="p-5">
            <h3 className="mb-4 font-display text-sm font-semibold text-text">
              Faixas de pace por zona — VDOT {vdot.toFixed(1)}
            </h3>
            <div className="overflow-hidden rounded-xl border border-border">
              <table className="w-full text-sm">
                <thead>
                  <tr className={cn("bg-card-hover/40 text-left text-[11px] uppercase tracking-wider text-text-muted")}>
                    <th className="px-4 py-3 font-medium">Zona</th>
                    <th className="px-4 py-3 font-medium">Pace alvo</th>
                    <th className="px-4 py-3 font-medium hidden sm:table-cell">Descrição</th>
                    <th className="px-4 py-3 font-medium hidden md:table-cell">Treinos indicados</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {TRAINING_ZONES.map((z) => {
                    const range = trainingPaces[z.id];
                    const types = runTypes.filter((t) => t.zone === z.id).map((t) => t.label).join(", ");
                    return (
                      <tr key={z.id} className="hover:bg-card-hover/20 transition-colors">
                        <td className="px-4 py-3">
                          <span className="inline-flex items-center gap-2 font-semibold" style={{ color: z.color }}>
                            <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: z.color }} />
                            {z.label}
                          </span>
                        </td>
                        <td className="px-4 py-3 font-mono font-semibold text-text">
                          {formatPace(range.fastSecPerKm).replace("/km", "")}–{formatPace(range.slowSecPerKm)}
                        </td>
                        <td className="px-4 py-3 text-text-muted hidden sm:table-cell">{z.description}</td>
                        <td className="px-4 py-3 text-text-muted text-xs hidden md:table-cell">{types || "—"}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <p className="mt-3 text-xs text-text-muted">
              Use esses valores como base na prescrição dentro da aba{" "}
              <span className="font-semibold text-text">Periodização</span>. O sistema aplica as zonas automaticamente
              ao gerar treinos com VDOT informado.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
