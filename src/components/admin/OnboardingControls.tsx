'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';

export function OnboardingControls({
  businessId,
  clientStepsDone,
  sdmReviewed,
  onboardingComplete,
}: {
  businessId: string;
  clientStepsDone: boolean;
  sdmReviewed: boolean;
  onboardingComplete: boolean;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState<'review' | 'complete' | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function markReview() {
    setLoading('review');
    setError(null);
    const res = await fetch(`/api/admin/clients/${businessId}/review`, { method: 'POST' });
    const data = await res.json();
    setLoading(null);
    if (!res.ok) return setError(data.error || 'Something went wrong.');
    router.refresh();
  }

  async function markComplete() {
    setLoading('complete');
    setError(null);
    const res = await fetch(`/api/admin/clients/${businessId}/complete`, { method: 'POST' });
    const data = await res.json();
    setLoading(null);
    if (!res.ok) return setError(data.error || 'Something went wrong.');
    router.refresh();
  }

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
      <div className="flex items-center gap-2">
        <span className="text-sm text-slate">SDM Review:</span>
        {sdmReviewed ? <Badge tone="emerald">Complete</Badge> : <Badge tone="gold">Pending</Badge>}
      </div>
      <div className="flex items-center gap-2">
        <span className="text-sm text-slate">Onboarding:</span>
        {onboardingComplete ? <Badge tone="emerald">Complete</Badge> : <Badge tone="gold">In progress</Badge>}
      </div>
      <div className="flex flex-1 justify-end gap-2">
        {!sdmReviewed && (
          <Button size="sm" loading={loading === 'review'} disabled={!clientStepsDone} onClick={markReview}>
            Mark SDM review complete
          </Button>
        )}
        {sdmReviewed && !onboardingComplete && (
          <Button size="sm" loading={loading === 'complete'} onClick={markComplete}>
            Confirm onboarding complete
          </Button>
        )}
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}
      {!clientStepsDone && !sdmReviewed && (
        <p className="text-xs text-mist">Business info, marketing intake and required documents must be complete first.</p>
      )}
    </div>
  );
}
