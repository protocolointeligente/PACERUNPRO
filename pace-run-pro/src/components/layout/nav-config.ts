import {
  Activity,
  BarChart2,
  Bell,
  BookOpen,
  Building2,
  CalendarDays,
  CheckSquare,
  ClipboardList,
  DollarSign,
  GraduationCap,
  Kanban,
  LayoutDashboard,
  LayoutGrid,
  Palette,
  ScrollText,
  Shirt,
  Target,
  TicketPercent,
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
  { href: "/atleta/calendario", label: "Meus treinos", icon: CalendarDays },
  { href: "/atleta/evolucao", label: "Evolucao", icon: BarChart2 },
  { href: "/atleta/comunidade", label: "Comunidade", icon: Trophy },
];

export const athleteMoreNav: NavItem[] = [
  { href: "/atleta/atividade", label: "Atividades", icon: CheckSquare },
  { href: "/atleta/planos", label: "Planos & periodizacao", icon: ClipboardList },
  { href: "/atleta/previsao", label: "Previsao & estrategia", icon: Target },
  { href: "/atleta/university", label: "Pace University", icon: GraduationCap },
  { href: "/atleta/tenis", label: "Tenis tracker", icon: Shirt },
  { href: "/atleta/perfil", label: "Perfil", icon: User },
];

export const coachNav: NavItem[] = [
  { href: "/treinador/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/treinador/alertas", label: "Alertas", icon: Bell },
  { href: "/treinador/atletas", label: "Atletas", icon: Users },
  { href: "/treinador/analise-semanal", label: "Analise semanal", icon: Activity },
  { href: "/treinador/relatorios", label: "Relatorios", icon: ScrollText },
  { href: "/treinador/prescricao/periodizacao", label: "Periodizacao", icon: BarChart2 },
  { href: "/treinador/avaliacao", label: "Avaliacao", icon: Activity },
  { href: "/treinador/grupos", label: "Grupos", icon: Users },
  { href: "/treinador/biblioteca", label: "Biblioteca", icon: BookOpen },
  { href: "/treinador/gestao", label: "Gestao", icon: Kanban },
  { href: "/treinador/crm", label: "CRM", icon: Users },
  { href: "/treinador/planos-venda", label: "Planos de venda", icon: ClipboardList },
  { href: "/treinador/financeiro", label: "Financeiro", icon: DollarSign },
  { href: "/treinador/minha-loja", label: "Minha loja", icon: LayoutGrid },
  { href: "/treinador/minha-pagina", label: "Minha pagina", icon: User },
  { href: "/treinador/vouchers", label: "Vouchers", icon: TicketPercent },
  { href: "/treinador/white-label", label: "White Label", icon: Palette },
  { href: "/treinador/university", label: "Pace University", icon: GraduationCap },
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
