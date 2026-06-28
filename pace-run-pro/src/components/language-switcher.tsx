"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Globe } from "lucide-react";

const LOCALES = [
  { code: "pt-BR", label: "Português", flag: "🇧🇷" },
  { code: "en", label: "English", flag: "🇺🇸" },
  { code: "es", label: "Español", flag: "🇪🇸" },
] as const;

type LocaleCode = (typeof LOCALES)[number]["code"];

interface LanguageSwitcherProps {
  current?: LocaleCode;
  className?: string;
}

export function LanguageSwitcher({ current = "pt-BR", className = "" }: LanguageSwitcherProps) {
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const router = useRouter();

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  async function switchLocale(code: LocaleCode) {
    if (code === current || pending) return;
    setPending(true);
    setOpen(false);
    await fetch("/api/locale", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ locale: code }),
    });
    router.refresh();
    setPending(false);
  }

  const currentLocale = LOCALES.find((l) => l.code === current) ?? LOCALES[0];

  return (
    <div ref={ref} className={`relative ${className}`}>
      <button
        onClick={() => setOpen((o) => !o)}
        disabled={pending}
        className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium text-text-muted hover:bg-white/5 hover:text-text transition-colors disabled:opacity-50"
        aria-label="Switch language"
      >
        <Globe className="h-3.5 w-3.5" aria-hidden />
        <span>{currentLocale.flag}</span>
        <span className="hidden sm:inline">{currentLocale.label.split(" ")[0]}</span>
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-1 z-50 min-w-[9rem] rounded-xl border border-border bg-card shadow-xl py-1">
          {LOCALES.map((locale) => (
            <button
              key={locale.code}
              onClick={() => switchLocale(locale.code)}
              className={[
                "flex w-full items-center gap-2.5 px-3 py-2 text-xs transition-colors hover:bg-white/5",
                locale.code === current ? "text-accent font-semibold" : "text-text-muted",
              ].join(" ")}
            >
              <span>{locale.flag}</span>
              <span>{locale.label}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
