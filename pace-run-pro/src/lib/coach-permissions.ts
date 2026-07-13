import {
  LayoutDashboard,
  Bell,
  BarChart2,
  Users,
  CalendarDays,
  Dumbbell,
  FileBarChart,
  DollarSign,
  PackagePlus,
  ShoppingBag,
  Wallet,
  Globe,
  Ticket,
  Kanban,
  Palette,
  Settings,
  GraduationCap,
  User,
  Zap,
  BookOpen,
  Layers,
} from "lucide-react";
import type { NavItem } from "@/components/layout/nav-config";

export type CoachRole = "autonomo" | "owner" | "hired";

export const ROLE_LABELS: Record<CoachRole, string> = {
  autonomo: "CEO da Assessoria",
  owner: "CEO da Assessoria",
  hired: "Treinador Contratado",
};

export const ROLE_DESCRIPTIONS: Record<CoachRole, string> = {
  autonomo: "Gestao completa dos seus atletas e negocio",
  owner: "Gerencia assessoria, equipe e resultados",
  hired: "Acessa apenas os atletas da sua equipe",
};

const PLAN_TIER: Record<string, number> = {
  "b2b-free": 0,
  "b2b-starter": 1,
  "b2b-pro": 2,
  "b2b-assessoria": 3,
  "b2b-unlimited": 4,
};

function planTier(planId: string): number {
  return PLAN_TIER[planId] ?? 0;
}

const coreNav: NavItem[] = [
  { href: "/treinador/atletas", label: "Calendario", icon: CalendarDays },
  { href: "/treinador/dashboard", label: "Resumo", icon: LayoutDashboard },
  { href: "/treinador/alertas", label: "Alertas", icon: Bell },
  { href: "/treinador/biblioteca", label: "Biblioteca", icon: BookOpen },
  { href: "/treinador/relatorios", label: "Relatorios", icon: FileBarChart },
];

const prescriptionNav: NavItem[] = [
  { href: "/treinador/prescricao/periodizacao", label: "Periodizacao", icon: BarChart2, sectionStart: "Prescricao" },
  { href: "/treinador/prescricao/forca", label: "Forca", icon: Dumbbell },
  { href: "/treinador/grupos", label: "Grupos", icon: Layers },
  { href: "/treinador/analise-semanal", label: "Analise semanal", icon: Users },
];

const businessNavBase: NavItem[] = [
  { href: "/treinador/gestao", label: "Gestao & vendas", icon: DollarSign, sectionStart: "Administracao" },
  { href: "/treinador/planos-venda", label: "Meus planos", icon: PackagePlus },
  { href: "/treinador/loja-planos", label: "Loja de planilhas", icon: ShoppingBag },
  { href: "/treinador/financeiro", label: "Financeiro", icon: Wallet },
  { href: "/treinador/minha-pagina", label: "Pagina publica", icon: Globe },
  { href: "/treinador/crm", label: "CRM de leads", icon: Kanban },
];

const businessNavPro: NavItem[] = [
  { href: "/treinador/vouchers", label: "Vouchers", icon: Ticket },
];

const businessNavAssessoria: NavItem[] = [
  { href: "/treinador/admin", label: "Minha assessoria", icon: Settings },
];

const businessNavUnlimited: NavItem[] = [
  { href: "/treinador/white-label", label: "White-label", icon: Palette },
];

const helpNav: NavItem[] = [
  { href: "/treinador/configuracoes/zonas", label: "Zonas de treino", icon: Zap, sectionStart: "Conta" },
  { href: "/treinador/perfil", label: "Meu perfil", icon: User },
  { href: "/treinador/conheca-o-sistema", label: "Conheca o sistema", icon: GraduationCap },
];

export function getCoachNav(
  role: CoachRole,
  planId: string = "b2b-free"
): { main: NavItem[]; more: NavItem[] } {
  if (role === "hired") {
    return { main: coreNav, more: [...prescriptionNav, ...helpNav] };
  }

  const tier = planTier(planId);
  const more: NavItem[] = [
    ...prescriptionNav,
    ...(tier >= 1 ? businessNavBase : []),
    ...(tier >= 2 ? businessNavPro : []),
    ...(tier >= 3 ? businessNavAssessoria : []),
    ...(tier >= 4 ? businessNavUnlimited : []),
    ...helpNav,
  ];

  return { main: coreNav, more };
}

export type CoachFeature =
  | "gestao" | "financeiro" | "planos-venda" | "minha-pagina"
  | "vouchers" | "crm" | "white-label" | "admin";

const FEATURE_MIN_TIER: Record<CoachFeature, number> = {
  gestao: 1,
  financeiro: 1,
  "planos-venda": 1,
  "minha-pagina": 1,
  crm: 1,
  vouchers: 2,
  admin: 3,
  "white-label": 4,
};

export function canAccess(
  role: CoachRole,
  feature: CoachFeature,
  planId?: string
): boolean {
  if (role === "hired") return false;
  if (!planId) return true;
  return planTier(planId) >= (FEATURE_MIN_TIER[feature] ?? 0);
}
