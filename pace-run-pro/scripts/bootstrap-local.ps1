$ErrorActionPreference = "Stop"

if (-not (Test-Path ".env.local")) {
  Copy-Item ".env.example" ".env.local"
  Write-Host "Criado .env.local a partir de .env.example. Preencha os segredos antes de iniciar."
}

npm install
node scripts/validate-env.mjs
npx prisma generate
npx prisma migrate deploy
Write-Host "Bootstrap concluído. Inicie com: npm run dev"
