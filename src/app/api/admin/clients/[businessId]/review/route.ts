import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireStaff } from '@/lib/rbac';
import { recalcProgress } from '@/lib/progress';
import { logActivity } from '@/lib/activity';

/** SDM staff mark the intake review complete. This is the one step the
 * client can never trigger themselves (Build Brief §12). */
export async function POST(_req: Request, { params }: { params: { businessId: string } }) {
  const staff = await requireStaff();
  if (staff instanceof NextResponse) return staff;

  await prisma.clientIntake.update({
    where: { businessId: params.businessId },
    data: { sdmReviewedBy: staff.id, sdmReviewedAt: new Date() },
  });

  const result = await recalcProgress(params.businessId);
  await logActivity({
    businessId: params.businessId,
    userId: staff.id,
    activityType: 'SDM_REVIEW_COMPLETED',
    description: `${staff.firstName} ${staff.lastName} completed the SDM review.`,
  });

  return NextResponse.json(result);
}
