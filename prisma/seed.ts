import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const plans = [
    {
      code: 'start',
      name: 'Start',
      description: 'Ideal para micro e pequenas empresas',
      priceMonthly: 15000,
      priceYearly: 150000,
      maxUsers: 5,
      maxBranches: 1,
      maxStorageMb: 2048,
      features: { modules: ['finance', 'invoicing', 'sales', 'crm', 'stock', 'hr'] },
      sortOrder: 1,
    },
    {
      code: 'business',
      name: 'Business',
      description: 'Escolha principal para empresas em crescimento',
      priceMonthly: 45000,
      priceYearly: 450000,
      maxUsers: 25,
      maxBranches: 5,
      maxStorageMb: 10240,
      features: { modules: ['all_core'], automations: true, api_access: true },
      sortOrder: 2,
    },
    {
      code: 'enterprise',
      name: 'Enterprise',
      description: 'Grupos e necessidades avançadas',
      priceMonthly: 120000,
      priceYearly: 1200000,
      maxUsers: null,
      maxBranches: null,
      maxStorageMb: 51200,
      features: { modules: ['all'], automations: true, api_access: true, sso: true },
      sortOrder: 3,
    },
  ];

  for (const p of plans) {
    await prisma.plan.upsert({
      where: { code: p.code },
      update: {
        name: p.name,
        description: p.description,
        priceMonthly: p.priceMonthly,
        priceYearly: p.priceYearly,
        maxUsers: p.maxUsers,
        maxBranches: p.maxBranches,
        maxStorageMb: p.maxStorageMb,
        features: p.features,
        sortOrder: p.sortOrder,
        isActive: true,
      },
      create: p as any,
    });
  }

  const settings: { key: string; value: any; description: string }[] = [
    { key: 'trial_enabled', value: true, description: 'Permitir período de teste' },
    { key: 'trial_days', value: 30, description: 'Dias de trial' },
    { key: 'default_plan_code', value: 'start', description: 'Plano no registo' },
    { key: 'allow_free_plans', value: true, description: 'Permitir planos gratuitos' },
    {
      key: 'payment_gateway',
      value: { provider: null, status: 'NOT_CONFIGURED', mode: 'sandbox' },
      description: 'Gateway de pagamento',
    },
    {
      key: 'agt_config',
      value: { enabled: false, environment: 'test' },
      description: 'Configuração AGT',
    },
  ];

  for (const s of settings) {
    await prisma.platformSetting.upsert({
      where: { key: s.key },
      update: { value: s.value, description: s.description },
      create: s,
    });
  }

  console.log('Seed OK: planos Start/Business/Enterprise + platform_settings');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
