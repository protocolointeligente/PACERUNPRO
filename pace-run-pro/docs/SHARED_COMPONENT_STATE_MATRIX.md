# Matriz de estados dos componentes compartilhados

Escopo: `cn()`, `Badge`, `Card` e `Button`, com foco nas superfícies de maior
risco visual: landing page, calendário e fluxos de pagamento.

## Matriz mínima de verificação

| Componente | Claro | Escuro | Hover/foco | Disabled | Status | Contraste | Mobile |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `Button` primário | ✓ | ✓ | ✓ | ✓ | loading/sucesso/erro | texto e ícone legíveis | sem overflow |
| `Button` secundário | ✓ | ✓ | ✓ | ✓ | ativo/inativo | borda distinguível | alvo ≥ 44px |
| `Badge` | ✓ | ✓ | n/a | n/a | sucesso/atenção/erro/neutro | texto ≥ 4.5:1 | não cortar label |
| `Card` | ✓ | ✓ | hover quando clicável | n/a | selecionado/erro | superfície separada do fundo | empilhar conteúdo |
| `cn()`/variantes | ✓ | ✓ | classes compostas | classes compostas | prioridade de estado | sem conflito de tema | classes responsivas |

## Critérios de aceite

- Texto normal deve atingir contraste mínimo WCAG AA de 4.5:1; texto grande, 3:1.
- Foco de teclado deve permanecer visível nos temas claro e escuro.
- Estados `disabled` devem reduzir a interação sem depender apenas de opacidade.
- Estados de status devem ter texto/ícone além da cor.
- Em viewport de 360px, nenhum componente pode criar rolagem horizontal.
- A validação deve ser repetida nos componentes consumidores do calendário, não só
  no componente primitivo.

## Procedimento atual

O projeto possui Vitest, mas não possui infraestrutura de DOM/Playwright para
capturas visuais. Por isso esta matriz é o contrato de revisão para a etapa atual.
Antes de alterar `button.tsx`, `badge.tsx` ou `card.tsx`, a próxima etapa deve
instalar/configurar um runner visual e transformar cada célula marcada em um caso
de screenshot com viewport claro/escuro e 360px/1280px.

## Ordem de execução recomendada

1. Criar uma página interna de fixtures com os quatro componentes e todos os estados.
2. Adicionar screenshots baseline para claro, escuro, desktop e mobile.
3. Rodar a matriz em cada PR que alterar tokens, `cn()` ou componentes UI.
4. Revisar manualmente contraste e foco quando houver mudança de tokens de cor.

