"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useCoachRole } from "@/context/coach-role-context";
import { canAccess } from "@/lib/coach-permissions";
import { AccessRestricted } from "@/components/shared/access-restricted";
import {
  Palette,
  Check,
  Globe,
  Loader2,
  Users,
  UserCheck,
  Layers,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { whiteLabelConfig, type WhiteLabelConfig } from "@/lib/mock-data";
import { cn } from "@/lib/utils";

const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  show: (i: number = 0) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.07, duration: 0.35, ease: "easeOut" as const },
  }),
};

const LOGO_OPTIONS = ["⚡", "🏃", "🎯", "🏅", "💪", "🌟"];

const ALL_MODULES = [
  "Treinos",
  "Análise semanal",
  "IA Treinadora",
  "Tênis tracker",
  "Timeline do atleta",
  "Previsão & estratégia",
  "Comunidade",
];

const inputCls =
  "w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm text-text placeholder:text-text-muted focus:border-primary focus:outline-none transition-colors";
const labelCls = "mb-1.5 block text-sm font-medium text-text-muted";

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="mb-4 flex items-center gap-2 text-base font-semibold text-text">
      {children}
    </h2>
  );
}

function PreviewCard({ config }: { config: WhiteLabelConfig }) {
  return (
    <div
      className="rounded-2xl border p-5 space-y-3"
      style={{ borderColor: config.primaryColor + "60", background: config.primaryColor + "08" }}
    >
      <div className="flex items-center gap-3">
        <span className="text-3xl">{config.logoEmoji}</span>
        <div>
          <p className="font-bold text-text">{config.assessoriaName || "Assessoria"}</p>
          <p className="text-xs" style={{ color: config.accentColor }}>{config.customDomain}</p>
        </div>
      </div>
      <p className="text-xs leading-relaxed text-text-muted">{config.welcomeMessage}</p>
      <div className="flex flex-wrap gap-1.5">
        {config.featuresEnabled.map((f) => (
          <span
            key={f}
            className="rounded-full px-2 py-0.5 text-xs font-medium text-text"
            style={{ background: config.primaryColor + "50", border: `1px solid ${config.primaryColor}80` }}
          >
            {f}
          </span>
        ))}
      </div>
      <div
        className="rounded-xl px-4 py-2 text-center text-sm font-semibold text-text"
        style={{ background: `linear-gradient(135deg, ${config.primaryColor}, ${config.accentColor})` }}
      >
        Entrar na plataforma
      </div>
    </div>
  );
}

