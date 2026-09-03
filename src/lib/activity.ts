import { prisma } from '@/lib/prisma';

export type ActivityType =
  | 'ACCOUNT_CREATED'
  | 'BUSINESS_INFO_UPDATED'
  | 'INTAKE_UPDATED'
  | 'INTAKE_SUBMITTED'
  | 'DOCUMENT_UPLOADED'
  | 'DOCUMENT_REVIEWED'
  | 'DOCUMENT_REQUESTED'
  | 'SDM_REVIEW_COMPLETED'
  | 'ONBOARDING_COMPLETED'
  | 'TICKET_CREATED'
  | 'TICKET_MESSAGE'
  | 'TICKET_STATUS_CHANGED';

/** Appends a row to the auditable Activity Log (Build Brief §9). Never
 * throws — activity logging must not block the primary operation. */
export async function logActivity(params: {
  businessId: string;
  userId?: string | null;
  activityType: ActivityType;
  description: string;
}) {
  try {
    await prisma.activityLog.create({
      data: {
        businessId: params.businessId,
        userId: params.userId ?? null,
        activityType: params.activityType,
        description: params.description,
      },
    });
  } catch (err) {
    console.error('Failed to write activity log', err);
  }
}
