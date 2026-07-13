import {
  Activity,
  BarChart2,
  Bell,
  BookOpen,
  Bot,
  Building2,
  CalendarDays,
  CheckSquare,
  ClipboardList,
  DollarSign,
  Dumbbell,
  GraduationCap,
  Kanban,
  LayoutDashboard,
  LayoutGrid,
  ScrollText,
  Shirt,
  Target,
  Trophy,
  User,
  UserPlus,
  Users,
  type LucideIcon,
} from "lucide-react";

export interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
  /** When set, render a section label above this item in the sidebar */
  sectionStart?: string;
}

export const athleteNav: NavItem[] = [
  { href: "/atleta/dashboard", label: "Inicio", icon: LayoutDashboard },
  { href: "/atleta/calendario", label: "Calendario", icon: CalendarDays },
  { href: "/atleta/evolucao", label: "Evolucao", icon: BarChart2 },
  { href: "/atleta/forca", label: "Forca", icon: Dumbbell },
  { href: "/atleta/comunidade", label: "Comunidade", icon: Trophy },
];

export const athleteMoreNav: NavItem[] = [
  { href: "/atleta/atividade", label: "Atividades", icon: CheckSquare },
  { href: "/atleta/testes", label: "Testes de performance", icon: Activity },
  { href: "/atleta/planos", label: "Planos & periodizacao", icon: ClipboardList },
  { href: "/atleta/previsao", label: "Previsao & estrategia", icon: Target },
  { href: "/atleta/ia-treinadora", label: "IA Treinadora", icon: Bot },
  { href: "/atleta/tenis", label: "Tenis tracker", icon: Shirt },
  { href: "/atleta/perfil", label: "Perfil", icon: User },
];

export const coachNav: NavItem[] = [
  { href: "/treinador/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/treinador/alertas", label: "Alertas", icon: Bell },
  { href: "/treinador/atletas", label: "Calendario", icon: CalendarDays },
  { href: "/treinador/prescricao/periodizacao", label: "Periodizacao", icon: BarChart2 },
  { href: "/treinador/grupos", label: "Grupos", icon: Users },
  { href: "/treinador/biblioteca", label: "Biblioteca", icon: BookOpen },
  { href: "/treinador/gestao", label: "Gestao", icon: Kanban },
  { href: "/treinador/glossario", label: "Glossario", icon: GraduationCap },
  { href: "/treinador/perfil", label: "Meu perfil", icon: User },
];

export const adminNav: NavItem[] = [
  { href: "/admin/dashboard", label: "Visao Geral", icon: LayoutDashboard },
  { href: "/admin/assessorias", label: "Assessorias", icon: Building2 },
  { href: "/admin/planos", label: "Planos & Modulos", icon: LayoutGrid },
  { href: "/admin/financeiro", label: "Financeiro", icon: DollarSign },
  { href: "/admin/pendencias", label: "Pendencias", icon: CheckSquare },
  { href: "/admin/logs", label: "Logs e auditoria", icon: ScrollText },
  { href: "/admin/usuarios", label: "Adicionar usuario", icon: UserPlus },
];
