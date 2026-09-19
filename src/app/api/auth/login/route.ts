import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { loginSchema } from '@/lib/validation';
import { verifyPassword, createSessionToken, SESSION_COOKIE, SESSION_COOKIE_OPTIONS } from '@/lib/auth';

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const parsed = loginSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Enter a valid email and password.' }, { status: 400 });
  }
  const { email, password } = parsed.data;

  const user = await prisma.user.findUnique({ where: { email } });
  const genericError = () => NextResponse.json({ error: 'Incorrect email or password.' }, { status: 401 });

  if (!user) return genericError();
  const valid = await verifyPassword(password, user.passwordAuthRef);
  if (!valid) return genericError();
  if (!user.isActive) {
    return NextResponse.json({ error: 'This account has been deactivated. Contact SDM for help.' }, { status: 403 });
  }

  await prisma.user.update({ where: { id: user.id }, data: { lastLogin: new Date() } });

  const token = await createSessionToken({ sub: user.id, role: user.role });
  const res = NextResponse.json({ ok: true, role: user.role });
  res.cookies.set(SESSION_COOKIE, token, SESSION_COOKIE_OPTIONS);
  return res;
}
