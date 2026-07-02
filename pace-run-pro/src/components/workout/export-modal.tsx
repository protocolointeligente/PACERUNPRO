"use client";

import { useState } from "react";
import { Download, Watch, Copy, Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DEVICE_EXPORT_FLAGS } from "@/lib/export/structured-workout-export";

interface ExportModalProps {
  workoutId: string;
  sport: string;
  onClose: () => void;
}

type DeviceStatus = "ready" | "coming_soon" | "error" | "sent";

interface DeviceOption {
  id: string;
  label: string;
  emoji: string;
  status: DeviceStatus;
  flagKey?: keyof typeof DEVICE_EXPORT_FLAGS;
}

const DEVICES: DeviceOption[] = [
  { id: "garmin",  label: "Garmin",  emoji: "⌚", status: "coming_soon", flagKey: "ENABLE_GARMIN_EXPORT" },
  { id: "coros",   label: "COROS",   emoji: "⌚", status: "coming_soon", flagKey: "ENABLE_COROS_EXPORT" },
  { id: "polar",   label: "Polar",   emoji: "⌚", status: "coming_soon", flagKey: "ENABLE_POLAR_EXPORT" },
  { id: "suunto",  label: "Suunto",  emoji: "⌚", status: "coming_soon", flagKey: "ENABLE_SUUNTO_EXPORT" },
];

type CopyState = "idle" | "copied";

export function ExportModal({ workoutId, sport, onClose }: ExportModalProps) {
  const [copyState, setCopyState] = useState<CopyState>("idle");

  const isBike = sport.toUpperCase() === "BIKE";

  const handleDownload = (format: "json" | "zwo" | "erg") => {
    window.open(`/api/workouts/${workoutId}/export/${format}`, "_blank");
  };

  const handleCopyId = async () => {
    try {
      await navigator.clipboard.writeText(workoutId);
      setCopyState("copied");
      setTimeout(() => setCopyState("idle"), 2000);
    } catch { /* permission denied */ }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
      role="dialog"
      aria-modal="true"
      aria-label="Exportar treino"
    >
      <div className="w-full sm:max-w-md bg-card border border-border rounded-t-2xl sm:rounded-2xl p-6 flex flex-col gap-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Watch size={20} className="text-primary" />
            <h2 className="text-base font-semibold">Enviar para relógio</h2>
          </div>
          <button onClick={onClose} aria-label="Fechar" className="text-text-muted hover:text-foreground">
            <X size={20} />
          </button>
        </div>

        {/* Device list */}
        <div className="grid grid-cols-2 gap-3">
          {DEVICES.map((device) => {
            const enabled = device.flagKey ? DEVICE_EXPORT_FLAGS[device.flagKey] : false;
            return (
              <button
                key={device.id}
                disabled={!enabled}
                className={`flex flex-col items-center gap-2 rounded-xl border p-4 transition-all ${
                  enabled
                    ? "border-primary/50 bg-primary/10 hover:bg-primary/20 cursor-pointer"
                    : "border-border bg-surface opacity-50 cursor-not-allowed"
                }`}
              >
                <span className="text-2xl">{device.emoji}</span>
                <span className="text-sm font-medium">{device.label}</span>
                {!enabled && (
                  <span className="text-xs text-text-muted bg-surface px-2 py-0.5 rounded-full">Em breve</span>
                )}
              </button>
            );
          })}
        </div>

        {/* Not-ready notice */}
        <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 p-3 text-xs text-amber-400">
          Preparado para integração. No momento, exporte o arquivo estruturado para usar no seu app ou plataforma.
        </div>

        {/* File downloads */}
        <div className="flex flex-col gap-2">
          <p className="text-xs font-semibold text-text-muted uppercase tracking-wider">Baixar arquivo</p>
          <div className="flex flex-col gap-2">
            <button
              onClick={() => handleDownload("json")}
              className="flex items-center gap-3 rounded-lg border border-border bg-surface hover:bg-card p-3 text-sm transition-colors"
            >
              <Download size={16} className="text-primary" />
              <div className="text-left">
                <p className="font-medium">JSON PACE RUN PRO</p>
                <p className="text-xs text-text-muted">Formato interno — todos os esportes</p>
              </div>
            </button>
            {isBike && (
              <>
                <button
                  onClick={() => handleDownload("zwo")}
                  className="flex items-center gap-3 rounded-lg border border-border bg-surface hover:bg-card p-3 text-sm transition-colors"
                >
                  <Download size={16} className="text-[#f97316]" />
                  <div className="text-left">
                    <p className="font-medium">ZWO (Zwift)</p>
                    <p className="text-xs text-text-muted">Treino estruturado para Zwift</p>
                  </div>
                </button>
                <button
                  onClick={() => handleDownload("erg")}
                  className="flex items-center gap-3 rounded-lg border border-border bg-surface hover:bg-card p-3 text-sm transition-colors"
                >
                  <Download size={16} className="text-[#f97316]" />
                  <div className="text-left">
                    <p className="font-medium">ERG (trainers)</p>
                    <p className="text-xs text-text-muted">Potência para rolo inteligente</p>
                  </div>
                </button>
              </>
            )}
          </div>
        </div>

        {/* Copy workout ID */}
        <Button variant="outline" size="sm" onClick={handleCopyId} className="gap-2">
          {copyState === "copied" ? <Check size={14} className="text-primary" /> : <Copy size={14} />}
          {copyState === "copied" ? "Copiado!" : "Copiar ID do treino"}
        </Button>
      </div>
    </div>
  );
}
