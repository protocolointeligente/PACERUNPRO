"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft, ClipboardList, Loader2, Plus, Shield,
  Scale, Ruler, BarChart3, Activity, CheckCircle2, FileText,
  ChevronLeft, ChevronRight, TrendingDown, TrendingUp,
} from "lucide-react";

// ── Types ────────────────────────────────────────────────────────────────────

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

type Tab = "geral" | "composicao" | "circunferencias" | "dobras" | "performance" | "salvar";
type Sex = "M" | "F";
type Protocol = "jp7" | "jp3" | "faulkner" | "guedes";
type ActivityLevel = "sedentary" | "light" | "moderate" | "active" | "very_active";

const ACTIVITY_LABELS: Record<ActivityLevel, string> = {
  sedentary: "Sedentário",
  light: "Leve (1-3×/sem)",
  moderate: "Moderado (3-5×/sem)",
  active: "Intenso (6-7×/sem)",
  very_active: "Muito intenso (2×/dia)",
};

const ACTIVITY_FACTOR: Record<ActivityLevel, number> = {
  sedentary: 1.2,
  light: 1.375,
  moderate: 1.55,
  active: 1.725,
  very_active: 1.9,
};

const TABS: { id: Tab; label: string; icon: typeof Scale }[] = [
  { id: "geral",           label: "Dados Gerais",    icon: FileText },
  { id: "composicao",      label: "Composição",       icon: Scale },
  { id: "circunferencias", label: "Circunferências",  icon: Ruler },
  { id: "dobras",          label: "Dobras",           icon: BarChart3 },
  { id: "performance",     label: "Performance",      icon: Activity },
  { id: "salvar",          label: "Salvar",           icon: CheckCircle2 },
];

// ── Formulas ─────────────────────────────────────────────────────────────────

function calcBMI(w: number, hCm: number) {
  if (!w || !hCm) return null;
  const h = hCm / 100;
  return Math.round((w / (h * h)) * 10) / 10;
}

function calcTMB(sex: Sex, w: number, hCm: number, age: number): number | null {
  if (!w || !hCm || !age) return null;
  if (sex === "M") return Math.round(10 * w + 6.25 * hCm - 5 * age + 5);
  return Math.round(10 * w + 6.25 * hCm - 5 * age - 161);
}

function calcJP7(sex: Sex, age: number, sf: number[]): number | null {
  if (sf.some((v) => !v) || !age) return null;
  const sum = sf.reduce((a, b) => a + b, 0);
  const D = sex === "M"
    ? 1.112 - 0.00043499 * sum + 0.00000055 * sum * sum - 0.0002882 * age
    : 1.097 - 0.00046971 * sum + 0.00000056 * sum * sum - 0.00012828 * age;
  return Math.round((4.95 / D - 4.5) * 1000) / 10;
}

function calcJP3(sex: Sex, age: number, a: number, b: number, c: number): number | null {
  if (!a || !b || !c || !age) return null;
  const sum = a + b + c;
  const D = sex === "M"
    ? 1.10938 - 0.0008267 * sum + 0.0000016 * sum * sum - 0.0002574 * age
    : 1.0994921 - 0.0009929 * sum + 0.0000023 * sum * sum - 0.0001392 * age;
  return Math.round((4.95 / D - 4.5) * 1000) / 10;
}

function calcFaulkner(tri: number, sub: number, supr: number, abd: number): number | null {
  if (!tri || !sub || !supr || !abd) return null;
  return Math.round(((tri + sub + supr + abd) * 0.153 + 5.783) * 10) / 10;
}

function calcGuedes(sex: Sex, age: number, a: number, b: number, c: number): number | null {
  if (!a || !b || !c || !age) return null;
  const sum = a + b + c;
  if (sex === "M") {
    const D = 1.17136 - 0.06706 * Math.log10(sum) - 0.0002 * age;
    return Math.round((4.95 / D - 4.5) * 1000) / 10;
  }
  const D = 1.16650 - 0.07063 * Math.log10(sum) - 0.0002 * age;
  return Math.round((4.95 / D - 4.5) * 1000) / 10;
}

// ── Input style ──────────────────────────────────────────────────────────────

const INP = "w-full rounded-xl border border-border bg-background px-3.5 py-2.5 text-sm text-text placeholder:text-text-muted/50 outline-none focus:border-primary/60 focus:ring-2 focus:ring-primary/20 transition-colors";

// ── Helper ───────────────────────────────────────────────────────────────────

