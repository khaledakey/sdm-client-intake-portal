import Link from 'next/link';
import { getCurrentUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
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
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16, flexWrap: 'wrap' }}>
        <div>
          <h1>Support Centre</h1>
          <p className="lede">Reach the SDM team and track your requests.</p>
        </div>
        <Link href="/support/new" className="btn btn-primary">
          New support ticket
        </Link>
      </div>

      <div className="card card-pad">
        <div className="section-title">Your tickets</div>
        {tickets.length === 0 ? (
          <div className="empty" style={{ padding: '16px 0', textAlign: 'left' }}>You haven&apos;t raised any support tickets yet.</div>
        ) : (
          <>
            <table className="table" style={{ marginTop: 12 }}>
              <thead>
                <tr>
                  <th>Ticket</th>
                  <th>Category</th>
                  <th>Priority</th>
                  <th>Status</th>
                  <th>Updated</th>
                  <th>Assigned</th>
                </tr>
              </thead>
              <tbody>
                {tickets.map((ticket) => (
                  <tr key={ticket.id}>
                    <td>
                      <Link href={`/support/${ticket.id}`} style={{ color: 'var(--text-heading)', fontWeight: 600 }}>
                        SDM-{ticket.ticketNumber} &middot; {ticket.subject}
                      </Link>
                    </td>
                    <td className="muted"><CategoryLabel category={ticket.category} /></td>
                    <td><PriorityBadge priority={ticket.priority} /></td>
                    <td><StatusBadge status={ticket.status} /></td>
                    <td className="muted">{formatDate(ticket.updatedAt)}</td>
                    <td className="muted">
                      {ticket.assignedTo ? `${ticket.assignedTo.firstName} ${ticket.assignedTo.lastName}` : 'Unassigned'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div className="table-cards">
              {tickets.map((ticket) => (
                <div key={ticket.id} className="t-card">
                  <Link href={`/support/${ticket.id}`} style={{ fontWeight: 600, color: 'var(--text-heading)' }}>
                    SDM-{ticket.ticketNumber} &middot; {ticket.subject}
                  </Link>
                  <div className="row"><span className="k">Category</span><CategoryLabel category={ticket.category} /></div>
                  <div className="row"><span className="k">Priority</span><PriorityBadge priority={ticket.priority} /></div>
                  <div className="row"><span className="k">Status</span><StatusBadge status={ticket.status} /></div>
                  <div className="row"><span className="k">Updated</span><span>{formatDate(ticket.updatedAt)}</span></div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
