import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ user: null }, { status: 401 });
  }

  const memberships = await prisma.organizationMember.findMany({
    where: { userId: session.user.id, status: 'active' },
    include: {
      organization: {
        select: { id: true, name: true, slug: true, status: true },
      },
      role: { select: { code: true, name: true, permissions: true } },
    },
  });

  return NextResponse.json({
    user: {
      id: session.user.id,
      email: session.user.email,
      fullName: session.user.fullName,
      isGlobalAdmin: session.user.isGlobalAdmin,
    },
    organizations: memberships.map((m) => ({
      ...m.organization,
      isOwner: m.isOwner,
      role: m.role,
    })),
  });
}
