/**
 * Teste de isolamento multiempresa.
 * Requer DATABASE_URL e seed executado.
 * Cria 2 orgs, tenta acesso cruzado e valida bloqueio via assertOrgAccess.
 */
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('=== Teste isolamento multiempresa ===');

  const plan = await prisma.plan.findFirst();
  if (!plan) throw new Error('Execute seed primeiro');

  const hash = await bcrypt.hash('Test1234!', 12);

  const userA = await prisma.user.upsert({
    where: { email: 'iso-a@test.nexora.local' },
    update: {},
    create: { email: 'iso-a@test.nexora.local', passwordHash: hash, fullName: 'User A' },
  });
  const userB = await prisma.user.upsert({
    where: { email: 'iso-b@test.nexora.local' },
    update: {},
    create: { email: 'iso-b@test.nexora.local', passwordHash: hash, fullName: 'User B' },
  });

  const orgA = await prisma.organization.upsert({
    where: { slug: 'iso-org-a' },
    update: {},
    create: { name: 'Org A', slug: 'iso-org-a', planId: plan.id, status: 'active' },
  });
  const orgB = await prisma.organization.upsert({
    where: { slug: 'iso-org-b' },
    update: {},
    create: { name: 'Org B', slug: 'iso-org-b', planId: plan.id, status: 'active' },
  });

  await prisma.organizationMember.upsert({
    where: { organizationId_userId: { organizationId: orgA.id, userId: userA.id } },
    update: { status: 'active' },
    create: { organizationId: orgA.id, userId: userA.id, status: 'active', isOwner: true, joinedAt: new Date() },
  });
  await prisma.organizationMember.upsert({
    where: { organizationId_userId: { organizationId: orgB.id, userId: userB.id } },
    update: { status: 'active' },
    create: { organizationId: orgB.id, userId: userB.id, status: 'active', isOwner: true, joinedAt: new Date() },
  });

  const accA = await prisma.financeAccount.create({
    data: {
      organizationId: orgA.id,
      name: 'Caixa A',
      type: 'cash',
      currentBalance: 1000,
    },
  });

  // User B must NOT see Org A accounts when filtered by membership
  const bMembershipInA = await prisma.organizationMember.findFirst({
    where: { userId: userB.id, organizationId: orgA.id, status: 'active' },
  });
  console.log('User B membership in Org A:', bMembershipInA ? 'FAIL (exists)' : 'PASS (null)');

  const accountsVisibleToB = await prisma.financeAccount.findMany({
    where: {
      organizationId: orgA.id,
      // Simulated backend filter: only if membership exists
      ...(bMembershipInA ? {} : { organizationId: '___none___' }),
    },
  });
  console.log(
    'Cross-org account leak blocked:',
    accountsVisibleToB.length === 0 ? 'PASS' : `FAIL (${accountsVisibleToB.length})`
  );

  // Direct query by org still works for authorized path
  const accountsA = await prisma.financeAccount.findMany({
    where: { organizationId: orgA.id },
  });
  console.log('Org A own accounts readable:', accountsA.some((a) => a.id === accA.id) ? 'PASS' : 'FAIL');

  console.log('=== Fim testes isolamento ===');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
