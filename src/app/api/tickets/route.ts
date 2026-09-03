import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireOwnBusiness } from '@/lib/rbac';
import { ticketCreateSchema } from '@/lib/validation';
import { saveFile, isExtensionAllowed, MAX_UPLOAD_BYTES } from '@/lib/storage';
import { logActivity } from '@/lib/activity';
import { dispatchIntegrationEvent } from '@/lib/integration';
import { sendTicketCreatedEmails } from '@/lib/email';
import { nextTicketNumber } from '@/lib/tickets';
import { TICKET_CATEGORY_LABELS, TICKET_PRIORITY_LABELS } from '@/lib/format';

export async function GET() {
  const ctx = await requireOwnBusiness();
  if (ctx instanceof NextResponse) return ctx;

  const tickets = await prisma.supportTicket.findMany({
    where: { businessId: ctx.business.id },
    orderBy: { updatedAt: 'desc' },
    include: { assignedTo: { select: { firstName: true, lastName: true } } },
  });
  return NextResponse.json({ tickets });
}

export async function POST(req: Request) {
  const ctx = await requireOwnBusiness();
  if (ctx instanceof NextResponse) return ctx;
  const { user, business } = ctx;

  const form = await req.formData().catch(() => null);
  if (!form) return NextResponse.json({ error: 'Invalid submission.' }, { status: 400 });

  const parsed = ticketCreateSchema.safeParse({
    subject: form.get('subject'),
    category: form.get('category'),
    priority: form.get('priority'),
    description: form.get('description'),
    urgentJustification: form.get('urgentJustification') || undefined,
  });
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? 'Invalid input.' }, { status: 400 });
  }
  const { subject, category, priority, description, urgentJustification } = parsed.data;

  if (priority === 'URGENT' && (!urgentJustification || urgentJustification.trim().length < 15)) {
    return NextResponse.json(
      { error: 'Urgent requests need a short explanation of the business impact before they can be submitted.' },
      { status: 400 }
    );
  }

  let attachmentReference: string | null = null;
  const file = form.get('attachment');
  if (file instanceof File && file.size > 0) {
    if (!isExtensionAllowed(file.name)) {
      return NextResponse.json({ error: 'That attachment type is not supported.' }, { status: 400 });
    }
    if (file.size > MAX_UPLOAD_BYTES) {
      return NextResponse.json({ error: 'Attachment is too large (20MB max).' }, { status: 400 });
    }
    const buffer = Buffer.from(await file.arrayBuffer());
    attachmentReference = await saveFile(business.id, file.name, buffer);
  }

  const ticketNumber = await nextTicketNumber();
  const ticket = await prisma.supportTicket.create({
    data: {
      businessId: business.id,
      ticketNumber,
      subject,
      category,
      priority,
      createdById: user.id,
      messages: {
        create: {
          senderId: user.id,
          senderType: 'CLIENT',
          message: description,
          attachmentReference,
        },
      },
    },
  });

  await logActivity({
    businessId: business.id,
    userId: user.id,
    activityType: 'TICKET_CREATED',
    description: `Opened support ticket SDM-${ticket.ticketNumber}: ${subject}`,
  });
  const portalUrl = `${process.env.APP_URL || 'http://localhost:3000'}/support/${ticket.id}`;
  await dispatchIntegrationEvent('ticket.created', {
    businessId: business.id,
    ticketId: ticket.id,
    ticketNumber: ticket.ticketNumber,
    subject,
    description,
    category: TICKET_CATEGORY_LABELS[category],
    priority: TICKET_PRIORITY_LABELS[priority],
    portalUrl,
  });

  await sendTicketCreatedEmails({
    clientEmail: user.email,
    clientName: user.firstName,
    businessName: business.businessName,
    ticketNumber: ticket.ticketNumber,
    subject,
    description,
    portalUrl,
  });

  return NextResponse.json({ ticket });
}
