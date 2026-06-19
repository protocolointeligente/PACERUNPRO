"use client";

import { motion } from "framer-motion";
import { Copy, ExternalLink, Globe, QrCode, Share2 } from "lucide-react";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  show: (i: number = 0) => ({ opacity: 1, y: 0, transition: { delay: i * 0.06, duration: 0.4, ease: "easeOut" as const } }),
};

export default function MinhaPaginaPage() {
  const slug = "ricardo-pace"; // will come from coach profile
  const publicUrl = `https://pacerunpro.com.br/p/${slug}`;
  const [copied, setCopied] = useState(false);

  function handleCopy() {
    void navigator.clipboard.writeText(publicUrl).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
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

      {/* URL card */}
      <motion.div custom={1} variants={fadeUp} initial="hidden" animate="show">
        <Card>
          <CardContent className="space-y-4 p-5">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-text-muted mb-1">Seu link</p>
              <div className="flex items-center gap-2 rounded-xl border border-border bg-card-hover/40 px-4 py-3">
                <p className="flex-1 truncate font-mono text-sm text-primary">{publicUrl}</p>
                <button onClick={handleCopy} className="shrink-0 text-text-muted hover:text-text transition-colors">
                  <Copy className="h-4 w-4" />
                </button>
              </div>
              {copied && <p className="mt-1 text-xs text-success">Link copiado!</p>}
            </div>

            <div className="flex flex-wrap gap-2">
              <a href={`/p/${slug}`} target="_blank" rel="noopener noreferrer">
                <Button variant="primary" size="sm" className="gap-1.5">
                  <ExternalLink className="h-3.5 w-3.5" /> Ver página
                </Button>
              </a>
              <Button variant="outline" size="sm" className="gap-1.5" onClick={handleCopy}>
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
      <motion.div custom={2} variants={fadeUp} initial="hidden" animate="show">
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

      {/* Customize prompt */}
      <motion.div custom={3} variants={fadeUp} initial="hidden" animate="show">
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
