# Supabase / PostgreSQL

## Como aplicar no projeto Supabase "Nexora business"

1. Abra o dashboard: https://supabase.com/dashboard
2. Projecto **Nexora business** → **SQL Editor**
3. Cole o conteúdo de `migrations/001_nexora_foundation.sql`
4. **Run**

Ou com CLI:
```bash
supabase link --project-ref SEU_REF
supabase db push
```

## Ligar a app Next.js

Em Vercel / `.env`:
```
DATABASE_URL=postgresql://postgres.[REF]:[PASSWORD]@aws-0-xx.pooler.supabase.com:6543/postgres
```

Use a connection string **Transaction** ou **Session** pooler (Settings → Database).

A app Nexora usa **auth própria** (tabelas `users` / `sessions`), não Supabase Auth.
