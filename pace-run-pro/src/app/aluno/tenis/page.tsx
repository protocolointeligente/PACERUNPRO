"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  AlertTriangle,
  ArrowLeft,
  ChevronDown,
  ChevronUp,
  Plus,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { shoesList, type Shoe } from "@/lib/mock-data";
import { cn } from "@/lib/utils";
import Link from "next/link";

const inputClass =
  "w-full rounded-xl border border-border bg-background px-3.5 py-2.5 text-sm text-text placeholder:text-text-muted/50 outline-none focus:border-primary/60 focus:ring-2 focus:ring-primary/20 transition-colors";

export default function TenisPage() {
  const [shoes, setShoes] = useState(shoesList);
  const [showAdd, setShowAdd] = useState(false);
  const [showRetired, setShowRetired] = useState(false);
  const [newName, setNewName] = useState("");
  const [newBrand, setNewBrand] = useState("");
  const [newModel, setNewModel] = useState("");
  const [newMaxKm, setNewMaxKm] = useState("700");

  function addShoe() {
    if (!newBrand || !newModel) return;
    const shoe: Shoe = {
      id: `sh-${Date.now()}`,
      name: newName || "Novo tênis",
      brand: newBrand,
      model: newModel,
      kmAccumulated: 0,
      maxKm: parseInt(newMaxKm) || 700,
      dateAdded: new Date().toISOString().slice(0, 10),
      color: "#8b5cf6",
      active: true,
      imageEmoji: "👟",
    };
    setShoes((prev) => [shoe, ...prev]);
    setNewName("");
    setNewBrand("");
    setNewModel("");
    setNewMaxKm("700");
    setShowAdd(false);
  }

  function retireShoe(id: string) {
    setShoes((prev) =>
      prev.map((s) => (s.id === id ? { ...s, active: false } : s))
    );
  }

  const activeShoes = shoes.filter((s) => s.active);
  const retiredShoes = shoes.filter((s) => !s.active);

  const totalKm = activeShoes.reduce((acc, s) => acc + s.kmAccumulated, 0);
  const nearLimit = activeShoes.filter(
    (s) => s.kmAccumulated / s.maxKm > 0.8
  ).length;

  function getStatus(shoe: Shoe) {
    const pct = shoe.kmAccumulated / shoe.maxKm;
    if (pct >= 1) return "esgotado";
    if (pct >= 0.85) return "trocar";
    if (pct >= 0.7) return "atenção";
    return "ok";
  }

  function getBarColor(status: string) {
    if (status === "ok") return "bg-success";
    if (status === "atenção") return "bg-warning";
    if (status === "trocar") return "bg-orange-400";
    return "bg-danger";
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      {/* Header */}
      <div className="space-y-3">
        <Link
          href="/aluno/perfil"
          className="inline-flex items-center gap-1.5 text-sm text-text-muted hover:text-text transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Voltar ao perfil
        </Link>

        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="space-y-1">
            <Badge variant="primary">Tênis</Badge>
            <h1 className="font-display text-2xl font-bold text-text sm:text-3xl">
              Monitoramento de tênis
            </h1>
            <p className="max-w-lg text-sm text-text-muted">
              Acompanhe o km acumulado em cada par e receba alertas antes de
              chegar ao limite de desgaste.
            </p>
          </div>
          <Button
            variant="primary"
            size="sm"
            onClick={() => setShowAdd(true)}
            className="shrink-0"
          >
            <Plus className="h-4 w-4" />
            Adicionar tênis
          </Button>
        </div>
      </div>

      {/* Add form */}
      <AnimatePresence>
        {showAdd && (
          <motion.div
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.2 }}
          >
            <Card>
              <CardContent className="space-y-4 pt-5">
                <h2 className="font-semibold text-text">Novo tênis</h2>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-text-muted">
                      Nome (ex: &ldquo;Para treinos longos&rdquo;)
                    </label>
                    <input
                      className={inputClass}
                      placeholder="Nome personalizado"
                      value={newName}
                      onChange={(e) => setNewName(e.target.value)}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-text-muted">
                      Marca <span className="text-danger">*</span>
                    </label>
                    <input
                      className={inputClass}
                      placeholder="Ex: Asics, Nike, Mizuno..."
                      value={newBrand}
                      onChange={(e) => setNewBrand(e.target.value)}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-text-muted">
                      Modelo <span className="text-danger">*</span>
                    </label>
                    <input
                      className={inputClass}
                      placeholder="Ex: Gel-Nimbus 26"
                      value={newModel}
                      onChange={(e) => setNewModel(e.target.value)}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-text-muted">
                      Km máximo recomendado
                    </label>
                    <input
                      className={inputClass}
                      type="number"
                      placeholder="700"
                      value={newMaxKm}
                      onChange={(e) => setNewMaxKm(e.target.value)}
                    />
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={addShoe}
                    disabled={!newBrand || !newModel}
                  >
                    Salvar
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowAdd(false)}
                  >
                    Cancelar
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Summary stats */}
      <div className="grid grid-cols-3 gap-3">
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-text">{activeShoes.length}</p>
            <p className="mt-0.5 text-xs text-text-muted">Pares ativos</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-text">
              {totalKm.toLocaleString("pt-BR")}
            </p>
            <p className="mt-0.5 text-xs text-text-muted">Km acumulados</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p
              className={cn(
                "text-2xl font-bold",
                nearLimit > 0 ? "text-warning" : "text-success"
              )}
            >
              {nearLimit}
            </p>
            <p className="mt-0.5 text-xs text-text-muted">Próximos do limite</p>
          </CardContent>
        </Card>
      </div>

      {/* Active shoes grid */}
      <div>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-widest text-text-muted">
          Tênis ativos
        </h2>
        <div className="grid gap-4 lg:grid-cols-2">
          {activeShoes.map((shoe, i) => {
            const pct = shoe.kmAccumulated / shoe.maxKm;
            const status = getStatus(shoe);
            const barColor = getBarColor(status);
            const remaining = shoe.maxKm - shoe.kmAccumulated;

            return (
              <motion.div
                key={shoe.id}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.06 }}
              >
                <Card className="overflow-hidden">
                  <CardContent className="space-y-4 p-5">
                    {/* Top row */}
                    <div className="flex items-start gap-3">
                      <div
                        className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl text-2xl"
                        style={{ backgroundColor: `${shoe.color}20`, border: `1.5px solid ${shoe.color}40` }}
                      >
                        {shoe.imageEmoji}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold text-text">
                          {shoe.brand} {shoe.model}
                        </p>
                        <p className="text-xs text-text-muted">{shoe.name}</p>
                        <div className="mt-1.5">
                          {status === "ok" && (
                            <Badge variant="success">Em ótimas condições</Badge>
                          )}
                          {status === "atenção" && (
                            <Badge variant="warning">Monitorar</Badge>
                          )}
                          {status === "trocar" && (
                            <Badge variant="danger">Considere trocar</Badge>
                          )}
                          {status === "esgotado" && (
                            <Badge variant="danger">Aposentar</Badge>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Km counter */}
                    <div className="space-y-2">
                      <div className="flex items-end justify-between">
                        <span className="text-3xl font-bold tabular-nums text-text">
                          {shoe.kmAccumulated.toLocaleString("pt-BR")}
                          <span className="ml-1 text-base font-normal text-text-muted">
                            km
                          </span>
                        </span>
                        <span className="text-sm text-text-muted">
                          de {shoe.maxKm.toLocaleString("pt-BR")} km
                        </span>
                      </div>
                      <Progress
                        value={pct * 100}
                        colorClassName={barColor}
                        className="h-2.5"
                      />
                      <p className="text-xs text-text-muted">
                        {remaining > 0
                          ? `${remaining.toLocaleString("pt-BR")} km restantes`
                          : "Limite atingido"}
                      </p>
                    </div>

                    {/* Alert box */}
                    {(status === "trocar" || status === "esgotado") && (
                      <div className="flex items-center gap-2 rounded-lg bg-warning/10 border border-warning/30 px-3 py-2 text-xs text-warning">
                        <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
                        {status === "esgotado"
                          ? "Este tênis ultrapassou o limite recomendado. Aposentar."
                          : "Próximo do limite. Comece a planejar a substituição."}
                      </div>
                    )}

                    {/* Footer */}
                    <div className="flex items-center justify-between border-t border-border pt-3">
                      <p className="text-xs text-text-muted">
                        Adicionado em:{" "}
                        {new Date(shoe.dateAdded + "T12:00:00").toLocaleDateString("pt-BR")}
                      </p>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-xs text-text-muted hover:text-danger"
                        onClick={() => retireShoe(shoe.id)}
                      >
                        Aposentar
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Retired shoes */}
      {retiredShoes.length > 0 && (
        <div>
          <button
            className="mb-3 flex w-full items-center justify-between text-sm font-semibold uppercase tracking-widest text-text-muted hover:text-text transition-colors"
            onClick={() => setShowRetired((v) => !v)}
          >
            <span>Tênis aposentados ({retiredShoes.length})</span>
            {showRetired ? (
              <ChevronUp className="h-4 w-4" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
          </button>

          <AnimatePresence>
            {showRetired && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.25 }}
                className="overflow-hidden"
              >
                <div className="grid gap-3 lg:grid-cols-2">
                  {retiredShoes.map((shoe) => {
                    const pct = shoe.kmAccumulated / shoe.maxKm;
                    return (
                      <Card key={shoe.id} className="opacity-60">
                        <CardContent className="flex items-center gap-3 p-4">
                          <div
                            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-lg"
                            style={{
                              backgroundColor: `${shoe.color}15`,
                              border: `1px solid ${shoe.color}30`,
                            }}
                          >
                            {shoe.imageEmoji}
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2">
                              <p className="text-sm font-semibold text-text">
                                {shoe.brand} {shoe.model}
                              </p>
                              <Badge variant="outline" className="text-[10px]">
                                Aposentado
                              </Badge>
                            </div>
                            <p className="text-xs text-text-muted">
                              {shoe.kmAccumulated.toLocaleString("pt-BR")} km /{" "}
                              {shoe.maxKm.toLocaleString("pt-BR")} km (
                              {Math.round(pct * 100)}%)
                            </p>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
