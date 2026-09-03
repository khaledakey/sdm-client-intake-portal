import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireBusinessAccess } from '@/lib/rbac';
import { isStaff } from '@/lib/auth';
import { readStoredFile } from '@/lib/storage';

export async function GET(_req: Request, { params }: { params: { id: string; messageId: string } }) {
  const message = await prisma.ticketMessage.findFirst({
    where: { id: params.messageId, ticketId: params.id },
  });
  if (!message || !message.attachmentReference) {
    return NextResponse.json({ error: 'Attachment not found.' }, { status: 404 });
  }

  const ticket = await prisma.supportTicket.findUniqueOrThrow({ where: { id: params.id } });
  const ctx = await requireBusinessAccess(ticket.businessId);
  if (ctx instanceof NextResponse) return ctx;
  if (message.internal && !isStaff(ctx.user.role)) {
    return NextResponse.json({ error: 'Not found.' }, { status: 404 });
  }

  const buffer = await readStoredFile(message.attachmentReference).catch(() => null);
  if (!buffer) return NextResponse.json({ error: 'File is no longer available.' }, { status: 404 });

  return new NextResponse(buffer, {
    headers: { 'Content-Type': 'application/octet-stream', 'Content-Disposition': 'attachment' },
  });
}
