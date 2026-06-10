import type { PlanoAssinatura } from "@/lib/types";

export const PLANOS_ASSINATURA: PlanoAssinatura[] = [
  {
    id: "free",
    nome: "Free",
    precoMensal: 0,
    recursos: [
      "1 plano de treino gerado por IA",
      "Banco de exercícios completo",
      "Registro de cargas e repetições",
      "Check-in diário",
      "Conquistas e XP",
    ],
  },
  {
    id: "premium",
    nome: "Premium",
    precoMensal: 39.9,
    destaque: true,
    recursos: [
      "Tudo do plano Free",
      "AI Coach com adaptação contínua do treino",
      "Detecção de estagnação e deload automático",
      "Plano nutricional personalizado",
      "Evolução completa: medidas, fotos e gráficos",
      "Sem anúncios",
    ],
  },
  {
    id: "personal",
    nome: "Personal",
    precoMensal: 99.9,
    recursos: [
      "Tudo do plano Premium",
      "Cadastro ilimitado de alunos",
      "Edição manual de treinos e avaliações",
      "Acompanhamento de frequência e adesão",
      "Relatórios de evolução por aluno",
    ],
  },
];

export type MetodoPagamento = "cartao" | "pix" | "mercadopago";

export const METODOS_PAGAMENTO: { id: MetodoPagamento; nome: string; descricao: string }[] = [
  {
    id: "cartao",
    nome: "Cartão de crédito (Stripe)",
    descricao: "Cobrança recorrente automática, cancele quando quiser.",
  },
  {
    id: "pix",
    nome: "Pix",
    descricao: "Pagamento instantâneo via QR Code, renovação manual mensal.",
  },
  {
    id: "mercadopago",
    nome: "Mercado Pago",
    descricao: "Cartão, boleto ou saldo Mercado Pago.",
  },
];

export function getPlanoById(id: string): PlanoAssinatura | undefined {
  return PLANOS_ASSINATURA.find((p) => p.id === id);
}
