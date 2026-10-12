import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import {
  hashPassword,
  createToken,
  setSessionCookie,
  shouldBeGlobalAdmin,
} from '@/lib/auth';

const schema = z.object({
  fullName: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(8),
  organizationName: z.string().min(2),
  organizationSlug: z
    .string()
    .min(2)
    .regex(/^[a-z0-9-]+$/),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const data = schema.parse(body);
    const email = data.email.toLowerCase().trim();

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return NextResponse.json({ error: 'Email já registado' }, { status: 409 });
    }

    const slugTaken = await prisma.organization.findUnique({
      where: { slug: data.organizationSlug },
    });
    if (slugTaken) {
      return NextResponse.json({ error: 'Slug da organização já em uso' }, { status: 409 });
    }

    const trialSetting = await prisma.platformSetting.findUnique({
      where: { key: 'trial_enabled' },
    });
    const trialDaysSetting = await prisma.platformSetting.findUnique({
      where: { key: 'trial_days' },
    });
    const trialEnabled =
      trialSetting?.value === true ||
      trialSetting?.value === 'true' ||
      trialSetting == null;
    const trialDays = Number(trialDaysSetting?.value ?? process.env.DEFAULT_TRIAL_DAYS ?? 30);

    const plan = await prisma.plan.findUnique({ where: { code: 'start' } });
    if (!plan) {
      return NextResponse.json(
        { error: 'Planos não inicializados. Execute o seed.' },
        { status: 500 }
      );
    }

    const trialEnds = new Date();
    trialEnds.setDate(trialEnds.getDate() + trialDays);

    const passwordHash = await hashPassword(data.password);
    const isGlobalAdmin = shouldBeGlobalAdmin(email);

    const result = await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          email,
          passwordHash,
          fullName: data.fullName,
          isGlobalAdmin,
        },
      });

      const org = await tx.organization.create({
        data: {
          name: data.organizationName,
          slug: data.organizationSlug,
          email,
          planId: plan.id,
          status: trialEnabled ? 'trial' : 'pending',
          trialEndsAt: trialEnabled ? trialEnds : null,
        },
      });

      const role = await tx.role.create({
        data: {
          organizationId: org.id,
          code: 'owner',
          name: 'Proprietário',
          isSystem: true,
          permissions: ['*'],
        },
      });

      await tx.organizationMember.create({
        data: {
          organizationId: org.id,
          userId: user.id,
          roleId: role.id,
          status: 'active',
          isOwner: true,
          joinedAt: new Date(),
        },
      });

      await tx.subscription.create({
        data: {
          organizationId: org.id,
          planId: plan.id,
          status: trialEnabled ? 'trial' : 'pending',
          billingCycle: 'monthly',
          trialEndsAt: trialEnabled ? trialEnds : null,
          currentPeriodStart: new Date(),
          currentPeriodEnd: trialEnabled ? trialEnds : null,
        },
      });

      await tx.auditLog.create({
        data: {
          organizationId: org.id,
          actorUserId: user.id,
          action: 'organization.create',
          entityType: 'organization',
          entityId: org.id,
          metadata: { name: org.name, slug: org.slug },
        },
      });

      return { user, org };
    });

    const token = await createToken({
      userId: result.user.id,
      email: result.user.email,
      isGlobalAdmin: result.user.isGlobalAdmin,
    });
    await setSessionCookie(token);

    return NextResponse.json({
      user: {
        id: result.user.id,
        email: result.user.email,
        fullName: result.user.fullName,
        isGlobalAdmin: result.user.isGlobalAdmin,
      },
      organization: { id: result.org.id, name: result.org.name, slug: result.org.slug },
    });
  } catch (err: any) {
    if (err?.name === 'ZodError') {
      return NextResponse.json({ error: 'Dados inválidos', details: err.errors }, { status: 400 });
    }
    console.error(err);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}
