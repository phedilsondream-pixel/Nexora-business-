-- Nexora Business Suite — Foundation schema for Supabase / PostgreSQL
-- Multi-tenant SaaS (pt-AO / AOA). Safe to re-run (IF NOT EXISTS).

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ========== AUTH & TENANCY ==========

CREATE TABLE IF NOT EXISTS users (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email           TEXT NOT NULL UNIQUE,
  password_hash   TEXT NOT NULL,
  full_name       TEXT,
  phone           TEXT,
  is_global_admin BOOLEAN NOT NULL DEFAULT false,
  locale          TEXT NOT NULL DEFAULT 'pt-AO',
  timezone        TEXT NOT NULL DEFAULT 'Africa/Luanda',
  email_verified  TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at      TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS sessions (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token_hash  TEXT NOT NULL UNIQUE,
  expires_at  TIMESTAMPTZ NOT NULL,
  ip_address  TEXT,
  user_agent  TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS sessions_user_id_idx ON sessions(user_id);

CREATE TABLE IF NOT EXISTS plans (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code           TEXT NOT NULL UNIQUE,
  name           TEXT NOT NULL,
  description    TEXT,
  price_monthly  NUMERIC(12,2) NOT NULL DEFAULT 0,
  price_yearly   NUMERIC(12,2) NOT NULL DEFAULT 0,
  currency       TEXT NOT NULL DEFAULT 'AOA',
  max_users      INT,
  max_branches   INT,
  max_storage_mb INT,
  features       JSONB NOT NULL DEFAULT '{}',
  is_active      BOOLEAN NOT NULL DEFAULT true,
  sort_order     INT NOT NULL DEFAULT 0,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS organizations (
  id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name                 TEXT NOT NULL,
  slug                 TEXT NOT NULL UNIQUE,
  legal_name           TEXT,
  tax_id               TEXT,
  email                TEXT,
  phone                TEXT,
  address              JSONB,
  logo_url             TEXT,
  plan_id              UUID REFERENCES plans(id),
  status               TEXT NOT NULL DEFAULT 'trial',
  trial_ends_at        TIMESTAMPTZ,
  current_period_start TIMESTAMPTZ,
  current_period_end   TIMESTAMPTZ,
  settings             JSONB NOT NULL DEFAULT '{}',
  created_at           TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at           TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at           TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS organizations_status_idx ON organizations(status);

CREATE TABLE IF NOT EXISTS roles (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  code            TEXT NOT NULL,
  name            TEXT NOT NULL,
  description     TEXT,
  is_system       BOOLEAN NOT NULL DEFAULT false,
  permissions     JSONB NOT NULL DEFAULT '[]',
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (organization_id, code)
);

CREATE TABLE IF NOT EXISTS organization_members (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role_id         UUID REFERENCES roles(id),
  status          TEXT NOT NULL DEFAULT 'active',
  is_owner        BOOLEAN NOT NULL DEFAULT false,
  joined_at       TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (organization_id, user_id)
);
CREATE INDEX IF NOT EXISTS organization_members_user_id_idx ON organization_members(user_id);

CREATE TABLE IF NOT EXISTS subscriptions (
  id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id      UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  plan_id              UUID NOT NULL REFERENCES plans(id),
  status               TEXT NOT NULL DEFAULT 'trial',
  billing_cycle        TEXT NOT NULL DEFAULT 'monthly',
  current_period_start TIMESTAMPTZ,
  current_period_end   TIMESTAMPTZ,
  cancel_at_period_end BOOLEAN NOT NULL DEFAULT false,
  cancelled_at         TIMESTAMPTZ,
  trial_ends_at        TIMESTAMPTZ,
  metadata             JSONB NOT NULL DEFAULT '{}',
  created_at           TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at           TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS subscriptions_org_idx ON subscriptions(organization_id);

CREATE TABLE IF NOT EXISTS platform_settings (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key        TEXT NOT NULL UNIQUE,
  value      JSONB NOT NULL DEFAULT '{}',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS audit_logs (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id) ON DELETE SET NULL,
  actor_user_id   UUID REFERENCES users(id) ON DELETE SET NULL,
  action          TEXT NOT NULL,
  entity_type     TEXT,
  entity_id       TEXT,
  metadata        JSONB NOT NULL DEFAULT '{}',
  ip_address      TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS audit_logs_org_idx ON audit_logs(organization_id);
CREATE INDEX IF NOT EXISTS audit_logs_created_idx ON audit_logs(created_at DESC);

-- ========== FINANCE ==========

CREATE TABLE IF NOT EXISTS finance_accounts (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name            TEXT NOT NULL,
  type            TEXT NOT NULL DEFAULT 'cash',
  currency        TEXT NOT NULL DEFAULT 'AOA',
  balance         NUMERIC(14,2) NOT NULL DEFAULT 0,
  is_active       BOOLEAN NOT NULL DEFAULT true,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS finance_accounts_org_idx ON finance_accounts(organization_id);

CREATE TABLE IF NOT EXISTS finance_categories (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name            TEXT NOT NULL,
  type            TEXT NOT NULL DEFAULT 'expense',
  parent_id       UUID,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS finance_categories_org_idx ON finance_categories(organization_id);

CREATE TABLE IF NOT EXISTS finance_transactions (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  account_id      UUID NOT NULL REFERENCES finance_accounts(id) ON DELETE CASCADE,
  category_id     UUID REFERENCES finance_categories(id),
  type            TEXT NOT NULL,
  amount          NUMERIC(14,2) NOT NULL,
  currency        TEXT NOT NULL DEFAULT 'AOA',
  description     TEXT,
  reference       TEXT,
  occurred_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by      UUID REFERENCES users(id),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS finance_transactions_org_idx ON finance_transactions(organization_id);

-- ========== INVOICING (AGT-ready fields) ==========

CREATE TABLE IF NOT EXISTS customers (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name            TEXT NOT NULL,
  tax_id          TEXT,
  email           TEXT,
  phone           TEXT,
  address         JSONB,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS customers_org_idx ON customers(organization_id);

CREATE TABLE IF NOT EXISTS document_series (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  document_type   TEXT NOT NULL,
  prefix          TEXT NOT NULL,
  next_number     INT NOT NULL DEFAULT 1,
  year            INT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (organization_id, document_type, year)
);

CREATE TABLE IF NOT EXISTS commercial_documents (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  customer_id     UUID REFERENCES customers(id),
  series_id       UUID REFERENCES document_series(id),
  document_type   TEXT NOT NULL,
  number          TEXT NOT NULL,
  status          TEXT NOT NULL DEFAULT 'draft',
  issue_date      DATE,
  due_date        DATE,
  currency        TEXT NOT NULL DEFAULT 'AOA',
  subtotal        NUMERIC(14,2) NOT NULL DEFAULT 0,
  tax_total       NUMERIC(14,2) NOT NULL DEFAULT 0,
  total           NUMERIC(14,2) NOT NULL DEFAULT 0,
  lines           JSONB NOT NULL DEFAULT '[]',
  -- AGT / Angola fiscal readiness
  agt_hash        TEXT,
  agt_signature   TEXT,
  agt_atcud       TEXT,
  agt_qr_code     TEXT,
  notes           TEXT,
  created_by      UUID REFERENCES users(id),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (organization_id, document_type, number)
);
CREATE INDEX IF NOT EXISTS commercial_documents_org_idx ON commercial_documents(organization_id);

-- ========== STOCK ==========

CREATE TABLE IF NOT EXISTS products (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  sku             TEXT,
  name            TEXT NOT NULL,
  description     TEXT,
  unit            TEXT NOT NULL DEFAULT 'un',
  price           NUMERIC(14,2) NOT NULL DEFAULT 0,
  cost            NUMERIC(14,2) NOT NULL DEFAULT 0,
  currency        TEXT NOT NULL DEFAULT 'AOA',
  is_active       BOOLEAN NOT NULL DEFAULT true,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS products_org_idx ON products(organization_id);

CREATE TABLE IF NOT EXISTS warehouses (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name            TEXT NOT NULL,
  location        TEXT,
  is_default      BOOLEAN NOT NULL DEFAULT false,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS stock_levels (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  product_id      UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  warehouse_id    UUID NOT NULL REFERENCES warehouses(id) ON DELETE CASCADE,
  quantity        NUMERIC(14,3) NOT NULL DEFAULT 0,
  min_quantity    NUMERIC(14,3) NOT NULL DEFAULT 0,
  UNIQUE (product_id, warehouse_id)
);

CREATE TABLE IF NOT EXISTS stock_movements (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  product_id      UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  warehouse_id    UUID NOT NULL REFERENCES warehouses(id) ON DELETE CASCADE,
  type            TEXT NOT NULL,
  quantity        NUMERIC(14,3) NOT NULL,
  note            TEXT,
  created_by      UUID REFERENCES users(id),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ========== CRM / HR / PROJECTS / SUPPORT ==========

CREATE TABLE IF NOT EXISTS leads (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name            TEXT NOT NULL,
  email           TEXT,
  phone           TEXT,
  stage           TEXT NOT NULL DEFAULT 'new',
  value           NUMERIC(14,2) DEFAULT 0,
  currency        TEXT NOT NULL DEFAULT 'AOA',
  source          TEXT,
  owner_user_id   UUID REFERENCES users(id),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS employees (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id         UUID REFERENCES users(id),
  full_name       TEXT NOT NULL,
  email           TEXT,
  phone           TEXT,
  position        TEXT,
  department      TEXT,
  hire_date       DATE,
  status          TEXT NOT NULL DEFAULT 'active',
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS projects (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name            TEXT NOT NULL,
  status          TEXT NOT NULL DEFAULT 'active',
  start_date      DATE,
  end_date        DATE,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS tasks (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  project_id      UUID REFERENCES projects(id) ON DELETE CASCADE,
  title           TEXT NOT NULL,
  status          TEXT NOT NULL DEFAULT 'todo',
  assignee_id     UUID REFERENCES users(id),
  due_date        DATE,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS support_tickets (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  number          TEXT NOT NULL,
  subject         TEXT NOT NULL,
  status          TEXT NOT NULL DEFAULT 'open',
  priority        TEXT NOT NULL DEFAULT 'medium',
  requester_id    UUID REFERENCES users(id),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (organization_id, number)
);

-- ========== SEED ==========

INSERT INTO plans (code, name, description, price_monthly, price_yearly, currency, max_users, features, sort_order)
VALUES
  ('start', 'Start', 'Plano inicial para pequenas empresas', 15000, 150000, 'AOA', 5, '{"modules":["finance","invoicing"]}', 1),
  ('business', 'Business', 'Para empresas em crescimento', 45000, 450000, 'AOA', 25, '{"modules":["finance","invoicing","stock","crm","hr"]}', 2),
  ('enterprise', 'Enterprise', 'Completo com todos os módulos', 120000, 1200000, 'AOA', NULL, '{"modules":["all"]}', 3)
ON CONFLICT (code) DO NOTHING;

INSERT INTO platform_settings (key, value)
VALUES
  ('trial', '{"enabled": true, "days": 30, "first_month_free": true}'::jsonb),
  ('payments', '{"status": "NOT_CONFIGURED", "providers": []}'::jsonb),
  ('agt', '{"status": "PREPARED", "license_required": true}'::jsonb)
ON CONFLICT (key) DO NOTHING;

-- Promote global admin email when user registers (app also enforces this)
-- No auth.users dependency: Nexora uses custom auth tables, not Supabase Auth by default.

COMMENT ON TABLE commercial_documents IS 'AGT fields prepared: agt_hash, agt_signature, agt_atcud, agt_qr_code';
COMMENT ON TABLE platform_settings IS 'Admin can toggle trial and plan pricing via app';
