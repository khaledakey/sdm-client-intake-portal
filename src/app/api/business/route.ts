import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireOwnBusiness } from '@/lib/rbac';
import { businessSchema } from '@/lib/validation';
import { recalcProgress } from '@/lib/progress';
import { logActivity } from '@/lib/activity';
import { dispatchIntegrationEvent } from '@/lib/integration';

export async function GET() {
  const ctx = await requireOwnBusiness();
  if (ctx instanceof NextResponse) return ctx;
  return NextResponse.json({ business: ctx.business });
}

export async function PATCH(req: Request) {
  const ctx = await requireOwnBusiness();
  if (ctx instanceof NextResponse) return ctx;
  const { user, business } = ctx;

  const body = await req.json().catch(() => null);
  const parsed = businessSchema.partial().safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? 'Invalid input.' }, { status: 400 });
  }

  const updated = await prisma.business.update({
    where: { id: business.id },
    data: parsed.data,
  });

  const { percentage, stepDone } = await recalcProgress(business.id);

  await logActivity({
    businessId: business.id,
    userId: user.id,
    activityType: 'BUSINESS_INFO_UPDATED',
    description: 'Business information was updated.',
  });
  await dispatchIntegrationEvent('business.updated', { businessId: business.id, fields: parsed.data });

  return NextResponse.json({ business: updated, percentage, stepDone });
}
