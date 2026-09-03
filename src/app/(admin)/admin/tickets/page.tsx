import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import { Card, CardHeader } from '@/components/ui/Card';
import { StatusBadge, PriorityBadge, CategoryLabel } from '@/components/portal/TicketBadges';
import { formatDateTime } from '@/lib/format';

export default async function AdminTicketsPage() {
  const tickets = await prisma.supportTicket.findMany({
    orderBy: { updatedAt: 'desc' },
    include: {
      business: { select: { businessName: true } },
      assignedTo: { select: { firstName: true, lastName: true } },
    },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-2xl font-semibold text-midnight">Support Tickets</h1>
        <p className="mt-1 text-sm text-slate">All client support requests across the portal.</p>
      </div>

      <Card>
        <CardHeader title="All tickets" />
        {tickets.length === 0 ? (
          <p className="text-sm text-mist">No tickets yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[820px] text-left text-sm">
              <thead>
                <tr className="border-b border-slate/10 text-xs uppercase tracking-wide text-mist">
                  <th className="py-2 pr-4 font-medium">Ticket</th>
                  <th className="py-2 pr-4 font-medium">Client</th>
                  <th className="py-2 pr-4 font-medium">Category</th>
                  <th className="py-2 pr-4 font-medium">Priority</th>
                  <th className="py-2 pr-4 font-medium">Status</th>
                  <th className="py-2 pr-4 font-medium">Assigned</th>
                  <th className="py-2 pr-4 font-medium">Updated</th>
                </tr>
              </thead>
              <tbody>
                {tickets.map((t) => (
                  <tr key={t.id} className="border-b border-slate/5">
                    <td className="py-3 pr-4">
                      <Link href={`/admin/tickets/${t.id}`} className="font-medium text-midnight hover:text-teal">
                        SDM-{t.ticketNumber} &middot; {t.subject}
                      </Link>
                    </td>
                    <td className="py-3 pr-4 text-slate">{t.business.businessName}</td>
                    <td className="py-3 pr-4 text-slate">
                      <CategoryLabel category={t.category} />
                    </td>
                    <td className="py-3 pr-4">
                      <PriorityBadge priority={t.priority} />
                    </td>
                    <td className="py-3 pr-4">
                      <StatusBadge status={t.status} />
                    </td>
                    <td className="py-3 pr-4 text-slate">
                      {t.assignedTo ? `${t.assignedTo.firstName} ${t.assignedTo.lastName}` : 'Unassigned'}
                    </td>
                    <td className="py-3 pr-4 text-slate">{formatDateTime(t.updatedAt)}</td>
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
