# Futebol Coach

Aplicativo de planejamento de treinos de futebol, reconstruído como uma aplicação Next.js (App Router) com visual premium, a partir da versão original em arquivo único `Futebol_Coach_V12_STANDALONE.html`.

Desenvolvido por **Ricardo Pace** — Profissional de Educação Física, Treinador Licença B ATFA CONMEBOL.

## Funcionalidades

- **Gerar aula** (`/`) — monta uma sessão de treino completa por categoria, foco, posição, estrutura funcional, tempo e nível, selecionando exercícios do banco e exibindo organização da sessão, exercícios com pranchas táticas e mesociclo sugerido de 4 semanas.
- **Biblioteca 500** (`/biblioteca`) — banco com 500 exercícios filtráveis por categoria, foco, posição, estrutura e busca livre, com paginação.
- **TaticalPad** (`/taticalpad`) — motor de geração automática de pranchas táticas e descrições de exercícios, com edição dos elementos do diagrama (jogadores, bola, cones, setas, zonas, mini-gols) e dos textos (objetivo, descrição, organização, execução, pontos de correção). As edições ficam salvas no navegador e novos exercícios personalizados podem ser criados, expandindo o banco.
- **Matriz por idade** (`/matriz`) — referência de prioridades por categoria etária, com possibilidade de adicionar/remover prioridades conforme o contexto da equipe.
- **Posições** (`/posicoes`) — módulo por posição com objetivos, fundamentos e contagem de exercícios disponíveis.
- **Avaliação** (`/avaliacao`) — tabela de avaliação por princípios de jogo (ataque, defesa e transições).
- **Identidade** (`/identidade`) — paletas de identidade visual e alternância de tema/acento (escuro/claro, azul/laranja).

## Diagramas táticos

As pranchas táticas são geradas a partir de um modelo de dados declarativo (`DiagramElement[]`) renderizado em SVG sobre um campo de futebol (`viewBox="0 0 160 105"`). Cada instância do componente `TacticalDiagram` recebe ids únicos de gradiente e marcadores de seta via `useId()`, evitando colisões de `id` quando várias pranchas aparecem na mesma página. Os marcadores de seta usam `markerUnits="userSpaceOnUse"` com tamanho fixo e cor correspondente à da seta.

## Stack técnica

- [Next.js 16](https://nextjs.org) (App Router, Turbopack)
- [React 19](https://react.dev)
- [Tailwind CSS v4](https://tailwindcss.com)
- TypeScript

## Como rodar

```bash
npm install
npm run dev
```

Abra [http://localhost:3000](http://localhost:3000).

Outros scripts disponíveis:

```bash
npm run build   # build de produção
npm run start   # servidor de produção
npm run lint    # checagem de lint (eslint)
```
