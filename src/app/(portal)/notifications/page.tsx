import { getCurrentUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { getOutstandingActions } from '@/lib/actions';
import { ActionRequiredList } from '@/components/portal/ActionRequiredList';
import { timeAgo } from '@/components/portal/ActivityTimeline';

export default async function NotificationsPage() {
  const user = await getCurrentUser();
  const business = await prisma.business.findFirst({ where: { userId: user!.id } });
  if (!business) return null;

  const [actions, activity] = await Promise.all([
    getOutstandingActions(business.id, user!.id),
    prisma.activityLog.findMany({ where: { businessId: business.id }, orderBy: { createdAt: 'desc' }, take: 30 }),
  ]);

  return (
    <div>
      <h1>Notifications</h1>
      <p className="lede">Everything SDM needs from you, and a log of what&rsquo;s happened.</p>

      <div className="card card-pad">
        <div className="section-title">Action Required</div>
        <ActionRequiredList actions={actions} />

        <div className="section-title" style={{ marginTop: 26 }}>Activity Log</div>
        {activity.length === 0 ? (
          <div className="empty" style={{ padding: '16px 0', textAlign: 'left' }}>No activity yet.</div>
        ) : (
          activity.map((item) => (
            <div key={item.id} className="list-row">
              <div>
                <div className="title" style={{ fontWeight: 400 }}>{item.description}</div>
                <div className="sub">{timeAgo(new Date(item.createdAt))}</div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
