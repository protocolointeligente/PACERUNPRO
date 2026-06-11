"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import {
  type AccentMode,
  type ThemeMode,
  loadAccent,
  loadTheme,
  saveAccent,
  saveTheme,
} from "@/lib/storage";

interface ThemeContextValue {
  theme: ThemeMode;
  accent: AccentMode;
  setTheme: (theme: ThemeMode) => void;
  setAccent: (accent: AccentMode) => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<ThemeMode>("dark");
  const [accent, setAccentState] = useState<AccentMode>("blue");

  useEffect(() => {
    // Read persisted preferences after mount to avoid SSR/client markup mismatch.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setThemeState(loadTheme());
    setAccentState(loadAccent());
  }, []);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
  }, [theme]);

  useEffect(() => {
    document.documentElement.dataset.accent = accent;
  }, [accent]);

  function setTheme(next: ThemeMode) {
    setThemeState(next);
    saveTheme(next);
  }

  function setAccent(next: AccentMode) {
    setAccentState(next);
    saveAccent(next);
  }

  return (
    <ThemeContext.Provider value={{ theme, accent, setTheme, setAccent }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used within a ThemeProvider");
  return ctx;
}
