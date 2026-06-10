"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Chip } from "@/components/ui/chip";
import { Input } from "@/components/ui/input";
import { DynamicIcon } from "@/components/ui/dynamic-icon";
import { useAppStore } from "@/lib/store/useAppStore";
import { OBJETIVOS } from "@/lib/data/options";
import { cn } from "@/lib/utils";
import type { NivelExperiencia, Objetivo } from "@/lib/types";

const NIVEIS: { id: NivelExperiencia; label: string }[] = [
  { id: "iniciante", label: "Iniciante" },
  { id: "intermediario", label: "Intermediário" },
  { id: "avancado", label: "Avançado" },
];

export default function OnboardingObjetivoPage() {
  const router = useRouter();
  const setObjetivo = useAppStore((s) => s.setObjetivo);

  const [objetivo, setObjetivoSelecionado] = useState<Objetivo | null>(null);
  const [nivel, setNivel] = useState<NivelExperiencia | null>(null);
  const [pesoMeta, setPesoMeta] = useState("");

  const podeContinuar = !!objetivo && !!nivel;

  function handleContinuar() {
    if (!objetivo || !nivel) return;
    setObjetivo(objetivo, nivel, pesoMeta ? Number(pesoMeta) : undefined);
    router.push("/onboarding/avaliacao");
  }

  return (
    <div className="flex flex-col pb-24">
      <h1 className="font-display text-2xl font-extrabold">Qual é o seu objetivo?</h1>
      <p className="mt-2 text-text-muted">
        Vamos personalizar seu plano de treino com IA.
      </p>

      <div className="mt-6 grid grid-cols-2 gap-3">
        {OBJETIVOS.map((obj) => (
          <button
            key={obj.id}
            type="button"
            onClick={() => setObjetivoSelecionado(obj.id)}
            className={cn(
              "flex flex-col items-start gap-2 rounded-2xl border p-4 text-left transition-colors",
              objetivo === obj.id
                ? "border-primary bg-primary/10"
                : "border-border bg-card hover:bg-card-hover",
            )}
          >
            <DynamicIcon name={obj.icone} className="h-6 w-6 text-primary" />
            <span className="font-semibold">{obj.label}</span>
            <span className="text-xs text-text-muted">{obj.descricao}</span>
          </button>
        ))}
      </div>

      <h2 className="mt-8 font-display text-lg font-bold">Qual seu nível de experiência?</h2>
      <div className="mt-3 flex flex-wrap gap-2">
        {NIVEIS.map((n) => (
          <Chip key={n.id} selected={nivel === n.id} onClick={() => setNivel(n.id)}>
            {n.label}
          </Chip>
        ))}
      </div>

      <div className="mt-6">
        <Input
          label="Peso meta (kg) — opcional"
          type="number"
          placeholder="Ex: 75"
          value={pesoMeta}
          onChange={(e) => setPesoMeta(e.target.value)}
        />
      </div>

      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-border bg-background/95 px-6 py-4 backdrop-blur safe-bottom">
        <div className="mx-auto w-full max-w-md">
          <Button
            size="lg"
            className="w-full"
            disabled={!podeContinuar}
            onClick={handleContinuar}
          >
            Continuar
          </Button>
        </div>
      </div>
    </div>
  );
}
