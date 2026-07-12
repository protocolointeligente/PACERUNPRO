#!/usr/bin/env bash
# Deploy script for Vercel / CI.
# Generates Prisma Client, applies pending migrations, then builds Next.js.
# Migrations are managed exclusively by `prisma migrate deploy`.
# Do NOT add `migrate resolve`, `migrate reset`, or `db push` here.
set -e

prisma generate
prisma migrate deploy
next build
