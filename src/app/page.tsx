import Link from "next/link";

const SECTIONS = [
  {
    href: "/gerar",
    icon: "⌁",
    title: "Gerar treino",
    subtitle: "Aula inteligente por categoria, foco e posição",
  },
  {
    href: "/biblioteca",
    icon: "▦",
    title: "Biblioteca",
    subtitle: "500 exercícios filtráveis",
  },
  {
    href: "/prancheta-tatica",
    icon: "✎",
    title: "Prancheta tática",
    subtitle: "Pranchas e descrições editáveis",
  },
  {
    href: "/matriz",
    icon: "◫",
    title: "Plano por categoria",
    subtitle: "Matriz de prioridades por idade",
  },
  {
    href: "/posicoes",
    icon: "◉",
    title: "Treino por posição",
    subtitle: "Funções, fundamentos e exercícios",
  },
  {
    href: "/avaliacao",
    icon: "✓",
    title: "Avaliação",
    subtitle: "Critérios por princípios de jogo",
  },
];

export default function Home() {
  return (
    <div>
      <section className="hero-panel relative mb-4.5 overflow-hidden p-6 after:absolute after:-bottom-[130px] after:-right-[70px] after:h-[360px] after:w-[360px] after:rounded-full after:border after:border-white/[.08] after:shadow-[inset_0_0_0_34px_rgba(255,255,255,.025)] after:content-['']">
        <p className="m-0 text-sm font-bold" style={{ color: "var(--muted)" }}>
          Olá, Professor Ricardo 👋
        </p>
        <h1 className="m-0 mt-1.5 text-[clamp(32px,6vw,56px)] font-black leading-[1.05] tracking-[-0.04em]">
          Qual treino vamos montar hoje?
        </h1>
        <p className="mt-3 max-w-[640px] text-sm leading-relaxed" style={{ color: "var(--muted)" }}>
          Planeje aulas por idade, objetivo, fundamentos, posição e estrutura funcional. O sistema seleciona
          exercícios do banco de 500 atividades e gera uma sessão com pranchas táticas, tempos e mesociclo.
        </p>
        <div className="mt-4.5 text-xs font-black uppercase tracking-[0.08em]">Ricardo Pace • Educação Física • Licença B ATFA CONMEBOL</div>
      </section>

      <div className="grid gap-3.5 sm:grid-cols-2 lg:grid-cols-3">
        {SECTIONS.map((s) => (
          <Link key={s.href} href={s.href} className="menu-card">
            <span className="menu-card-ico">{s.icon}</span>
            <span className="min-w-0 flex-1">
              <span className="m-0 block text-base font-bold leading-tight">{s.title}</span>
              <span className="mt-0.5 block text-xs leading-snug" style={{ color: "var(--muted)" }}>
                {s.subtitle}
              </span>
            </span>
            <span className="menu-card-arrow">›</span>
          </Link>
        ))}
      </div>
    </div>
  );
}
