# Desenvolvimento local

1. Copie `.env.example` para `.env.local` e preencha os valores reais.
2. Execute `npm run bootstrap:local` para instalar dependências, validar o ambiente, gerar o Prisma Client e aplicar migrations.
3. Inicie com `npm run dev`.

Para validar sem alterar o banco, execute `npm run env:validate`. O script verifica variáveis obrigatórias e apenas alerta sobre integrações opcionais; nunca imprime segredos.

Antes de publicar, execute `npm run lint`, `npm test` e `npm run build`. Em produção, as migrations devem ser aplicadas pelo comando de build/deploy e o `DATABASE_URL` deve apontar para o banco de produção.
