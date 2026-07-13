# Deploy - Pace Run Pro

## Production Safety Flow

Before changing Production, follow this order:

1. Create a provider snapshot/backup of the current Production database.
2. Confirm `DATABASE_URL` and any direct migration URL point to the intended Production database.
3. Run the read-only audit:

   ```bash
   cd pace-run-pro
   npm run db:audit:readonly
   ```

4. Review counts for `users`, `coaches`, `athletes`, training tables, missing soft-delete columns, and recent Prisma migrations.
5. Deploy only after the backup and read-only audit are captured.
6. After deploy/migration, run `npm run db:audit:readonly` again and compare counts.

Do not run `prisma db seed`, `prisma migrate reset`, `prisma db push`, or destructive SQL against Production.

## Database

Use two PostgreSQL connection strings when the provider exposes them:

- Pooled/serverless connection: use this for `DATABASE_URL` in Vercel runtime.
- Direct/non-pooled connection: use this for Prisma migrations and local maintenance commands.

Vercel currently runs:

```bash
prisma generate && prisma migrate deploy && next build
```

Because deploy runs migrations, every Production deployment that includes schema changes must be treated as a database change:

1. snapshot first;
2. read-only audit before deploy;
3. deploy;
4. read-only audit after deploy.

## Seed Policy

The seed is for development only. It does not contain passwords in source and it skips destructive reset by default.

Required local variables:

```bash
SEED_ADMIN_PASSWORD="..."
SEED_COACH_PASSWORD="..."
SEED_ATHLETE_PASSWORD="..."
```

Local non-destructive seed:

```bash
npx prisma db seed
```

Local destructive reset plus seed requires explicit opt-in:

```bash
ALLOW_DESTRUCTIVE_SEED=true npx prisma db seed
```

Production-like databases are blocked unless `ALLOW_PRODUCTION_SEED=true` is set. A destructive production-like seed also requires `ALLOW_PRODUCTION_SEED_RESET=true`. Use those only after a verified backup.

## Google OAuth

1. Open Google Cloud Console.
2. Create or select the project.
3. Create an OAuth 2.0 Web Application client.
4. Add callback URLs:
   - `http://localhost:3000/api/auth/callback/google`
   - `https://www.pacerunpro.com.br/api/auth/callback/google`
5. Store the client ID and secret in environment variables.

## Environment Variables

Required core variables:

- `DATABASE_URL`
- `AUTH_SECRET`
- `ADMIN_EMAILS`
- Google OAuth client ID/secret when Google login is enabled

Never document real passwords in this repository. Rotate any credential that was ever committed or shared in plaintext.

## Soft Delete Cleanup

The cleanup job can permanently delete records after the grace period, but physical deletion is disabled unless:

```bash
ALLOW_HARD_DELETE_CLEANUP=true
```

Keep that variable unset unless a backup exists and the deletion window has been reviewed.
