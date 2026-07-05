"use client";

// Small dismissible upgrade CTA for coaches on the free plan.
// Persists dismissal in localStorage with a 7-day cooldown.

import { useState, useEffect } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Zap, X } from "lucide-react";
import { useCoachRole } from "@/context/coach-role-context";

const STORAGE_KEY = "upgrade-cta-dismissed";
const COOLDOWN_MS = 604800000; // 7 days

export default function UpgradeCTABanner() {
  const { planId } = useCoachRole();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (planId !== "b2b-free") return;
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const { dismissed_at } = JSON.parse(raw) as { dismissed_at: number };
        if (Date.now() - dismissed_at < COOLDOWN_MS) return;
      }
    } catch {
      // localStorage unavailable or malformed — show the banner
    }
    setVisible(true);
  }, [planId]);

  if (!visible || planId !== "b2b-free") return null;

  function handleDismiss() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ dismissed_at: Date.now() }));
    } catch {
      // ignore
    }
    setVisible(false);
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: -6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      className="rounded-xl border border-primary/20 bg-primary/5 px-4 py-3 flex items-center gap-3 text-sm"
    >
      <Zap className="h-4 w-4 shrink-0 text-primary" />
      <p className="flex-1 text-text-muted">
        <span className="font-semibold text-text">Você está no plano gratuito</span>
        {" · "}Desbloqueie mais recursos com o Starter
      </p>
      <Link
        href="/treinador/loja-planos"
        className="shrink-0 rounded-lg bg-primary/15 px-3 py-1.5 text-xs font-semibold text-primary transition-colors hover:bg-primary/25"
      >
        Ver planos
      </Link>
      <button
        type="button"
        onClick={handleDismiss}
        aria-label="Fechar"
        className="shrink-0 rounded-md p-0.5 text-text-muted transition-colors hover:text-text"
      >
        <X className="h-4 w-4" />
      </button>
    </motion.div>
  );
}
