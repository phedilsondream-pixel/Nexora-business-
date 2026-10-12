import bcrypt from 'bcryptjs';
import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';
import { prisma } from './prisma';

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'dev-only-change-me-in-production-32chars'
);
const COOKIE_NAME = 'nexora_session';
const GLOBAL_ADMIN_EMAIL = (process.env.GLOBAL_ADMIN_EMAIL || 'phedilsondream@gmail.com').toLowerCase();

export async function hashPassword(password: string) {
  return bcrypt.hash(password, 12);
}

export async function verifyPassword(password: string, hash: string) {
  return bcrypt.compare(password, hash);
}

export async function createToken(payload: { userId: string; email: string; isGlobalAdmin: boolean }) {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(process.env.JWT_EXPIRES_IN || '7d')
    .sign(JWT_SECRET);
}

export async function verifyToken(token: string) {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    return payload as { userId: string; email: string; isGlobalAdmin: boolean };
  } catch {
    return null;
  }
}

export async function setSessionCookie(token: string) {
  const jar = await cookies();
  jar.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 7,
  });
}

export async function clearSessionCookie() {
  const jar = await cookies();
  jar.delete(COOKIE_NAME);
}

export async function getSession() {
  const jar = await cookies();
  const token = jar.get(COOKIE_NAME)?.value;
  if (!token) return null;
  const payload = await verifyToken(token);
  if (!payload) return null;

  const user = await prisma.user.findFirst({
    where: { id: payload.userId, deletedAt: null },
  });
  if (!user) return null;

  // Ensure global admin email stays elevated
  if (user.email.toLowerCase() === GLOBAL_ADMIN_EMAIL && !user.isGlobalAdmin) {
    await prisma.user.update({
      where: { id: user.id },
      data: { isGlobalAdmin: true },
    });
    user.isGlobalAdmin = true;
  }

  return { user, payload };
}

export function shouldBeGlobalAdmin(email: string) {
  return email.toLowerCase() === GLOBAL_ADMIN_EMAIL;
}

export async function requireAuth() {
  const session = await getSession();
  if (!session) throw new AuthError('Não autenticado', 401);
  return session;
}

export async function requireGlobalAdmin() {
  const session = await requireAuth();
  if (!session.user.isGlobalAdmin) throw new AuthError('Acesso negado', 403);
  return session;
}

export class AuthError extends Error {
  status: number;
  constructor(message: string, status = 401) {
    super(message);
    this.status = status;
  }
}

/** Server-side org access check — never trust client orgId alone */
export async function assertOrgAccess(userId: string, organizationId: string, isGlobalAdmin: boolean) {
  if (isGlobalAdmin) return true;
  const membership = await prisma.organizationMember.findFirst({
    where: {
      userId,
      organizationId,
      status: 'active',
    },
  });
  if (!membership) throw new AuthError('Sem acesso a esta organização', 403);
  return membership;
}
