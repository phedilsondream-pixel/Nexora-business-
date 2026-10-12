# Entrega — Infraestrutura e Produção

## O que foi feito e verificado

### Railway
- Projecto `Nexora business` (ID `9883060d-5b6e-4cd2-99b6-4a502bf6ae50`) acedido com project token
- Serviço **Postgres** existente e deployment SUCCESS
- **TCP Proxy público** criado: `centerbeam.proxy.rlwy.net` porta `19553`
- Schema Prisma aplicado com `prisma db push` — **sucesso**
- Seed (planos Start/Business/Enterprise + platform_settings) — **sucesso**
- Teste `SELECT 1` — **PASS**
- Teste isolamento multiempresa — **PASS**

### Código preparado (sem Supabase)
- Next.js 14 + Prisma + auth própria (bcrypt + JWT cookie)
- Multi-tenancy com `assertOrgAccess` no backend
- Admin global automático para `phedilsondream@gmail.com`
- Healthcheck `/api/health`
- Auth: register / login / logout / me
- Admin: listar organizações
- Finanças: contas por organização
- `railway.toml`, `.env.example`, scripts de teste

### Não feito / limitações honestas
- GitHub: integração sem permissão para `create_repository` (403) — criar repo manualmente e fazer push
- Vercel: conta/team identificado (`team_ZRI5LZYkxrTYpaxrfdry77R3`); projecto Nexora ainda não ligado ao Git (falta repo)
- UI completa dos 24 módulos: schema núcleo + APIs críticas; UI React completa fica no frontend a ligar a estas APIs
- Backups Railway: confirmar no painel (plano e retenção) — não afirmados activos sem verificação visual
- Pagamentos: adapter `NOT_CONFIGURED`
- **Token Railway e password da BD foram usados nesta sessão — RODAR imediatamente**

## Acções mínimas do proprietário

1. **Rodar credenciais Railway** (token de projecto + password Postgres)
2. No GitHub: criar repo privado `nexora-business-suite` e fazer upload/push do código em `artifacts/nexora-business-suite`
3. No Vercel: importar o repo → projecto → definir env:
   - `DATABASE_URL` = URL **pública** do TCP proxy (após rotação da password)
   - `JWT_SECRET` = string longa aleatória
   - `NEXT_PUBLIC_APP_URL` = URL do deploy
   - `GLOBAL_ADMIN_EMAIL` = phedilsondream@gmail.com
4. Após deploy: `npx prisma migrate deploy` (ou db push) + seed se necessário
5. Registar com `phedilsondream@gmail.com` → acesso admin
6. Activar domínio personalizado + HTTPS
7. Confirmar backups no Railway

## URL pública BD (antes da rotação)

Formato: `postgresql://postgres:PASSWORD@centerbeam.proxy.rlwy.net:19553/railway`

Obter password actual no Railway → Postgres → Variables (`POSTGRES_PASSWORD` / `DATABASE_URL`).

## Segurança

- Nunca expor `DATABASE_URL` no frontend
- Cookie de sessão httpOnly
- Isolamento por membership validado no servidor
- Token de projecto Railway tem poderes limitados; preferir account token só em CI seguro
