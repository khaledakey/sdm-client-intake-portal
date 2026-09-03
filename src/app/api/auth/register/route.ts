import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { registerSchema } from '@/lib/validation';
import { hashPassword, createSessionToken, SESSION_COOKIE, SESSION_COOKIE_OPTIONS } from '@/lib/auth';
import { generateToken } from '@/lib/tokens';
import { sendVerificationEmail } from '@/lib/email';
import { logActivity } from '@/lib/activity';
import { dispatchIntegrationEvent } from '@/lib/integration';
import { DEFAULT_DOCUMENT_REQUESTS, recalcProgress } from '@/lib/progress';

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const parsed = registerSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? 'Invalid input.' }, { status: 400 });
  }
  const { firstName, lastName, businessName, email, phone, password } = parsed.data;

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return NextResponse.json({ error: 'An account with that email already exists.' }, { status: 409 });
  }

  const passwordAuthRef = await hashPassword(password);

  const user = await prisma.user.create({
    data: {
      firstName,
      lastName,
      email,
      phone,
      passwordAuthRef,
      role: 'CLIENT',
      businesses: {
        create: {
          businessName,
          intake: { create: {} },
          documentRequests: {
            create: DEFAULT_DOCUMENT_REQUESTS.map((d) => ({
              label: d.label,
              documentType: d.documentType,
              required: d.required,
              note: d.note,
            })),
          },
        },
      },
    },
    include: { businesses: true },
  });

  const business = user.businesses[0];

  await recalcProgress(business.id);
  await logActivity({
    businessId: business.id,
    userId: user.id,
    activityType: 'ACCOUNT_CREATED',
    description: `${firstName} ${lastName} created an SDM Client Portal account for ${businessName}.`,
  });
  await dispatchIntegrationEvent('client.registered', {
    userId: user.id,
    businessId: business.id,
    email,
    firstName,
    lastName,
    phone,
    businessName,
    portalUrl: `${process.env.APP_URL || 'http://localhost:3000'}/admin/clients/${business.id}`,
  });

  const { raw, hash } = generateToken();
  await prisma.emailVerificationToken.create({
    data: { userId: user.id, tokenHash: hash, expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24) },
  });
  const verifyUrl = `${process.env.APP_URL || 'http://localhost:3000'}/verify-email?token=${raw}`;
  await sendVerificationEmail(email, firstName, verifyUrl);

  const token = await createSessionToken({ sub: user.id, role: user.role });
  const res = NextResponse.json({ ok: true });
  res.cookies.set(SESSION_COOKIE, token, SESSION_COOKIE_OPTIONS);
  return res;
}
