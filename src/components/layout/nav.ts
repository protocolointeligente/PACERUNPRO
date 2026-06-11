export interface NavItem {
  href: string;
  label: string;
  icon: string;
}

export const NAV_ITEMS: NavItem[] = [
  { href: "/", label: "Gerar aula", icon: "⌁" },
  { href: "/biblioteca", label: "Biblioteca 500", icon: "▦" },
  { href: "/prancheta-tatica", label: "Prancheta Tática", icon: "✎" },
  { href: "/matriz", label: "Matriz por idade", icon: "◫" },
  { href: "/posicoes", label: "Posições", icon: "◉" },
  { href: "/avaliacao", label: "Avaliação", icon: "✓" },
  { href: "/identidade", label: "Identidade", icon: "◆" },
];
