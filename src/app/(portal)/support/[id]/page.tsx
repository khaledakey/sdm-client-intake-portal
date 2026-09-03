import { notFound } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { TicketConversation } from '@/components/portal/TicketConversation';

export default async function TicketDetailPage({ params }: { params: { id: string } }) {
  const user = await getCurrentUser();
  const ticket = await prisma.supportTicket.findFirst({
    where: { id: params.id, business: { userId: user!.id } },
    include: { assignedTo: { select: { firstName: true, lastName: true } } },
  });
  if (!ticket) notFound();

  const messages = await prisma.ticketMessage.findMany({
    where: { ticketId: ticket.id, internal: false },
    orderBy: { createdAt: 'asc' },
    include: { sender: { select: { firstName: true, lastName: true, role: true } } },
  });

  return (
    <TicketConversation
      ticket={JSON.parse(JSON.stringify(ticket))}
      messages={JSON.parse(JSON.stringify(messages))}
    />
  );
}
