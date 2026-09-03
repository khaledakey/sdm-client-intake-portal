import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireStaff } from '@/lib/rbac';
import { saveFile, isExtensionAllowed, MAX_UPLOAD_BYTES } from '@/lib/storage';
import { logActivity } from '@/lib/activity';
import { dispatchIntegrationEvent } from '@/lib/integration';

export async function POST(req: Request, { params }: { params: { id: string } }) {
  const staff = await requireStaff();
  if (staff instanceof NextResponse) return staff;

  const ticket = await prisma.supportTicket.findUnique({ where: { id: params.id } });
  if (!ticket) return NextResponse.json({ error: 'Ticket not found.' }, { status: 404 });

  const form = await req.formData().catch(() => null);
  const message = String(form?.get('message') || '').trim();
  const internal = String(form?.get('internal') || 'false') === 'true';
  const nextStatus = form?.get('nextStatus') ? String(form.get('nextStatus')) : null;
  if (!message) return NextResponse.json({ error: 'Message cannot be empty.' }, { status: 400 });

  let attachmentReference: string | null = null;
  const file = form?.get('attachment');
  if (file instanceof File && file.size > 0) {
    if (!isExtensionAllowed(file.name)) {
      return NextResponse.json({ error: 'That attachment type is not supported.' }, { status: 400 });
    }
    if (file.size > MAX_UPLOAD_BYTES) {
      return NextResponse.json({ error: 'Attachment is too large (20MB max).' }, { status: 400 });
    }
    const buffer = Buffer.from(await file.arrayBuffer());
    attachmentReference = await saveFile(ticket.businessId, file.name, buffer);
  }

  const created = await prisma.ticketMessage.create({
    data: { ticketId: ticket.id, senderId: staff.id, senderType: 'SDM_TEAM', message, attachmentReference, internal },
  });

  const validStatuses = ['OPEN', 'IN_PROGRESS', 'WAITING_FOR_CLIENT', 'RESOLVED', 'CLOSED'];
  await prisma.supportTicket.update({
    where: { id: ticket.id },
    data: {
      updatedAt: new Date(),
      ...(nextStatus && validStatuses.includes(nextStatus) ? { status: nextStatus as any } : {}),
      ...(nextStatus === 'RESOLVED' ? { resolvedAt: new Date() } : {}),
    },
  });

  if (!internal) {
    await logActivity({
      businessId: ticket.businessId,
      userId: staff.id,
      activityType: 'TICKET_MESSAGE',
      description: `SDM replied on ticket SDM-${ticket.ticketNumber}.`,
    });
    await dispatchIntegrationEvent('ticket.message', { ticketId: ticket.id, senderType: 'SDM_TEAM' });
  }

  return NextResponse.json({ message: created });
}
