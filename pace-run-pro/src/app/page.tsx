"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Zap, ArrowRight } from "lucide-react";

export default function SplashScreen() {
  return (
    <div className="relative flex min-h-dvh flex-1 flex-col items-center justify-between overflow-hidden px-6 py-10 text-center sm:py-14">
      {/* background image of a runner */}
      <div className="absolute inset-0 -z-10">
        <div
          className="absolute inset-0 bg-cover bg-center opacity-35"
          style={{
            backgroundImage:
              "url('https://images.unsplash.com/photo-1502904550040-7534597429ae?w=1600&h=2200&fit=crop')",
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-background/40 via-background/80 to-background" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_900px_500px_at_50%_0%,rgba(139,92,246,0.35),transparent_60%)]" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: -16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="mt-10 flex flex-col items-center gap-3"
      >
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl gradient-primary shadow-2xl shadow-primary/40">
          <Zap className="h-9 w-9 text-white" fill="white" />
        </div>
        <div>
          <p className="font-display text-3xl font-extrabold tracking-[0.18em] text-white sm:text-4xl">
            PACE RUN <span className="gradient-text">PRO</span>
          </p>
          <p className="mt-1 text-xs uppercase tracking-[0.35em] text-text-muted">
            Performance · Ciência · Propósito
          </p>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, delay: 0.25, ease: "easeOut" }}
        className="flex max-w-md flex-col items-center gap-8"
      >
        <h1 className="font-display text-2xl font-semibold leading-tight text-white sm:text-3xl">
          “Treine com propósito.
          <br />
          <span className="gradient-text">Evolua todos os dias.</span>”
        </h1>
        <p className="text-sm text-text-muted">
          Prescrição inteligente de corrida, força e funcional, periodização, testes de
          performance e gestão completa de atletas — tudo em português, em um único lugar.
        </p>

        <Link href="/onboarding" className="w-full">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.97 }}
            className="group flex w-full items-center justify-center gap-2 rounded-2xl gradient-primary px-8 py-4 text-base font-bold tracking-wide text-white shadow-xl shadow-primary/30"
          >
            COMEÇAR
            <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
          </motion.button>
        </Link>

        <div className="flex items-center gap-6 text-xs text-text-muted">
          <Link href="/aluno/dashboard" className="underline-offset-4 hover:text-white hover:underline">
            Já tenho conta — entrar
          </Link>
          <Link href="/treinador/dashboard" className="underline-offset-4 hover:text-white hover:underline">
            Sou treinador
          </Link>
        </div>
      </motion.div>

      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.6 }}
        className="text-[11px] text-text-muted/70"
      >
        Responsável técnico: Ricardo Luiz Pace Júnior — CREF 014626-G/MG
      </motion.p>
    </div>
  );
}
