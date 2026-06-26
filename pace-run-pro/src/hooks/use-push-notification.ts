"use client";

import { useEffect, useState } from "react";

export type PushStatus = "unsupported" | "denied" | "default" | "granted" | "subscribed";

export function usePushNotification() {
  const [status, setStatus] = useState<PushStatus>("default");

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
      setStatus("unsupported");
      return;
    }
    if (Notification.permission === "denied") setStatus("denied");
    else if (Notification.permission === "granted") {
      navigator.serviceWorker.ready.then((reg) =>
        reg.pushManager.getSubscription().then((sub) => {
          if (sub) setStatus("subscribed");
        })
      );
    }

    navigator.serviceWorker.register("/sw.js").catch(() => {});
  }, []);

  async function subscribe(vapidPublicKey: string): Promise<boolean> {
    if (!("serviceWorker" in navigator)) return false;

    const perm = await Notification.requestPermission();
    if (perm !== "granted") {
      setStatus("denied");
      return false;
    }

    const reg = await navigator.serviceWorker.ready;
    const existing = await reg.pushManager.getSubscription();
    if (existing) await existing.unsubscribe();

    const sub = await reg.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(vapidPublicKey),
    });

    const res = await fetch("/api/atleta/push", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(sub),
    });

    if (res.ok) {
      setStatus("subscribed");
      return true;
    }
    return false;
  }

  async function unsubscribe(): Promise<void> {
    const reg = await navigator.serviceWorker.ready;
    const sub = await reg.pushManager.getSubscription();
    if (sub) {
      await sub.unsubscribe();
      await fetch("/api/atleta/push", { method: "DELETE" });
    }
    setStatus("default");
  }

  return { status, subscribe, unsubscribe };
}

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = atob(base64);
  return Uint8Array.from(rawData, (c) => c.charCodeAt(0));
}
