import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireGlobalAdmin, AuthError } from '@/lib/auth';

export async function GET() {
  try {
    await requireGlobalAdmin();
    const orgs = await prisma.organization.findMany({
      where: { deletedAt: null },
      orderBy: { createdAt: 'desc' },
      include: {
        plan: { select: { code: true, name: true } },
        _count: { select: { members: true } },
      },
    });
    return NextResponse.json({ organizations: orgs });
  } catch (err: any) {
    if (err instanceof AuthError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}
