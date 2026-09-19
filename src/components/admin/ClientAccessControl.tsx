'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';

export function ClientAccessControl({ businessId, isActive }: { businessId: string; isActive: boolean }) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function toggle() {
    const next = !isActive;
    if (
      !next &&
      !window.confirm('Deactivate this client\'s portal access? They will be signed out and unable to log in until reactivated.')
    ) {
      return;
    }
    setSaving(true);
    setError(null);
    const res = await fetch(`/api/admin/clients/${businessId}/access`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isActive: next }),
    });
    const data = await res.json();
    setSaving(false);
    if (!res.ok) return setError(data.error || 'Something went wrong.');
    router.refresh();
  }

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
      <div className="flex items-center gap-2">
        <span className="text-sm text-slate">Portal access:</span>
        {isActive ? <Badge tone="emerald">Active</Badge> : <Badge tone="red">Deactivated</Badge>}
      </div>
      <div className="flex flex-1 justify-end gap-2">
        <Button size="sm" variant={isActive ? 'danger' : 'secondary'} loading={saving} onClick={toggle}>
          {isActive ? 'Deactivate access' : 'Reactivate access'}
        </Button>
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}
    </div>
  );
}
