import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import {
  verifyPassword,
  createToken,
  setSessionCookie,
  shouldBeGlobalAdmin,
} from '@/lib/auth';

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, password } = schema.parse(body);
    const normalized = email.toLowerCase().trim();

    const user = await prisma.user.findFirst({
      where: { email: normalized, deletedAt: null },
    });
    if (!user) {
      return NextResponse.json({ error: 'Email ou palavra-passe incorrectos' }, { status: 401 });
    }

    const ok = await verifyPassword(password, user.passwordHash);
    if (!ok) {
      return NextResponse.json({ error: 'Email ou palavra-passe incorrectos' }, { status: 401 });
    }

    if (shouldBeGlobalAdmin(user.email) && !user.isGlobalAdmin) {
      await prisma.user.update({
        where: { id: user.id },
        data: { isGlobalAdmin: true },
      });
      user.isGlobalAdmin = true;
    }

    await prisma.auditLog.create({
      data: {
        actorId: user.id,
        action: 'auth.login',
        entityType: 'user',
        entityId: user.id,
      },
    });

    const token = await createToken({
      userId: user.id,
      email: user.email,
      isGlobalAdmin: user.isGlobalAdmin,
    });
    await setSessionCookie(token);

    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        isGlobalAdmin: user.isGlobalAdmin,
      },
    });
  } catch (err: any) {
    if (err?.name === 'ZodError') {
      return NextResponse.json({ error: 'Dados inválidos' }, { status: 400 });
    }
    console.error(err);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}
