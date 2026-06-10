"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Chip } from "@/components/ui/chip";
import { Textarea } from "@/components/ui/textarea";
import { TopBar } from "@/components/layout/top-bar";
import { useAppStore } from "@/lib/store/useAppStore";
import { todayIso } from "@/lib/utils";

interface MetricaConfig {
  key: "humor" | "energia" | "sono" | "fome" | "dorMuscular" | "estresse";
  label: string;
  inicio: string;
  fim: string;
}

const METRICAS: MetricaConfig[] = [
  { key: "humor", label: "Humor", inicio: "Ruim", fim: "Ótimo" },
  { key: "energia", label: "Energia", inicio: "Baixa", fim: "Alta" },
  { key: "sono", label: "Sono", inicio: "Ruim", fim: "Ótimo" },
  { key: "fome", label: "Fome", inicio: "Baixa", fim: "Alta" },
  { key: "dorMuscular", label: "Dor muscular", inicio: "Nenhuma", fim: "Intensa" },
  { key: "estresse", label: "Estresse", inicio: "Baixo", fim: "Alto" },
];

export default function CheckinPage() {
  const router = useRouter();
  const checkins = useAppStore((s) => s.checkins);
  const addCheckIn = useAppStore((s) => s.addCheckIn);

  const hoje = todayIso();
  const checkinHoje = checkins.find((c) => c.data === hoje);

  const [humor, setHumor] = useState(checkinHoje?.humor ?? 3);
  const [energia, setEnergia] = useState(checkinHoje?.energia ?? 3);
  const [sono, setSono] = useState(checkinHoje?.sono ?? 3);
  const [fome, setFome] = useState(checkinHoje?.fome ?? 3);
  const [dorMuscular, setDorMuscular] = useState(checkinHoje?.dorMuscular ?? 3);
  const [estresse, setEstresse] = useState(checkinHoje?.estresse ?? 3);
  const [comentario, setComentario] = useState(checkinHoje?.comentario ?? "");
  const [salvo, setSalvo] = useState(false);

  const valores: Record<MetricaConfig["key"], number> = {
    humor,
    energia,
    sono,
    fome,
    dorMuscular,
    estresse,
  };

  const setters: Record<MetricaConfig["key"], (valor: number) => void> = {
    humor: setHumor,
    energia: setEnergia,
    sono: setSono,
    fome: setFome,
    dorMuscular: setDorMuscular,
    estresse: setEstresse,
  };

  function handleSalvar() {
    addCheckIn({
      data: hoje,
      humor,
      energia,
      sono,
      fome,
      dorMuscular,
      estresse,
      comentario: comentario || undefined,
    });
    setSalvo(true);
  }

  return (
    <div className="flex flex-col gap-4 px-4 py-4">
      <TopBar title="Check-in diário" subtitle="Como você está se sentindo hoje?" showBack />

      {salvo ? (
        <Card className="flex flex-col items-center gap-3 py-8 text-center">
          <CheckCircle className="h-12 w-12 text-success" />
          <p className="font-display text-lg font-bold text-text">Check-in salvo! +10 XP</p>
          <Button className="w-full" size="lg" variant="primary" onClick={() => router.push("/aluno/dashboard")}>
            Voltar ao início
          </Button>
        </Card>
      ) : (
        <>
          {checkinHoje && (
            <Badge variant="default" className="w-fit">
              Check-in já registrado hoje — você pode atualizar abaixo.
            </Badge>
          )}

          <div className="flex flex-col gap-3">
            {METRICAS.map((metrica) => (
              <Card key={metrica.key}>
                <CardTitle className="mb-3">{metrica.label}</CardTitle>
                <div className="flex justify-between gap-2">
                  {[1, 2, 3, 4, 5].map((valor) => (
                    <Chip
                      key={valor}
                      selected={valores[metrica.key] === valor}
                      onClick={() => setters[metrica.key](valor)}
                      className="flex-1 justify-center"
                    >
                      {valor}
                    </Chip>
                  ))}
                </div>
                <div className="mt-2 flex justify-between text-xs text-text-muted">
                  <span>{metrica.inicio}</span>
                  <span>{metrica.fim}</span>
                </div>
              </Card>
            ))}
          </div>

          <Textarea
            label="Observações (opcional)"
            placeholder="Como foi seu dia? Algo a destacar?"
            value={comentario}
            onChange={(e) => setComentario(e.target.value)}
          />

          <Button className="w-full" size="lg" variant="primary" onClick={handleSalvar}>
            Salvar check-in
          </Button>
        </>
      )}
    </div>
  );
}
