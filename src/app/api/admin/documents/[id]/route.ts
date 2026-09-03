import { NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { requireStaff } from '@/lib/rbac';
import { recalcProgress } from '@/lib/progress';
import { logActivity } from '@/lib/activity';
import { dispatchIntegrationEvent } from '@/lib/integration';

const schema = z.object({
  reviewStatus: z.enum(['UPLOADED', 'UNDER_REVIEW', 'APPROVED', 'ADDITIONAL_INFO_REQUIRED']),
  reviewNotes: z.string().trim().max(1000).optional().nullable(),
});

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const staff = await requireStaff();
  if (staff instanceof NextResponse) return staff;

  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? 'Invalid input.' }, { status: 400 });
  }

  const document = await prisma.document.update({
    where: { id: params.id },
    data: {
      reviewStatus: parsed.data.reviewStatus,
      reviewNotes: parsed.data.reviewNotes,
      reviewedById: staff.id,
      reviewDate: new Date(),
    },
  });

  await recalcProgress(document.businessId);
  await logActivity({
    businessId: document.businessId,
    userId: staff.id,
    activityType: 'DOCUMENT_REVIEWED',
    description: `"${document.fileName}" marked as ${parsed.data.reviewStatus.replace(/_/g, ' ').toLowerCase()}.`,
  });
  await dispatchIntegrationEvent('document.reviewed', {
    documentId: document.id,
    businessId: document.businessId,
    reviewStatus: parsed.data.reviewStatus,
  });

  return NextResponse.json({ document });
}
