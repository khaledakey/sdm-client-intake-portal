import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import { Card, CardHeader } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { ONBOARDING_STEPS } from '@/lib/progress';
import { formatDate } from '@/lib/format';

export default async function AdminClientsPage() {
  const businesses = await prisma.business.findMany({
    orderBy: { createdAt: 'desc' },
    include: {
      owner: { select: { firstName: true, lastName: true, email: true, isActive: true } },
      intake: true,
      _count: { select: { documents: true, supportTickets: true } },
    },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-2xl font-semibold text-midnight">Clients</h1>
        <p className="mt-1 text-sm text-slate">{businesses.length} client account(s) in the portal.</p>
      </div>

      <Card>
        <CardHeader title="All clients" />
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] text-left text-sm">
            <thead>
              <tr className="border-b border-slate/10 text-xs uppercase tracking-wide text-mist">
                <th className="py-2 pr-4 font-medium">Business</th>
                <th className="py-2 pr-4 font-medium">Contact</th>
                <th className="py-2 pr-4 font-medium">Stage</th>
                <th className="py-2 pr-4 font-medium">Access</th>
                <th className="py-2 pr-4 font-medium">Progress</th>
                <th className="py-2 pr-4 font-medium">Documents</th>
                <th className="py-2 pr-4 font-medium">Tickets</th>
                <th className="py-2 pr-4 font-medium">Joined</th>
              </tr>
            </thead>
            <tbody>
              {businesses.map((b) => {
                const stageLabel =
                  ONBOARDING_STEPS.find((s) => s.key === b.intake?.onboardingStatus)?.label ?? 'Account Created';
                return (
                  <tr key={b.id} className="border-b border-slate/5">
                    <td className="py-3 pr-4">
                      <Link href={`/admin/clients/${b.id}`} className="font-medium text-midnight hover:text-teal">
                        {b.businessName}
                      </Link>
                    </td>
                    <td className="py-3 pr-4 text-slate">
                      {b.owner.firstName} {b.owner.lastName}
                      <span className="block text-xs text-mist">{b.owner.email}</span>
                    </td>
                    <td className="py-3 pr-4">
                      <Badge tone={b.intake?.onboardingStatus === 'ONBOARDING_COMPLETE' ? 'emerald' : 'teal'}>
                        {stageLabel}
                      </Badge>
                    </td>
                    <td className="py-3 pr-4">
                      {b.owner.isActive ? <Badge tone="emerald">Active</Badge> : <Badge tone="red">Deactivated</Badge>}
                    </td>
                    <td className="py-3 pr-4 text-slate">{b.intake?.progressPercentage ?? 0}%</td>
                    <td className="py-3 pr-4 text-slate">{b._count.documents}</td>
                    <td className="py-3 pr-4 text-slate">{b._count.supportTickets}</td>
                    <td className="py-3 pr-4 text-slate">{formatDate(b.createdAt)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
