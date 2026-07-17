"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

const APP_ROUTE_PREFIXES = ["/atleta", "/treinador", "/admin"];

export function PwaRegister() {
  const pathname = usePathname();

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
    if (!pathname || !APP_ROUTE_PREFIXES.some((prefix) => pathname.startsWith(prefix))) return;

    try {
      localStorage.setItem("prp:last-session-url", `${pathname}${window.location.search}`);
      localStorage.setItem("prp:last-session-at", new Date().toISOString());
    } catch {
      // localStorage pode estar indisponivel em modo privado/restrito.
    }
  }, [pathname]);

  return null;
}
