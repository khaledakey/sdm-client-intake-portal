'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Input, Select, Textarea } from '@/components/ui/Field';
import { Button } from '@/components/ui/Button';
import { IconUpload } from '@/components/icons';
import { TICKET_CATEGORY_LABELS } from '@/lib/format';

const CATEGORY_OPTIONS = Object.entries(TICKET_CATEGORY_LABELS).map(([value, label]) => ({ value, label }));
const PRIORITY_OPTIONS = [
  { value: 'LOW', label: 'Low · general, no rush' },
  { value: 'NORMAL', label: 'Normal · standard turnaround' },
  { value: 'HIGH', label: 'High · impacting your work' },
  { value: 'URGENT', label: 'Urgent · business-critical, needs immediate attention' },
];

export function NewTicketForm() {
  const router = useRouter();
  const [subject, setSubject] = useState('');
  const [category, setCategory] = useState('GENERAL_QUESTION');
  const [priority, setPriority] = useState('NORMAL');
  const [description, setDescription] = useState('');
  const [urgentJustification, setUrgentJustification] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const formData = new FormData();
    formData.append('subject', subject);
    formData.append('category', category);
    formData.append('priority', priority);
    formData.append('description', description);
    if (priority === 'URGENT') formData.append('urgentJustification', urgentJustification);
    if (file) formData.append('attachment', file);

    const res = await fetch('/api/tickets', { method: 'POST', body: formData });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) {
      setError(data.error || 'Something went wrong.');
      return;
    }
    router.push(`/support/${data.ticket.id}`);
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="card card-pad" style={{ maxWidth: 640 }}>
      <div className="section-title">Tell us what&rsquo;s going on</div>
      <Input label="Subject" required value={subject} onChange={(e) => setSubject(e.target.value)} />
      <div className="grid-2">
        <Select label="Category" options={CATEGORY_OPTIONS} value={category} onChange={(e) => setCategory(e.target.value)} />
        <Select
          label="Priority"
          options={PRIORITY_OPTIONS}
          value={priority}
          onChange={(e) => setPriority(e.target.value)}
          hint="Low · Normal · High · Urgent, each with a description on hover."
        />
      </div>

      {priority === 'URGENT' && (
        <div
          className="alert"
          style={{
            background: 'var(--status-warn-bg)',
            borderColor: 'var(--status-warn-border)',
            color: 'var(--status-warn-text)',
            flexDirection: 'column',
            alignItems: 'stretch',
            marginBottom: 18,
          }}
        >
          <p style={{ margin: '0 0 10px' }}>
            Urgent is reserved for business-critical issues: your website or ads are down, or an
            active campaign is broken. For everything else, High priority gets fast attention too.
          </p>
          <Textarea
            label="Briefly explain the business impact"
            required
            rows={2}
            value={urgentJustification}
            onChange={(e) => setUrgentJustification(e.target.value)}
          />
        </div>
      )}

      <Textarea
        label="Description"
        required
        rows={5}
        style={{ minHeight: 130 }}
        hint="Include as much detail as you can: what happened, when, and what you've already tried."
        value={description}
        onChange={(e) => setDescription(e.target.value)}
      />

      <div className="field">
        <label>Attachment (optional)</label>
        <div
          onClick={() => document.getElementById('ticket-attachment')?.click()}
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
          {file ? file.name : 'Choose file · no file chosen'}
        </div>
        <input
          id="ticket-attachment"
          type="file"
          className="hidden"
          onChange={(e) => setFile(e.target.files?.[0] || null)}
        />
      </div>

      {error && (
        <div className="alert alert-error" style={{ marginBottom: 18 }}>
          {error}
        </div>
      )}
      <Button type="submit" loading={loading}>
        Submit ticket
      </Button>
    </form>
  );
}
