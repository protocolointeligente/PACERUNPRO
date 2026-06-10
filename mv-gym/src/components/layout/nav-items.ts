import {
  Home,
  Dumbbell,
  LineChart,
  Apple,
  User,
  Users,
  ClipboardList,
  LayoutDashboard,
  CreditCard,
  BarChart3,
} from "lucide-react";
import type { NavItem } from "./bottom-nav";

export const ALUNO_NAV: NavItem[] = [
  { href: "/aluno/dashboard", label: "Início", icon: Home },
  { href: "/aluno/treino", label: "Treino", icon: Dumbbell },
  { href: "/aluno/evolucao", label: "Evolução", icon: LineChart },
  { href: "/aluno/nutricao", label: "Nutrição", icon: Apple },
  { href: "/aluno/perfil", label: "Perfil", icon: User },
];

export const PERSONAL_NAV: NavItem[] = [
  { href: "/personal/dashboard", label: "Início", icon: Home },
  { href: "/personal/alunos", label: "Alunos", icon: Users },
  { href: "/personal/avaliacoes", label: "Avaliações", icon: ClipboardList },
  { href: "/personal/perfil", label: "Perfil", icon: User },
];

export const ADMIN_NAV: NavItem[] = [
  { href: "/admin/dashboard", label: "Início", icon: LayoutDashboard },
  { href: "/admin/usuarios", label: "Usuários", icon: Users },
  { href: "/admin/assinaturas", label: "Assinaturas", icon: CreditCard },
  { href: "/admin/financeiro", label: "Financeiro", icon: BarChart3 },
];
