'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';

export function TeamStatusToggle({ id, isActive, isSelf }: { id: string; isActive: boolean; isSelf: boolean }) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (isSelf) {
    return <span className="text-xs text-mist">You</span>;
  }

  async function toggle() {
    const next = !isActive;
    if (!next && !window.confirm('Deactivate this account? They will be signed out and unable to log in until reactivated.')) {
      return;
    }
    setSaving(true);
    setError(null);
    const res = await fetch(`/api/admin/team/${id}`, {
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
    <div className="flex flex-col items-end gap-1">
      <Button size="sm" variant={isActive ? 'danger' : 'secondary'} loading={saving} onClick={toggle}>
        {isActive ? 'Deactivate' : 'Reactivate'}
      </Button>
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  );
}
