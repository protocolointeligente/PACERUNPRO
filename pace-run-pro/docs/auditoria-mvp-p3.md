# Auditoria MVP P3 - PACERUNPRO

Data: 17 de julho de 2026

## Status executivo

O MVP esta mais proximo de venda assistida do que de escala automatica. O fluxo principal de treinador e atleta ja cobre prescricao, periodizacao, calendario, gestao basica, metricas iniciais, marketplace inicial e University. Para vender com seguranca, o produto deve ser operado com acompanhamento proximo nas primeiras assessorias, porque pagamentos, integracoes externas e auditoria fina de permissao ainda precisam de prova real em producao.

## O que ficou consolidado

- Periodizacao gera sessoes por modalidade e publica rascunhos editaveis no calendario.
- Calendario do treinador mostra resumo real por modalidade, distancia, TSS planejado e volume por atleta.
- Visao do atleta em "Meus treinos" foi simplificada para uma agenda unica com filtros por modalidade e cards clicaveis.
- Treinador tem acesso a modulos de negocio no menu: CRM, planos de venda, financeiro, loja, vouchers, gestao e Pace University.
- Pace University abre cursos e aulas para atleta e treinador, sem depender de conteudo estatico morto.
- Rotas antigas de prescricao foram neutralizadas por redirect para a periodizacao principal.
- Checkout fake foi removido; acessos dependem de pagamento, voucher ou aprovacao administrativa.
- Observabilidade com Sentry foi migrada para o padrao atual do Next.js.
- Modo claro recebeu ajustes de contraste e reducao do verde limao em areas criticas.

## Riscos antes de venda em escala

- Pagamento precisa de teste ponta a ponta com credenciais reais, webhook real, plano real e usuario novo.
- Split/conta vinculada Asaas ainda precisa validacao operacional completa. O sistema tem estrutura de marketplace, mas nao deve prometer split automatico sem homologacao.
- Integracoes com Strava/relogios ainda precisam teste real de sincronizacao recorrente, reconciliacao previsto x realizado e tratamento de falhas.
- Permissoes de servidor existem em rotas importantes, mas ainda precisam auditoria sistematica rota por rota antes de alto volume.
- Alguns modulos de comunidade, analise semanal e conteudos auxiliares ainda usam dados estaticos ou fallback.
- Biblioteca persistida ainda nao esta completa para todas as modalidades como catalogo profissional versionado.
- Warnings de lint restantes sao majoritariamente imagens `<img>` e pequenos simbolos legados; nao bloqueiam build, mas devem ser reduzidos antes de escalar performance.

## Prioridade para vender o MVP

1. Rodar compra real em producao: treinador novo, plano pago, webhook recebido, acesso liberado, status visivel no admin.
2. Rodar jornada de treinador: criar plano de venda, convidar atleta, atleta contratar, prescrever periodizacao, liberar calendario.
3. Rodar jornada de atleta: ver plano, abrir treino, registrar execucao/feedback, treinador visualizar metricas.
4. Validar exclusao/desvinculo de atleta liberando slot do treinador.
5. Validar logs de auditoria para acoes sensiveis: pagamento, liberacao, exclusao, prescricao e alteracao de plano.
6. Revisar politica de acesso em todas as APIs `/api/coach`, `/api/athlete`, `/api/admin` e webhooks.

## Criterio de pronto para primeiras vendas

- Um treinador consegue entrar, configurar planos, receber pagamento ou voucher, convidar atletas e prescrever sem suporte tecnico.
- Um atleta consegue comprar/entrar, ver treinos, abrir detalhes, registrar execucao e feedback.
- O admin consegue acompanhar pagamento, pendencias, logs e aprovar excecoes sem editar banco.
- Treinos e periodizacao persistem depois de sair, voltar e trocar de atleta.
- Erros de producao aparecem em Sentry ou logs de deploy com contexto suficiente para correcao.
