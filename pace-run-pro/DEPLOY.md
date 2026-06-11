# Deploy — Pace Run Pro

## 1. Banco de dados (Neon)

1. Crie conta em [neon.tech](https://neon.tech)
2. "Create Project" → nome: `pacerunpro` → região: US East ou São Paulo
3. Na página "Connection Details" do Neon existem **duas** connection strings —
   guarde as duas, elas são usadas em lugares diferentes:
   - **Pooled connection** (host termina em `-pooler`): use esta no `DATABASE_URL`
     da Vercel (produção). É feita para muitas conexões curtas, como funções
     serverless.
   - **Direct connection** (sem `-pooler`): use esta apenas localmente, no seu
     `.env.local`, para rodar as migrações (`prisma migrate dev`) e o seed.
     Migrações precisam de uma conexão direta porque o pooler do Neon
     (PgBouncer) não suporta os locks de sessão que o Prisma Migrate usa.
4. No `.env.local`, coloque a **connection string direta** em `DATABASE_URL` e
   execute as migrações:
   ```bash
   cd pace-run-pro
   npx prisma migrate dev --name init
   npx prisma db seed
   ```
   Isso cria a pasta `prisma/migrations/` (deve ser commitada no git) e popula
   o banco com o usuário treinador e o atleta de exemplo.

## 2. Google OAuth

1. Acesse [console.cloud.google.com](https://console.cloud.google.com)
2. Crie um projeto → "APIs & Services" → "Credentials" → "Create OAuth 2.0 Client"
3. Tipo: Web Application
4. Authorized redirect URIs:
   - `http://localhost:3000/api/auth/callback/google` (dev)
   - `https://www.pacerunpro.com.br/api/auth/callback/google` (prod)
5. Copie Client ID e Client Secret para `.env.local`

## 3. Variáveis de ambiente

Copie `.env.example` para `.env.local` e preencha todos os valores, incluindo:

- `AUTH_SECRET` — gere com:
  ```bash
  openssl rand -base64 32
  ```
- `ADMIN_EMAILS` — lista de e-mails (separados por vírgula) que devem virar
  `ADMIN` automaticamente no primeiro login com Google. Coloque aqui o seu
  e-mail (ex.: `ricardo.pace.jr@gmail.com`) para ter acesso a `/admin` e
  `/treinador` ao entrar com sua conta Google.

## 4. Deploy na Vercel

1. Importe o repositório `arena` na Vercel
2. Root Directory: `pace-run-pro`
3. Em "Environment Variables" adicione todas as variáveis do `.env.local`,
   mas com `DATABASE_URL` apontando para a **connection string pooled**
   do Neon (host com `-pooler`), e `NEXTAUTH_URL` com a URL final de produção
4. Deploy
5. Após o primeiro deploy, se ainda não rodou `prisma migrate dev` localmente
   (passo 1.4), rode-o agora a partir da sua máquina apontando `DATABASE_URL`
   para a connection string **direta** do Neon — isso cria as tabelas em
   produção. Deploys futuros não precisam disso, a menos que o schema mude
   (nesse caso, gere uma nova migração localmente e rode
   `npx prisma migrate deploy` apontando para a connection string direta).

## Credenciais de acesso (seed)

| Perfil | E-mail | Senha |
|--------|--------|-------|
| Treinador (Coach) | `ricardo@pacerunpro.com.br` | `PaceRunPro@2026` |
| Atleta (demo) | `camila@exemplo.com` | `Atleta@2026` |

> **Altere as senhas imediatamente após o primeiro login em produção.**

> Para entrar como administrador com sua própria conta Google, basta fazer
> login normalmente — se o seu e-mail estiver em `ADMIN_EMAILS`, a conta é
> promovida a `ADMIN` automaticamente no login.
