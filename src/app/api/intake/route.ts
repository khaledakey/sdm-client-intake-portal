import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireOwnBusiness } from '@/lib/rbac';
import { intakeSchema } from '@/lib/validation';
import { recalcProgress, parseExtendedData } from '@/lib/progress';
import { logActivity } from '@/lib/activity';
import { dispatchIntegrationEvent } from '@/lib/integration';

export async function GET() {
  const ctx = await requireOwnBusiness();
  if (ctx instanceof NextResponse) return ctx;

  let intake = await prisma.clientIntake.findUnique({ where: { businessId: ctx.business.id } });
  if (!intake) {
    intake = await prisma.clientIntake.create({ data: { businessId: ctx.business.id } });
  }
  return NextResponse.json({ intake: { ...intake, extendedData: parseExtendedData(intake.extendedData) } });
}

export async function PATCH(req: Request) {
  const ctx = await requireOwnBusiness();
  if (ctx instanceof NextResponse) return ctx;
  const { user, business } = ctx;

  const body = await req.json().catch(() => null);
  const parsed = intakeSchema.partial().safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? 'Invalid input.' }, { status: 400 });
  }

  const { extendedData: newExtended, ...namedFields } = parsed.data;

  const existing = await prisma.clientIntake.findUnique({ where: { businessId: business.id } });
  const mergedExtended = { ...parseExtendedData(existing?.extendedData ?? null), ...(newExtended || {}) };

  const updated = await prisma.clientIntake.upsert({
    where: { businessId: business.id },
    create: { businessId: business.id, ...namedFields, extendedData: JSON.stringify(mergedExtended) },
    update: { ...namedFields, extendedData: JSON.stringify(mergedExtended) },
  });

  const { percentage, stepDone } = await recalcProgress(business.id);

  await logActivity({
    businessId: business.id,
    userId: user.id,
    activityType: 'INTAKE_UPDATED',
    description: 'Marketing intake information was updated.',
  });
  await dispatchIntegrationEvent('intake.updated', { businessId: business.id, submissionId: updated.id });

  return NextResponse.json({
    intake: { ...updated, extendedData: mergedExtended },
    percentage,
    stepDone,
  });
}
