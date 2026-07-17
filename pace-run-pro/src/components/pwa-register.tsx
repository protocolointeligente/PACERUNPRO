"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";

const APP_ROUTE_PREFIXES = ["/atleta", "/treinador", "/admin"];

export function PwaRegister() {
  const pathname = usePathname();
  const [isOffline, setIsOffline] = useState(false);

  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;

    const register = () => {
      navigator.serviceWorker.register("/sw.js").catch(() => undefined);
    };

    if (document.readyState === "complete") {
      register();
      return;
    }

    window.addEventListener("load", register, { once: true });
    return () => window.removeEventListener("load", register);
  }, []);

  useEffect(() => {
    const syncOnlineState = () => setIsOffline(!navigator.onLine);
    syncOnlineState();
    window.addEventListener("online", syncOnlineState);
    window.addEventListener("offline", syncOnlineState);
    return () => {
      window.removeEventListener("online", syncOnlineState);
      window.removeEventListener("offline", syncOnlineState);
    };
  }, []);

  useEffect(() => {
    if (!pathname || !APP_ROUTE_PREFIXES.some((prefix) => pathname.startsWith(prefix))) return;

    try {
      localStorage.setItem("prp:last-session-url", `${pathname}${window.location.search}${window.location.hash}`);
      localStorage.setItem("prp:last-session-at", new Date().toISOString());
    } catch {
      // localStorage pode estar indisponivel em modo privado/restrito.
    }
  }, [pathname]);

  if (!isOffline) return null;

  return (
    <div className="fixed left-3 right-3 top-3 z-[80] mx-auto max-w-md rounded-2xl border border-warning/35 bg-card/95 px-4 py-3 text-sm text-text shadow-2xl shadow-black/20 backdrop-blur-xl">
      <p className="font-bold">Voce esta offline</p>
      <p className="mt-0.5 text-xs leading-5 text-text-muted">
        A ultima sessao carregada continua disponivel quando estiver no cache.
        Para evitar perda de dados, deixe novos registros para quando a conexao voltar.
      </p>
    </div>
  );
}
