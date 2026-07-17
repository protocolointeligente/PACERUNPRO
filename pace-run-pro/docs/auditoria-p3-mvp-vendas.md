# Auditoria P3 — MVP pronto para venda

Data: 2026-07-16

## Consolidado neste ciclo

- Landing page com proposta mais direta para venda B2B: planos, prescrição, periodização, CRM, métricas e experiência do atleta.
- CTA público sem verde-limão agressivo; acento visual principal migrado para azul, com contraste mais estável em modo claro/escuro.
- Login separado da landing, com seleção visual de perfil de treinador ou atleta e redirecionamento inicial coerente.
- Middleware reforçado para APIs protegidas por papel:
  - `/api/admin/*`: somente `ADMIN`.
  - `/api/coach/*` e `/api/treinador/*`: `COACH` ou `ADMIN`.
  - `/api/atleta/*` e `/api/athlete/*`: `ATHLETE` ou `ADMIN`.
- Rotas antigas de admin dentro de `/treinador/admin*` já estão neutralizadas por redirect.
- Marketplace básico possui rotas distintas:
  - `/treinador/planos-venda`: criação e gestão de ofertas da assessoria.
  - `/treinador/minha-loja`: produtos/planilhas publicados.
  - `/treinador/loja-planos`: visão operacional da loja de produtos.

## Critérios MVP de venda

- Treinador consegue criar conta, acessar painel, cadastrar atleta, criar planos de venda e prescrever calendário.
- Atleta consegue acessar agenda única, ver treinos, registrar prova e executar força com GIFs.
- Periodização publica sessões editáveis no calendário.
- Dashboard do treinador possui visão por atleta e métricas reais suficientes para decisão operacional.
- Admin possui visão de assessorias, financeiro, pendências, logs e planos sem depender de mocks operacionais.
- Domínios de produção devem apontar para o commit mais recente antes de iniciar tráfego pago ou venda ativa.

## Riscos residuais aceitáveis para MVP

- Conteúdo da Pace University é inicial e textual; vídeos, progresso de aula e certificados podem entrar pós-MVP.
- Integrações de relógio/Strava dependem de autorização do usuário e podem ter fila de sincronização posterior.
- Modo claro foi estabilizado visualmente, mas ainda deve passar por revisão manual em telas muito densas.
- Alguns warnings antigos de `<img>` e variáveis não usadas permanecem no build; não bloqueiam produção, mas devem entrar em rodada de limpeza técnica.

## Pós-MVP recomendado

- Persistir no servidor os logs de carga/reps/RPE de força hoje salvos localmente na execução mobile.
- Criar teste end-to-end cobrindo cadastro treinador → criação de plano → convite atleta → compra/acesso → prescrição → visualização atleta.
- Adicionar Sentry global error handler conforme aviso do build.
- Revisar performance de imagens com `next/image` nas telas que ainda usam `<img>`.
- Criar página pública de demonstração por nicho: corrida, triathlon, assessoria, personal/força.
