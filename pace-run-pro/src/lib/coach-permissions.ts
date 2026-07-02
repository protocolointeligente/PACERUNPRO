import {
  LayoutDashboard,
  Bell,
  Users,
  CalendarDays,
  Activity,
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
  MessageSquare,
  BarChart2,
  Bike,
  Waves,
  Trophy,
} from "lucide-react";
import type { NavItem } from "@/components/layout/nav-config";

export type CoachRole = "autonomo" | "owner" | "hired";

export const ROLE_LABELS: Record<CoachRole, string> = {
  autonomo: "CEO da Assessoria",
  owner: "CEO da Assessoria",
  hired: "Treinador Contratado",
};

export const ROLE_DESCRIPTIONS: Record<CoachRole, string> = {
  autonomo: "Gestão completa dos seus atletas e negócio",
  owner: "Gerencia assessoria, equipe e resultados",
  hired: "Acessa apenas os atletas da sua equipe",
};

// Plans ordered by tier (index = tier level)
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

// First 5 items become the mobile bottom nav — keep them as the daily-driver actions
const coreNav: NavItem[] = [
  { href: "/treinador/dashboard",                label: "Dashboard",  icon: LayoutDashboard },
  { href: "/treinador/atletas",                  label: "Atletas",    icon: Users           },
  { href: "/treinador/mensagens",                label: "Mensagens",  icon: MessageSquare   },
  { href: "/treinador/alertas",                  label: "Alertas",    icon: Bell            },
  { href: "/treinador/prescricao/periodizacao",  label: "Periodizar", icon: CalendarDays    },

  // — Equipe —
  { href: "/treinador/grupos",                   label: "Grupos",          icon: Layers,      sectionStart: "Equipe"    },
  { href: "/treinador/relatorios",               label: "Relatórios",      icon: FileBarChart                           },

  // — Prescrição —
  { href: "/treinador/prescricao/corrida",       label: "VDOT / Paces",    icon: Activity,    sectionStart: "Prescrição" },
  { href: "/treinador/prescricao/forca",         label: "Força",           icon: Dumbbell                               },
  { href: "/treinador/prescricao/ciclismo",      label: "Ciclismo / FTP",  icon: Bike,        sectionStart: undefined   },
  { href: "/treinador/prescricao/natacao",       label: "Natação / CSS",   icon: Waves,       sectionStart: undefined   },
  { href: "/treinador/prescricao/triatlo",       label: "Triathlon",       icon: Trophy,      sectionStart: undefined   },
  { href: "/treinador/configuracoes/zonas",      label: "Zonas de treino", icon: Zap                                    },
  { href: "/treinador/biblioteca",               label: "Biblioteca",      icon: BookOpen                               },
  { href: "/treinador/minha-loja",               label: "Minha loja",      icon: ShoppingBag                            },
];

// Starter+ (tier ≥ 1)
const businessNavBase: NavItem[] = [
  { href: "/treinador/gestao",       label: "Gestão & vendas",      icon: DollarSign,  sectionStart: "Negócio" },
  { href: "/treinador/planos-venda", label: "Meus planos",          icon: PackagePlus },
  { href: "/treinador/loja-planos",  label: "Loja de planilhas",    icon: ShoppingBag },
  { href: "/treinador/financeiro",   label: "Config. financeiras",  icon: Wallet      },
  { href: "/treinador/minha-pagina", label: "Minha página pública", icon: Globe       },
  { href: "/treinador/crm",          label: "CRM de leads",         icon: Kanban      },
];

// Pro+ (tier ≥ 2)
const businessNavPro: NavItem[] = [
  { href: "/treinador/vouchers", label: "Vouchers", icon: Ticket },
];

// Assessoria+ (tier ≥ 3)
const businessNavAssessoria: NavItem[] = [
  { href: "/treinador/admin", label: "Minha assessoria", icon: Settings },
];

// Unlimited only (tier = 4)
const businessNavUnlimited: NavItem[] = [
  { href: "/treinador/white-label", label: "White-label", icon: Palette },
];

const helpNav: NavItem[] = [
  { href: "/treinador/universidade",        label: "PACE University",   icon: GraduationCap, sectionStart: "Aprender" },
  { href: "/treinador/conheca-o-sistema",   label: "Conheça o sistema", icon: BookOpen                               },
  { href: "/treinador/glossario",           label: "Glossário",         icon: BarChart2                              },
  { href: "/treinador/perfil",              label: "Minha conta",       icon: User,          sectionStart: "Conta"    },
];

export function getCoachNav(
  role: CoachRole,
  planId: string = "b2b-free"
): { main: NavItem[]; more: NavItem[] } {
  if (role === "hired") {
    return { main: coreNav, more: helpNav };
  }

  const tier = planTier(planId);
  const more: NavItem[] = [
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

// Minimum plan tier required for each feature
const FEATURE_MIN_TIER: Record<CoachFeature, number> = {
  "gestao":        1,
  "financeiro":    1,
  "planos-venda":  1,
  "minha-pagina":  1,
  "crm":           1,
  "vouchers":      2,
  "admin":         3,
  "white-label":   4,
};

export function canAccess(
  role: CoachRole,
  feature: CoachFeature,
  planId?: string
): boolean {
  if (role === "hired") return false;
  // Without planId: legacy role-only check (owner/autonomo = full access)
  if (!planId) return true;
  return planTier(planId) >= (FEATURE_MIN_TIER[feature] ?? 0);
}
