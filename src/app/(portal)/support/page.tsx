import Link from 'next/link';
import { getCurrentUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { Card, CardHeader } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { StatusBadge, PriorityBadge, CategoryLabel } from '@/components/portal/TicketBadges';
import { formatDate } from '@/lib/format';

export default async function SupportPage() {
  const user = await getCurrentUser();
  const business = await prisma.business.findFirst({ where: { userId: user!.id } });
  if (!business) return null;

  const tickets = await prisma.supportTicket.findMany({
    where: { businessId: business.id },
    orderBy: { updatedAt: 'desc' },
    include: { assignedTo: { select: { firstName: true, lastName: true } } },
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="font-heading text-2xl font-semibold text-midnight">Support Centre</h1>
          <p className="mt-1 text-sm text-slate">Reach the SDM team and track your requests.</p>
        </div>
        <Link href="/support/new">
          <Button>New support ticket</Button>
        </Link>
      </div>

      <Card>
        <CardHeader title="Your tickets" />
        {tickets.length === 0 ? (
          <p className="text-sm text-mist">You haven&apos;t raised any support tickets yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] text-left text-sm">
              <thead>
                <tr className="border-b border-slate/10 text-xs uppercase tracking-wide text-mist">
                  <th className="py-2 pr-4 font-medium">Ticket</th>
                  <th className="py-2 pr-4 font-medium">Category</th>
                  <th className="py-2 pr-4 font-medium">Priority</th>
                  <th className="py-2 pr-4 font-medium">Status</th>
                  <th className="py-2 pr-4 font-medium">Updated</th>
                  <th className="py-2 pr-4 font-medium">Assigned</th>
                </tr>
              </thead>
              <tbody>
                {tickets.map((ticket) => (
                  <tr key={ticket.id} className="border-b border-slate/5">
                    <td className="py-3 pr-4">
                      <Link href={`/support/${ticket.id}`} className="font-medium text-midnight hover:text-teal">
                        SDM-{ticket.ticketNumber} &middot; {ticket.subject}
                      </Link>
                    </td>
                    <td className="py-3 pr-4 text-slate">
                      <CategoryLabel category={ticket.category} />
                    </td>
                    <td className="py-3 pr-4">
                      <PriorityBadge priority={ticket.priority} />
                    </td>
                    <td className="py-3 pr-4">
                      <StatusBadge status={ticket.status} />
                    </td>
                    <td className="py-3 pr-4 text-slate">{formatDate(ticket.updatedAt)}</td>
                    <td className="py-3 pr-4 text-slate">
                      {ticket.assignedTo ? `${ticket.assignedTo.firstName} ${ticket.assignedTo.lastName}` : 'Unassigned'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
