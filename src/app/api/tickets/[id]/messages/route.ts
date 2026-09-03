import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import { saveFile, isExtensionAllowed, MAX_UPLOAD_BYTES } from '@/lib/storage';
import { logActivity } from '@/lib/activity';
import { dispatchIntegrationEvent } from '@/lib/integration';

export async function POST(req: Request, { params }: { params: { id: string } }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: 'Not authenticated.' }, { status: 401 });

  const ticket = await prisma.supportTicket.findFirst({
    where: { id: params.id, business: { userId: user.id } },
  });
  if (!ticket) return NextResponse.json({ error: 'Ticket not found.' }, { status: 404 });
  if (ticket.status === 'CLOSED') {
    return NextResponse.json({ error: 'This ticket is closed. Open a new ticket if you need further help.' }, { status: 400 });
  }

  const form = await req.formData().catch(() => null);
  const message = String(form?.get('message') || '').trim();
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
    data: { ticketId: ticket.id, senderId: user.id, senderType: 'CLIENT', message, attachmentReference },
  });

  await prisma.supportTicket.update({
    where: { id: ticket.id },
    data: { status: ticket.status === 'WAITING_FOR_CLIENT' ? 'OPEN' : ticket.status, updatedAt: new Date() },
  });

  await logActivity({
    businessId: ticket.businessId,
    userId: user.id,
    activityType: 'TICKET_MESSAGE',
    description: `Replied on ticket SDM-${ticket.ticketNumber}.`,
  });
  await dispatchIntegrationEvent('ticket.message', { ticketId: ticket.id, senderType: 'CLIENT' });

  return NextResponse.json({ message: created });
}
