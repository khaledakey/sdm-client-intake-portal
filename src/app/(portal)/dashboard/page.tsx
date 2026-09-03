import Link from 'next/link';
import { getCurrentUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { recalcProgress, nextRecommendedAction, ONBOARDING_STEPS } from '@/lib/progress';
import { getOutstandingActions } from '@/lib/actions';
import { Card, CardHeader } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
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
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-2xl font-semibold text-midnight">
          Welcome back, {user!.firstName}
        </h1>
        <p className="mt-1 text-sm text-slate">
          {business.businessName} &middot; Current stage:{' '}
          <span className="font-medium text-teal">{currentStepLabel}</span>
        </p>
      </div>

      <Card>
        <ProgressTracker stepDone={stepDone as Record<string, boolean>} percentage={percentage} />
        <div className="mt-6 flex flex-col items-start justify-between gap-3 rounded-xl bg-teal/5 p-4 sm:flex-row sm:items-center">
          <p className="text-sm text-midnight">
            <span className="font-semibold">Next step:</span> {recommended.label}
          </p>
          {recommended.href && (
            <Link href={recommended.href}>
              <Button size="sm">{recommended.actionLabel ?? 'Continue'}</Button>
            </Link>
          )}
        </div>
      </Card>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader
            title="Action Required"
            description="Outstanding items SDM needs from you to keep things moving."
          />
          <ActionRequiredList actions={actions} />
        </Card>

        <Card>
          <CardHeader title="Recent Activity" />
          <ActivityTimeline items={activity} />
        </Card>
      </div>
    </div>
  );
}
