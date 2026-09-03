import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireStaff } from '@/lib/rbac';
import { recalcProgress } from '@/lib/progress';
import { logActivity } from '@/lib/activity';
import { dispatchIntegrationEvent } from '@/lib/integration';

export async function POST(_req: Request, { params }: { params: { businessId: string } }) {
  const staff = await requireStaff();
  if (staff instanceof NextResponse) return staff;

  const existing = await prisma.clientIntake.findUnique({ where: { businessId: params.businessId } });
  if (!existing?.sdmReviewedAt) {
    return NextResponse.json({ error: 'Complete the SDM review before finishing onboarding.' }, { status: 400 });
  }

  await prisma.clientIntake.update({
    where: { businessId: params.businessId },
    data: { onboardingCompletedBy: staff.id, onboardingCompletedAt: new Date() },
  });

  const result = await recalcProgress(params.businessId);
  await logActivity({
    businessId: params.businessId,
    userId: staff.id,
    activityType: 'ONBOARDING_COMPLETED',
    description: `${staff.firstName} ${staff.lastName} marked onboarding complete.`,
  });
  await dispatchIntegrationEvent('onboarding.stage_changed', {
    businessId: params.businessId,
    stage: 'ONBOARDING_COMPLETE',
  });

  return NextResponse.json(result);
}
