'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Input, Select, Textarea } from '@/components/ui/Field';
import { Button } from '@/components/ui/Button';
import { TICKET_CATEGORY_LABELS } from '@/lib/format';

const CATEGORY_OPTIONS = Object.entries(TICKET_CATEGORY_LABELS).map(([value, label]) => ({ value, label }));
const PRIORITY_OPTIONS = [
  { value: 'LOW', label: 'Low — general, no rush' },
  { value: 'NORMAL', label: 'Normal — standard turnaround' },
  { value: 'HIGH', label: 'High — impacting your work' },
  { value: 'URGENT', label: 'Urgent — business-critical, needs immediate attention' },
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
    <form onSubmit={onSubmit} className="space-y-5">
      <Input label="Subject" required value={subject} onChange={(e) => setSubject(e.target.value)} />
      <div className="grid gap-4 sm:grid-cols-2">
        <Select label="Category" options={CATEGORY_OPTIONS} value={category} onChange={(e) => setCategory(e.target.value)} />
        <Select label="Priority" options={PRIORITY_OPTIONS} value={priority} onChange={(e) => setPriority(e.target.value)} />
      </div>

      {priority === 'URGENT' && (
        <div className="rounded-xl border border-gold/40 bg-gold/10 p-4">
          <p className="text-sm font-medium text-[#8a6f22]">
            Urgent is reserved for business-critical issues — e.g. your website or ads are down, or an
            active campaign is broken. For everything else, High priority gets fast attention too.
          </p>
          <Textarea
            className="mt-3"
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
        hint="Include as much detail as you can — what happened, when, and what you've already tried."
        value={description}
        onChange={(e) => setDescription(e.target.value)}
      />

      <div>
        <span className="mb-1.5 block text-sm font-medium text-midnight">Attachment (optional)</span>
        <input
          type="file"
          onChange={(e) => setFile(e.target.files?.[0] || null)}
          className="block w-full text-sm text-slate file:mr-4 file:rounded-lg file:border-0 file:bg-teal/10 file:px-3 file:py-2 file:text-sm file:font-medium file:text-teal"
        />
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}
      <Button type="submit" loading={loading}>
        Submit ticket
      </Button>
    </form>
  );
}
