# Matriz inicial de autorização

Esta matriz é o contrato para revisar as rotas protegidas por `getSession()`.
Ela separa autenticação (há sessão?) de autorização (a sessão pode acessar o
recurso?).

| Domínio | Exemplos de rotas | Treinador | Atleta | Admin | Sem plano |
| --- | --- | --- | --- | --- | --- |
| Atletas | `/api/coach/athletes`, `/api/atleta/perfil` | própria assessoria | próprio perfil | suporte/auditoria | negar |
| Treinos/calendário | `/api/coach/workouts`, `/api/atleta/workouts` | atletas vinculados | próprios treinos | suporte/auditoria | leitura limitada ou negar |
| Biblioteca/templates | `/api/coach/biblioteca`, `/api/coach/templates/*` | própria assessoria | negar escrita | suporte/auditoria | negar |
| Billing/planos | `/api/coach/billing`, `/api/planos`, `/api/vouchers` | própria conta | própria assinatura | gestão global | apenas catálogo público |
| Integrações | `/api/integrations/strava/*` | própria conta | própria conta | suporte/auditoria | negar |
| Administração | `/api/admin/*` | negar | negar | permitir | negar |
| Comunidade/comentários | `/api/workout-logs/*/comments` | contexto autorizado | contexto autorizado | suporte/auditoria | leitura pública somente se definida |

## Regras obrigatórias

- `null` não pode ser tratado como usuário autenticado.
- Falha de infraestrutura do Auth.js deve gerar erro observável, não `401` falso.
- Toda rota deve validar ownership/assessoria do recurso, não apenas o papel.
- Rotas de admin devem exigir papel administrativo explícito.
- Testes devem cobrir treinador acessando atleta de outra assessoria, atleta
  acessando treino alheio, usuário sem plano e usuário sem sessão.

