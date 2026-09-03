'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Input, Select } from '@/components/ui/Field';
import { Button } from '@/components/ui/Button';
import { DOCUMENT_TYPE_LABELS } from '@/lib/format';

const CATEGORY_OPTIONS = Object.entries(DOCUMENT_TYPE_LABELS).map(([value, label]) => ({ value, label }));

export function DocumentRequestForm({ businessId }: { businessId: string }) {
  const router = useRouter();
  const [label, setLabel] = useState('');
  const [documentType, setDocumentType] = useState('OTHER');
  const [required, setRequired] = useState(true);
  const [note, setNote] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    const res = await fetch(`/api/admin/clients/${businessId}/document-requests`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ label, documentType, required, note: note || undefined }),
    });
    const data = await res.json();
    setSaving(false);
    if (!res.ok) return setError(data.error || 'Something went wrong.');
    setLabel('');
    setNote('');
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="grid gap-3 rounded-xl border border-dashed border-slate/20 p-4 sm:grid-cols-2">
      <Input label="Document to request" required value={label} onChange={(e) => setLabel(e.target.value)} />
      <Select label="Category" options={CATEGORY_OPTIONS} value={documentType} onChange={(e) => setDocumentType(e.target.value)} />
      <Input label="Note for client (optional)" value={note} onChange={(e) => setNote(e.target.value)} />
      <label className="flex items-center gap-2 self-end pb-2.5 text-sm text-midnight">
        <input type="checkbox" checked={required} onChange={(e) => setRequired(e.target.checked)} />
        Required for onboarding
      </label>
      <div className="sm:col-span-2">
        {error && <p className="mb-2 text-sm text-red-600">{error}</p>}
        <Button type="submit" size="sm" loading={saving}>
          Request document
        </Button>
      </div>
    </form>
  );
}
