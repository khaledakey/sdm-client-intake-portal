import Link from 'next/link';
import { getCurrentUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { recalcProgress, nextRecommendedAction, ONBOARDING_STEPS } from '@/lib/progress';
import { getOutstandingActions } from '@/lib/actions';
import { ProgressTracker } from '@/components/portal/ProgressTracker';
import { ActionRequiredList } from '@/components/portal/ActionRequiredList';
import { ActivityTimeline } from '@/components/portal/ActivityTimeline';

export default async function DashboardPage() {
  const user = await getCurrentUser();
  const business = await prisma.business.findFirst({ where: { userId: user!.id } });
  if (!business) return null;

  const { stepDone, percentage, currentStatus } = await recalcProgress(business.id);
  const actions = await getOutstandingActions(business.id, user!.id);
  const activity = await prisma.activityLog.findMany({
    where: { businessId: business.id },
    orderBy: { createdAt: 'desc' },
    take: 8,
  });
  const recommended = nextRecommendedAction(stepDone as Record<string, boolean>);
  const currentStepLabel = ONBOARDING_STEPS.find((s) => s.key === currentStatus)?.label ?? 'Onboarding Complete';

  return (
    <div>
      <h1>Welcome back, {user!.firstName}</h1>
      <p className="lede">
        {business.businessName} &middot; Current stage: {currentStepLabel}
      </p>

      <div className="card card-pad" style={{ marginBottom: 24 }}>
        <ProgressTracker stepDone={stepDone as Record<string, boolean>} percentage={percentage} />
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            background: 'var(--surface-tint)',
            borderRadius: 'var(--radius-md)',
            padding: '16px 20px',
            marginTop: 22,
            gap: 16,
            flexWrap: 'wrap',
          }}
        >
          <div style={{ fontSize: 14 }}>
            <strong>Next step:</strong> {recommended.label}
          </div>
          {recommended.href && (
            <Link href={recommended.href} className="btn btn-primary btn-sm">
              {recommended.actionLabel ?? 'Continue'}
            </Link>
          )}
        </div>
      </div>

      <div className="grid-2" style={{ gap: 24 }}>
        <div className="card card-pad">
          <div className="section-title">Action Required</div>
          <div className="section-sub">Outstanding items SDM needs from you to keep things moving.</div>
          <ActionRequiredList actions={actions} />
        </div>

        <div className="card card-pad">
          <div className="section-title">Recent Activity</div>
          <ActivityTimeline items={activity} />
        </div>
      </div>
    </div>
  );
}
