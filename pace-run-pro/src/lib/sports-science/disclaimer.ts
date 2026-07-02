/**
 * Disclaimers científicos para todas as análises de carga e risco.
 * Etapa 12 — Validação Científica.
 *
 * Nenhuma saída do sistema deve ser interpretada como diagnóstico médico.
 * Sempre usar linguagem de estimativa e recomendação, nunca diretiva ou diagnóstica.
 */

export const SCIENCE_DISCLAIMER =
  "Estimativa baseada em modelos científicos (Banister, Gabbett, Williams). " +
  "Não substitui avaliação de profissional de saúde ou educação física credenciado.";

export const INJURY_RISK_DISCLAIMER =
  "Atenção: indicador de carga elevada. Sugere-se avaliação pelo treinador ou profissional de saúde antes de prosseguir.";

export const MEDICAL_DISCLAIMER =
  "Esta análise é uma estimativa de suporte à decisão, não um diagnóstico médico. " +
  "Consulte um profissional qualificado para orientação individualizada.";

/** Wrapper para adicionar aviso em qualquer string de recomendação. */
export function withDisclaimer(recommendation: string, level: "info" | "warning" | "medical" = "info"): string {
  const note = level === "medical"
    ? MEDICAL_DISCLAIMER
    : level === "warning"
    ? INJURY_RISK_DISCLAIMER
    : SCIENCE_DISCLAIMER;
  return `${recommendation} — ${note}`;
}
