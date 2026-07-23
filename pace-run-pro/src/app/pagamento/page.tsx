"use client";

import { Suspense, useEffect, useState } from "react";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { CheckCircle2, Copy, Loader2, QrCode } from "lucide-react";
import { Button } from "@/components/ui/button";
import { b2bPlans } from "@/lib/mock-data-billing";
import { formatBRL } from "@/lib/utils";

function PaymentContent() {
  const router = useRouter();
  const params = useSearchParams();
  const planId = params.get("plano") ?? "b2b-pro";
  const plan = b2bPlans.find((item) => item.id === planId && item.price > 0) ?? b2bPlans[2];
  const [taxId, setTaxId] = useState("");
  const [pixText, setPixText] = useState("");
  const [qrUrl, setQrUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!pixText) return;
    const timer = window.setInterval(async () => {
      const response = await fetch("/api/billing/pagbank/pix", { cache: "no-store" });
      if (response.ok && (await response.json()).active) {
        window.clearInterval(timer);
        router.replace("/treinador/dashboard?pagamento=confirmado");
        router.refresh();
      }
    }, 5000);
    return () => window.clearInterval(timer);
  }, [pixText, router]);

  async function createPix() {
    setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/billing/pagbank/pix", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ planId: plan.id, taxId }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "Não foi possível gerar o PIX");
      setPixText(data.pixText);
      setQrUrl(data.pixQrCodeUrl);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao gerar pagamento");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="mx-auto flex min-h-dvh max-w-lg items-center px-6 py-12">
      <section className="w-full rounded-2xl border border-border bg-card p-7 shadow-2xl">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/15 text-primary"><QrCode /></div>
          <div><p className="text-xs uppercase tracking-wider text-text-muted">Pagamento seguro</p><h1 className="text-2xl font-extrabold text-text">Plano {plan.name}</h1></div>
        </div>
        <p className="mt-5 text-3xl font-extrabold text-text">R$ {formatBRL(plan.price)}<span className="text-sm font-normal text-text-muted">/mês</span></p>

        {!pixText ? (
          <div className="mt-7 space-y-4">
            <label className="block text-sm font-semibold text-text">CPF ou CNPJ
              <input value={taxId} onChange={(e) => setTaxId(e.target.value)} className="mt-2 w-full rounded-xl border border-border bg-background px-4 py-3" placeholder="Somente números" />
            </label>
            {error && <p className="text-sm text-danger">{error}</p>}
            <Button className="w-full" size="lg" onClick={createPix} disabled={loading}>
              {loading ? <><Loader2 className="h-4 w-4 animate-spin" /> Gerando PIX…</> : "Gerar PIX"}
            </Button>
          </div>
        ) : (
          <div className="mt-7 text-center">
            {qrUrl && <Image src={qrUrl} width={240} height={240} alt="QR Code PIX" className="mx-auto rounded-xl bg-white p-2" unoptimized />}
            <Button variant="outline" className="mt-4 w-full" onClick={() => navigator.clipboard.writeText(pixText)}><Copy className="h-4 w-4" /> Copiar código PIX</Button>
            <p className="mt-4 flex items-center justify-center gap-2 text-sm text-text-muted"><CheckCircle2 className="h-4 w-4 text-success" /> Acesso liberado automaticamente após a confirmação.</p>
          </div>
        )}
      </section>
    </main>
  );
}

export default function PaymentPage() {
  return <Suspense fallback={null}><PaymentContent /></Suspense>;
}
