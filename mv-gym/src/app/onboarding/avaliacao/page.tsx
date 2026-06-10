"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useAppStore } from "@/lib/store/useAppStore";
import { calcIMC, classificarIMC } from "@/lib/utils";
import type { Circunferencias } from "@/lib/types";

interface MedidaCampo {
  key: keyof Circunferencias;
  label: string;
}

const MEDIDAS: MedidaCampo[] = [
  { key: "cintura", label: "Cintura" },
  { key: "quadril", label: "Quadril" },
  { key: "peito", label: "Peito" },
  { key: "bracoDireito", label: "Braço direito" },
  { key: "bracoEsquerdo", label: "Braço esquerdo" },
  { key: "coxaDireita", label: "Coxa direita" },
  { key: "coxaEsquerda", label: "Coxa esquerda" },
  { key: "panturrilhaDireita", label: "Panturrilha direita" },
  { key: "panturrilhaEsquerda", label: "Panturrilha esquerda" },
  { key: "abdomen", label: "Abdômen" },
];

export default function OnboardingAvaliacaoPage() {
  const router = useRouter();
  const usuario = useAppStore((s) => s.usuario);
  const addAvaliacao = useAppStore((s) => s.addAvaliacao);

  const [peso, setPeso] = useState(usuario?.pesoKg ? String(usuario.pesoKg) : "");
  const [altura, setAltura] = useState(usuario?.alturaCm ? String(usuario.alturaCm) : "");
  const [percGordura, setPercGordura] = useState("");
  const [massaMuscular, setMassaMuscular] = useState("");

  const [mostrarMedidas, setMostrarMedidas] = useState(false);
  const [medidas, setMedidas] = useState<Record<string, string>>({});

  const pesoNum = Number(peso);
  const alturaNum = Number(altura);
  const imc = pesoNum > 0 && alturaNum > 0 ? calcIMC(pesoNum, alturaNum) : null;

  function handleMedidaChange(key: keyof Circunferencias, value: string) {
    setMedidas((prev) => ({ ...prev, [key]: value }));
  }

  function handleContinuar() {
    const circunferencias: Circunferencias = {};
    MEDIDAS.forEach(({ key }) => {
      const valor = medidas[key];
      if (valor && valor.trim() !== "") {
        circunferencias[key] = Number(valor);
      }
    });

    addAvaliacao({
      data: new Date().toISOString(),
      pesoKg: Number(peso),
      alturaCm: Number(altura),
      percentualGordura: percGordura ? Number(percGordura) : undefined,
      massaMuscularKg: massaMuscular ? Number(massaMuscular) : undefined,
      circunferencias,
    });

    router.push("/onboarding/preferencias");
  }

  const podeContinuar = !!peso && Number(peso) > 0 && !!altura && Number(altura) > 0;

  return (
    <div className="flex flex-col pb-24">
      <h1 className="font-display text-2xl font-extrabold">Avaliação física inicial</h1>
      <p className="mt-2 text-text-muted">
        Esses dados nos ajudam a calcular seu plano nutricional e acompanhar sua evolução.
      </p>

      <div className="mt-6 flex flex-col gap-4">
        <Input
          label="Peso atual (kg)"
          type="number"
          placeholder="Ex: 78"
          value={peso}
          onChange={(e) => setPeso(e.target.value)}
        />
        <Input
          label="Altura (cm)"
          type="number"
          placeholder="Ex: 178"
          value={altura}
          onChange={(e) => setAltura(e.target.value)}
        />

        {imc !== null && (
          <Badge variant="default" className="w-fit">
            IMC {imc.toFixed(1)} · {classificarIMC(imc)}
          </Badge>
        )}

        <Input
          label="Percentual de gordura (%) — opcional"
          type="number"
          placeholder="Ex: 18"
          value={percGordura}
          onChange={(e) => setPercGordura(e.target.value)}
        />
        <Input
          label="Massa muscular (kg) — opcional"
          type="number"
          placeholder="Ex: 35"
          value={massaMuscular}
          onChange={(e) => setMassaMuscular(e.target.value)}
        />
      </div>

      <div className="mt-6">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => setMostrarMedidas((prev) => !prev)}
        >
          {mostrarMedidas ? "Ocultar medidas" : "Adicionar medidas"}
        </Button>

        {mostrarMedidas && (
          <div className="mt-4">
            <h2 className="font-display text-lg font-bold">Medidas corporais (opcional)</h2>
            <div className="mt-3 grid grid-cols-2 gap-3">
              {MEDIDAS.map((medida) => (
                <Input
                  key={medida.key}
                  label={medida.label}
                  type="number"
                  placeholder="cm"
                  value={medidas[medida.key] ?? ""}
                  onChange={(e) => handleMedidaChange(medida.key, e.target.value)}
                />
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-border bg-background/95 px-6 py-4 backdrop-blur safe-bottom">
        <div className="mx-auto w-full max-w-md">
          <Button size="lg" className="w-full" disabled={!podeContinuar} onClick={handleContinuar}>
            Continuar
          </Button>
        </div>
      </div>
    </div>
  );
}
