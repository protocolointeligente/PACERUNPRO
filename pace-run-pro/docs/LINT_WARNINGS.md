# Warnings de lint classificados

Última execução: 2026-07-21. O lint apresenta 26 warnings e zero errors.

- **Imagens (`@next/next/no-img-element`)**: 18 ocorrências em telas de atleta, treinador e admin. Melhoria de LCP/banda; não bloqueia release funcional. Migrar gradualmente para `next/image`.
- **Variáveis não usadas**: 7 ocorrências em telas legadas, `pace-university.ts` e `training-load.ts`. Baixo risco funcional; remover imports/variáveis em uma limpeza dedicada.
- **Diretiva ESLint sem efeito**: 1 ocorrência em `_list-client.tsx`. Remover a diretiva obsoleta.

Critério de release: nenhum warning novo em arquivos de autenticação, ownership, checkout ou webhook; os warnings existentes ficam aceitos apenas com registro no `RELEASE_CHECKLIST.md`.
