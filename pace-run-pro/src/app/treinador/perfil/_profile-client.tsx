"use client";

import { useRef, useState } from "react";
import { motion } from "framer-motion";
import {
  Camera,
  CheckCircle2,
  Loader2,
  Phone,
  MapPin,
  Shield,
  User,
  MessageCircle,
  BookOpen,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

const inputClass =
  "w-full rounded-xl border border-border bg-background px-3.5 py-2.5 text-sm text-text placeholder:text-text-muted/50 outline-none focus:border-primary/60 focus:ring-2 focus:ring-primary/20 transition-colors";

const labelClass = "mb-1.5 block text-xs font-semibold uppercase tracking-wider text-text-muted";

interface Props {
  initialName: string;
  initialEmail: string;
  initialPhone: string;
  initialCity: string;
  initialState: string;
  initialAvatarUrl: string | null;
  initialCredential: string;
  initialBio: string;
  initialWhatsapp: string;
  initialSpecialties: string[];
}

export default function CoachProfileClient({
  initialName,
  initialEmail,
  initialPhone,
  initialCity,
  initialState,
  initialAvatarUrl,
  initialCredential,
  initialBio,
  initialWhatsapp,
  initialSpecialties,
}: Props) {
  const [name, setName] = useState(initialName);
  const [phone, setPhone] = useState(initialPhone);
  const [city, setCity] = useState(initialCity);
  const [state, setState] = useState(initialState);
  const [credential, setCredential] = useState(initialCredential);
  const [bio, setBio] = useState(initialBio);
  const [whatsapp, setWhatsapp] = useState(initialWhatsapp);
  const [specialtiesInput, setSpecialtiesInput] = useState(initialSpecialties.join(", "));
  const [avatarUrl, setAvatarUrl] = useState(initialAvatarUrl ?? "");
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  const avatarInputRef = useRef<HTMLInputElement>(null);

  async function resizeImage(file: File, maxW: number, maxH: number, quality = 0.82): Promise<string> {
    return new Promise((resolve) => {
      const img = new Image();
      const objUrl = URL.createObjectURL(file);
      img.onload = () => {
        const ratio = Math.min(maxW / img.width, maxH / img.height, 1);
        const canvas = document.createElement("canvas");
        canvas.width = Math.round(img.width * ratio);
        canvas.height = Math.round(img.height * ratio);
        canvas.getContext("2d")!.drawImage(img, 0, 0, canvas.width, canvas.height);
        URL.revokeObjectURL(objUrl);
        resolve(canvas.toDataURL("image/jpeg", quality));
      };
      img.src = objUrl;
    });
  }

  async function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setAvatarUploading(true);
    try {
      const dataUrl = await resizeImage(file, 400, 400);
      const res = await fetch("/api/atleta/avatar", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ dataUrl }),
      });
      if (res.ok) setAvatarUrl(dataUrl);
    } catch {
      setError("Erro ao salvar foto.");
    } finally {
      setAvatarUploading(false);
      e.target.value = "";
    }
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");
    setSaved(false);
    try {
      const res = await fetch("/api/treinador/perfil", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          phone: phone.trim(),
          city: city.trim(),
          state: state.trim(),
          credential: credential.trim(),
          bio: bio.trim(),
          whatsapp: whatsapp.trim(),
          specialties: specialtiesInput
            .split(",")
            .map((s) => s.trim())
            .filter(Boolean),
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        setError(data.error ?? "Erro ao salvar.");
        return;
      }
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch {
      setError("Erro ao salvar perfil.");
    } finally {
      setSaving(false);
    }
  }

  const initials = name.split(" ").map((n) => n[0]).slice(0, 2).join("").toUpperCase() || "TR";

  return (
    <div className="mx-auto max-w-3xl space-y-7">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <Badge variant="primary" className="mb-3">
          <User className="h-3 w-3" />
          Meu Perfil
        </Badge>
        <h1 className="font-display text-2xl font-bold text-text sm:text-3xl">Meu Perfil</h1>
        <p className="mt-1 text-sm text-text-muted">
          Mantenha suas informações atualizadas. Atletas e potenciais clientes verão esses dados.
        </p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1, duration: 0.4 }}
      >
        <Card>
          <CardContent className="p-6">
            {/* Avatar */}
            <div className="mb-7 flex items-center gap-5">
              <div className="relative">
                <Avatar className="h-20 w-20">
                  <AvatarImage src={avatarUrl} alt={name} />
                  <AvatarFallback className="text-lg font-bold">{initials}</AvatarFallback>
                </Avatar>
                <button
                  type="button"
                  onClick={() => avatarInputRef.current?.click()}
                  disabled={avatarUploading}
                  className="absolute -bottom-1 -right-1 flex h-7 w-7 items-center justify-center rounded-full border-2 border-card bg-primary text-white transition-colors hover:bg-primary/90 disabled:opacity-60"
                  title="Alterar foto"
                >
                  {avatarUploading ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Camera className="h-3.5 w-3.5" />
                  )}
                </button>
                <input
                  ref={avatarInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleAvatarChange}
                />
              </div>
              <div>
                <p className="font-display text-lg font-semibold text-text">{name || "Treinador"}</p>
                <p className="text-sm text-text-muted">{initialEmail}</p>
                {credential && <p className="mt-0.5 text-xs text-primary">{credential}</p>}
              </div>
            </div>

            <form onSubmit={handleSave} className="space-y-6">
              {/* Personal info */}
              <div>
                <div className="mb-4 flex items-center gap-2 border-b border-border pb-2">
                  <User className="h-4 w-4 text-text-muted" />
                  <h2 className="text-sm font-semibold text-text">Informações pessoais</h2>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className={labelClass}>Nome completo</label>
                    <input
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Seu nome"
                      className={inputClass}
                    />
                  </div>
                  <div>
                    <label className={labelClass}>
                      <Phone className="inline h-3 w-3 mr-1" />Telefone
                    </label>
                    <input
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="(11) 99999-9999"
                      className={inputClass}
                    />
                  </div>
                  <div>
                    <label className={labelClass}>
                      <MapPin className="inline h-3 w-3 mr-1" />Cidade
                    </label>
                    <input
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      placeholder="Ex.: São Paulo"
                      className={inputClass}
                    />
                  </div>
                  <div>
                    <label className={labelClass}>Estado (UF)</label>
                    <input
                      value={state}
                      onChange={(e) => setState(e.target.value)}
                      placeholder="Ex.: SP"
                      maxLength={2}
                      className={inputClass}
                    />
                  </div>
                </div>
              </div>

              {/* Professional */}
              <div>
                <div className="mb-4 flex items-center gap-2 border-b border-border pb-2">
                  <Shield className="h-4 w-4 text-text-muted" />
                  <h2 className="text-sm font-semibold text-text">Informações profissionais</h2>
                </div>
                <div className="space-y-4">
                  <div>
                    <label className={labelClass}>CREF / Credencial</label>
                    <input
                      value={credential}
                      onChange={(e) => setCredential(e.target.value)}
                      placeholder="Ex.: CREF 014626-G/MG"
                      className={inputClass}
                    />
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <label className={labelClass}>
                        <MessageCircle className="inline h-3 w-3 mr-1" />WhatsApp
                      </label>
                      <input
                        value={whatsapp}
                        onChange={(e) => setWhatsapp(e.target.value)}
                        placeholder="(11) 99999-9999"
                        className={inputClass}
                      />
                    </div>
                    <div>
                      <label className={labelClass}>
                        <BookOpen className="inline h-3 w-3 mr-1" />Especialidades
                      </label>
                      <input
                        value={specialtiesInput}
                        onChange={(e) => setSpecialtiesInput(e.target.value)}
                        placeholder="Corrida de rua, Triathlon…"
                        className={inputClass}
                      />
                      <p className="mt-1 text-[11px] text-text-muted">Separe com vírgulas</p>
                    </div>
                  </div>
                  <div>
                    <label className={labelClass}>Bio / Apresentação</label>
                    <textarea
                      value={bio}
                      onChange={(e) => setBio(e.target.value)}
                      placeholder="Conte um pouco sobre sua trajetória e metodologia de treino…"
                      rows={4}
                      className={`${inputClass} resize-none`}
                    />
                  </div>
                </div>
              </div>

              {error && (
                <p className="rounded-xl border border-danger/30 bg-danger/10 px-4 py-3 text-sm text-danger">
                  {error}
                </p>
              )}

              <div className="flex justify-end">
                <Button type="submit" size="lg" disabled={saving}>
                  {saving ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Salvando…
                    </>
                  ) : saved ? (
                    <>
                      <CheckCircle2 className="h-4 w-4" />
                      Salvo!
                    </>
                  ) : (
                    "Salvar alterações"
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
