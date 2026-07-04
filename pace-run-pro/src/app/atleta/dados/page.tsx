"use client";

import { useState } from "react";
import {
  Shield,
  Download,
  Trash2,
  Eye,
  Lock,
  FileJson,
  AlertTriangle,
  CheckCircle2,
} from "lucide-react";

const RIGHTS = [
  {
    icon: Eye,
    title: "Acesso",
    description:
      "Você pode solicitar a qualquer momento uma cópia de todos os seus dados pessoais que armazenamos.",
  },
  {
    icon: FileJson,
    title: "Portabilidade",
    description:
      "Seus dados são exportados em formato JSON legível por máquina, compatível com qualquer sistema.",
  },
  {
    icon: Trash2,
    title: "Exclusão",
    description:
      "Você pode solicitar a exclusão completa da sua conta e todos os dados associados a qualquer momento.",
  },
  {
    icon: Lock,
    title: "Retificação",
    description:
      "Se algum dado estiver incorreto, você pode corrigi-lo nas configurações do perfil.",
  },
];

const DATA_CATEGORIES = [
  { label: "Dados cadastrais", items: ["Nome", "E-mail", "Papel (atleta)"] },
  {
    label: "Perfil atleta",
    items: [
      "Data de nascimento",
      "Sexo",
      "Altura e peso",
      "Objetivo e nível",
      "Histórico de lesões",
    ],
  },
  {
    label: "Treinos",
    items: [
      "Planos de treino",
      "Logs de treino (até 500)",
      "Séries e cargas registradas",
    ],
  },
  {
    label: "Saúde",
    items: [
      "Métricas (peso, FC, etc.)",
      "Check-ins de bem-estar",
      "Logs de recuperação (HRV, sono)",
      "Avaliações físicas",
    ],
  },
  {
    label: "Performance",
    items: ["Testes de performance", "Corridas e tempos", "Eventos de corrida"],
  },
  {
    label: "Questionários",
    items: ["Questionários de saúde (PAR-Q e outros)"],
  },
  {
    label: "Financeiro",
    items: ["Pedidos no marketplace", "Avaliações de produtos"],
  },
  {
    label: "Consentimentos",
    items: [
      "Registros de consentimento LGPD",
      "Versão aceita e data de revogação (se aplicável)",
    ],
  },
];

export default function DadosPage() {
  const [downloading, setDownloading] = useState(false);
  const [downloaded, setDownloaded] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleExport() {
    setDownloading(true);
    setError(null);
    try {
      const res = await fetch("/api/atleta/dados/exportar");
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? "Erro ao exportar dados");
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      const cd = res.headers.get("content-disposition") ?? "";
      const match = cd.match(/filename="([^"]+)"/);
      a.download = match?.[1] ?? "meus-dados-pace.json";
      a.click();
      URL.revokeObjectURL(url);
      setDownloaded(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erro desconhecido");
    } finally {
      setDownloading(false);
    }
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-8 space-y-8">
      {/* Header */}
      <div className="flex items-start gap-4">
        <div className="p-3 rounded-2xl bg-blue-100 dark:bg-blue-900/30">
          <Shield className="w-6 h-6 text-blue-600 dark:text-blue-400" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">Meus Dados & Privacidade</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Lei Geral de Proteção de Dados — LGPD Art. 18
          </p>
        </div>
      </div>

      {/* Export card */}
      <div className="border rounded-2xl p-6 space-y-4">
        <h2 className="font-semibold text-lg">Exportar meus dados</h2>
        <p className="text-sm text-muted-foreground">
          Baixe uma cópia completa de todos os dados que armazenamos sobre você
          em formato JSON. O arquivo inclui treinos, métricas de saúde,
          histórico de compras e registros de consentimento.
        </p>

        {error && (
          <div className="flex items-center gap-2 text-sm text-destructive bg-destructive/10 rounded-lg px-3 py-2">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            {error}
          </div>
        )}

        {downloaded && !error && (
          <div className="flex items-center gap-2 text-sm text-green-700 dark:text-green-400 bg-green-50 dark:bg-green-900/20 rounded-lg px-3 py-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            Dados exportados com sucesso. Verifique seus downloads.
          </div>
        )}

        <button
          onClick={handleExport}
          disabled={downloading}
          className="inline-flex items-center gap-2 bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-60 px-4 py-2.5 rounded-xl text-sm font-medium transition-colors"
        >
          <Download className="w-4 h-4" />
          {downloading ? "Preparando arquivo…" : "Baixar meus dados (JSON)"}
        </button>
      </div>

      {/* Rights */}
      <div className="space-y-3">
        <h2 className="font-semibold text-lg">Seus direitos pela LGPD</h2>
        <div className="grid sm:grid-cols-2 gap-3">
          {RIGHTS.map(({ icon: Icon, title, description }) => (
            <div
              key={title}
              className="border rounded-xl p-4 space-y-1.5"
            >
              <div className="flex items-center gap-2">
                <Icon className="w-4 h-4 text-primary" />
                <span className="font-medium text-sm">{title}</span>
              </div>
              <p className="text-xs text-muted-foreground">{description}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Data categories */}
      <div className="space-y-3">
        <h2 className="font-semibold text-lg">O que está no arquivo exportado</h2>
        <div className="border rounded-2xl divide-y">
          {DATA_CATEGORIES.map(({ label, items }) => (
            <div key={label} className="px-4 py-3">
              <p className="text-sm font-medium mb-1">{label}</p>
              <ul className="text-xs text-muted-foreground space-y-0.5">
                {items.map((item) => (
                  <li key={item} className="flex items-center gap-1.5">
                    <span className="w-1 h-1 rounded-full bg-muted-foreground/50 shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>

      {/* Contact */}
      <div className="bg-muted/50 rounded-2xl px-5 py-4 text-sm text-muted-foreground">
        <p>
          Para solicitar exclusão da conta ou exercer outros direitos LGPD,
          entre em contato com nosso DPO em{" "}
          <a
            href="mailto:privacidade@pacerunpro.com.br"
            className="text-primary underline underline-offset-2"
          >
            privacidade@pacerunpro.com.br
          </a>
          . Prazo de resposta: até 15 dias úteis.
        </p>
      </div>
    </div>
  );
}
