import {
  LayoutDashboard,
  CalendarDays,
  TrendingUp,
  Dumbbell,
  Trophy,
  Users,
  ClipboardList,
  FileBarChart,
  User,
  Activity,
  DollarSign,
  Settings,
  Building2,
  Bell,
  Target,
  Shirt,
  BarChart2,
  Kanban,
  Palette,
  Bot,
  type LucideIcon,
} from "lucide-react";

export interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
}

export const athleteNav: NavItem[] = [
  { href: "/aluno/dashboard", label: "Início", icon: LayoutDashboard },
  { href: "/aluno/calendario", label: "Calendário", icon: CalendarDays },
  { href: "/aluno/evolucao", label: "Evolução", icon: TrendingUp },
  { href: "/aluno/forca", label: "Força", icon: Dumbbell },
  { href: "/aluno/comunidade", label: "Comunidade", icon: Trophy },
];

export const athleteMoreNav: NavItem[] = [
  { href: "/aluno/testes", label: "Testes de performance", icon: Activity },
  { href: "/aluno/planos", label: "Planos & periodização", icon: ClipboardList },
  { href: "/aluno/previsao", label: "Previsão & estratégia", icon: Target },
  { href: "/aluno/ia-treinadora", label: "IA Treinadora", icon: Bot },
  { href: "/aluno/tenis", label: "Tênis tracker", icon: Shirt },
  { href: "/aluno/perfil", label: "Perfil", icon: User },
];

export const coachNav: NavItem[] = [
  { href: "/treinador/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/treinador/alertas", label: "Alertas", icon: Bell },
  { href: "/treinador/analise-semanal", label: "Análise semanal", icon: BarChart2 },
  { href: "/treinador/alunos", label: "Atletas", icon: Users },
  { href: "/treinador/prescricao/corrida", label: "Prescrição corrida", icon: Activity },
  { href: "/treinador/prescricao/forca", label: "Prescrição força", icon: Dumbbell },
  { href: "/treinador/prescricao/periodizacao", label: "Periodização", icon: CalendarDays },
  { href: "/treinador/relatorios", label: "Relatórios", icon: FileBarChart },
  { href: "/treinador/gestao", label: "Gestão & vendas", icon: DollarSign },
  { href: "/treinador/crm", label: "CRM de leads", icon: Kanban },
  { href: "/treinador/white-label", label: "White-label", icon: Palette },
  { href: "/treinador/admin", label: "Admin", icon: Settings },
];

export const adminNav: NavItem[] = [
  { href: "/admin/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/assessorias", label: "Assessorias", icon: Building2 },
  { href: "/admin/atletas", label: "Atletas B2C", icon: Users },
  { href: "/admin/financeiro", label: "Financeiro", icon: DollarSign },
];
