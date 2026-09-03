'use client';

import { useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import clsx from 'clsx';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Select } from '@/components/ui/Field';
import { IconUpload, IconFile, IconTrash } from '@/components/icons';
import { DOCUMENT_TYPE_LABELS, DOCUMENT_STATUS_LABELS, formatBytes, formatDate } from '@/lib/format';

type DocumentRow = {
  id: string;
  fileName: string;
  documentType: string;
  fileSize: number;
  uploadDate: string;
  reviewStatus: string;
  reviewNotes: string | null;
  uploadedBy: { firstName: string; lastName: string };
  fulfillsRequestId: string | null;
};

type RequestRow = {
  id: string;
  label: string;
  documentType: string;
  note: string | null;
  required: boolean;
  status: 'OPEN' | 'FULFILLED' | 'CANCELLED';
};

const CATEGORY_OPTIONS = Object.entries(DOCUMENT_TYPE_LABELS).map(([value, label]) => ({ value, label }));

const STATUS_TONE: Record<string, 'neutral' | 'teal' | 'emerald' | 'gold'> = {
  UPLOADED: 'teal',
  UNDER_REVIEW: 'gold',
  APPROVED: 'emerald',
  ADDITIONAL_INFO_REQUIRED: 'gold',
};

export function DocumentCentre({
  initialDocuments,
  initialRequests,
}: {
  initialDocuments: DocumentRow[];
  initialRequests: RequestRow[];
}) {
  const router = useRouter();
  const [documents, setDocuments] = useState(initialDocuments);
  const [requests, setRequests] = useState(initialRequests);
  const [uploadingId, setUploadingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [generalCategory, setGeneralCategory] = useState('OTHER');
  const generalInputRef = useRef<HTMLInputElement>(null);
  const requestInputRefs = useRef<Record<string, HTMLInputElement | null>>({});

  async function refresh() {
    const res = await fetch('/api/documents');
    const data = await res.json();
    setDocuments(data.documents);
    setRequests(data.requests);
    router.refresh();
  }

  async function upload(file: File, documentType: string, fulfillsRequestId?: string) {
    setError(null);
    setUploadingId(fulfillsRequestId || 'general');
    const formData = new FormData();
    formData.append('file', file);
    formData.append('documentType', documentType);
    if (fulfillsRequestId) formData.append('fulfillsRequestId', fulfillsRequestId);
    const res = await fetch('/api/documents', { method: 'POST', body: formData });
    const data = await res.json();
    setUploadingId(null);
    if (!res.ok) {
      setError(data.error || 'Upload failed.');
      return;
    }
    await refresh();
  }

  async function remove(id: string) {
    if (!confirm('Remove this document?')) return;
    const res = await fetch(`/api/documents/${id}`, { method: 'DELETE' });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error || 'Could not remove document.');
      return;
    }
    await refresh();
  }

  const outstanding = requests.filter((r) => r.status === 'OPEN');
  const fulfilled = requests.filter((r) => r.status === 'FULFILLED');

  return (
    <div className="space-y-6">
      {error && <p className="text-sm text-red-600">{error}</p>}

      <div>
        <h3 className="mb-3 font-heading text-sm font-semibold uppercase tracking-wide text-slate">
          Requested by SDM
        </h3>
        {outstanding.length === 0 && fulfilled.length === 0 && (
          <p className="text-sm text-mist">No specific documents have been requested yet.</p>
        )}
        <div className="space-y-3">
          {[...outstanding, ...fulfilled].map((request) => (
            <div
              key={request.id}
              className={clsx(
                'flex flex-col gap-3 rounded-xl border p-4 sm:flex-row sm:items-center sm:justify-between',
                request.status === 'FULFILLED' ? 'border-emerald/30 bg-emerald/5' : 'border-slate/10'
              )}
            >
              <div>
                <p className="flex items-center gap-2 text-sm font-medium text-midnight">
                  {request.label}
                  <Badge tone={request.required ? 'gold' : 'mist'}>{request.required ? 'Required' : 'Optional'}</Badge>
                  {request.status === 'FULFILLED' && <Badge tone="emerald">Submitted</Badge>}
                </p>
                {request.note && <p className="mt-1 text-xs text-slate">{request.note}</p>}
              </div>
              {request.status === 'OPEN' && (
                <div>
                  <input
                    ref={(el) => {
                      requestInputRefs.current[request.id] = el;
                    }}
                    type="file"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) upload(file, request.documentType, request.id);
                      e.target.value = '';
                    }}
                  />
                  <Button
                    size="sm"
                    variant="secondary"
                    loading={uploadingId === request.id}
                    onClick={() => requestInputRefs.current[request.id]?.click()}
                  >
                    <IconUpload className="h-3.5 w-3.5" /> Upload
                  </Button>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-xl border border-dashed border-slate/20 p-5">
        <h3 className="mb-3 font-heading text-sm font-semibold uppercase tracking-wide text-slate">
          Upload another document
        </h3>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
          <div className="flex-1">
            <Select
              label="Document category"
              options={CATEGORY_OPTIONS}
              value={generalCategory}
              onChange={(e) => setGeneralCategory(e.target.value)}
            />
          </div>
          <input
            ref={generalInputRef}
            type="file"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) upload(file, generalCategory);
              e.target.value = '';
            }}
          />
          <Button loading={uploadingId === 'general'} onClick={() => generalInputRef.current?.click()}>
            <IconUpload className="h-4 w-4" /> Choose file
          </Button>
        </div>
        <p className="mt-2 text-xs text-mist">PDF, Office, image, or archive files up to 20MB.</p>
      </div>

      <div>
        <h3 className="mb-3 font-heading text-sm font-semibold uppercase tracking-wide text-slate">
          Your documents
        </h3>
        {documents.length === 0 ? (
          <p className="text-sm text-mist">Nothing uploaded yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] text-left text-sm">
              <thead>
                <tr className="border-b border-slate/10 text-xs uppercase tracking-wide text-mist">
                  <th className="py-2 pr-4 font-medium">Document</th>
                  <th className="py-2 pr-4 font-medium">Type</th>
                  <th className="py-2 pr-4 font-medium">Uploaded</th>
                  <th className="py-2 pr-4 font-medium">Size</th>
                  <th className="py-2 pr-4 font-medium">Status</th>
                  <th className="py-2 pr-0 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {documents.map((doc) => (
                  <tr key={doc.id} className="border-b border-slate/5">
                    <td className="py-3 pr-4">
                      <div className="flex items-center gap-2">
                        <IconFile className="h-4 w-4 shrink-0 text-mist" />
                        <span className="text-midnight">{doc.fileName}</span>
                      </div>
                    </td>
                    <td className="py-3 pr-4 text-slate">{DOCUMENT_TYPE_LABELS[doc.documentType]}</td>
                    <td className="py-3 pr-4 text-slate">
                      {formatDate(doc.uploadDate)}
                      <span className="block text-xs text-mist">
                        by {doc.uploadedBy.firstName} {doc.uploadedBy.lastName}
                      </span>
                    </td>
                    <td className="py-3 pr-4 text-slate">{formatBytes(doc.fileSize)}</td>
                    <td className="py-3 pr-4">
                      <Badge tone={STATUS_TONE[doc.reviewStatus] || 'neutral'}>
                        {DOCUMENT_STATUS_LABELS[doc.reviewStatus]}
                      </Badge>
                      {doc.reviewNotes && <p className="mt-1 max-w-xs text-xs text-slate">{doc.reviewNotes}</p>}
                    </td>
                    <td className="py-3 pr-0 text-right">
                      <div className="flex justify-end gap-2">
                        <a
                          href={`/api/documents/${doc.id}/download`}
                          className="rounded-lg border border-slate/20 px-2.5 py-1.5 text-xs font-medium text-midnight hover:border-teal/40 hover:text-teal"
                        >
                          Download
                        </a>
                        {doc.reviewStatus !== 'APPROVED' && (
                          <button
                            onClick={() => remove(doc.id)}
                            className="rounded-lg border border-slate/20 p-1.5 text-red-500 hover:border-red-300"
                            aria-label="Remove document"
                          >
                            <IconTrash className="h-3.5 w-3.5" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
