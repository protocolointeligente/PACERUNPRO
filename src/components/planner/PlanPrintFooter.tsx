"use client";

import { useEffect, useState } from "react";
import { loadCoachProfile, type CoachProfile } from "@/lib/storage";

export function PlanPrintFooter() {
  const [profile, setProfile] = useState<CoachProfile | null>(null);

  useEffect(() => {
    // Reads persisted coach profile after mount to avoid SSR/client markup mismatch.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setProfile(loadCoachProfile());
  }, []);

  if (!profile?.name) return null;

  return (
    <div className="mt-8 hidden border-t pt-4 text-xs print:block" style={{ borderColor: "var(--line)" }}>
      <div className="flex items-end justify-between gap-4">
        <div>
          <p className="m-0 font-bold">{profile.name}</p>
          {profile.role && (
            <p className="m-0" style={{ color: "var(--muted)" }}>
              {profile.role}
            </p>
          )}
          {profile.credential && (
            <p className="m-0" style={{ color: "var(--muted)" }}>
              {profile.credential}
            </p>
          )}
          {profile.club && (
            <p className="m-0" style={{ color: "var(--muted)" }}>
              {profile.club}
            </p>
          )}
        </div>
        {profile.signature && (
          <div className="text-right">
            <p className="m-0 text-2xl" style={{ fontFamily: "'Brush Script MT', cursive" }}>
              {profile.signature}
            </p>
            <p className="m-0 border-t pt-1 text-[10px] uppercase tracking-wide" style={{ borderColor: "var(--line)", color: "var(--muted)" }}>
              Assinatura do responsável técnico
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
