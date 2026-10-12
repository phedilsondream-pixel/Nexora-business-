# Supabase — Nexora Business

- **Project ref:** `jlhfltgghdmvnthusfhl`
- **Region:** `eu-west-1`
- **API URL:** https://jlhfltgghdmvnthusfhl.supabase.co

## Checklist operacional

1. Dashboard → projecto activo (não paused).
2. Settings → Database → copiar **URI** (com password).
3. Vercel env `DATABASE_URL` = URI (Session mode porta 5432 no pooler).
4. Local ou CI:
   ```bash
   npx prisma db push
   npx tsx prisma/seed.ts
   ```
5. Health: https://nexora-business-3wkh.vercel.app/api/health → `database: connected`

## Nota

As keys `sb_publishable_*` / `sb_secret_*` servem REST/Auth.
O Prisma **exige** `DATABASE_URL` com password Postgres.
