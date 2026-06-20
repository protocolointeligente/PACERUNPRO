"use client";

import { motion } from "framer-motion";
import { Camera, Copy, ExternalLink, Globe, QrCode, Share2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  show: (i: number = 0) => ({ opacity: 1, y: 0, transition: { delay: i * 0.06, duration: 0.4, ease: "easeOut" as const } }),
};

function resizeImage(file: File, maxW: number, maxH: number): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(url);
      const ratio = Math.min(maxW / img.width, maxH / img.height, 1);
      const canvas = document.createElement("canvas");
      canvas.width = Math.round(img.width * ratio);
      canvas.height = Math.round(img.height * ratio);
      canvas.getContext("2d")!.drawImage(img, 0, 0, canvas.width, canvas.height);
      resolve(canvas.toDataURL("image/jpeg", 0.82));
    };
    img.onerror = reject;
    img.src = url;
  });
}

export default function MinhaPaginaPage() {
  const [slug, setSlug] = useState<string | null>(null);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [bannerUrl, setBannerUrl] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [uploadingBanner, setUploadingBanner] = useState(false);
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const bannerInputRef = useRef<HTMLInputElement>(null);

  const publicUrl = slug ? `https://pacerunpro.com.br/p/${slug}` : "";

  useEffect(() => {
    fetch("/api/coach/profile")
      .then((r) => r.json())
      .then((d: { slug?: string | null; avatarUrl?: string | null; bannerUrl?: string | null }) => {
        if (d.slug) setSlug(d.slug);
        if (d.avatarUrl) setAvatarUrl(d.avatarUrl);
        if (d.bannerUrl) setBannerUrl(d.bannerUrl);
      })
      .catch(() => null);
  }, []);

  function handleCopy() {
    if (!publicUrl) return;
    void navigator.clipboard.writeText(publicUrl).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  async function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingAvatar(true);
    try {
      const dataUrl = await resizeImage(file, 400, 400);
      await fetch("/api/coach/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ avatarUrl: dataUrl }),
      });
      setAvatarUrl(dataUrl);
    } finally {
      setUploadingAvatar(false);
      e.target.value = "";
    }
  }

  async function handleBannerChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingBanner(true);
    try {
      const dataUrl = await resizeImage(file, 1200, 300);
      await fetch("/api/coach/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bannerUrl: dataUrl }),
      });
      setBannerUrl(dataUrl);
    } finally {
      setUploadingBanner(false);
      e.target.value = "";
    }
  }

  return (
    <div className="mx-auto max-w-2xl space-y-8">
      <motion.div variants={fadeUp} initial="hidden" animate="show">
        <Badge variant="primary" className="mb-2">
          <Globe className="h-3 w-3" /> Página pública
        </Badge>
        <h1 className="font-display text-2xl font-bold text-text sm:text-3xl">Minha página pública</h1>
        <p className="mt-1.5 text-sm text-text-muted">
          Essa é a página que seus atletas e futuros clientes veem. Compartilhe o link ou QR Code nas redes sociais.
        </p>
      </motion.div>

      {/* Photo upload */}
      <motion.div custom={1} variants={fadeUp} initial="hidden" animate="show">
        <Card>
          <CardContent className="p-5 space-y-4">
            <p className="text-xs font-semibold uppercase tracking-wider text-text-muted">Fotos do perfil</p>

            {/* Banner */}
            <div className="relative h-24 w-full overflow-hidden rounded-xl bg-card-hover/60 border border-border">
              {bannerUrl && (
                <img src={bannerUrl} alt="Banner" className="h-full w-full object-cover" />
              )}
              <button
                onClick={() => bannerInputRef.current?.click()}
                disabled={uploadingBanner}
                className="absolute right-2 top-2 flex items-center gap-1.5 rounded-lg bg-black/50 px-2.5 py-1.5 text-[11px] font-semibold text-white transition-colors hover:bg-black/70 disabled:opacity-50"
              >
                <Camera className="h-3 w-3" />
                {uploadingBanner ? "Salvando…" : "Alterar banner"}
              </button>
              <input ref={bannerInputRef} type="file" accept="image/*" className="hidden" onChange={handleBannerChange} />
            </div>

            {/* Avatar */}
            <div className="flex items-center gap-4">
              <div className="relative h-16 w-16 shrink-0">
                <div className="h-16 w-16 overflow-hidden rounded-full border-2 border-primary/30 bg-card-hover/60">
                  {avatarUrl ? (
                    <img src={avatarUrl} alt="Foto" className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-text-muted text-xl font-bold">
                      T
                    </div>
                  )}
                </div>
                <button
                  onClick={() => avatarInputRef.current?.click()}
                  disabled={uploadingAvatar}
                  className="absolute -bottom-0.5 -right-0.5 flex h-6 w-6 items-center justify-center rounded-full bg-primary text-white shadow-md transition-opacity hover:opacity-90 disabled:opacity-50"
                >
                  <Camera className="h-3 w-3" />
                </button>
                <input ref={avatarInputRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
              </div>
              <div>
                <p className="text-sm font-semibold text-text">Foto do treinador</p>
                <p className="text-xs text-text-muted">Aparece na sua página pública e para os atletas</p>
                {uploadingAvatar && <p className="text-xs text-primary mt-0.5">Salvando…</p>}
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* URL card */}
      <motion.div custom={2} variants={fadeUp} initial="hidden" animate="show">
        <Card>
          <CardContent className="space-y-4 p-5">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-text-muted mb-1">Seu link</p>
              {publicUrl ? (
                <div className="flex items-center gap-2 rounded-xl border border-border bg-card-hover/40 px-4 py-3">
                  <p className="flex-1 truncate font-mono text-sm text-primary">{publicUrl}</p>
                  <button onClick={handleCopy} className="shrink-0 text-text-muted hover:text-text transition-colors">
                    <Copy className="h-4 w-4" />
                  </button>
                </div>
              ) : (
                <div className="rounded-xl border border-border bg-card-hover/40 px-4 py-3">
                  <p className="text-xs text-text-muted">Configure um slug na página de perfil para ativar seu link público.</p>
                </div>
              )}
              {copied && <p className="mt-1 text-xs text-success">Link copiado!</p>}
            </div>

            <div className="flex flex-wrap gap-2">
              {slug && (
                <a href={`/p/${slug}`} target="_blank" rel="noopener noreferrer">
                  <Button variant="primary" size="sm" className="gap-1.5">
                    <ExternalLink className="h-3.5 w-3.5" /> Ver página
                  </Button>
                </a>
              )}
              <Button variant="outline" size="sm" className="gap-1.5" onClick={handleCopy} disabled={!publicUrl}>
                <Share2 className="h-3.5 w-3.5" /> Compartilhar
              </Button>
              <Button variant="outline" size="sm" className="gap-1.5" disabled>
                <QrCode className="h-3.5 w-3.5" /> Baixar QR Code
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Page preview */}
      {slug && (
        <motion.div custom={3} variants={fadeUp} initial="hidden" animate="show">
          <Card>
            <CardContent className="p-0 overflow-hidden rounded-2xl">
              <div className="border-b border-border bg-card-hover/40 px-4 py-2.5 flex items-center gap-2">
                <div className="flex gap-1.5">
                  <span className="h-2.5 w-2.5 rounded-full bg-danger/60" />
                  <span className="h-2.5 w-2.5 rounded-full bg-warning/60" />
                  <span className="h-2.5 w-2.5 rounded-full bg-success/60" />
                </div>
                <p className="flex-1 text-center font-mono text-[10px] text-text-muted">{publicUrl}</p>
              </div>
              <iframe
                src={`/p/${slug}`}
                className="h-[600px] w-full"
                title="Prévia da sua página pública"
              />
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Customize prompt */}
      <motion.div custom={4} variants={fadeUp} initial="hidden" animate="show">
        <Card className="border-primary/20">
          <CardContent className="p-5">
            <p className="text-sm font-semibold text-text mb-1">Personalize seu perfil público</p>
            <p className="text-xs text-text-muted mb-3">
              Adicione seu logo, bio pública, WhatsApp e configure seus planos para ter uma página profissional.
            </p>
            <div className="flex gap-2">
              <a href="/treinador/planos-venda">
                <Button variant="outline" size="sm">Editar planos</Button>
              </a>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
