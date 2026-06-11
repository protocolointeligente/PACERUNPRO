"use client";

import { useEffect, useState } from "react";
import { loadCoachProfile, saveCoachProfile, type CoachProfile } from "@/lib/storage";

export default function PerfilPage() {
  const [profile, setProfile] = useState<CoachProfile>({
    name: "",
    role: "Profissional de Educação Física",
    credential: "Treinador Licença B ATFA CONMEBOL",
    club: "",
    email: "",
    phone: "",
    signature: "",
  });
  const [status, setStatus] = useState<string | null>(null);

  useEffect(() => {
    // Reads persisted profile after mount to avoid SSR/client markup mismatch.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setProfile(loadCoachProfile());
  }, []);

  function update<K extends keyof CoachProfile>(key: K, value: CoachProfile[K]) {
    setProfile((prev) => ({ ...prev, [key]: value }));
    setStatus(null);
  }

  function handleSave() {
    saveCoachProfile(profile);
    setStatus("Perfil salvo. Os dados aparecerão na assinatura dos PDFs gerados.");
  }

  return (
    <div className="card p-4.5">
      <h2 className="m-0 mb-4 flex items-center gap-2.5 text-[19px] font-bold tracking-tight">
        <span className="grid h-[31px] w-[31px] place-items-center rounded-xl text-sm font-black text-white" style={{ background: "var(--accent)" }}>
          9
        </span>
        Perfil do treinador
      </h2>

      <p className="callout mb-4">
        Estes dados são usados para identificar o responsável técnico e assinar os planos de treino exportados em PDF.
      </p>

      <div className="grid gap-2.5 sm:grid-cols-2">
        <div>
          <label className="field-label" htmlFor="perfilNome">
            Nome completo
          </label>
          <input id="perfilNome" className="field-input" placeholder="ex: Ricardo Pace" value={profile.name} onChange={(e) => update("name", e.target.value)} />
        </div>
        <div>
          <label className="field-label" htmlFor="perfilFuncao">
            Função
          </label>
          <input id="perfilFuncao" className="field-input" placeholder="ex: Profissional de Educação Física" value={profile.role} onChange={(e) => update("role", e.target.value)} />
        </div>
        <div>
          <label className="field-label" htmlFor="perfilCredencial">
            Licença / Credencial
          </label>
          <input
            id="perfilCredencial"
            className="field-input"
            placeholder="ex: Treinador Licença B ATFA CONMEBOL"
            value={profile.credential}
            onChange={(e) => update("credential", e.target.value)}
          />
        </div>
        <div>
          <label className="field-label" htmlFor="perfilClube">
            Clube / Instituição
          </label>
          <input id="perfilClube" className="field-input" placeholder="ex: Escola de Futebol Vitória" value={profile.club ?? ""} onChange={(e) => update("club", e.target.value)} />
        </div>
        <div>
          <label className="field-label" htmlFor="perfilEmail">
            E-mail
          </label>
          <input id="perfilEmail" type="email" className="field-input" placeholder="ex: contato@email.com" value={profile.email ?? ""} onChange={(e) => update("email", e.target.value)} />
        </div>
        <div>
          <label className="field-label" htmlFor="perfilTelefone">
            Telefone
          </label>
          <input id="perfilTelefone" className="field-input" placeholder="ex: (11) 99999-9999" value={profile.phone ?? ""} onChange={(e) => update("phone", e.target.value)} />
        </div>
        <div className="sm:col-span-2">
          <label className="field-label" htmlFor="perfilAssinatura">
            Assinatura (nome para impressão)
          </label>
          <input
            id="perfilAssinatura"
            className="field-input"
            placeholder="ex: Ricardo Pace"
            value={profile.signature ?? ""}
            onChange={(e) => update("signature", e.target.value)}
          />
        </div>
      </div>

      <button type="button" className="btn mt-3.5" onClick={handleSave} disabled={!profile.name.trim()}>
        Salvar perfil
      </button>

      {status && (
        <div className="mt-3.5 rounded-xl border px-2.5 py-1.5 text-xs" style={{ borderColor: "rgba(34,197,94,.22)", background: "rgba(48,209,88,.10)", color: "var(--ok)" }}>
          {status}
        </div>
      )}

      {profile.signature && (
        <div className="surface mt-4 p-3.5">
          <p className="field-label">Pré-visualização da assinatura no PDF</p>
          <div className="flex items-end justify-between gap-4">
            <div className="text-[12px]" style={{ color: "var(--muted)" }}>
              <p className="m-0 font-bold" style={{ color: "var(--text)" }}>
                {profile.name || "Seu nome"}
              </p>
              {profile.role && <p className="m-0">{profile.role}</p>}
              {profile.credential && <p className="m-0">{profile.credential}</p>}
              {profile.club && <p className="m-0">{profile.club}</p>}
            </div>
            <div className="text-right">
              <p className="m-0 text-2xl" style={{ fontFamily: "'Brush Script MT', cursive" }}>
                {profile.signature}
              </p>
              <p className="m-0 border-t pt-1 text-[10px] uppercase tracking-wide" style={{ borderColor: "var(--line)", color: "var(--muted)" }}>
                Assinatura do responsável técnico
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
