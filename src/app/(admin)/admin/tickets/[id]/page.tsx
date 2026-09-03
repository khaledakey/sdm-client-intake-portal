import { notFound } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { StaffTicketPanel } from '@/components/admin/StaffTicketPanel';

export default async function AdminTicketDetailPage({ params }: { params: { id: string } }) {
  const ticket = await prisma.supportTicket.findUnique({ where: { id: params.id } });
  if (!ticket) notFound();

  const [messages, teamMembers] = await Promise.all([
    prisma.ticketMessage.findMany({
      where: { ticketId: ticket.id },
      orderBy: { createdAt: 'asc' },
      include: { sender: { select: { firstName: true, lastName: true } } },
    }),
    prisma.user.findMany({
      where: { role: { in: ['SDM_ADMIN', 'SDM_TEAM_MEMBER'] } },
      select: { id: true, firstName: true, lastName: true },
    }),
  ]);

  return (
    <StaffTicketPanel
      ticket={JSON.parse(JSON.stringify(ticket))}
      messages={JSON.parse(JSON.stringify(messages))}
      teamMembers={teamMembers}
    />
  );
}
