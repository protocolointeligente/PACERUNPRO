"use client";

import { useState } from "react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";
import { Camera, TrendingDown, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { TopBar } from "@/components/layout/top-bar";
import { useAppStore } from "@/lib/store/useAppStore";
import { calcIMC, classificarIMC, formatDate } from "@/lib/utils";
import type { Circunferencias } from "@/lib/types";

const CIRCUNFERENCIA_LABELS: Record<keyof Circunferencias, string> = {
  cintura: "Cintura",
  quadril: "Quadril",
  peito: "Peito",
  bracoDireito: "Braço direito",
  bracoEsquerdo: "Braço esquerdo",
  coxaDireita: "Coxa direita",
  coxaEsquerda: "Coxa esquerda",
  panturrilhaDireita: "Panturrilha direita",
  panturrilhaEsquerda: "Panturrilha esquerda",
  abdomen: "Abdômen",
};

const CIRCUNFERENCIA_KEYS = Object.keys(CIRCUNFERENCIA_LABELS) as (keyof Circunferencias)[];

export default function EvolucaoPage() {
  const usuario = useAppStore((s) => s.usuario);
  const avaliacoes = useAppStore((s) => s.avaliacoes);
  const registrosTreino = useAppStore((s) => s.registrosTreino);
  const addAvaliacao = useAppStore((s) => s.addAvaliacao);

  const [open, setOpen] = useState(false);
  const [peso, setPeso] = useState("");
  const [altura, setAltura] = useState("");
  const [percentualGordura, setPercentualGordura] = useState("");
  const [massaMuscular, setMassaMuscular] = useState("");
  const [cintura, setCintura] = useState("");
  const [peito, setPeito] = useState("");
  const [bracoDireito, setBracoDireito] = useState("");
  const [coxaDireita, setCoxaDireita] = useState("");

  const ultimaAvaliacao = avaliacoes[0];
  const imcAtual = ultimaAvaliacao ? calcIMC(ultimaAvaliacao.pesoKg, ultimaAvaliacao.alturaCm) : null;

  const pesoChartData = [...avaliacoes].reverse().map((a) => ({
    data: formatDate(a.data),
    peso: a.pesoKg,
  }));

  const treinoChartData = [...registrosTreino]
    .slice(0, 8)
    .reverse()
    .map((r) => ({
      data: formatDate(r.data),
      volume: Math.round(r.volumeTotalKg),
    }));

  const atual = avaliacoes[0];
  const anterior = avaliacoes[1];

  function handleOpenChange(isOpen: boolean) {
    setOpen(isOpen);
    if (isOpen) {
      setPeso(String(ultimaAvaliacao?.pesoKg ?? usuario?.pesoKg ?? ""));
      setAltura(String(ultimaAvaliacao?.alturaCm ?? usuario?.alturaCm ?? ""));
      setPercentualGordura("");
      setMassaMuscular("");
      setCintura("");
      setPeito("");
      setBracoDireito("");
      setCoxaDireita("");
    }
  }

  function handleSalvarAvaliacao() {
    if (!peso || !altura) return;

    const circunferencias: Circunferencias = {};
    if (cintura) circunferencias.cintura = Number(cintura);
    if (peito) circunferencias.peito = Number(peito);
    if (bracoDireito) circunferencias.bracoDireito = Number(bracoDireito);
    if (coxaDireita) circunferencias.coxaDireita = Number(coxaDireita);

    addAvaliacao({
      data: new Date().toISOString(),
      pesoKg: Number(peso),
      alturaCm: Number(altura),
      percentualGordura: percentualGordura ? Number(percentualGordura) : undefined,
      massaMuscularKg: massaMuscular ? Number(massaMuscular) : undefined,
      circunferencias,
    });

    setOpen(false);
  }

  return (
    <div className="flex flex-col gap-4 px-4 py-4">
      <TopBar title="Evolução" subtitle="Acompanhe seu progresso" />

      <Card>
        <div className="grid grid-cols-3 gap-2 text-center">
          <div>
            <p className="font-display text-xl font-extrabold text-text">
              {ultimaAvaliacao?.pesoKg ?? "—"}
            </p>
            <p className="mt-1 text-xs text-text-muted">Peso atual (kg)</p>
          </div>
          <div>
            <p className="font-display text-xl font-extrabold text-text">
              {usuario?.pesoMetaKg ?? "—"}
            </p>
            <p className="mt-1 text-xs text-text-muted">Meta (kg)</p>
          </div>
          <div>
            <p className="font-display text-xl font-extrabold text-text">{imcAtual ?? "—"}</p>
            {imcAtual !== null && (
              <Badge variant="default" className="mt-1">
                {classificarIMC(imcAtual)}
              </Badge>
            )}
            {imcAtual === null && <p className="mt-1 text-xs text-text-muted">IMC</p>}
          </div>
        </div>
      </Card>

      <Tabs defaultValue="peso">
        <TabsList className="w-full">
          <TabsTrigger value="peso">Peso</TabsTrigger>
          <TabsTrigger value="medidas">Medidas</TabsTrigger>
          <TabsTrigger value="treinos">Treinos</TabsTrigger>
          <TabsTrigger value="fotos">Fotos</TabsTrigger>
        </TabsList>

        <TabsContent value="peso">
          {avaliacoes.length === 0 ? (
            <Card>
              <p className="text-sm text-text-muted">Nenhuma avaliação registrada ainda.</p>
            </Card>
          ) : (
            <Card>
              <CardTitle className="mb-3">Peso ao longo do tempo</CardTitle>
              <div style={{ width: "100%", height: 220 }}>
                <ResponsiveContainer>
                  <LineChart data={pesoChartData}>
                    <CartesianGrid stroke="#1F2937" strokeDasharray="3 3" />
                    <XAxis dataKey="data" tick={{ fill: "#AAB3C5", fontSize: 11 }} />
                    <YAxis
                      tick={{ fill: "#AAB3C5", fontSize: 11 }}
                      domain={["dataMin - 2", "dataMax + 2"]}
                    />
                    <Tooltip
                      contentStyle={{
                        background: "#121923",
                        border: "1px solid #1F2937",
                        borderRadius: 12,
                        color: "#FFFFFF",
                      }}
                    />
                    <Line type="monotone" dataKey="peso" stroke="#C6FF00" strokeWidth={2} dot={{ r: 3 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="medidas">
          {avaliacoes.length === 0 ? (
            <Card>
              <p className="text-sm text-text-muted">Nenhuma avaliação registrada ainda.</p>
            </Card>
          ) : (
            <div className="flex flex-col gap-3">
              {CIRCUNFERENCIA_KEYS.filter(
                (key) => atual.circunferencias[key] !== undefined,
              ).map((key) => {
                const valorAtual = atual.circunferencias[key]!;
                const valorAnterior = anterior?.circunferencias[key];
                const delta =
                  valorAnterior !== undefined ? Math.round((valorAtual - valorAnterior) * 10) / 10 : null;

                return (
                  <Card key={key} className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-text">{CIRCUNFERENCIA_LABELS[key]}</p>
                      <p className="font-display text-lg font-bold text-text">{valorAtual} cm</p>
                    </div>
                    {delta !== null && delta !== 0 && (
                      <Badge variant={delta < 0 ? "success" : "default"}>
                        {delta < 0 ? (
                          <TrendingDown className="h-3.5 w-3.5" />
                        ) : (
                          <TrendingUp className="h-3.5 w-3.5" />
                        )}
                        {delta > 0 ? "+" : ""}
                        {delta} cm
                      </Badge>
                    )}
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>

        <TabsContent value="treinos">
          {registrosTreino.length === 0 ? (
            <Card>
              <p className="text-sm text-text-muted">Nenhum treino registrado ainda.</p>
            </Card>
          ) : (
            <Card>
              <CardTitle className="mb-3">Volume de treino (kg)</CardTitle>
              <div style={{ width: "100%", height: 220 }}>
                <ResponsiveContainer>
                  <BarChart data={treinoChartData}>
                    <CartesianGrid stroke="#1F2937" strokeDasharray="3 3" />
                    <XAxis dataKey="data" tick={{ fill: "#AAB3C5", fontSize: 11 }} />
                    <YAxis tick={{ fill: "#AAB3C5", fontSize: 11 }} />
                    <Tooltip
                      contentStyle={{
                        background: "#121923",
                        border: "1px solid #1F2937",
                        borderRadius: 12,
                        color: "#FFFFFF",
                      }}
                    />
                    <Bar dataKey="volume" fill="#C6FF00" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="fotos">
          <div className="grid grid-cols-3 gap-2">
            {["Frente", "Lado", "Costas"].map((label) => (
              <div
                key={label}
                className="flex aspect-square flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-border text-xs text-text-muted"
              >
                <Camera className="h-5 w-5" />
                {label}
              </div>
            ))}
          </div>
          <p className="mt-3 text-xs text-text-muted">
            Comparação de fotos de progresso estará disponível em breve.
          </p>
        </TabsContent>
      </Tabs>

      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogTrigger asChild>
          <Button className="w-full" variant="secondary">
            Nova avaliação física
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nova avaliação física</DialogTitle>
          </DialogHeader>

          <div className="flex flex-col gap-3">
            <div className="grid grid-cols-2 gap-3">
              <Input
                label="Peso (kg)"
                type="number"
                inputMode="decimal"
                value={peso}
                onChange={(e) => setPeso(e.target.value)}
              />
              <Input
                label="Altura (cm)"
                type="number"
                inputMode="decimal"
                value={altura}
                onChange={(e) => setAltura(e.target.value)}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <Input
                label="% gordura (opcional)"
                type="number"
                inputMode="decimal"
                value={percentualGordura}
                onChange={(e) => setPercentualGordura(e.target.value)}
              />
              <Input
                label="Massa muscular (kg)"
                type="number"
                inputMode="decimal"
                value={massaMuscular}
                onChange={(e) => setMassaMuscular(e.target.value)}
              />
            </div>

            <CardDescription>Medidas (opcional)</CardDescription>

            <div className="grid grid-cols-2 gap-3">
              <Input
                label="Cintura (cm)"
                type="number"
                inputMode="decimal"
                value={cintura}
                onChange={(e) => setCintura(e.target.value)}
              />
              <Input
                label="Peito (cm)"
                type="number"
                inputMode="decimal"
                value={peito}
                onChange={(e) => setPeito(e.target.value)}
              />
              <Input
                label="Braço direito (cm)"
                type="number"
                inputMode="decimal"
                value={bracoDireito}
                onChange={(e) => setBracoDireito(e.target.value)}
              />
              <Input
                label="Coxa direita (cm)"
                type="number"
                inputMode="decimal"
                value={coxaDireita}
                onChange={(e) => setCoxaDireita(e.target.value)}
              />
            </div>

            <Button className="mt-2 w-full" variant="primary" onClick={handleSalvarAvaliacao}>
              Salvar avaliação
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
