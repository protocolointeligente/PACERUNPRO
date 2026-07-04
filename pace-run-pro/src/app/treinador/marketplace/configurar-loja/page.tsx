"use client";

import { useEffect, useState } from "react";
import { CheckCircle2, ExternalLink, Info, Loader2, Save, Store } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface MarketplaceStore {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  logoUrl: string | null;
  bannerUrl: string | null;
  primaryColor: string;
  instagramUrl: string | null;
  whatsapp: string | null;
  isActive: boolean;
  commissionPct: number;
}

const inputCls = "w-full rounded-xl border border-border bg-background px-3.5 py-2.5 text-sm text-text placeholder:text-text-muted/50 outline-none focus:border-primary/60 focus:ring-2 focus:ring-primary/20 transition-colors";

export default function ConfigurarLojaPage() {
  const [store, setStore] = useState<MarketplaceStore | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [form, setForm] = useState({
    name: "",
    slug: "",
    description: "",
    logoUrl: "",
    bannerUrl: "",
    primaryColor: "#C6F24E",
    instagramUrl: "",
    whatsapp: "",
    isActive: true,
  });

  useEffect(() => {
    fetch("/api/coach/marketplace/store")
      .then((r) => r.ok ? r.json() : null)
      .then((d: { store: MarketplaceStore | null } | null) => {
        if (d?.store) {
          setStore(d.store);
          setForm({
            name: d.store.name,
            slug: d.store.slug,
            description: d.store.description ?? "",
            logoUrl: d.store.logoUrl ?? "",
            bannerUrl: d.store.bannerUrl ?? "",
            primaryColor: d.store.primaryColor,
            instagramUrl: d.store.instagramUrl ?? "",
            whatsapp: d.store.whatsapp ?? "",
            isActive: d.store.isActive,
          });
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  function setField<K extends keyof typeof form>(key: K, value: typeof form[K]) {
    setSaved(false);
    setError(null);
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSave() {
    setSaving(true);
    setSaved(false);
    setError(null);
    try {
      const method = store ? "PATCH" : "POST";
      const res = await fetch("/api/coach/marketplace/store", {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name.trim(),
          slug: form.slug.trim(),
          description: form.description.trim() || null,
          logoUrl: form.logoUrl.trim() || null,
          bannerUrl: form.bannerUrl.trim() || null,
          primaryColor: form.primaryColor,
          instagramUrl: form.instagramUrl.trim() || null,
          whatsapp: form.whatsapp.trim() || null,
          isActive: form.isActive,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Erro ao salvar.");
        return;
      }
      setStore(data.store);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch {
      setError("Erro de conexão. Tente novamente.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl space-y-8 px-4 py-8 sm:px-6">
      {/* Header */}
      <div>
        <Badge variant="primary" className="mb-2">Marketplace</Badge>
        <h1 className="font-display text-2xl font-bold text-text">Configurar loja</h1>
        <p className="text-sm text-text-muted mt-0.5">
          Configure o perfil da sua loja no marketplace — nome, descrição, logo e contato.
        </p>
      </div>

      {/* Commission info */}
      <div className="flex items-start gap-3 rounded-xl border border-border/60 bg-card/60 px-4 py-3">
        <Info className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
        <p className="text-xs text-text-muted">
          A PACE RUN PRO retém <strong className="text-text">{Math.round((store?.commissionPct ?? 0.15) * 100)}%</strong> de comissão por cada venda. O restante é repassado mensalmente via PIX.
        </p>
      </div>

      <Card>
        <CardContent className="p-6 space-y-5">
          <h2 className="font-display text-base font-semibold text-text">Identidade da loja</h2>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-text-muted uppercase tracking-wide">Nome da loja *</label>
              <input
                value={form.name}
                onChange={(e) => setField("name", e.target.value)}
                placeholder="Minha Assessoria"
                className={inputCls}
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-text-muted uppercase tracking-wide">Slug (URL)</label>
              <div className="flex items-center gap-0">
                <span className="rounded-l-xl border border-r-0 border-border bg-card-hover px-3 py-2.5 text-xs text-text-muted">loja/</span>
                <input
                  value={form.slug}
                  onChange={(e) => setField("slug", e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""))}
                  placeholder="minha-assessoria"
                  className={cn(inputCls, "rounded-l-none")}
                />
              </div>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-text-muted uppercase tracking-wide">Descrição</label>
            <textarea
              value={form.description}
              onChange={(e) => setField("description", e.target.value)}
              placeholder="Fale sobre sua assessoria, metodologia e diferenciais..."
              rows={3}
              className={cn(inputCls, "resize-none")}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-6 space-y-5">
          <h2 className="font-display text-base font-semibold text-text">Visual</h2>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-text-muted uppercase tracking-wide">URL do logo</label>
              <input
                value={form.logoUrl}
                onChange={(e) => setField("logoUrl", e.target.value)}
                placeholder="https://..."
                className={inputCls}
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-text-muted uppercase tracking-wide">Cor principal</label>
              <div className="flex items-center gap-3">
                <input
                  type="color"
                  value={form.primaryColor}
                  onChange={(e) => setField("primaryColor", e.target.value)}
                  className="h-10 w-14 cursor-pointer rounded-xl border border-border bg-transparent p-1"
                />
                <input
                  value={form.primaryColor}
                  onChange={(e) => setField("primaryColor", e.target.value)}
                  placeholder="#C6F24E"
                  className={cn(inputCls, "flex-1")}
                />
              </div>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-text-muted uppercase tracking-wide">URL do banner</label>
            <input
              value={form.bannerUrl}
              onChange={(e) => setField("bannerUrl", e.target.value)}
              placeholder="https://..."
              className={inputCls}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-6 space-y-5">
          <h2 className="font-display text-base font-semibold text-text">Contato</h2>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-text-muted uppercase tracking-wide">WhatsApp</label>
              <input
                value={form.whatsapp}
                onChange={(e) => setField("whatsapp", e.target.value)}
                placeholder="+55 11 99999-9999"
                className={inputCls}
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-text-muted uppercase tracking-wide">Instagram</label>
              <input
                value={form.instagramUrl}
                onChange={(e) => setField("instagramUrl", e.target.value)}
                placeholder="https://instagram.com/..."
                className={inputCls}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-6 space-y-3">
          <h2 className="font-display text-base font-semibold text-text">Visibilidade</h2>
          <label className="flex cursor-pointer items-center gap-3">
            <div
              onClick={() => setField("isActive", !form.isActive)}
              className={cn(
                "relative h-6 w-11 shrink-0 rounded-full border transition-colors",
                form.isActive ? "border-primary bg-primary" : "border-border bg-card-hover"
              )}
            >
              <span className={cn("absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform", form.isActive ? "translate-x-5" : "translate-x-0.5")} />
            </div>
            <div>
              <p className="text-sm font-medium text-text">Loja ativa</p>
              <p className="text-xs text-text-muted">Loja visível no marketplace para atletas comprarem.</p>
            </div>
          </label>
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex items-center justify-between gap-4">
        {store && (
          <a
            href={`/marketplace?store=${store.slug}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 text-xs text-primary hover:underline"
          >
            <ExternalLink className="h-3.5 w-3.5" />
            Ver loja pública
          </a>
        )}
        <div className="ml-auto flex items-center gap-3">
          {saved && (
            <span className="flex items-center gap-1.5 text-xs text-success">
              <CheckCircle2 className="h-3.5 w-3.5" />
              Salvo!
            </span>
          )}
          {error && <span className="text-xs text-danger">{error}</span>}
          <Button onClick={handleSave} disabled={saving || !form.name.trim()} className="gap-2">
            {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
            {store ? "Salvar alterações" : "Criar loja"}
          </Button>
        </div>
      </div>

      {/* Store preview */}
      {store && (
        <div className="rounded-2xl border border-primary/20 bg-primary/5 p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/20">
              <Store className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="font-semibold text-text text-sm">{store.name}</p>
              <p className="text-xs text-text-muted">/marketplace?store={store.slug}</p>
            </div>
          </div>
          <p className="text-xs text-text-muted">
            Comissão da plataforma: <strong className="text-text">{Math.round(store.commissionPct * 100)}%</strong>
            {" · "}
            Status: <strong className={store.isActive ? "text-success" : "text-danger"}>{store.isActive ? "Ativa" : "Inativa"}</strong>
          </p>
        </div>
      )}
    </div>
  );
}
