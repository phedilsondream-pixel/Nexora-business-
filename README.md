# Nexora Business Suite

SaaS empresarial multiempresa para Angola (pt-AO / AOA).

## Stack (obrigatória)

| Camada | Tecnologia |
|--------|------------|
| App / API | Next.js 14 (App Router) |
| ORM | Prisma |
| Base de dados | **Railway PostgreSQL** |
| Auth | Própria (bcrypt + JWT em cookie httpOnly) — **sem Supabase** |
| Deploy app | Vercel e/ou Railway |
| Segredos | Variáveis de ambiente |

## Arranque local

```bash
cp .env.example .env
# Preencher DATABASE_URL (URL pública Railway TCP proxy) e JWT_SECRET

npm install
npx prisma migrate dev --name init
npm run db:seed
npm run dev
```

## Railway

- Projecto: `Nexora business` (`9883060d-5b6e-4cd2-99b6-4a502bf6ae50`)
- Serviço Postgres já existente
- `DATABASE_URL` interna: `postgres.railway.internal:5432` (só entre serviços Railway)
- Para Vercel/local: usar TCP Proxy público (já pode ser criado na dashboard ou API)

### Comandos úteis

```bash
npx prisma migrate deploy   # produção
npx prisma db seed
npm run test:health
npm run test:isolation
```

## Variáveis

Ver `.env.example`. **Nunca** commitar `.env` com segredos.

## Admin global

Email `phedilsondream@gmail.com` é promovido automaticamente a `isGlobalAdmin` no registo e no login.

## Segurança multiempresa

- Todas as rotas de negócio exigem sessão
- `assertOrgAccess(userId, organizationId)` valida membership no backend
- Global admin separado dos admins de empresa
- Auditoria em acções críticas

## Pagamentos e AGT

- Adapter de pagamentos: estado `NOT_CONFIGURED` até credenciais reais
- Campos AGT preparados; certificação só após licenciamento oficial

## O que o proprietário ainda precisa fazer

1. Criar repositório GitHub `nexora-business-suite` (a integração actual não tem permissão `repo:create`) e fazer push deste código
2. Ligar o repo ao Vercel (ou deploy no Railway)
3. Definir no Vercel/Railway: `DATABASE_URL`, `JWT_SECRET`, `NEXT_PUBLIC_APP_URL`, `GLOBAL_ADMIN_EMAIL`
4. Rodar `prisma migrate deploy` + `db:seed` no ambiente de produção
5. **Rodar o token Railway** — foi exposto nesta conversa; gerar novo project token
6. Configurar domínio personalizado + HTTPS
7. Confirmar backups no painel Railway (plano / retenção)
8. Integrar gateway de pagamento real quando disponível em Angola

## Testes executáveis

| Script | O que valida |
|--------|----------------|
| `test:health` | Ligação real à BD |
| `test:isolation` | Isolamento entre organizações |
| `GET /api/health` | Healthcheck deploy |
