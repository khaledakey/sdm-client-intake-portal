import { prisma } from '@/lib/prisma';
import { isBusinessInfoComplete, isMarketingInfoComplete } from '@/lib/progress';

export interface OutstandingAction {
  id: string;
  label: string;
  description: string;
  href: string;
  severity: 'high' | 'normal';
}

/** Builds the "Action Required" list shown on the dashboard and
 * notifications page (Build Brief §3). */
export async function getOutstandingActions(businessId: string, userId: string): Promise<OutstandingAction[]> {
  const actions: OutstandingAction[] = [];

  const [user, business, intake, openRequests, waitingTickets] = await Promise.all([
    prisma.user.findUnique({ where: { id: userId } }),
    prisma.business.findUniqueOrThrow({ where: { id: businessId } }),
    prisma.clientIntake.findUnique({ where: { businessId } }),
    prisma.documentRequest.findMany({ where: { businessId, status: 'OPEN' }, orderBy: { createdAt: 'asc' } }),
    prisma.supportTicket.findMany({ where: { businessId, status: 'WAITING_FOR_CLIENT' } }),
  ]);

  if (user && !user.emailVerifiedAt) {
    actions.push({
      id: 'verify-email',
      label: 'Verify your email address',
      description: 'Confirm your email so SDM can reach you about your account.',
      href: '/account',
      severity: 'normal',
    });
  }

  if (!isBusinessInfoComplete(business)) {
    actions.push({
      id: 'business-info',
      label: 'Complete your business information',
      description: 'Tell us the essentials about your business so we can get started.',
      href: '/business',
      severity: 'high',
    });
  }

  if (!isMarketingInfoComplete(intake)) {
    actions.push({
      id: 'marketing-info',
      label: 'Complete your marketing intake form',
      description: 'Share your goals, target customers and current marketing activity.',
      href: '/intake',
      severity: 'high',
    });
  }

  for (const req of openRequests) {
    actions.push({
      id: `doc-request-${req.id}`,
      label: req.required ? `Upload required document: ${req.label}` : `Upload requested document: ${req.label}`,
      description: req.note || 'Requested by the SDM team.',
      href: '/documents',
      severity: req.required ? 'high' : 'normal',
    });
  }

  for (const ticket of waitingTickets) {
    actions.push({
      id: `ticket-${ticket.id}`,
      label: `Respond to support request #SDM-${ticket.ticketNumber}`,
      description: ticket.subject,
      href: `/support/${ticket.id}`,
      severity: 'normal',
    });
  }

  return actions;
}
