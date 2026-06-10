import type { PlanoAssinaturaId, UserRole } from "@/lib/types";
import type { MetodoPagamento } from "@/lib/data/plans";

export interface UsuarioAdmin {
  id: string;
  nome: string;
  email: string;
  role: UserRole;
  plano: PlanoAssinaturaId;
  status: "ativo" | "inadimplente" | "cancelado";
  criadoEm: string;
}

export const USUARIOS_ADMIN: UsuarioAdmin[] = [
  { id: "u-1", nome: "Camila Ferreira", email: "camila.ferreira@email.com", role: "aluno", plano: "premium", status: "ativo", criadoEm: "2026-01-12" },
  { id: "u-2", nome: "Rafael Souza", email: "rafael.souza@email.com", role: "aluno", plano: "premium", status: "ativo", criadoEm: "2026-01-18" },
  { id: "u-3", nome: "Beatriz Lima", email: "beatriz.lima@email.com", role: "aluno", plano: "free", status: "ativo", criadoEm: "2026-02-02" },
  { id: "u-4", nome: "Lucas Martins", email: "lucas.martins@email.com", role: "aluno", plano: "premium", status: "ativo", criadoEm: "2026-02-09" },
  { id: "u-5", nome: "Juliana Castro", email: "juliana.castro@email.com", role: "aluno", plano: "free", status: "inadimplente", criadoEm: "2026-02-20" },
  { id: "u-6", nome: "Pedro Henrique", email: "pedro.henrique@email.com", role: "aluno", plano: "premium", status: "ativo", criadoEm: "2026-03-01" },
  { id: "u-7", nome: "Amanda Rocha", email: "amanda.rocha@email.com", role: "aluno", plano: "premium", status: "ativo", criadoEm: "2026-03-15" },
  { id: "u-8", nome: "Thiago Almeida", email: "thiago.almeida@email.com", role: "aluno", plano: "free", status: "cancelado", criadoEm: "2026-03-22" },
  { id: "u-9", nome: "Studio Fit Performance", email: "contato@studiofit.com", role: "personal", plano: "personal", status: "ativo", criadoEm: "2025-11-04" },
  { id: "u-10", nome: "André Coach", email: "andre.coach@email.com", role: "personal", plano: "personal", status: "ativo", criadoEm: "2025-12-10" },
  { id: "u-11", nome: "Equipe MV GYM", email: "admin@mvgym.com", role: "admin", plano: "personal", status: "ativo", criadoEm: "2025-10-01" },
];

export interface TransacaoAdmin {
  id: string;
  usuario: string;
  plano: PlanoAssinaturaId;
  valor: number;
  metodo: MetodoPagamento;
  status: "pago" | "pendente" | "falhou";
  data: string;
}

export const TRANSACOES_ADMIN: TransacaoAdmin[] = [
  { id: "tx-1", usuario: "Rafael Souza", plano: "premium", valor: 39.9, metodo: "cartao", status: "pago", data: "2026-06-09" },
  { id: "tx-2", usuario: "Camila Ferreira", plano: "premium", valor: 39.9, metodo: "pix", status: "pago", data: "2026-06-08" },
  { id: "tx-3", usuario: "André Coach", plano: "personal", valor: 99.9, metodo: "cartao", status: "pago", data: "2026-06-07" },
  { id: "tx-4", usuario: "Juliana Castro", plano: "free", valor: 0, metodo: "pix", status: "falhou", data: "2026-06-05" },
  { id: "tx-5", usuario: "Lucas Martins", plano: "premium", valor: 39.9, metodo: "mercadopago", status: "pago", data: "2026-06-04" },
  { id: "tx-6", usuario: "Studio Fit Performance", plano: "personal", valor: 99.9, metodo: "cartao", status: "pago", data: "2026-06-03" },
  { id: "tx-7", usuario: "Amanda Rocha", plano: "premium", valor: 39.9, metodo: "pix", status: "pendente", data: "2026-06-02" },
  { id: "tx-8", usuario: "Pedro Henrique", plano: "premium", valor: 39.9, metodo: "cartao", status: "pago", data: "2026-06-01" },
];

export const METRICAS_ADMIN = {
  totalUsuarios: USUARIOS_ADMIN.length,
  alunosAtivos: USUARIOS_ADMIN.filter((u) => u.role === "aluno" && u.status === "ativo").length,
  mrr: TRANSACOES_ADMIN.filter((t) => t.status === "pago").reduce((acc, t) => acc + t.valor, 0),
  novosAssinantesMes: 5,
  churnRatePct: 4.2,
  distribuicaoPlanos: [
    { plano: "free" as PlanoAssinaturaId, quantidade: USUARIOS_ADMIN.filter((u) => u.plano === "free").length },
    { plano: "premium" as PlanoAssinaturaId, quantidade: USUARIOS_ADMIN.filter((u) => u.plano === "premium").length },
    { plano: "personal" as PlanoAssinaturaId, quantidade: USUARIOS_ADMIN.filter((u) => u.plano === "personal").length },
  ],
  receitaMensal: [
    { mes: "Jan", receita: 3200 },
    { mes: "Fev", receita: 4100 },
    { mes: "Mar", receita: 5400 },
    { mes: "Abr", receita: 6300 },
    { mes: "Mai", receita: 7200 },
    { mes: "Jun", receita: 7950 },
  ],
};
