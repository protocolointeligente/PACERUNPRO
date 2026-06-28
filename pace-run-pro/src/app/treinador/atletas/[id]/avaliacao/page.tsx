"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, ClipboardList, Loader2, Plus, Shield } from "lucide-react";

interface PhysicalAssessment {
  id: string;
  assessedAt: string;
  weightKg: number | null;
  bodyFatPct: number | null;
  muscleMassKg: number | null;
  bmi: number | null;
  neckCm: number | null;
  chestCm: number | null;
  waistCm: number | null;
  hipCm: number | null;
  thighCm: number | null;
  calfCm: number | null;
  armCm: number | null;
  forearmCm: number | null;
  vo2max: number | null;
  restingHr: number | null;
  hrv: number | null;
  flexibilityScore: number | null;
  notes: string | null;
}

const inputClass = "w-full rounded-xl border border-border bg-background px-3.5 py-2.5 text-sm text-text placeholder:text-text-muted/50 outline-none focus:border-primary/60 focus:ring-2 focus:ring-primary/20 transition-colors";

export default function AvaliacaoFisicaPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: athleteId } = use(params);

  const [assessments, setAssessments] = useState<PhysicalAssessment[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const [form, setForm] = useState({
    assessedAt: new Date().toISOString().split("T")[0],
    weightKg: "", bodyFatPct: "", muscleMassKg: "", bmi: "",
    neckCm: "", chestCm: "", waistCm: "", hipCm: "", thighCm: "", calfCm: "", armCm: "", forearmCm: "",
    vo2max: "", restingHr: "", hrv: "", flexibilityScore: "",
    notes: "", lgpdConsent: false,
  });

  function setField(key: string, value: string | boolean) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function load() {
    setLoading(true);
    try {
      const res = await fetch(`/api/coach/athletes/${athleteId}/avaliacao`);
      if (res.ok) {
        const data = await res.json();
        setAssessments(data.assessments);
      }
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, [athleteId]);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!form.lgpdConsent) { setError("É necessário obter e confirmar o consentimento LGPD do atleta."); return; }
    setSaving(true);
    try {
      const payload = Object.fromEntries(
        Object.entries(form).map(([k, v]) => {
          if (k === "lgpdConsent" || k === "assessedAt" || k === "notes") return [k, v];
          if (v === "") return [k, null];
          return [k, Number(v)];
        })
      );
      const res = await fetch(`/api/coach/athletes/${athleteId}/avaliacao`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) { const d = await res.json(); setError(d.error ?? "Erro ao salvar."); return; }
      setShowForm(false);
      await load();
    } catch {
      setError("Erro de rede. Tente novamente.");
    } finally {
      setSaving(false);
    }
  }

  const latest = assessments[0];

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <Link href={`/treinador/atletas/${athleteId}`} className="mb-3 inline-flex items-center gap-1.5 text-xs font-semibold text-text-muted hover:text-text">
          <ArrowLeft className="h-3.5 w-3.5" />
          Voltar ao perfil
        </Link>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ClipboardList className="h-5 w-5 text-primary" />
            <h1 className="font-display text-2xl font-bold text-text">Avaliação Física</h1>
          </div>
          <button onClick={() => setShowForm(!showForm)} className="flex items-center gap-1.5 rounded-xl border border-primary/40 bg-primary/10 px-3 py-2 text-xs font-bold text-primary hover:bg-primary/20 transition-colors">
            <Plus className="h-3.5 w-3.5" />
            Nova avaliação
          </button>
        </div>
      </div>

      {/* LGPD notice */}
      <div className="flex items-start gap-3 rounded-xl border border-border/60 bg-card/60 px-4 py-3">
        <Shield className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
        <p className="text-xs text-text-muted">
          Dados de avaliação física são <strong className="text-text">dados sensíveis de saúde</strong> conforme a LGPD (Lei 13.709/2018). O consentimento explícito do atleta é obrigatório antes de qualquer coleta ou registro.
        </p>
      </div>

      {/* Form */}
      {showForm && (
        <form onSubmit={handleSave} className="rounded-2xl border border-border bg-card p-5 space-y-5">
          <p className="text-sm font-bold text-text">Nova avaliação</p>

          <label className="block">
            <span className="mb-1 block text-xs font-semibold uppercase tracking-wider text-text-muted">Data da avaliação</span>
            <input type="date" value={form.assessedAt} onChange={(e) => setField("assessedAt", e.target.value)} className={inputClass} />
          </label>

          <div>
            <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-text-muted">Composição corporal</p>
            <div className="grid grid-cols-2 gap-3">
              {[
                { key: "weightKg", label: "Peso (kg)" },
                { key: "bodyFatPct", label: "% Gordura" },
                { key: "muscleMassKg", label: "Massa muscular (kg)" },
                { key: "bmi", label: "IMC" },
              ].map((f) => (
                <label key={f.key} className="block">
                  <span className="mb-1 block text-xs text-text-muted">{f.label}</span>
                  <input type="number" step="0.1" value={form[f.key as keyof typeof form] as string} onChange={(e) => setField(f.key, e.target.value)} placeholder="—" className={inputClass} />
                </label>
              ))}
            </div>
          </div>

          <div>
            <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-text-muted">Perimetria (cm)</p>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {[
                { key: "neckCm", label: "Pescoço" },
                { key: "chestCm", label: "Peitoral" },
                { key: "waistCm", label: "Cintura" },
                { key: "hipCm", label: "Quadril" },
                { key: "thighCm", label: "Coxa" },
                { key: "calfCm", label: "Panturrilha" },
                { key: "armCm", label: "Braço" },
                { key: "forearmCm", label: "Antebraço" },
              ].map((f) => (
                <label key={f.key} className="block">
                  <span className="mb-1 block text-xs text-text-muted">{f.label}</span>
                  <input type="number" step="0.1" value={form[f.key as keyof typeof form] as string} onChange={(e) => setField(f.key, e.target.value)} placeholder="—" className={inputClass} />
                </label>
              ))}
            </div>
          </div>

          <div>
            <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-text-muted">Performance</p>
            <div className="grid grid-cols-2 gap-3">
              {[
                { key: "vo2max", label: "VO₂máx (ml/kg/min)" },
                { key: "restingHr", label: "FC de repouso (bpm)" },
                { key: "hrv", label: "HRV (ms)" },
                { key: "flexibilityScore", label: "Flexibilidade (cm)" },
              ].map((f) => (
                <label key={f.key} className="block">
                  <span className="mb-1 block text-xs text-text-muted">{f.label}</span>
                  <input type="number" step="0.1" value={form[f.key as keyof typeof form] as string} onChange={(e) => setField(f.key, e.target.value)} placeholder="—" className={inputClass} />
                </label>
              ))}
            </div>
          </div>

          <label className="block">
            <span className="mb-1 block text-xs font-semibold uppercase tracking-wider text-text-muted">Observações</span>
            <textarea rows={3} value={form.notes} onChange={(e) => setField("notes", e.target.value)} placeholder="Observações clínicas, contexto, restrições…" className={inputClass} />
          </label>

          {/* LGPD consent */}
          <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-primary/30 bg-primary/5 p-4">
            <input type="checkbox" checked={form.lgpdConsent} onChange={(e) => setField("lgpdConsent", e.target.checked)} className="mt-0.5 h-4 w-4 accent-primary shrink-0" />
            <span className="text-xs text-text">
              <strong className="text-primary">Consentimento LGPD confirmado.</strong> O atleta foi informado sobre a coleta, uso e armazenamento dos seus dados de saúde, e concordou expressamente com o registro desta avaliação física no sistema PACE RUN PRO.
            </span>
          </label>

          {error && <p className="rounded-xl border border-red-500/30 bg-red-500/10 px-3.5 py-2.5 text-sm text-red-400">{error}</p>}

          <div className="flex gap-3">
            <button type="button" onClick={() => setShowForm(false)} className="rounded-xl border border-border px-4 py-2.5 text-sm font-semibold text-text-muted hover:bg-card-hover">Cancelar</button>
            <button type="submit" disabled={saving} className="flex flex-1 items-center justify-center gap-2 rounded-xl gradient-primary px-4 py-2.5 text-sm font-bold text-white shadow-lg shadow-primary/30 disabled:opacity-60">
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Salvar avaliação"}
            </button>
          </div>
        </form>
      )}

      {/* History */}
      {loading ? (
        <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
      ) : assessments.length === 0 ? (
        <div className="rounded-2xl border border-border bg-card p-8 text-center">
          <ClipboardList className="mx-auto mb-3 h-10 w-10 text-text-muted/30" />
          <p className="text-sm text-text-muted">Nenhuma avaliação registrada</p>
        </div>
      ) : (
        <div className="space-y-4">
          {assessments.map((a, i) => (
            <div key={a.id} className={`rounded-2xl border ${i === 0 ? "border-primary/30 bg-primary/5" : "border-border bg-card"} p-5`}>
              <div className="mb-4 flex items-center justify-between">
                <p className="text-sm font-bold text-text">{new Date(a.assessedAt).toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" })}</p>
                {i === 0 && <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-[10px] font-bold text-primary">Mais recente</span>}
              </div>

              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                {[
                  { label: "Peso", value: a.weightKg ? `${a.weightKg} kg` : null },
                  { label: "% Gordura", value: a.bodyFatPct ? `${a.bodyFatPct}%` : null },
                  { label: "Massa muscular", value: a.muscleMassKg ? `${a.muscleMassKg} kg` : null },
                  { label: "IMC", value: a.bmi ? String(a.bmi) : null },
                  { label: "Cintura", value: a.waistCm ? `${a.waistCm} cm` : null },
                  { label: "Quadril", value: a.hipCm ? `${a.hipCm} cm` : null },
                  { label: "Coxa", value: a.thighCm ? `${a.thighCm} cm` : null },
                  { label: "VO₂máx", value: a.vo2max ? `${a.vo2max} ml/kg/min` : null },
                ].filter((r) => r.value).map((r) => (
                  <div key={r.label} className="rounded-xl border border-border/50 bg-background/40 px-3 py-2">
                    <p className="text-[10px] text-text-muted uppercase tracking-wider">{r.label}</p>
                    <p className="text-sm font-bold text-text mt-0.5">{r.value}</p>
                  </div>
                ))}
              </div>

              {/* Delta vs previous */}
              {i === 0 && assessments[1] && assessments[1].weightKg && a.weightKg && (
                <div className="mt-3 flex items-center gap-2">
                  <span className="text-xs text-text-muted">Variação de peso desde a avaliação anterior:</span>
                  <span className={`text-xs font-bold ${a.weightKg < assessments[1].weightKg ? "text-green-400" : "text-red-400"}`}>
                    {a.weightKg > assessments[1].weightKg ? "+" : ""}{(a.weightKg - assessments[1].weightKg).toFixed(1)} kg
                  </span>
                </div>
              )}

              {a.notes && <p className="mt-3 text-xs text-text-muted/80 leading-relaxed">{a.notes}</p>}
            </div>
          ))}
        </div>
      )}

      {/* Latest summary card */}
      {latest && (
        <div className="rounded-xl border border-border/50 bg-card-hover/30 px-4 py-3">
          <p className="text-xs font-semibold text-text-muted">Dados perimetrais — última avaliação</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {[
              { l: "Pescoço", v: latest.neckCm },
              { l: "Peitoral", v: latest.chestCm },
              { l: "Waist", v: latest.waistCm },
              { l: "Braço", v: latest.armCm },
              { l: "Antebraço", v: latest.forearmCm },
              { l: "Panturrilha", v: latest.calfCm },
            ].filter((r) => r.v).map((r) => (
              <span key={r.l} className="rounded-full bg-card px-2.5 py-1 text-xs text-text-muted border border-border">
                {r.l}: <strong className="text-text">{r.v} cm</strong>
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
