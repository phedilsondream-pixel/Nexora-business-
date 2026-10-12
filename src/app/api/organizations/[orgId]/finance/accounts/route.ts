import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { requireAuth, assertOrgAccess, AuthError } from '@/lib/auth';

type Ctx = { params: { orgId: string } };

export async function GET(_req: NextRequest, { params }: Ctx) {
  try {
    const session = await requireAuth();
    await assertOrgAccess(session.user.id, params.orgId, session.user.isGlobalAdmin);

    const accounts = await prisma.financeAccount.findMany({
      where: { organizationId: params.orgId, deletedAt: null },
      orderBy: { name: 'asc' },
    });
    return NextResponse.json({ accounts });
  } catch (err: any) {
    if (err instanceof AuthError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}

const createSchema = z.object({
  name: z.string().min(1),
  type: z.enum(['cash', 'bank', 'mobile_money', 'other']),
  currency: z.string().default('AOA'),
  initialBalance: z.number().default(0),
  bankName: z.string().optional(),
  accountNumber: z.string().optional(),
});

export async function POST(req: NextRequest, { params }: Ctx) {
  try {
    const session = await requireAuth();
    await assertOrgAccess(session.user.id, params.orgId, session.user.isGlobalAdmin);

    const data = createSchema.parse(await req.json());
    const account = await prisma.financeAccount.create({
      data: {
        organizationId: params.orgId,
        name: data.name,
        type: data.type,
        currency: data.currency,
        initialBalance: data.initialBalance,
        currentBalance: data.initialBalance,
        bankName: data.bankName,
        accountNumber: data.accountNumber,
      },
    });

    await prisma.auditLog.create({
      data: {
        organizationId: params.orgId,
        actorId: session.user.id,
        action: 'finance.account.create',
        entityType: 'finance_account',
        entityId: account.id,
        newData: { name: account.name },
      },
    });

    return NextResponse.json({ account }, { status: 201 });
  } catch (err: any) {
    if (err instanceof AuthError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    if (err?.name === 'ZodError') {
      return NextResponse.json({ error: 'Dados inválidos' }, { status: 400 });
    }
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}
