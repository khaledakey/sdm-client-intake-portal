import { NextResponse } from 'next/server';
import { randomBytes } from 'crypto';
import { prisma } from '@/lib/prisma';
import { requireApiKey } from '@/lib/apiAuth';
import { createUserApiSchema } from '@/lib/validation';
import { hashPassword } from '@/lib/auth';
import { generateToken } from '@/lib/tokens';
import { sendWelcomeSetPasswordEmail } from '@/lib/email';
import { logActivity } from '@/lib/activity';
import { DEFAULT_DOCUMENT_REQUESTS, recalcProgress } from '@/lib/progress';

/** Server-to-server account creation (X-API-Key auth — see src/lib/apiAuth.ts),
 * for automations (e.g. the Make CRM-01 scenario) that need to provision a
 * portal login after a lead has already been captured elsewhere. Mirrors
 * /api/auth/register's user+business creation, but generates a random
 * password and emails a set-password link instead of taking one directly. */
export async function POST(req: Request) {
  const authError = requireApiKey(req);
  if (authError) return authError;

  const body = await req.json().catch(() => null);
  const parsed = createUserApiSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? 'Invalid input.' }, { status: 400 });
  }
  const { firstName, lastName, businessName, email, phone } = parsed.data;

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return NextResponse.json(
      { error: 'An account with that email already exists.', userId: existing.id },
      { status: 409 }
    );
  }

  const passwordAuthRef = await hashPassword(randomBytes(24).toString('hex'));

  const user = await prisma.user.create({
    data: {
      firstName,
      lastName,
      email,
      phone,
      passwordAuthRef,
      role: 'CLIENT',
      // Trusted automation caller has already validated this address (it's
      // the one the lead submitted the form with) — skip the separate
      // click-to-verify email step register() uses for self-signups.
      emailVerifiedAt: new Date(),
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
    description: `${firstName} ${lastName}'s SDM Client Portal account was created via the API for ${businessName}.`,
  });

  const { raw, hash } = generateToken();
  await prisma.passwordResetToken.create({
    data: { userId: user.id, tokenHash: hash, expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24) },
  });
  const setPasswordUrl = `${process.env.APP_URL || 'http://localhost:3000'}/reset-password?token=${raw}`;
  const emailResult = await sendWelcomeSetPasswordEmail(email, firstName, setPasswordUrl);
  const inviteEmail =
    emailResult.status === 'sent'
      ? { status: 'sent' as const, ...(emailResult.messageId ? { messageId: emailResult.messageId } : {}) }
      : { status: 'failed' as const, error: emailResult.error };

  return NextResponse.json(
    { ok: true, userId: user.id, businessId: business.id, inviteEmail },
    { status: 201 }
  );
}
