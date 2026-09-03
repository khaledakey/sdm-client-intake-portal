'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Select } from '@/components/ui/Field';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { IconFile } from '@/components/icons';
import { DOCUMENT_TYPE_LABELS, DOCUMENT_STATUS_LABELS, formatBytes, formatDate } from '@/lib/format';

const STATUS_OPTIONS = Object.entries(DOCUMENT_STATUS_LABELS).map(([value, label]) => ({ value, label }));
const STATUS_TONE: Record<string, 'neutral' | 'teal' | 'emerald' | 'gold'> = {
  UPLOADED: 'teal',
  UNDER_REVIEW: 'gold',
  APPROVED: 'emerald',
  ADDITIONAL_INFO_REQUIRED: 'gold',
};

export function DocumentReviewRow({
  document,
}: {
  document: {
    id: string;
    fileName: string;
    documentType: string;
    fileSize: number;
    uploadDate: string;
    reviewStatus: string;
    reviewNotes: string | null;
    uploadedBy: { firstName: string; lastName: string };
  };
}) {
  const router = useRouter();
  const [status, setStatus] = useState(document.reviewStatus);
  const [notes, setNotes] = useState(document.reviewNotes || '');
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);

  async function save() {
    setSaving(true);
    await fetch(`/api/admin/documents/${document.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reviewStatus: status, reviewNotes: notes }),
    });
    setSaving(false);
    setDirty(false);
    router.refresh();
  }

  return (
    <div className="rounded-xl border border-slate/10 p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-start gap-2">
          <IconFile className="mt-0.5 h-4 w-4 text-mist" />
          <div>
            <a href={`/api/documents/${document.id}/download`} className="text-sm font-medium text-midnight hover:text-teal">
              {document.fileName}
            </a>
            <p className="text-xs text-mist">
              {DOCUMENT_TYPE_LABELS[document.documentType]} &middot; {formatBytes(document.fileSize)} &middot; uploaded{' '}
              {formatDate(document.uploadDate)} by {document.uploadedBy.firstName} {document.uploadedBy.lastName}
            </p>
          </div>
        </div>
        <Badge tone={STATUS_TONE[document.reviewStatus] || 'neutral'}>{DOCUMENT_STATUS_LABELS[document.reviewStatus]}</Badge>
      </div>

      <div className="mt-3 grid gap-3 sm:grid-cols-[200px_1fr_auto] sm:items-end">
        <Select
          label="Review status"
          options={STATUS_OPTIONS}
          value={status}
          onChange={(e) => {
            setStatus(e.target.value);
            setDirty(true);
          }}
        />
        <div>
          <span className="mb-1.5 block text-sm font-medium text-midnight">Notes to client</span>
          <input
            className="w-full rounded-lg border border-slate/20 px-3 py-2 text-sm focus:border-teal focus:outline-none focus:ring-2 focus:ring-teal/20"
            placeholder="Optional — visible if additional info is required"
            value={notes}
            onChange={(e) => {
              setNotes(e.target.value);
              setDirty(true);
            }}
          />
        </div>
        <Button size="sm" onClick={save} disabled={!dirty} loading={saving}>
          Save
        </Button>
      </div>
    </div>
  );
}
