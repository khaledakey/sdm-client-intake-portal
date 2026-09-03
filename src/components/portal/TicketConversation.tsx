'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import clsx from 'clsx';
import { Button } from '@/components/ui/Button';
import { StatusBadge, PriorityBadge } from '@/components/portal/TicketBadges';
import { formatDateTime } from '@/lib/format';

type Message = {
  id: string;
  senderType: 'CLIENT' | 'SDM_TEAM' | 'SYSTEM';
  message: string;
  attachmentReference: string | null;
  createdAt: string;
  sender: { firstName: string; lastName: string; role: string } | null;
};

type Ticket = {
  id: string;
  ticketNumber: number;
  subject: string;
  category: string;
  priority: string;
  status: string;
  createdAt: string;
  assignedTo: { firstName: string; lastName: string } | null;
};

export function TicketConversation({ ticket, messages }: { ticket: Ticket; messages: Message[] }) {
  const router = useRouter();
  const [items, setItems] = useState(messages);
  const [status, setStatus] = useState(ticket.status);
  const [reply, setReply] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function sendReply(e: React.FormEvent) {
    e.preventDefault();
    if (!reply.trim()) return;
    setSending(true);
    setError(null);
    const formData = new FormData();
    formData.append('message', reply);
    if (file) formData.append('attachment', file);

    const res = await fetch(`/api/tickets/${ticket.id}/messages`, { method: 'POST', body: formData });
    const data = await res.json();
    setSending(false);
    if (!res.ok) {
      setError(data.error || 'Could not send message.');
      return;
    }
    setItems((prev) => [...prev, { ...data.message, sender: null }]);
    setReply('');
    setFile(null);
    if (status === 'WAITING_FOR_CLIENT') setStatus('OPEN');
    router.refresh();
  }

  async function closeTicket() {
    const res = await fetch(`/api/tickets/${ticket.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'CLOSED' }),
    });
    if (res.ok) {
      setStatus('CLOSED');
      router.refresh();
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-start">
        <div>
          <p className="text-xs uppercase tracking-wide text-mist">SDM-{ticket.ticketNumber}</p>
          <h1 className="font-heading text-xl font-semibold text-midnight">{ticket.subject}</h1>
          <p className="mt-1 text-xs text-slate">
            Opened {formatDateTime(ticket.createdAt)}
            {ticket.assignedTo && ` · Assigned to ${ticket.assignedTo.firstName} ${ticket.assignedTo.lastName}`}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <PriorityBadge priority={ticket.priority} />
          <StatusBadge status={status} />
        </div>
      </div>

      <div className="space-y-4 rounded-2xl border border-slate/10 bg-white p-5">
        {items.map((msg) => (
          <div
            key={msg.id}
            className={clsx(
              'max-w-[85%] rounded-xl p-3.5 text-sm',
              msg.senderType === 'CLIENT'
                ? 'ml-auto bg-teal/10 text-midnight'
                : msg.senderType === 'SYSTEM'
                ? 'mx-auto bg-black/5 text-center text-xs text-slate'
                : 'bg-slate/5 text-midnight'
            )}
          >
            {msg.senderType !== 'SYSTEM' && (
              <p className="mb-1 text-xs font-semibold text-slate">
                {msg.senderType === 'CLIENT' ? 'You' : msg.sender ? `${msg.sender.firstName} · SDM Team` : 'SDM Team'}
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

      {status !== 'CLOSED' ? (
        <form onSubmit={sendReply} className="space-y-3 rounded-2xl border border-slate/10 bg-white p-5">
          <textarea
            className="w-full rounded-lg border border-slate/20 p-3 text-sm focus:border-teal focus:outline-none focus:ring-2 focus:ring-teal/20"
            rows={3}
            placeholder="Write a reply to SDM…"
            value={reply}
            onChange={(e) => setReply(e.target.value)}
          />
          <div className="flex flex-wrap items-center justify-between gap-3">
            <input
              type="file"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
              className="text-xs text-slate file:mr-3 file:rounded-lg file:border-0 file:bg-teal/10 file:px-2.5 file:py-1.5 file:text-xs file:font-medium file:text-teal"
            />
            <div className="flex gap-2">
              {status === 'RESOLVED' && (
                <Button type="button" variant="secondary" onClick={closeTicket}>
                  Close ticket
                </Button>
              )}
              <Button type="submit" loading={sending}>
                Send reply
              </Button>
            </div>
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
        </form>
      ) : (
        <p className="rounded-xl bg-black/5 p-4 text-center text-sm text-slate">
          This ticket is closed. Open a new ticket if you need further help.
        </p>
      )}
    </div>
  );
}
