'use client';

import { useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import clsx from 'clsx';
import { Select } from '@/components/ui/Field';
import { IconUpload, IconFile, IconTrash } from '@/components/icons';
import { DOCUMENT_TYPE_LABELS, DOCUMENT_STATUS_LABELS, formatBytes, formatDate } from '@/lib/format';
import { ManageAccessPanel } from '@/components/portal/ManageAccessPanel';

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

const STATUS_PILL: Record<string, string> = {
  UPLOADED: 'pill-progress',
  UNDER_REVIEW: 'pill-review',
  APPROVED: 'pill-verified',
  ADDITIONAL_INFO_REQUIRED: 'pill-required',
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
  const [manageAccessOpen, setManageAccessOpen] = useState(false);
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
    <div className="card card-pad">
      <div className="section-title">Document Upload Centre</div>
      {error && (
        <div className="alert alert-error" style={{ marginTop: 12 }}>
          {error}
        </div>
      )}

      <div className="eyebrow" style={{ margin: '18px 0 10px' }}>Requested by SDM</div>
      {outstanding.length === 0 && fulfilled.length === 0 && (
        <div className="empty" style={{ padding: '16px 0', textAlign: 'left' }}>No specific documents have been requested yet.</div>
      )}
      {[...outstanding, ...fulfilled].map((request) => (
        <div key={request.id} className="list-row">
          <div>
            <div className="title">
              {request.label}{' '}
              <span className={clsx('pill', request.required ? 'pill-required' : 'pill-optional')} style={{ marginLeft: 8 }}>
                {request.required ? 'Required' : 'Optional'}
              </span>
              {request.status === 'FULFILLED' && (
                <span className="pill pill-submitted" style={{ marginLeft: 8 }}>Submitted</span>
              )}
            </div>
            {request.note && <div className="sub">{request.note}</div>}
          </div>
          {request.status === 'OPEN' && request.documentType === 'WEBSITE_DOCUMENTS' && (
            <div>
              <button type="button" className="btn btn-secondary btn-sm" onClick={() => setManageAccessOpen(true)}>
                Manage access
              </button>
            </div>
          )}
          {request.status === 'OPEN' && request.documentType !== 'WEBSITE_DOCUMENTS' && (
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
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={() => requestInputRefs.current[request.id]?.click()}
                disabled={uploadingId === request.id}
              >
                <IconUpload width={14} height={14} /> {uploadingId === request.id ? 'Uploading…' : 'Upload'}
              </button>
            </div>
          )}
        </div>
      ))}

      <div className="eyebrow" style={{ margin: '26px 0 10px' }}>Upload another document</div>
      <div className="grid-2" style={{ alignItems: 'end' }}>
        <Select
          label="Category"
          options={CATEGORY_OPTIONS}
          value={generalCategory}
          onChange={(e) => setGeneralCategory(e.target.value)}
        />
        <div className="field">
          <label>File</label>
          <div
            onClick={() => generalInputRef.current?.click()}
            style={{
              border: '1px dashed var(--border-card)',
              borderRadius: 'var(--radius-md)',
              padding: 14,
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              color: 'var(--text-muted)',
              fontSize: 13,
              cursor: 'pointer',
            }}
          >
            <IconUpload width={15} height={15} />
            {uploadingId === 'general' ? 'Uploading…' : 'Choose file · no file chosen'}
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
          <span className="hint">PDF, Office, image, or archive files up to 20MB.</span>
        </div>
      </div>

      <div className="eyebrow" style={{ margin: '26px 0 10px' }}>Your documents</div>
      {documents.length === 0 ? (
        <div className="empty" style={{ padding: '16px 0', textAlign: 'left' }}>Nothing uploaded yet.</div>
      ) : (
        <>
          <table className="table">
            <thead>
              <tr>
                <th>Document</th>
                <th>Type</th>
                <th>Uploaded</th>
                <th>Size</th>
                <th>Status</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {documents.map((doc) => (
                <tr key={doc.id}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <IconFile width={16} height={16} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
                      {doc.fileName}
                    </div>
                  </td>
                  <td className="muted">{DOCUMENT_TYPE_LABELS[doc.documentType]}</td>
                  <td className="muted">
                    {formatDate(doc.uploadDate)}
                    <div className="mono" style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                      by {doc.uploadedBy.firstName} {doc.uploadedBy.lastName}
                    </div>
                  </td>
                  <td className="muted">{formatBytes(doc.fileSize)}</td>
                  <td>
                    <span className={clsx('pill', STATUS_PILL[doc.reviewStatus] || 'pill-normal')}>
                      {DOCUMENT_STATUS_LABELS[doc.reviewStatus]}
                    </span>
                    {doc.reviewNotes && <div className="sub" style={{ maxWidth: 220 }}>{doc.reviewNotes}</div>}
                  </td>
                  <td>
                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
                      <a href={`/api/documents/${doc.id}/download`}>Download</a>
                      {doc.reviewStatus !== 'APPROVED' && (
                        <button
                          type="button"
                          onClick={() => remove(doc.id)}
                          aria-label="Remove document"
                          style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--status-error-text)', padding: 0 }}
                        >
                          <IconTrash width={14} height={14} />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="table-cards">
            {documents.map((doc) => (
              <div key={doc.id} className="t-card">
                <div style={{ fontWeight: 600, marginBottom: 8 }}>{doc.fileName}</div>
                <div className="row"><span className="k">Type</span><span>{DOCUMENT_TYPE_LABELS[doc.documentType]}</span></div>
                <div className="row"><span className="k">Uploaded</span><span>{formatDate(doc.uploadDate)}</span></div>
                <div className="row"><span className="k">Size</span><span>{formatBytes(doc.fileSize)}</span></div>
                <div className="row">
                  <span className="k">Status</span>
                  <span className={clsx('pill', STATUS_PILL[doc.reviewStatus] || 'pill-normal')}>
                    {DOCUMENT_STATUS_LABELS[doc.reviewStatus]}
                  </span>
                </div>
                <div style={{ marginTop: 10, display: 'flex', gap: 14 }}>
                  <a href={`/api/documents/${doc.id}/download`}>Download</a>
                  {doc.reviewStatus !== 'APPROVED' && (
                    <button
                      type="button"
                      onClick={() => remove(doc.id)}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--status-error-text)', padding: 0 }}
                    >
                      Remove
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {manageAccessOpen && <ManageAccessPanel onClose={() => setManageAccessOpen(false)} />}
    </div>
  );
}
