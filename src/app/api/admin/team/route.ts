import { NextResponse } from 'next/server';
import { randomBytes } from 'crypto';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/rbac';
import { inviteTeamMemberSchema } from '@/lib/validation';
import { hashPassword } from '@/lib/auth';
import { generateToken } from '@/lib/tokens';
import { sendWelcomeSetPasswordEmail } from '@/lib/email';

/** SDM_ADMIN-only: list every staff login (SDM_ADMIN + SDM_TEAM_MEMBER). */
export async function GET() {
  const admin = await requireAdmin();
  if (admin instanceof NextResponse) return admin;

  const team = await prisma.user.findMany({
    where: { role: { in: ['SDM_ADMIN', 'SDM_TEAM_MEMBER'] } },
    orderBy: { createdAt: 'asc' },
    select: { id: true, firstName: true, lastName: true, email: true, role: true, isActive: true, createdAt: true, lastLogin: true },
  });
  return NextResponse.json({ team });
}

/** SDM_ADMIN-only: invite a new staff login. Mirrors POST /api/users (the
 * CRM-01 automation's client-invite path) — random password, set-password
 * email — but takes a role and is reachable from the admin UI, not an API key. */
export async function POST(req: Request) {
  const admin = await requireAdmin();
  if (admin instanceof NextResponse) return admin;

  const body = await req.json().catch(() => null);
  const parsed = inviteTeamMemberSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? 'Invalid input.' }, { status: 400 });
  }
  const { firstName, lastName, email, role } = parsed.data;

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return NextResponse.json({ error: 'An account with that email already exists.' }, { status: 409 });
  }

  const passwordAuthRef = await hashPassword(randomBytes(24).toString('hex'));
  const user = await prisma.user.create({
    data: { firstName, lastName, email, passwordAuthRef, role, emailVerifiedAt: new Date() },
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
    { ok: true, userId: user.id, inviteEmail },
    { status: 201 }
  );
}
