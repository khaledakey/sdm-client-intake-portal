/**
 * Create an SDM staff login (SDM_ADMIN or SDM_TEAM_MEMBER) and email them a
 * set-password link, using the same flow as /api/users' client-invite path
 * (src/lib/tokens.ts + sendWelcomeSetPasswordEmail). Staff accounts have no
 * business/intake attached -- only client accounts do.
 *
 * Idempotent: refuses to create a second account for an email that already
 * exists (prints the existing user's id/role and exits 0 without changes).
 *
 * Run with:
 *   npx tsx scripts/create-staff-user.ts <email> <firstName> <lastName> [role]
 * role defaults to SDM_ADMIN. The other valid staff role is SDM_TEAM_MEMBER.
 */
import { randomBytes } from 'crypto';
import { PrismaClient } from '@prisma/client';
import { hashPassword } from '../src/lib/auth';
import { generateToken } from '../src/lib/tokens';
import { sendWelcomeSetPasswordEmail } from '../src/lib/email';

const prisma = new PrismaClient();

async function main() {
  const [email, firstName, lastName, roleArg] = process.argv.slice(2);
  const role = roleArg || 'SDM_ADMIN';

  if (!email || !firstName || !lastName) {
    console.error('Usage: npx tsx scripts/create-staff-user.ts <email> <firstName> <lastName> [SDM_ADMIN|SDM_TEAM_MEMBER]');
    process.exit(1);
  }
  if (role !== 'SDM_ADMIN' && role !== 'SDM_TEAM_MEMBER') {
    console.error(`Invalid role "${role}". Must be SDM_ADMIN or SDM_TEAM_MEMBER.`);
    process.exit(1);
  }

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    console.log(`An account already exists for ${email} (id=${existing.id}, role=${existing.role}). Nothing created.`);
    return;
  }

  const passwordAuthRef = await hashPassword(randomBytes(24).toString('hex'));
  const user = await prisma.user.create({
    data: {
      firstName,
      lastName,
      email,
      passwordAuthRef,
      role,
      emailVerifiedAt: new Date(),
    },
  });

  const { raw, hash } = generateToken();
  await prisma.passwordResetToken.create({
    data: { userId: user.id, tokenHash: hash, expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24) },
  });
  const setPasswordUrl = `${process.env.APP_URL || 'http://localhost:3000'}/reset-password?token=${raw}`;

  const emailResult = await sendWelcomeSetPasswordEmail(email, firstName, setPasswordUrl);

  console.log(`Created ${role} account for ${email} (id=${user.id}).`);
  console.log(`Set-password link: ${setPasswordUrl}`);
  console.log(`Email delivery: ${emailResult.status}${emailResult.status === 'failed' ? ` (${emailResult.error})` : ''}`);
  console.log('The link above expires in 24 hours -- use it directly if email delivery failed or is delayed.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
