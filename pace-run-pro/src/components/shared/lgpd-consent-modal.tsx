"use client";

import { useEffect, useState } from "react";
import { MapPin, HeartPulse, ShieldCheck, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const STORAGE_KEY = "lgpd_consent_v1";

interface ConsentState {
  gps: boolean;
  health: boolean;
  decidedAt: string;
}

export function LgpdConsentModal() {
  const [show, setShow] = useState(false);
  const [saving, setSaving] = useState(false);
  const [gps, setGps] = useState(true);
  const [health, setHealth] = useState(true);

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) {
      // Delay slightly so the page renders first
      const t = setTimeout(() => setShow(true), 800);
      return () => clearTimeout(t);
    }
  }, []);

  async function handleAccept() {
    setSaving(true);
    try {
      await fetch("/api/atleta/lgpd-consent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ gps, health }),
      });
    } catch {
      // Silent — still persist locally so we don't show the modal again
    } finally {
      const state: ConsentState = { gps, health, decidedAt: new Date().toISOString() };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
      setSaving(false);
      setShow(false);
    }
  }

  function handleDecline() {
    const state: ConsentState = { gps: false, health: false, decidedAt: new Date().toISOString() };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    fetch("/api/atleta/lgpd-consent", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ gps: false, health: false }),
    }).catch(() => null);
    setShow(false);
  }

  if (!show) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center p-4 sm:items-center" role="dialog" aria-modal="true" aria-label="Consentimento de privacidade">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

      {/* Modal */}
      <div className="relative w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-2xl">
        <div className="flex items-start justify-between gap-3 mb-4">
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-primary shrink-0" />
            <h2 className="font-display text-base font-bold text-text">Privacidade dos seus dados</h2>
          </div>
          <Badge variant="primary" className="shrink-0">LGPD</Badge>
        </div>

        <p className="text-sm text-text-muted mb-5">
          Para oferecer treinos personalizados e análise de desempenho, precisamos do seu consentimento explícito para
          tratar os seguintes dados pessoais sensíveis, conforme a Lei Geral de Proteção de Dados (LGPD — Lei nº 13.709/2018):
        </p>

        <div className="space-y-3 mb-6">
          {/* GPS consent */}
          <label className="flex items-start gap-3 rounded-xl border border-border bg-card-hover p-4 cursor-pointer hover:border-primary/40 transition-colors">
            <input
              type="checkbox"
              checked={gps}
              onChange={(e) => setGps(e.target.checked)}
              className="mt-0.5 h-4 w-4 accent-primary"
            />
            <div className="flex-1">
              <div className="flex items-center gap-1.5 mb-1">
                <MapPin className="h-4 w-4 text-primary" />
                <span className="text-sm font-semibold text-text">Localização GPS</span>
              </div>
              <p className="text-xs text-text-muted leading-relaxed">
                Dados de rotas e trajetos de treinos sincronizados via Strava ou Garmin. Usados para análise de pace,
                altitude e perfil de percurso. Não compartilhados com terceiros.
              </p>
            </div>
          </label>

          {/* Health data consent */}
          <label className="flex items-start gap-3 rounded-xl border border-border bg-card-hover p-4 cursor-pointer hover:border-primary/40 transition-colors">
            <input
              type="checkbox"
              checked={health}
              onChange={(e) => setHealth(e.target.checked)}
              className="mt-0.5 h-4 w-4 accent-primary"
            />
            <div className="flex-1">
              <div className="flex items-center gap-1.5 mb-1">
                <HeartPulse className="h-4 w-4 text-danger" />
                <span className="text-sm font-semibold text-text">Dados de saúde</span>
              </div>
              <p className="text-xs text-text-muted leading-relaxed">
                Frequência cardíaca, potência, VO2 estimado, peso, histórico de lesões e métricas fisiológicas.
                Processados exclusivamente para personalização do treinamento pelo seu treinador.
              </p>
            </div>
          </label>
        </div>

        <p className="text-[11px] text-text-muted mb-4 leading-relaxed">
          Você pode revogar esses consentimentos a qualquer momento em{" "}
          <strong className="text-text">Configurações → Privacidade</strong>. O uso dos dados é regido pela nossa
          Política de Privacidade.
        </p>

        <div className="flex gap-3">
          <Button
            variant="outline"
            size="sm"
            className="flex-1"
            onClick={handleDecline}
            disabled={saving}
          >
            <X className="h-4 w-4 mr-1.5" />
            Recusar
          </Button>
          <Button
            size="sm"
            className="flex-1"
            onClick={handleAccept}
            disabled={saving}
          >
            {saving ? "Salvando…" : "Aceitar selecionados"}
          </Button>
        </div>
      </div>
    </div>
  );
}
