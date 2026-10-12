import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Testing DATABASE_URL connection...');
  const r = await prisma.$queryRaw`SELECT 1 as ok`;
  console.log('DB connected:', r);
  const plans = await prisma.plan.count();
  console.log('Plans count:', plans);
  const settings = await prisma.platformSetting.count();
  console.log('Settings count:', settings);
}

main()
  .catch((e) => {
    console.error('FAILED', e.message);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
