import { NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { requireStaff } from '@/lib/rbac';
import { logActivity } from '@/lib/activity';

const schema = z.object({
  status: z.enum(['OPEN', 'IN_PROGRESS', 'WAITING_FOR_CLIENT', 'RESOLVED', 'CLOSED']).optional(),
  assignedToId: z.string().nullable().optional(),
});

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const staff = await requireStaff();
  if (staff instanceof NextResponse) return staff;

  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? 'Invalid input.' }, { status: 400 });
  }

  const ticket = await prisma.supportTicket.update({
    where: { id: params.id },
    data: {
      ...(parsed.data.status ? { status: parsed.data.status } : {}),
      ...(parsed.data.assignedToId !== undefined ? { assignedToId: parsed.data.assignedToId } : {}),
      ...(parsed.data.status === 'RESOLVED' ? { resolvedAt: new Date() } : {}),
    },
  });

  if (parsed.data.status) {
    await logActivity({
      businessId: ticket.businessId,
      userId: staff.id,
      activityType: 'TICKET_STATUS_CHANGED',
      description: `Ticket SDM-${ticket.ticketNumber} status changed to ${parsed.data.status.replace(/_/g, ' ').toLowerCase()}.`,
    });
  }

  return NextResponse.json({ ticket });
}
