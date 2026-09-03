import { getCurrentUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { getOutstandingActions } from '@/lib/actions';
import { Card, CardHeader } from '@/components/ui/Card';
import { ActionRequiredList } from '@/components/portal/ActionRequiredList';
import { ActivityTimeline } from '@/components/portal/ActivityTimeline';

export default async function NotificationsPage() {
  const user = await getCurrentUser();
  const business = await prisma.business.findFirst({ where: { userId: user!.id } });
  if (!business) return null;

  const [actions, activity] = await Promise.all([
    getOutstandingActions(business.id, user!.id),
    prisma.activityLog.findMany({ where: { businessId: business.id }, orderBy: { createdAt: 'desc' }, take: 30 }),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-2xl font-semibold text-midnight">Notifications</h1>
        <p className="mt-1 text-sm text-slate">Everything SDM needs from you, and a log of what's happened.</p>
      </div>

      <Card>
        <CardHeader title="Action Required" />
        <ActionRequiredList actions={actions} />
      </Card>

      <Card>
        <CardHeader title="Activity" />
        <ActivityTimeline items={activity} />
      </Card>
    </div>
  );
}
