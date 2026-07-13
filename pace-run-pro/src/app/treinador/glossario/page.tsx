"use client";

import { BookOpen, Dumbbell, Footprints, Waves, Bike, BarChart3 } from "lucide-react";
import { Card } from "@/components/ui/card";

const TERMS = [
  { icon: Footprints, title: "Corrida", text: "Pace, zonas, RPE, volume semanal, longao, limiar, VO2 e tapering." },
  { icon: Bike, title: "Ciclismo", text: "FTP, watts, cadencia, zonas de potencia, carga aguda e cronica." },
  { icon: Waves, title: "Natacao", text: "CSS, ritmo por 100 m, metragem, tecnica, recuperacao e intervalos." },
  { icon: Dumbbell, title: "Forca", text: "Series, repeticoes, carga, RPE, RIR, descanso e progressao de volume." },
  { icon: BarChart3, title: "Periodizacao", text: "Macrociclo, mesociclo, microciclo, descarga, tapering e prioridade de prova." },
];

export default function CoachGlossaryPage() {
  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div>
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-primary">Glossario</p>
        <h1 className="mt-2 font-display text-3xl font-bold text-text">Base de termos do treinador</h1>
        <p className="mt-2 max-w-2xl text-sm text-text-muted">
          Referencia rapida para prescricao, controle de carga, periodizacao e comunicacao com atletas.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {TERMS.map((term) => {
          const Icon = term.icon;
          return (
            <Card key={term.title} className="border-white/10 bg-[#07111c]/80 p-5 shadow-xl shadow-black/15">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/15 text-primary">
                <Icon className="h-5 w-5" />
              </div>
              <h2 className="mt-4 text-lg font-semibold text-text">{term.title}</h2>
              <p className="mt-2 text-sm leading-relaxed text-text-muted">{term.text}</p>
            </Card>
          );
        })}
      </div>

      <Card className="border-primary/25 bg-primary/10 p-5">
        <div className="flex items-start gap-3">
          <BookOpen className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
          <div>
            <h2 className="text-base font-semibold text-text">Padrao de prescricao</h2>
            <p className="mt-1 text-sm leading-relaxed text-text-muted">
              Use listas suspensas sempre que possivel, mantenha o calendario como fonte da verdade e libere treinos
              aceitos pelo Intelligence diretamente para o calendario mensal do atleta.
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
}
