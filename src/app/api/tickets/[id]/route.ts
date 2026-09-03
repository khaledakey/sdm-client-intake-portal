import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireBusinessAccess } from '@/lib/rbac';
import { getCurrentUser, isStaff } from '@/lib/auth';
import { logActivity } from '@/lib/activity';

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const ticket = await prisma.supportTicket.findUnique({ where: { id: params.id } });
  if (!ticket) return NextResponse.json({ error: 'Ticket not found.' }, { status: 404 });

  const ctx = await requireBusinessAccess(ticket.businessId);
  if (ctx instanceof NextResponse) return ctx;

  const messages = await prisma.ticketMessage.findMany({
    where: { ticketId: ticket.id, ...(isStaff(ctx.user.role) ? {} : { internal: false }) },
    orderBy: { createdAt: 'asc' },
    include: { sender: { select: { firstName: true, lastName: true, role: true } } },
  });

  const assignedTo = ticket.assignedToId
    ? await prisma.user.findUnique({ where: { id: ticket.assignedToId }, select: { firstName: true, lastName: true } })
    : null;

  return NextResponse.json({ ticket: { ...ticket, assignedTo }, messages });
}

/** Clients may only close a ticket that SDM has marked Resolved. Every
 * other status transition is an SDM staff action (see /api/admin/tickets). */
export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: 'Not authenticated.' }, { status: 401 });
  if (isStaff(user.role)) {
    return NextResponse.json({ error: 'Staff should use the admin ticket endpoint.' }, { status: 403 });
  }

  const ticket = await prisma.supportTicket.findFirst({
    where: { id: params.id, business: { userId: user.id } },
  });
  if (!ticket) return NextResponse.json({ error: 'Ticket not found.' }, { status: 404 });

  const body = await req.json().catch(() => null);
  if (body?.status !== 'CLOSED' || ticket.status !== 'RESOLVED') {
    return NextResponse.json({ error: 'Only a resolved ticket can be closed.' }, { status: 400 });
  }

  const updated = await prisma.supportTicket.update({
    where: { id: ticket.id },
    data: { status: 'CLOSED' },
  });

  await logActivity({
    businessId: ticket.businessId,
    userId: user.id,
    activityType: 'TICKET_STATUS_CHANGED',
    description: `Closed support ticket SDM-${ticket.ticketNumber}.`,
  });

  return NextResponse.json({ ticket: updated });
}