function n(v: string): number | null { return v === "" ? null : Number(v); }
function Lbl({ children }: { children: React.ReactNode }) {
  return <span className="mb-1 block text-xs font-medium text-text-muted">{children}</span>;
}
function Sect({ title }: { title: string }) {
  return <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-text-muted">{title}</p>;
}
function AutoField({ label, value, unit }: { label: string; value: number | null; unit?: string }) {
  return (
    <div className="rounded-xl border border-border/50 bg-background/40 px-3.5 py-2.5">
      <Lbl>{label}</Lbl>
      <p className="text-sm font-bold text-text">{value !== null ? `${value}${unit ? ` ${unit}` : ""}` : <span className="text-text-muted/50">—</span>}</p>
    </div>
  );
}
function Delta({ a, b, unit }: { a: number | null; b: number | null; unit: string }) {
  if (!a || !b) return null;
  const diff = Math.round((a - b) * 10) / 10;
  return (
    <span className={`text-xs font-bold ${diff < 0 ? "text-success" : "text-danger"}`}>
      {diff > 0 ? "+" : ""}{diff} {unit}
    </span>
  );
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function AvaliacaoFisicaPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: athleteId } = use(params);

  const [assessments, setAssessments] = useState<PhysicalAssessment[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState<Tab>("geral");

  // ── Local-only fields (not in DB) ───────────────────────────────────────────
  const [heightCm, setHeightCm] = useState("");
  const [age, setAge] = useState("");
  const [sex, setSex] = useState<Sex>("M");
  const [activityLevel, setActivityLevel] = useState<ActivityLevel>("moderate");
  const [sfProtocol, setSfProtocol] = useState<Protocol>("jp7");

  // Skinfolds (8 measurements)
  const [sfPeitoral, setSfPeitoral] = useState("");    // pectoral/chest
  const [sfAxilar, setSfAxilar] = useState("");        // midaxillary
  const [sfTriceps, setSfTriceps] = useState("");      // triceps
  const [sfSubescapular, setSfSubescapular] = useState(""); // subscapular
  const [sfAbdominal, setSfAbdominal] = useState(""); // abdominal
  const [sfSuprailica, setSfSuprailica] = useState(""); // suprailiac
  const [sfCoxa, setSfCoxa] = useState("");            // thigh
  const [sfPanturrilha, setSfPanturrilha] = useState(""); // calf

  // Extra circumferences (not in DB — go into notes)
  const [shoulderCm, setShoulderCm] = useState("");
  const [armContractedCm, setArmContractedCm] = useState("");
  const [abdomenCm, setAbdomenCm] = useState("");
  const [thighMidCm, setThighMidCm] = useState("");
  const [ankleCm, setAnkleCm] = useState("");

  // ── DB-backed fields ────────────────────────────────────────────────────────
  const [form, setForm] = useState({
    assessedAt:      new Date().toISOString().split("T")[0],
    weightKg:        "",
    bodyFatPct:      "",
    muscleMassKg:    "",
    bmi:             "",
    neckCm:          "",
    chestCm:         "",
    waistCm:         "",
    hipCm:           "",
    thighCm:         "",
    calfCm:          "",
    armCm:           "",
    forearmCm:       "",
    vo2max:          "",
    restingHr:       "",
    hrv:             "",
    flexibilityScore:"",
    notes:           "",
    lgpdConsent:     false,
  });

  function setField(key: string, value: string | boolean) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  // ── Auto calculations ────────────────────────────────────────────────────────
  const w = n(form.weightKg);
  const hCm = n(heightCm);
  const a = n(age);

  const autoBMI = w && hCm ? calcBMI(w, hCm) : null;
  const autoTMB = w && hCm && a ? calcTMB(sex, w, hCm, a) : null;
  const autoGET = autoTMB ? Math.round(autoTMB * ACTIVITY_FACTOR[activityLevel]) : null;
  const autoWHR = n(form.waistCm) && n(form.hipCm) ? Math.round((Number(form.waistCm) / Number(form.hipCm)) * 100) / 100 : null;
  const autoWHtR = n(form.waistCm) && hCm ? Math.round((Number(form.waistCm) / hCm) * 100) / 100 : null;
  const autoFFMI = w && n(form.bodyFatPct) && hCm ? Math.round(((w * (1 - Number(form.bodyFatPct) / 100)) / ((hCm / 100) * (hCm / 100))) * 10) / 10 : null;

  // Skinfold body fat calculation
  const sf7 = [sfPeitoral, sfAxilar, sfTriceps, sfSubescapular, sfAbdominal, sfSuprailica, sfCoxa].map(Number);
  const sf3men = [sfPeitoral, sfAbdominal, sfCoxa].map(Number);
  const sf3women = [sfTriceps, sfSuprailica, sfCoxa].map(Number);
  const sf4 = [sfTriceps, sfSubescapular, sfSuprailica, sfAbdominal].map(Number);
  const sf3guedes = sex === "M"
    ? [sfSubescapular, sfAbdominal, sfCoxa].map(Number)
    : [sfSuprailica, sfAbdominal, sfCoxa].map(Number);

  const sfAge = a ?? 0;
  const sfBodyFat =
    sfProtocol === "jp7"     ? calcJP7(sex, sfAge, sf7)
    : sfProtocol === "jp3"   ? calcJP3(sex, sfAge, ...(sex === "M" ? sf3men : sf3women) as [number, number, number])
    : sfProtocol === "faulkner" ? calcFaulkner(Number(sfTriceps), Number(sfSubescapular), Number(sfSuprailica), Number(sfAbdominal))
    : calcGuedes(sex, sfAge, ...sf3guedes as [number, number, number]);

  // ── Load history ─────────────────────────────────────────────────────────────
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

  // ── Save ─────────────────────────────────────────────────────────────────────
  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!form.lgpdConsent) { setError("É necessário confirmar o consentimento LGPD."); return; }
    setSaving(true);
    try {
      // Build extra notes with all unmapped fields
      const extra: Record<string, string | number> = {};
      if (heightCm) extra.altura_cm = Number(heightCm);
      if (age)      extra.idade = Number(age);
      extra.sexo = sex;
      if (shoulderCm)      extra.ombros_cm = Number(shoulderCm);
      if (armContractedCm) extra.braco_contraido_cm = Number(armContractedCm);
      if (abdomenCm)       extra.abdomen_cm = Number(abdomenCm);
      if (thighMidCm)      extra.coxa_media_cm = Number(thighMidCm);
      if (ankleCm)         extra.tornozelo_cm = Number(ankleCm);
      if (sfTriceps)        extra.dobra_triceps = Number(sfTriceps);
      if (sfSubescapular)  extra.dobra_subescapular = Number(sfSubescapular);
      if (sfPeitoral)      extra.dobra_peitoral = Number(sfPeitoral);
      if (sfAxilar)        extra.dobra_axilar = Number(sfAxilar);
      if (sfAbdominal)     extra.dobra_abdominal = Number(sfAbdominal);
      if (sfSuprailica)    extra.dobra_suprailica = Number(sfSuprailica);
      if (sfCoxa)          extra.dobra_coxa = Number(sfCoxa);
      if (sfPanturrilha)   extra.dobra_panturrilha = Number(sfPanturrilha);
      if (sfBodyFat !== null) extra.gordura_dobras_pct = sfBodyFat;
      if (sfProtocol)      extra.protocolo_dobras = sfProtocol;

      const notesStr = form.notes
        ? `${form.notes}\n\n[Medidas adicionais]\n${JSON.stringify(extra, null, 2)}`
        : Object.keys(extra).length > 0
          ? `[Medidas adicionais]\n${JSON.stringify(extra, null, 2)}`
          : "";

      // Use skinfold-derived fat% if available and bodyFatPct is empty
      const bodyFatPctFinal = form.bodyFatPct !== "" ? Number(form.bodyFatPct) : sfBodyFat;

      const payload = {
        assessedAt:       form.assessedAt,
        weightKg:         n(form.weightKg),
        bodyFatPct:       bodyFatPctFinal,
        muscleMassKg:     n(form.muscleMassKg),
        bmi:              autoBMI ?? n(form.bmi),
        neckCm:           n(form.neckCm),
        chestCm:          n(form.chestCm),
        waistCm:          n(form.waistCm),
        hipCm:            n(form.hipCm),
        thighCm:          n(form.thighCm),
        calfCm:           n(form.calfCm),
        armCm:            n(form.armCm),
        forearmCm:        n(form.forearmCm),
        vo2max:           n(form.vo2max),
        restingHr:        n(form.restingHr),
        hrv:              n(form.hrv),
        flexibilityScore: n(form.flexibilityScore),
        notes:            notesStr || null,
        lgpdConsent:      form.lgpdConsent,
      };

      const res = await fetch(`/api/coach/athletes/${athleteId}/avaliacao`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) { const d = await res.json(); setError(d.error ?? "Erro ao salvar."); return; }
      setShowForm(false);
      setActiveTab("geral");
      await load();
    } catch {
      setError("Erro de rede. Tente novamente.");
    } finally {
      setSaving(false);
    }
  }

  const latest = assessments[0];
  const prev   = assessments[1];

  const tabOrder: Tab[] = ["geral", "composicao", "circunferencias", "dobras", "performance", "salvar"];
  const tabIdx = tabOrder.indexOf(activeTab);

  // ── Render ───────────────────────────────────────────────────────────────────
  return (
    <div className="mx-auto max-w-3xl space-y-6">
      {/* Header */}
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
          <button
            onClick={() => { setShowForm(!showForm); setActiveTab("geral"); }}
            className="flex items-center gap-1.5 rounded-xl border border-primary/40 bg-primary/10 px-3 py-2 text-xs font-bold text-primary hover:bg-primary/20 transition-colors"
          >
            <Plus className="h-3.5 w-3.5" />
            Nova avaliação
          </button>
        </div>
      </div>

      {/* LGPD notice */}
      <div className="flex items-start gap-3 rounded-xl border border-border/60 bg-card/60 px-4 py-3">
        <Shield className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
        <p className="text-xs text-text-muted">
          Dados de avaliação física são <strong className="text-text">dados sensíveis de saúde</strong> conforme a LGPD (Lei 13.709/2018). O consentimento explícito do atleta é obrigatório.
        </p>
      </div>

      {/* ── FORM ── */}
      {showForm && (
        <form onSubmit={handleSave} className="rounded-2xl border border-border bg-card overflow-hidden">
          {/* Tab navigation */}
          <div className="flex overflow-x-auto border-b border-border bg-card-hover/40">
            {TABS.map((tab, i) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              const isDone = tabOrder.indexOf(tab.id) < tabIdx;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex shrink-0 items-center gap-1.5 px-4 py-3 text-xs font-semibold transition-all border-b-2 ${
                    isActive
                      ? "border-primary text-primary bg-primary/5"
                      : isDone
                      ? "border-transparent text-success"
                      : "border-transparent text-text-muted hover:text-text"
                  }`}
                >
                  {isDone ? <CheckCircle2 className="h-3.5 w-3.5" /> : <Icon className="h-3.5 w-3.5" />}
                  <span className="hidden sm:inline">{tab.label}</span>
                  <span className="sm:hidden">{i + 1}</span>
                </button>
              );
            })}
          </div>

          <div className="p-5 space-y-5">
            {/* ── TAB 1: Dados Gerais ── */}
            {activeTab === "geral" && (
              <>
                <Sect title="Informações gerais" />
                <label className="block">
                  <Lbl>Data da avaliação</Lbl>
                  <input type="date" value={form.assessedAt} onChange={(e) => setField("assessedAt", e.target.value)} className={INP} />
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <label className="block">
                    <Lbl>Sexo biológico</Lbl>
                    <div className="flex gap-2">
                      {([["M", "Masculino"], ["F", "Feminino"]] as const).map(([v, l]) => (
                        <button key={v} type="button" onClick={() => setSex(v)}
                          className={`flex-1 rounded-xl border py-2.5 text-sm font-medium transition-all ${sex === v ? "border-primary/50 bg-primary/10 text-primary" : "border-border bg-background text-text-muted hover:border-primary/30"}`}>
                          {l}
                        </button>
                      ))}
                    </div>
                  </label>
                  <label className="block">
                    <Lbl>Idade (anos)</Lbl>
                    <input type="number" min={10} max={100} value={age} onChange={(e) => setAge(e.target.value)} placeholder="Ex: 32" className={INP} />
                  </label>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <label className="block">
                    <Lbl>Altura (cm)</Lbl>
                    <input type="number" step="0.1" min={100} max={250} value={heightCm} onChange={(e) => setHeightCm(e.target.value)} placeholder="Ex: 175" className={INP} />
                  </label>
                  <label className="block">
                    <Lbl>Nível de atividade</Lbl>
                    <select value={activityLevel} onChange={(e) => setActivityLevel(e.target.value as ActivityLevel)} className={INP}>
                      {(Object.keys(ACTIVITY_LABELS) as ActivityLevel[]).map((k) => (
                        <option key={k} value={k}>{ACTIVITY_LABELS[k]}</option>
                      ))}
                    </select>
                  </label>
                </div>
              </>
            )}

            {/* ── TAB 2: Composição Corporal ── */}
            {activeTab === "composicao" && (
              <>
                <Sect title="Composição corporal" />
                <div className="grid grid-cols-2 gap-3">
                  <label className="block">
                    <Lbl>Peso (kg)</Lbl>
                    <input type="number" step="0.1" value={form.weightKg} onChange={(e) => setField("weightKg", e.target.value)} placeholder="Ex: 72.5" className={INP} />
                  </label>
                  <AutoField label="IMC (auto)" value={autoBMI} />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <label className="block">
                    <Lbl>Gordura % (bioimpedância)</Lbl>
                    <input type="number" step="0.1" value={form.bodyFatPct} onChange={(e) => setField("bodyFatPct", e.target.value)} placeholder="Ex: 18.5" className={INP} />
                  </label>
                  <label className="block">
                    <Lbl>Massa muscular (kg)</Lbl>
                    <input type="number" step="0.1" value={form.muscleMassKg} onChange={(e) => setField("muscleMassKg", e.target.value)} placeholder="Ex: 55.0" className={INP} />
                  </label>
                </div>
                {sfBodyFat !== null && (
                  <div className="rounded-xl border border-primary/30 bg-primary/5 px-4 py-3">
                    <p className="text-xs text-text-muted">Gordura % calculada pelas dobras ({sfProtocol.toUpperCase()}): <strong className="text-primary">{sfBodyFat}%</strong></p>
                    <button type="button" onClick={() => setField("bodyFatPct", String(sfBodyFat))}
                      className="mt-1 text-[11px] text-primary underline underline-offset-2">
                      Usar este valor
                    </button>
                  </div>
                )}
                <div className="rounded-xl border border-border bg-background/40 p-4 space-y-3">
                  <p className="text-xs font-semibold text-text-muted">Valores derivados (automáticos)</p>
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                    <AutoField label="TMB (kcal)" value={autoTMB} />
                    <AutoField label="GET (kcal)" value={autoGET} />
                    <AutoField label="FFMI" value={autoFFMI} />
                    {w && n(form.bodyFatPct) && (
                      <>
                        <AutoField label="Massa gorda (kg)" value={Math.round(w * Number(form.bodyFatPct) / 100 * 10) / 10} unit="kg" />
                        <AutoField label="Massa magra (kg)" value={Math.round(w * (1 - Number(form.bodyFatPct) / 100) * 10) / 10} unit="kg" />
                      </>
                    )}
                  </div>
                </div>
              </>
            )}

            {/* ── TAB 3: Circunferências ── */}
            {activeTab === "circunferencias" && (
              <>
                <Sect title="Perimetria (cm)" />
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                  {([
                    { key: "neckCm",   label: "Pescoço",         state: null },
                    { key: "shoulder", label: "Ombros",          state: [shoulderCm, setShoulderCm] },
                    { key: "chestCm",  label: "Peitoral",        state: null },
                    { key: "armCm",    label: "Braço Relaxado",  state: null },
                    { key: "armC",     label: "Braço Contraído", state: [armContractedCm, setArmContractedCm] },
                    { key: "forearmCm",label: "Antebraço",       state: null },
                    { key: "waistCm",  label: "Cintura",         state: null },
                    { key: "abdomen",  label: "Abdômen",         state: [abdomenCm, setAbdomenCm] },
                    { key: "hipCm",    label: "Quadril",         state: null },
                    { key: "thighCm",  label: "Coxa Proximal",   state: null },
                    { key: "thighMid", label: "Coxa Média",      state: [thighMidCm, setThighMidCm] },
                    { key: "calfCm",   label: "Panturrilha",     state: null },
                    { key: "ankle",    label: "Tornozelo",       state: [ankleCm, setAnkleCm] },
                  ] as const).map((f) => {
                    const isExtra = f.state !== null;
                    return (
                      <label key={f.key} className="block">
                        <Lbl>{f.label}{isExtra ? <span className="ml-1 text-[9px] text-text-muted/60 uppercase">extra</span> : null}</Lbl>
                        <input
                          type="number" step="0.1" placeholder="—"
                          value={isExtra ? (f.state as [string, (v: string) => void])[0] : (form[f.key as keyof typeof form] as string)}
                          onChange={(e) => isExtra
                            ? (f.state as [string, (v: string) => void])[1](e.target.value)
                            : setField(f.key, e.target.value)}
                          className={INP}
                        />
                      </label>
                    );
                  })}
                </div>
                <div className="mt-2 rounded-xl border border-border bg-background/40 p-4 space-y-3">
                  <p className="text-xs font-semibold text-text-muted">Índices calculados</p>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <AutoField label="RCQ (Cintura / Quadril)" value={autoWHR} />
                      {autoWHR && (
                        <p className="mt-0.5 text-[10px] text-text-muted">
                          {sex === "M"
                            ? autoWHR < 0.9 ? "✓ Normal" : autoWHR < 1.0 ? "Risco moderado" : "Risco elevado"
                            : autoWHR < 0.8 ? "✓ Normal" : autoWHR < 0.85 ? "Risco moderado" : "Risco elevado"}
                        </p>
                      )}
                    </div>
                    <div>
                      <AutoField label="RCEst (Cintura / Estatura)" value={autoWHtR} />
                      {autoWHtR && (
                        <p className="mt-0.5 text-[10px] text-text-muted">
                          {autoWHtR < 0.5 ? "✓ Normal" : autoWHtR < 0.6 ? "Risco moderado" : "Risco elevado"}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </>
            )}

            {/* ── TAB 4: Dobras Cutâneas ── */}
            {activeTab === "dobras" && (
              <>
                <Sect title="Dobras cutâneas (mm)" />
                <div className="mb-4">
                  <Lbl>Protocolo</Lbl>
                  <div className="flex flex-wrap gap-2">
                    {([
                      ["jp7", "Jackson-Pollock 7"],
                      ["jp3", "Jackson-Pollock 3"],
                      ["faulkner", "Faulkner 4"],
                      ["guedes", "Guedes 3"],
                    ] as const).map(([p, l]) => (
                      <button key={p} type="button" onClick={() => setSfProtocol(p)}
                        className={`rounded-xl border px-3 py-1.5 text-xs font-medium transition-all ${sfProtocol === p ? "border-primary/50 bg-primary/10 text-primary" : "border-border bg-background text-text-muted hover:border-primary/30"}`}>
                        {l}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                  {([
                    ["sfTriceps", "Tricipital", sfTriceps, setSfTriceps, true],
                    ["sfSubescapular", "Subescapular", sfSubescapular, setSfSubescapular, true],
                    ["sfPeitoral", "Peitoral", sfPeitoral, setSfPeitoral, sfProtocol === "jp7" || sfProtocol === "jp3"],
                    ["sfAxilar", "Axilar Média", sfAxilar, setSfAxilar, sfProtocol === "jp7"],
                    ["sfAbdominal", "Abdominal", sfAbdominal, setSfAbdominal, true],
                    ["sfSuprailica", "Suprailíaca", sfSuprailica, setSfSuprailica, true],
                    ["sfCoxa", "Coxa", sfCoxa, setSfCoxa, true],
                    ["sfPanturrilha", "Panturrilha", sfPanturrilha, setSfPanturrilha, false],
                  ] as const).map(([key, label, val, set, used]) => (
                    <label key={key} className={`block ${!used ? "opacity-40" : ""}`}>
                      <Lbl>{label}{!used ? <span className="ml-1 text-[9px]">não usado</span> : null}</Lbl>
                      <input type="number" step="0.1" placeholder="—" value={val} onChange={(e) => (set as (v: string) => void)(e.target.value)} disabled={!used} className={INP} />
                    </label>
                  ))}
                </div>

                {sfBodyFat !== null && (
                  <div className="mt-2 flex items-center gap-4 rounded-xl border border-success/30 bg-success/5 p-4">
                    <div>
                      <p className="text-xs text-text-muted">Gordura % calculada</p>
                      <p className="text-2xl font-display font-bold text-success">{sfBodyFat}%</p>
                    </div>
                    <div className="text-xs text-text-muted">
                      <p>Protocolo: <strong className="text-text">{sfProtocol.toUpperCase()}</strong></p>
                      {w && sfBodyFat && (
                        <>
                          <p>Massa gorda: <strong className="text-text">{Math.round(w * sfBodyFat / 100 * 10) / 10} kg</strong></p>
                          <p>Massa magra: <strong className="text-text">{Math.round(w * (1 - sfBodyFat / 100) * 10) / 10} kg</strong></p>
                        </>
                      )}
                    </div>
                    <div className="ml-auto">
                      <button type="button" onClick={() => { setField("bodyFatPct", String(sfBodyFat)); setActiveTab("composicao"); }}
                        className="rounded-xl border border-primary/40 bg-primary/10 px-3 py-1.5 text-xs font-bold text-primary hover:bg-primary/20">
                        Usar em Composição
                      </button>
                    </div>
                  </div>
                )}
              </>
            )}

            {/* ── TAB 5: Performance ── */}
            {activeTab === "performance" && (
              <>
                <Sect title="Cardiorrespiratório & Performance" />
                <div className="grid grid-cols-2 gap-3">
                  {([
                    { key: "vo2max",          label: "VO₂máx (ml/kg/min)", placeholder: "Ex: 48.5" },
                    { key: "restingHr",        label: "FC repouso (bpm)",   placeholder: "Ex: 52" },
                    { key: "hrv",              label: "HRV (ms)",           placeholder: "Ex: 65" },
                    { key: "flexibilityScore", label: "Flexibilidade (cm)", placeholder: "Ex: 10" },
                  ] as const).map((f) => (
                    <label key={f.key} className="block">
                      <Lbl>{f.label}</Lbl>
                      <input type="number" step="0.1" value={form[f.key]} onChange={(e) => setField(f.key, e.target.value)} placeholder={f.placeholder} className={INP} />
                    </label>
                  ))}
                </div>
                <div className="rounded-xl border border-border bg-background/40 p-4">
                  <p className="mb-2 text-xs font-semibold text-text-muted">Referências de desempenho aeróbico</p>
                  <div className="space-y-1 text-xs text-text-muted">
                    <p>VO₂máx &gt; 60 — Elite · 50–60 — Avançado · 40–50 — Intermediário · &lt;40 — Iniciante</p>
                    <p>HRV mais alto = melhor recuperação e fitness cardiovascular</p>
                    <p>Flexibilidade (banco): positivo = passou da linha, negativo = não alcançou</p>
                  </div>
                </div>
              </>
            )}

            {/* ── TAB 6: Observações & Salvar ── */}
            {activeTab === "salvar" && (
              <>
                <label className="block">
                  <Lbl>Observações clínicas</Lbl>
                  <textarea rows={4} value={form.notes} onChange={(e) => setField("notes", e.target.value)} placeholder="Contexto, restrições, observações…" className={INP} />
                </label>

                <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-primary/30 bg-primary/5 p-4">
                  <input type="checkbox" checked={form.lgpdConsent} onChange={(e) => setField("lgpdConsent", e.target.checked)} className="mt-0.5 h-4 w-4 accent-primary shrink-0" />
                  <span className="text-xs text-text">
                    <strong className="text-primary">Consentimento LGPD confirmado.</strong> O atleta foi informado sobre a coleta, uso e armazenamento dos seus dados de saúde, e concordou expressamente com o registro desta avaliação física no sistema PACE RUN PRO.
                  </span>
                </label>

                {/* Summary */}
                <div className="rounded-xl border border-border bg-background/40 p-4 space-y-2">
                  <p className="text-xs font-semibold text-text-muted">Resumo da avaliação</p>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    {[
                      ["Data", form.assessedAt],
                      ["Peso", form.weightKg ? `${form.weightKg} kg` : "—"],
                      ["Gordura %", form.bodyFatPct ? `${form.bodyFatPct}%` : sfBodyFat ? `${sfBodyFat}% (dobras)` : "—"],
                      ["IMC", autoBMI ? String(autoBMI) : "—"],
                      ["Cintura", form.waistCm ? `${form.waistCm} cm` : "—"],
                      ["VO₂máx", form.vo2max ? `${form.vo2max} ml/kg/min` : "—"],
                    ].map(([l, v]) => (
                      <div key={l} className="flex justify-between gap-2">
                        <span className="text-text-muted">{l}</span>
                        <span className="font-medium text-text">{v}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {error && <p className="rounded-xl border border-red-500/30 bg-red-500/10 px-3.5 py-2.5 text-sm text-red-400">{error}</p>}

                <div className="flex gap-3">
                  <button type="button" onClick={() => setShowForm(false)} className="rounded-xl border border-border px-4 py-2.5 text-sm font-semibold text-text-muted hover:bg-card-hover">
                    Cancelar
                  </button>
                  <button type="submit" disabled={saving} className="flex flex-1 items-center justify-center gap-2 rounded-xl gradient-primary px-4 py-2.5 text-sm font-bold text-white shadow-lg shadow-primary/30 disabled:opacity-60">
                    {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Salvar avaliação"}
                  </button>
                </div>
              </>
            )}

            {/* Navigation buttons */}
            {activeTab !== "salvar" && (
              <div className="flex justify-between pt-2">
                <button type="button" disabled={tabIdx === 0} onClick={() => setActiveTab(tabOrder[tabIdx - 1])}
                  className="flex items-center gap-1 rounded-xl border border-border px-3 py-2 text-xs font-medium text-text-muted hover:bg-card-hover disabled:opacity-30">
                  <ChevronLeft className="h-3.5 w-3.5" />
                  Anterior
                </button>
                <button type="button" onClick={() => setActiveTab(tabOrder[tabIdx + 1])}
                  className="flex items-center gap-1 rounded-xl border border-primary/40 bg-primary/10 px-3 py-2 text-xs font-bold text-primary hover:bg-primary/20">
                  Próximo
                  <ChevronRight className="h-3.5 w-3.5" />
                </button>
              </div>
            )}
          </div>
        </form>
      )}

      {/* ── HISTORY ── */}
      {loading ? (
        <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
      ) : assessments.length === 0 ? (
        <div className="rounded-2xl border border-border bg-card p-8 text-center">
          <ClipboardList className="mx-auto mb-3 h-10 w-10 text-text-muted/30" />
          <p className="text-sm text-text-muted">Nenhuma avaliação registrada</p>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Evolution summary */}
          {assessments.length >= 2 && latest && prev && (
            <div className="rounded-2xl border border-primary/20 bg-primary/5 p-4">
              <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-primary">Evolução desde a avaliação anterior</p>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                {([
                  ["Peso", latest.weightKg, prev.weightKg, "kg", true],
                  ["Gordura %", latest.bodyFatPct, prev.bodyFatPct, "%", true],
                  ["Massa muscular", latest.muscleMassKg, prev.muscleMassKg, "kg", false],
                  ["VO₂máx", latest.vo2max, prev.vo2max, "", false],
                ] as const).map(([label, curr, prevVal, unit, lowerBetter]) => {
                  if (!curr || !prevVal) return null;
                  const diff = Math.round((curr - prevVal) * 10) / 10;
                  const positive = lowerBetter ? diff < 0 : diff > 0;
                  return (
                    <div key={String(label)} className="rounded-xl border border-border/50 bg-background/40 px-3 py-2">
                      <p className="text-[10px] text-text-muted uppercase tracking-wider">{label}</p>
                      <p className="text-sm font-bold text-text mt-0.5">{curr}{unit}</p>
                      <span className={`text-[11px] font-bold ${positive ? "text-success" : "text-danger"}`}>
                        {diff > 0 ? "+" : ""}{diff}{unit}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Assessment cards */}
          {assessments.map((a, i) => (
            <div key={a.id} className={`rounded-2xl border ${i === 0 ? "border-primary/30 bg-primary/5" : "border-border bg-card"} p-5`}>
              <div className="mb-4 flex items-center justify-between">
                <p className="text-sm font-bold text-text">{new Date(a.assessedAt).toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" })}</p>
                {i === 0 && <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-[10px] font-bold text-primary">Mais recente</span>}
              </div>

              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                {([
                  ["Peso", a.weightKg, "kg"],
                  ["Gordura %", a.bodyFatPct, "%"],
                  ["Massa muscular", a.muscleMassKg, "kg"],
                  ["IMC", a.bmi, ""],
                  ["Cintura", a.waistCm, "cm"],
                  ["Quadril", a.hipCm, "cm"],
                  ["Coxa", a.thighCm, "cm"],
                  ["VO₂máx", a.vo2max, "ml/kg/min"],
                  ["FC repouso", a.restingHr, "bpm"],
                  ["HRV", a.hrv, "ms"],
                ] as const).filter(([, v]) => v !== null).map(([label, val, unit]) => (
                  <div key={String(label)} className="rounded-xl border border-border/50 bg-background/40 px-3 py-2">
                    <p className="text-[10px] text-text-muted uppercase tracking-wider">{label}</p>
                    <p className="text-sm font-bold text-text mt-0.5">{val}{unit}</p>
                    {i === 0 && assessments[1] && (
                      <Delta
                        a={val as number}
                        b={(assessments[1] as PhysicalAssessment)[
                          (label === "Peso" ? "weightKg" : label === "Gordura %" ? "bodyFatPct" : label === "Massa muscular" ? "muscleMassKg" : label === "IMC" ? "bmi" : label === "Cintura" ? "waistCm" : label === "Quadril" ? "hipCm" : label === "Coxa" ? "thighCm" : label === "VO₂máx" ? "vo2max" : label === "FC repouso" ? "restingHr" : "hrv") as keyof PhysicalAssessment
                        ] as number | null}
                        unit={unit}
                      />
                    )}
                  </div>
                ))}
              </div>

              {a.notes && (
                <p className="mt-3 rounded-xl bg-background/40 p-3 text-xs text-text-muted/80 leading-relaxed whitespace-pre-wrap">{
                  a.notes.replace(/\[Medidas adicionais\][\s\S]*$/, "").trim()
                }</p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
