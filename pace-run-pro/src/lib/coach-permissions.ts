import {
  LayoutDashboard,
  Bell,
  BarChart2,
  Users,
  CalendarDays,
  Activity,
  Dumbbell,
  FileBarChart,
  DollarSign,
  PackagePlus,
  Wallet,
  Globe,
  Ticket,
  Kanban,
  Palette,
  Settings,
  GraduationCap,
} from "lucide-react";
import type { NavItem } from "@/components/layout/nav-config";

export type CoachRole = "autonomo" | "owner" | "hired";

export const ROLE_LABELS: Record<CoachRole, string> = {
  autonomo: "Treinador Autônomo",
  owner: "Dono da Assessoria",
  hired: "Treinador Contratado",
};

export const ROLE_DESCRIPTIONS: Record<CoachRole, string> = {
  autonomo: "Gestão completa dos seus atletas e negócio",
  owner: "Gerencia assessoria, equipe e resultados",
  hired: "Acessa apenas os atletas da sua equipe",
};

const coreNav: NavItem[] = [
  { href: "/treinador/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/treinador/alertas", label: "Alertas", icon: Bell },
  { href: "/treinador/analise-semanal", label: "Análise semanal", icon: BarChart2 },
  { href: "/treinador/alunos", label: "Atletas", icon: Users },
  { href: "/treinador/prescricao/periodizacao", label: "Periodização", icon: CalendarDays },
  { href: "/treinador/prescricao/corrida", label: "Corrida & VDOT", icon: Activity },
  { href: "/treinador/prescricao/forca", label: "Prescrição força", icon: Dumbbell },
  { href: "/treinador/relatorios", label: "Relatórios", icon: FileBarChart },
];

const businessNav: NavItem[] = [
  { href: "/treinador/gestao",        label: "Gestão & vendas",       icon: DollarSign  },
  { href: "/treinador/planos-venda",  label: "Meus planos",           icon: PackagePlus },
  { href: "/treinador/financeiro",    label: "Config. financeiras",   icon: Wallet      },
  { href: "/treinador/minha-pagina",  label: "Minha página pública",  icon: Globe       },
  { href: "/treinador/vouchers",      label: "Vouchers",              icon: Ticket      },
  { href: "/treinador/crm",           label: "CRM de leads",          icon: Kanban      },
];

const ownerOnlyNav: NavItem[] = [
  { href: "/treinador/white-label", label: "White-label", icon: Palette },
  { href: "/treinador/admin",       label: "Admin",       icon: Settings },
];

const helpNav: NavItem[] = [
  { href: "/treinador/conheca-o-sistema", label: "Conheça o sistema", icon: GraduationCap },
];

export function getCoachNav(role: CoachRole): { main: NavItem[]; more: NavItem[] } {
  switch (role) {
    case "owner":
      return { main: coreNav, more: [...businessNav, ...ownerOnlyNav, ...helpNav] };
    case "autonomo":
      return { main: coreNav, more: [...businessNav, ...helpNav] };
    case "hired":
      return { main: coreNav, more: helpNav };
  }
}

export type CoachFeature =
  | "gestao" | "financeiro" | "planos-venda" | "minha-pagina"
  | "vouchers" | "crm" | "white-label" | "admin";

const FEATURE_ALLOWED: Record<CoachFeature, CoachRole[]> = {
  "gestao":        ["autonomo", "owner"],
  "financeiro":    ["autonomo", "owner"],
  "planos-venda":  ["autonomo", "owner"],
  "minha-pagina":  ["autonomo", "owner"],
  "vouchers":      ["autonomo", "owner"],
  "crm":           ["autonomo", "owner"],
  "white-label":   ["owner"],
  "admin":         ["owner"],
};

export function canAccess(role: CoachRole, feature: CoachFeature): boolean {
  return FEATURE_ALLOWED[feature]?.includes(role) ?? true;
}
