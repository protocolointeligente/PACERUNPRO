import {
  LayoutDashboard,
  CalendarDays,
  TrendingUp,
  Dumbbell,
  Trophy,
  Users,
  ClipboardList,
  FileBarChart,
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
  GraduationCap,
  Ticket,
  LayoutGrid,
  CheckSquare,
  ScrollText,
  Wallet,
  PackagePlus,
  Globe,
  UserPlus,
  BookOpen,
  ShoppingBag,
  MessageSquare,
  CreditCard,
  Store,
  Calendar,
  Clock,
  type LucideIcon,
} from "lucide-react";

export interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
  /** When set, render a section label above this item in the sidebar */
  sectionStart?: string;
}

// Bottom nav (4 primary items — daily athlete flow)
export const athleteNav: NavItem[] = [
  { href: "/atleta/dashboard", label: "Hoje", icon: LayoutDashboard },
  { href: "/atleta/calendario", label: "Plano", icon: CalendarDays },
  { href: "/atleta/evolucao", label: "Evolução", icon: TrendingUp },
  { href: "/atleta/treinador", label: "Treinador", icon: MessageSquare },
];

// Sidebar / drawer secondary items (sectioned for clarity)
export const athleteMoreNav: NavItem[] = [
  { href: "/atleta/forca",        label: "Força",                 icon: Dumbbell,      sectionStart: "Treino"   },
  { href: "/atleta/atividade",    label: "Atividades",            icon: CheckSquare                             },
  { href: "/atleta/testes",       label: "Testes de performance", icon: Activity,      sectionStart: "Análise"  },
  { href: "/atleta/relatorio",    label: "Relatório PDF",         icon: FileBarChart                            },
  { href: "/atleta/questionarios",label: "Questionários de saúde",icon: ClipboardList                          },
  { href: "/atleta/planos",       label: "Planos & periodização", icon: ClipboardList                           },
  { href: "/atleta/previsao",     label: "Previsão & estratégia", icon: Target                                  },
  { href: "/atleta/comunidade",   label: "Comunidade",            icon: Trophy,        sectionStart: "Social"   },
  { href: "/atleta/biblioteca",   label: "Minha biblioteca",      icon: BookOpen                                },
  { href: "/atleta/tenis",        label: "Tênis tracker",         icon: Shirt                                   },
  { href: "/loja",                label: "Loja de treinos",       icon: ShoppingBag, sectionStart: "Comprar"    },
  { href: "/atleta/cursos",       label: "Meus cursos",           icon: BookOpen,      sectionStart: "Aprender" },
  { href: "/atleta/desafios",     label: "Desafios",              icon: Trophy                                  },
  { href: "/atleta/universidade", label: "PACE University",       icon: GraduationCap                          },
  { href: "/atleta/perfil",       label: "Minha conta",           icon: CreditCard,    sectionStart: "Conta"    },
];

export const coachNav: NavItem[] = [
  { href: "/treinador/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/treinador/alertas", label: "Alertas", icon: Bell },
  { href: "/treinador/analise-semanal", label: "Análise semanal", icon: BarChart2 },
  { href: "/treinador/atletas", label: "Atletas", icon: Users },
  { href: "/treinador/prescricao/periodizacao", label: "Periodização", icon: CalendarDays },
  { href: "/treinador/prescricao/corrida", label: "Referência VDOT", icon: Activity },
  { href: "/treinador/prescricao/forca", label: "Prescrição força", icon: Dumbbell },
  { href: "/treinador/prescricao/forca-periodizacao", label: "Periodização força", icon: BarChart2 },
  { href: "/treinador/biblioteca", label: "Biblioteca de treinos", icon: BookOpen },
  { href: "/treinador/relatorios", label: "Relatórios", icon: FileBarChart },
  { href: "/treinador/marketplace",  label: "Marketplace",             icon: Store,        sectionStart: "Produto" },
  { href: "/treinador/cursos",       label: "Cursos online",           icon: BookOpen                            },
  { href: "/treinador/eventos",      label: "Eventos",                 icon: Calendar                            },
  { href: "/treinador/desafios",     label: "Desafios",                icon: Trophy                              },
  { href: "/treinador/agenda",       label: "Agenda",                  icon: Clock                               },
  { href: "/treinador/minha-loja", label: "Minha loja de treinos", icon: ShoppingBag },
  { href: "/treinador/gestao",        label: "Gestão & vendas",        icon: DollarSign  },
  { href: "/treinador/receitas",     label: "Receitas da loja",       icon: TrendingUp  },
  { href: "/treinador/planos-venda", label: "Meus planos",            icon: PackagePlus },
  { href: "/treinador/financeiro",   label: "Config. financeiras",    icon: Wallet      },
  { href: "/treinador/minha-pagina", label: "Minha página pública",   icon: Globe       },
  { href: "/treinador/vouchers", label: "Vouchers", icon: Ticket },
  { href: "/treinador/crm", label: "CRM de leads", icon: Kanban },
  { href: "/treinador/white-label", label: "White-label", icon: Palette },
  { href: "/treinador/admin", label: "Admin", icon: Settings },
  { href: "/treinador/conheca-o-sistema", label: "Conheça o sistema", icon: GraduationCap },
];

export const adminNav: NavItem[] = [
  { href: "/admin/dashboard",   label: "Visão Geral",     icon: LayoutDashboard },
  { href: "/admin/assessorias", label: "Assessorias",     icon: Building2       },
  { href: "/admin/planos",      label: "Planos & Módulos",icon: LayoutGrid      },
  { href: "/admin/financeiro",  label: "Financeiro",      icon: DollarSign      },
  { href: "/admin/marketplace", label: "Marketplace GMV", icon: Store           },
  { href: "/admin/loja",        label: "Loja da plataforma", icon: ShoppingBag  },
  { href: "/admin/pendencias",  label: "Pendências",      icon: CheckSquare     },
  { href: "/admin/vouchers",    label: "Vouchers",        icon: Ticket          },
  { href: "/admin/logs",        label: "Logs e auditoria",icon: ScrollText      },
  { href: "/admin/usuarios",    label: "Adicionar usuário",icon: UserPlus        },
];
