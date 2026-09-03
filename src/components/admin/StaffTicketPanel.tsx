'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import clsx from 'clsx';
import { Button } from '@/components/ui/Button';
import { Select } from '@/components/ui/Field';
import { Badge } from '@/components/ui/Badge';
import { StatusBadge, PriorityBadge } from '@/components/portal/TicketBadges';
import { TICKET_STATUS_LABELS, formatDateTime } from '@/lib/format';

type Message = {
  id: string;
  senderType: 'CLIENT' | 'SDM_TEAM' | 'SYSTEM';
  message: string;
  attachmentReference: string | null;
  internal: boolean;
  createdAt: string;
  sender: { firstName: string; lastName: string } | null;
};

type Ticket = {
  id: string;
  ticketNumber: number;
  subject: string;
  status: string;
  priority: string;
  assignedToId: string | null;
};

const STATUS_OPTIONS = Object.entries(TICKET_STATUS_LABELS).map(([value, label]) => ({ value, label }));

export function StaffTicketPanel({
  ticket,
  messages,
  teamMembers,
}: {
  ticket: Ticket;
  messages: Message[];
  teamMembers: { id: string; firstName: string; lastName: string }[];
}) {
  const router = useRouter();
  const [items, setItems] = useState(messages);
  const [status, setStatus] = useState(ticket.status);
  const [assignedTo, setAssignedTo] = useState(ticket.assignedToId || '');
  const [reply, setReply] = useState('');
  const [internal, setInternal] = useState(false);
  const [nextStatus, setNextStatus] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function updateMeta(patch: { status?: string; assignedToId?: string | null }) {
    await fetch(`/api/admin/tickets/${ticket.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(patch),
    });
    router.refresh();
  }

  async function sendReply(e: React.FormEvent) {
    e.preventDefault();
    if (!reply.trim()) return;
    setSending(true);
    setError(null);
    const formData = new FormData();
    formData.append('message', reply);
    formData.append('internal', String(internal));
    if (nextStatus) formData.append('nextStatus', nextStatus);
    if (file) formData.append('attachment', file);

    const res = await fetch(`/api/admin/tickets/${ticket.id}/messages`, { method: 'POST', body: formData });
    const data = await res.json();
    setSending(false);
    if (!res.ok) return setError(data.error || 'Could not send message.');

    setItems((prev) => [...prev, { ...data.message, sender: null }]);
    setReply('');
    setFile(null);
    if (nextStatus) setStatus(nextStatus);
    setNextStatus('');
    router.refresh();
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-start">
        <div>
          <p className="text-xs uppercase tracking-wide text-mist">SDM-{ticket.ticketNumber}</p>
          <h1 className="font-heading text-xl font-semibold text-midnight">{ticket.subject}</h1>
        </div>
        <div className="flex items-center gap-2">
          <PriorityBadge priority={ticket.priority} />
          <StatusBadge status={status} />
        </div>
      </div>

      <div className="grid gap-3 rounded-xl border border-slate/10 bg-white p-4 sm:grid-cols-2">
        <Select
          label="Status"
          options={STATUS_OPTIONS}
          value={status}
          onChange={(e) => {
            setStatus(e.target.value);
            updateMeta({ status: e.target.value });
          }}
        />
        <Select
          label="Assigned to"
          placeholder="Unassigned"
          options={teamMembers.map((m) => ({ value: m.id, label: `${m.firstName} ${m.lastName}` }))}
          value={assignedTo}
          onChange={(e) => {
            setAssignedTo(e.target.value);
            updateMeta({ assignedToId: e.target.value || null });
          }}
        />
      </div>

      <div className="space-y-4 rounded-2xl border border-slate/10 bg-white p-5">
        {items.map((msg) => (
          <div
            key={msg.id}
            className={clsx(
              'max-w-[85%] rounded-xl p-3.5 text-sm',
              msg.internal
                ? 'border border-dashed border-gold/50 bg-gold/10 text-midnight'
                : msg.senderType === 'CLIENT'
                ? 'bg-slate/5 text-midnight'
                : msg.senderType === 'SYSTEM'
                ? 'mx-auto bg-black/5 text-center text-xs text-slate'
                : 'ml-auto bg-teal/10 text-midnight'
            )}
          >
            {msg.senderType !== 'SYSTEM' && (
              <p className="mb-1 flex items-center gap-2 text-xs font-semibold text-slate">
                {msg.senderType === 'CLIENT' ? 'Client' : msg.sender ? `${msg.sender.firstName} · SDM Team` : 'SDM Team'}
                {msg.internal && <Badge tone="gold">Internal note</Badge>}
              </p>
            )}
            <p className="whitespace-pre-wrap">{msg.message}</p>
            {msg.attachmentReference && (
              <a
                href={`/api/tickets/${ticket.id}/messages/${msg.id}/attachment`}
                className="mt-2 inline-block text-xs font-medium text-teal underline"
              >
                View attachment
              </a>
            )}
            <p className="mt-1.5 text-[11px] text-mist">{formatDateTime(msg.createdAt)}</p>
          </div>
        ))}
      </div>

      <form onSubmit={sendReply} className="space-y-3 rounded-2xl border border-slate/10 bg-white p-5">
        <textarea
          className="w-full rounded-lg border border-slate/20 p-3 text-sm focus:border-teal focus:outline-none focus:ring-2 focus:ring-teal/20"
          rows={3}
          placeholder={internal ? 'Internal note (not visible to the client)…' : 'Reply to the client…'}
          value={reply}
          onChange={(e) => setReply(e.target.value)}
        />
        <div className="flex flex-wrap items-center gap-4">
          <label className="flex items-center gap-2 text-sm text-midnight">
            <input type="checkbox" checked={internal} onChange={(e) => setInternal(e.target.checked)} />
            Internal note (SDM only)
          </label>
          <input
            type="file"
            onChange={(e) => setFile(e.target.files?.[0] || null)}
            className="text-xs text-slate file:mr-3 file:rounded-lg file:border-0 file:bg-teal/10 file:px-2.5 file:py-1.5 file:text-xs file:font-medium file:text-teal"
          />
          <div className="ml-auto w-44">
            <Select
              options={[{ value: '', label: 'Keep current status' }, ...STATUS_OPTIONS]}
              value={nextStatus}
              onChange={(e) => setNextStatus(e.target.value)}
            />
          </div>
          <Button type="submit" loading={sending}>
            Send
          </Button>
        </div>
        {error && <p className="text-sm text-red-600">{error}</p>}
      </form>
    </div>
  );
}
