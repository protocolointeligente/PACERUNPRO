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
  { href: "/aluno/perfil", label: "Perfil", icon: User },
];

export const coachNav: NavItem[] = [
  { href: "/treinador/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/treinador/alunos", label: "Atletas", icon: Users },
  { href: "/treinador/prescricao/corrida", label: "Prescrição corrida", icon: Activity },
  { href: "/treinador/prescricao/forca", label: "Prescrição força", icon: Dumbbell },
  { href: "/treinador/relatorios", label: "Relatórios", icon: FileBarChart },
];
