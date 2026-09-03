import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import { generateToken } from '@/lib/tokens';
import { sendVerificationEmail } from '@/lib/email';

export async function POST() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: 'Not authenticated.' }, { status: 401 });
  if (user.emailVerifiedAt) return NextResponse.json({ ok: true, alreadyVerified: true });

  const { raw, hash } = generateToken();
  await prisma.emailVerificationToken.create({
    data: { userId: user.id, tokenHash: hash, expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24) },
  });
  const verifyUrl = `${process.env.APP_URL || 'http://localhost:3000'}/verify-email?token=${raw}`;
  await sendVerificationEmail(user.email, user.firstName, verifyUrl);
  return NextResponse.json({ ok: true });
}
