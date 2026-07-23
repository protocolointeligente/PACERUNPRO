# Auditoria dos nós isolados do Graphify

Base: grafo `838f84f3`, 23/07/2026.

O grafo encontrou 693 nós com uma ou nenhuma conexão. A maioria é configuração,
dependência ou símbolo gerado pelo compilador; não devem ser tratados como código
órfão automaticamente.

## Prioridade de investigação

| Grupo | Nós | Leitura atual | Próxima ação |
| --- | --- | --- | --- |
| Persistência | `prisma.ts`, `@prisma/client` | hubs de infraestrutura | manter como fronteira única e medir queries/índices |
| Autenticação | `getSession`, `auth-guard.ts`, `next-auth.d.ts` | alto acoplamento esperado | concluir testes de ownership por rota |
| Integrações | `strava.ts`, `normalize-activity.ts` | conexão com APIs e normalização | separar tipos de integração dos fixtures mock |
| Lifecycle | `deletion-service.ts`, `sw.js` | jobs/workers com poucos consumidores | adicionar smoke tests de execução |
| Métricas | `DerivedMetric`, `RecoveryLog`, `AthleteLoadParams` | parte aparece só no Prisma/API | validar uso real e índices no banco |
| Configuração | `compilerOptions`, `dependencies`, `devDependencies` | falsos positivos do parser | ignorar na triagem arquitetural |

## Conclusão

Não há evidência suficiente para remover nós isolados. O próximo ganho de segurança
é validar os grupos de persistência, integração e métricas com cobertura de rotas
e queries, usando o grafo SQL quando houver um DSN de staging disponível.

