import {
  LayoutDashboard,
  Bell,
  BarChart2,
  CalendarDays,
  GraduationCap,
  User,
  BookOpen,
  Layers,
  BriefcaseBusiness,
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
  { href: "/treinador/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/treinador/alertas", label: "Alertas", icon: Bell },
  { href: "/treinador/atletas", label: "Calendario", icon: CalendarDays },
];

const workflowNav: NavItem[] = [
  { href: "/treinador/prescricao/periodizacao", label: "Periodizacao", icon: BarChart2 },
  { href: "/treinador/grupos", label: "Grupos", icon: Layers },
  { href: "/treinador/biblioteca", label: "Biblioteca", icon: BookOpen },
];

const businessNav: NavItem[] = [
  { href: "/treinador/gestao", label: "Gestao", icon: BriefcaseBusiness },
  { href: "/treinador/university", label: "Pace University", icon: GraduationCap },
  { href: "/treinador/glossario", label: "Glossario", icon: BookOpen },
  { href: "/treinador/perfil", label: "Meu perfil", icon: User },
];

export function getCoachNav(
  role: CoachRole,
  planId: string = "b2b-free"
): { main: NavItem[]; more: NavItem[] } {
  if (role === "hired") {
    return { main: coreNav, more: [...workflowNav, ...businessNav] };
  }

  planTier(planId);

  return { main: coreNav, more: [...workflowNav, ...businessNav] };
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
