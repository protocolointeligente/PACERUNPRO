"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { LoaderCircle, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Chip } from "@/components/ui/chip";
import { DynamicIcon } from "@/components/ui/dynamic-icon";
import { useAppStore } from "@/lib/store/useAppStore";
import { LOCAIS_TREINO, EQUIPAMENTOS_DISPONIVEIS } from "@/lib/data/options";
import type { LocalTreino } from "@/lib/types";

const DIAS_OPCOES = [1, 2, 3, 4, 5, 6, 7];

const TEMPO_OPCOES = [
  { label: "30 min", valor: 30 },
  { label: "45 min", valor: 45 },
  { label: "60 min", valor: 60 },
  { label: "75 min", valor: 75 },
  { label: "90 min", valor: 90 },
];

export default function OnboardingPreferenciasPage() {
  const router = useRouter();
  const setPreferencias = useAppStore((s) => s.setPreferencias);

  const [local, setLocal] = useState<LocalTreino | null>(null);
  const [equipamentos, setEquipamentos] = useState<string[]>([...EQUIPAMENTOS_DISPONIVEIS]);
  const [diasPorSemana, setDiasPorSemana] = useState(4);
  const [tempoDisponivelMin, setTempoDisponivelMin] = useState(60);
  const [gerando, setGerando] = useState(false);

  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  function toggleEquipamento(equipamento: string) {
    setEquipamentos((prev) =>
      prev.includes(equipamento)
        ? prev.filter((item) => item !== equipamento)
        : [...prev, equipamento],
    );
  }

  function handleGerarPlano() {
    if (!local || equipamentos.length === 0) return;

    setGerando(true);
    timeoutRef.current = setTimeout(() => {
      setPreferencias({ local, equipamentos, diasPorSemana, tempoDisponivelMin });
      router.push("/aluno/dashboard");
    }, 900);
  }

  const podeContinuar = !!local && equipamentos.length > 0;

  return (
    <div className="flex flex-col pb-24">
      <h1 className="font-display text-2xl font-extrabold">Suas preferências de treino</h1>
      <p className="mt-2 text-text-muted">
        Última etapa! Vamos gerar seu plano personalizado com IA.
      </p>

      <h2 className="mt-8 font-display text-lg font-bold">Onde você treina?</h2>
      <div className="mt-3 flex flex-wrap gap-2">
        {LOCAIS_TREINO.map((loc) => (
          <Chip key={loc.id} selected={local === loc.id} onClick={() => setLocal(loc.id)}>
            <DynamicIcon name={loc.icone} className="h-4 w-4" />
            {loc.label}
          </Chip>
        ))}
      </div>

      <h2 className="mt-8 font-display text-lg font-bold">
        Quais equipamentos você tem disponível?
      </h2>
      <div className="mt-3 flex flex-wrap gap-2">
        {EQUIPAMENTOS_DISPONIVEIS.map((equipamento) => (
          <Chip
            key={equipamento}
            selected={equipamentos.includes(equipamento)}
            onClick={() => toggleEquipamento(equipamento)}
            className="capitalize"
          >
            {equipamento}
          </Chip>
        ))}
      </div>

      <h2 className="mt-8 font-display text-lg font-bold">
        Quantos dias por semana você pode treinar?
      </h2>
      <div className="mt-3 flex flex-wrap gap-2">
        {DIAS_OPCOES.map((dia) => (
          <Chip
            key={dia}
            selected={diasPorSemana === dia}
            onClick={() => setDiasPorSemana(dia)}
          >
            {dia}
          </Chip>
        ))}
      </div>

      <h2 className="mt-8 font-display text-lg font-bold">Quanto tempo por sessão?</h2>
      <div className="mt-3 flex flex-wrap gap-2">
        {TEMPO_OPCOES.map((opcao) => (
          <Chip
            key={opcao.valor}
            selected={tempoDisponivelMin === opcao.valor}
            onClick={() => setTempoDisponivelMin(opcao.valor)}
          >
            {opcao.label}
          </Chip>
        ))}
      </div>

      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-border bg-background/95 px-6 py-4 backdrop-blur safe-bottom">
        <div className="mx-auto w-full max-w-md">
          <Button
            size="lg"
            className="w-full"
            disabled={!podeContinuar || gerando}
            onClick={handleGerarPlano}
          >
            {gerando ? (
              <>
                <LoaderCircle className="h-5 w-5 animate-spin" />
                Gerando seu plano...
              </>
            ) : (
              <>
                Gerar meu plano com IA <Sparkles className="h-5 w-5" />
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
