export interface NavItem {
  href: string;
  label: string;
  icon: string;
}

export const NAV_ITEMS: NavItem[] = [
  { href: "/", label: "Início", icon: "⌂" },
  { href: "/gerar", label: "Gerar aula", icon: "⌁" },
  { href: "/biblioteca", label: "Biblioteca 500", icon: "▦" },
  { href: "/prancheta-tatica", label: "Prancheta Tática", icon: "✎" },
  { href: "/matriz", label: "Matriz por idade", icon: "◫" },
  { href: "/posicoes", label: "Posições", icon: "◉" },
  { href: "/avaliacao", label: "Avaliação", icon: "✓" },
  { href: "/identidade", label: "Identidade", icon: "◆" },
];

export const BOTTOM_NAV_ITEMS: NavItem[] = [
  { href: "/", label: "Início", icon: "⌂" },
  { href: "/gerar", label: "Gerar", icon: "⌁" },
  { href: "/biblioteca", label: "Biblioteca", icon: "▦" },
  { href: "/prancheta-tatica", label: "Prancheta", icon: "✎" },
  { href: "/mais", label: "Mais", icon: "⋯" },
];
