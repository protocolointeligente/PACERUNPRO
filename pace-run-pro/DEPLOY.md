# Deploy — Pace Run Pro

## 1. Banco de dados (Neon)

1. Crie conta em [neon.tech](https://neon.tech)
2. "Create Project" → nome: `pacerunpro` → região: US East ou São Paulo
3. Copie a **Connection String** (pooled) → coloque em `.env.local` como `DATABASE_URL`
4. Execute as migrações:
   ```bash
   cd pace-run-pro
   npx prisma migrate dev --name init
   npx prisma db seed
   ```

## 2. Google OAuth

1. Acesse [console.cloud.google.com](https://console.cloud.google.com)
2. Crie um projeto → "APIs & Services" → "Credentials" → "Create OAuth 2.0 Client"
3. Tipo: Web Application
4. Authorized redirect URIs:
   - `http://localhost:3000/api/auth/callback/google` (dev)
   - `https://www.pacerunpro.com.br/api/auth/callback/google` (prod)
5. Copie Client ID e Client Secret para `.env.local`

## 3. Variáveis de ambiente

Copie `.env.example` para `.env.local` e preencha todos os valores.

Gere AUTH_SECRET:
```bash
openssl rand -base64 32
```

## 4. Deploy na Vercel

1. Importe o repositório `arena` na Vercel
2. Root Directory: `pace-run-pro`
3. Em "Environment Variables" adicione todas as variáveis do `.env.local`
4. Deploy

## Credenciais de acesso (seed)

| Perfil | E-mail | Senha |
|--------|--------|-------|
| Treinador (Coach) | `ricardo@pacerunpro.com.br` | `PaceRunPro@2026` |
| Atleta (demo) | `camila@exemplo.com` | `Atleta@2026` |

> **Altere as senhas imediatamente após o primeiro login em produção.**