function WhiteLabelContent() {
  const [config, setConfig] = useState<WhiteLabelConfig>({ ...whiteLabelConfig });
  const [dnsStatus, setDnsStatus] = useState<"idle" | "checking" | "active">("active");
  const [newDomain, setNewDomain] = useState("");
  const [saved, setSaved] = useState(false);

  function toggleModule(mod: string) {
    setConfig((prev) => ({
      ...prev,
      featuresEnabled: prev.featuresEnabled.includes(mod)
        ? prev.featuresEnabled.filter((f) => f !== mod)
        : [...prev.featuresEnabled, mod],
    }));
  }

  function handleVerifyDns() {
    setDnsStatus("checking");
    setTimeout(() => setDnsStatus("active"), 2000);
  }

  function handleSave() {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  return (
    <div className="mx-auto max-w-5xl space-y-8">
      <motion.div variants={fadeUp} initial="hidden" animate="show" className="flex flex-wrap items-start justify-between gap-4">
        <div className="space-y-1">
          <Badge variant="primary" className="mb-2">
            <Palette className="h-3 w-3" />
            White-label
          </Badge>
          <h1 className="font-display text-2xl font-bold text-text sm:text-3xl">
            Configurações White-label
          </h1>
          <p className="text-sm text-text-muted">
            Personalize a experiência da sua assessoria para seus atletas.
          </p>
        </div>
        <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-700 bg-emerald-900/40 px-3 py-1.5 text-sm font-medium text-emerald-300">
          <span className="h-2 w-2 rounded-full bg-emerald-400" />
          Plano Business ativo
        </span>
      </motion.div>

      <div className="grid gap-6 lg:grid-cols-5">
        <div className="space-y-6 lg:col-span-3">
          <motion.div custom={1} variants={fadeUp} initial="hidden" animate="show">
            <Card>
              <CardContent className="p-5 space-y-4">
                <SectionTitle>
                  <Palette className="h-4 w-4 text-primary" />
                  Identidade visual
                </SectionTitle>

                <div>
                  <label className={labelCls}>Nome da assessoria</label>
                  <input
                    value={config.assessoriaName}
                    onChange={(e) => setConfig((prev) => ({ ...prev, assessoriaName: e.target.value }))}
                    placeholder="Nome da sua assessoria"
                    className={inputCls}
                  />
                </div>

                <div>
                  <label className={labelCls}>Logo (emoji)</label>
                  <div className="flex gap-2 flex-wrap">
                    {LOGO_OPTIONS.map((emoji) => (
                      <button
                        key={emoji}
                        onClick={() => setConfig((prev) => ({ ...prev, logoEmoji: emoji }))}
                        className={cn(
                          "flex h-10 w-10 items-center justify-center rounded-xl border text-xl transition-all",
                          config.logoEmoji === emoji
                            ? "border-primary bg-primary/20 scale-110"
                            : "border-border bg-card hover:border-primary/50"
                        )}
                      >
                        {emoji}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className={labelCls}>Cor primária</label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={config.primaryColor}
                        onChange={(e) => setConfig((prev) => ({ ...prev, primaryColor: e.target.value }))}
                        className="h-10 w-14 cursor-pointer rounded-lg border border-border bg-background p-1"
                      />
                      <span className="text-sm font-mono text-text-muted">{config.primaryColor}</span>
                    </div>
                  </div>
                  <div>
                    <label className={labelCls}>Cor de destaque</label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={config.accentColor}
                        onChange={(e) => setConfig((prev) => ({ ...prev, accentColor: e.target.value }))}
                        className="h-10 w-14 cursor-pointer rounded-lg border border-border bg-background p-1"
                      />
                      <span className="text-sm font-mono text-text-muted">{config.accentColor}</span>
                    </div>
                  </div>
                </div>

                <div>
                  <label className={labelCls}>Mensagem de boas-vindas</label>
                  <textarea
                    value={config.welcomeMessage}
                    onChange={(e) => setConfig((prev) => ({ ...prev, welcomeMessage: e.target.value }))}
                    rows={3}
                    className={cn(inputCls, "resize-none")}
                  />
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div custom={2} variants={fadeUp} initial="hidden" animate="show">
            <Card>
              <CardContent className="p-5 space-y-4">
                <SectionTitle>
                  <Layers className="h-4 w-4 text-primary" />
                  Módulos ativos
                </SectionTitle>
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                  {ALL_MODULES.map((mod) => {
                    const enabled = config.featuresEnabled.includes(mod);
                    return (
                      <button
                        key={mod}
                        onClick={() => toggleModule(mod)}
                        className={cn(
                          "flex items-center justify-between rounded-xl border px-3 py-2.5 text-sm font-medium transition-all",
                          enabled
                            ? "border-primary/60 bg-primary/10 text-primary"
                            : "border-border bg-card text-text-muted hover:border-border/80 hover:text-text"
                        )}
                      >
                        <span>{mod}</span>
                        <AnimatePresence mode="wait">
                          {enabled ? (
                            <motion.span
                              key="on"
                              initial={{ scale: 0 }}
                              animate={{ scale: 1 }}
                              exit={{ scale: 0 }}
                              className="flex h-5 w-5 items-center justify-center rounded-full bg-primary"
                            >
                              <Check className="h-3 w-3 text-text" />
                            </motion.span>
                          ) : (
                            <motion.span
                              key="off"
                              initial={{ scale: 0 }}
                              animate={{ scale: 1 }}
                              exit={{ scale: 0 }}
                              className="h-5 w-5 rounded-full border border-border"
                            />
                          )}
                        </AnimatePresence>
                      </button>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div custom={3} variants={fadeUp} initial="hidden" animate="show">
            <Card>
              <CardContent className="p-5 space-y-4">
                <SectionTitle>
                  <Globe className="h-4 w-4 text-primary" />
                  Domínio personalizado
                </SectionTitle>

                <div className="flex items-center gap-2 rounded-xl border border-emerald-700/60 bg-emerald-900/20 px-3 py-2.5">
                  <Check className="h-4 w-4 text-emerald-400 shrink-0" />
                  <div className="min-w-0">
                    <p className="text-xs font-medium text-emerald-300">Domínio ativo</p>
                    <p className="truncate text-sm font-mono text-text">{config.customDomain}</p>
                  </div>
                </div>

                <div>
                  <label className={labelCls}>Novo domínio</label>
                  <div className="flex gap-2">
                    <input
                      value={newDomain}
                      onChange={(e) => setNewDomain(e.target.value)}
                      placeholder="app.suaassessoria.com.br"
                      className={cn(inputCls, "flex-1")}
                    />
                    <button
                      onClick={handleVerifyDns}
                      disabled={dnsStatus === "checking" || !newDomain.trim()}
                      className="inline-flex shrink-0 items-center gap-2 rounded-xl border border-border px-4 py-2.5 text-sm font-medium text-text transition-colors hover:border-primary hover:text-primary disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {dnsStatus === "checking" ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Verificando
                        </>
                      ) : (
                        "Verificar DNS"
                      )}
                    </button>
                  </div>
                </div>

                <AnimatePresence>
                  {dnsStatus === "active" && newDomain && (
                    <motion.div
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 8 }}
                      className="flex items-center gap-2 rounded-xl border border-emerald-700/60 bg-emerald-900/20 px-3 py-2"
                    >
                      <Check className="h-4 w-4 text-emerald-400" />
                      <span className="text-sm text-emerald-300">DNS verificado — domínio ativo</span>
                    </motion.div>
                  )}
                </AnimatePresence>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div custom={4} variants={fadeUp} initial="hidden" animate="show">
            <Card>
              <CardContent className="p-5 space-y-4">
                <SectionTitle>
                  <Users className="h-4 w-4 text-primary" />
                  Estatísticas da assessoria
                </SectionTitle>
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { icon: <Users className="h-4 w-4" />, label: "Atletas ativos", value: config.athleteCount, color: "text-primary" },
                    { icon: <UserCheck className="h-4 w-4" />, label: "Treinadores", value: config.coachCount, color: "text-blue-400" },
                    { icon: <Layers className="h-4 w-4" />, label: "Plano atual", value: config.planName, color: "text-amber-400" },
                  ].map((s) => (
                    <div key={s.label} className="rounded-xl border border-border bg-background/50 p-3 text-center">
                      <div className={cn("mb-1 flex items-center justify-center gap-1 text-xs font-medium", s.color)}>
                        {s.icon}
                      </div>
                      <p className="text-lg font-bold text-text">{s.value}</p>
                      <p className="text-xs text-text-muted">{s.label}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div custom={5} variants={fadeUp} initial="hidden" animate="show">
            <button
              onClick={handleSave}
              className={cn(
                "gradient-primary w-full rounded-2xl py-3 text-base font-semibold text-white transition-all",
                saved && "opacity-80"
              )}
            >
              <AnimatePresence mode="wait">
                {saved ? (
                  <motion.span
                    key="saved"
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    className="inline-flex items-center gap-2"
                  >
                    <Check className="h-4 w-4" />
                    Salvo
                  </motion.span>
                ) : (
                  <motion.span
                    key="save"
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                  >
                    Salvar configurações
                  </motion.span>
                )}
              </AnimatePresence>
            </button>
          </motion.div>
        </div>

        <motion.div
          custom={1}
          variants={fadeUp}
          initial="hidden"
          animate="show"
          className="lg:col-span-2"
        >
          <div className="sticky top-6 space-y-3">
            <p className="text-xs font-semibold uppercase tracking-wider text-text-muted">Prévia ao vivo</p>
            <PreviewCard config={config} />
          </div>
        </motion.div>
      </div>
    </div>
  );
}

export default function WhiteLabelPage() {
  const { role } = useCoachRole();
  if (!canAccess(role, "white-label")) {
    return <AccessRestricted feature="White-label" currentRole={role} requiredRoles={["owner"]} />;
  }
  return <WhiteLabelContent />;
}
