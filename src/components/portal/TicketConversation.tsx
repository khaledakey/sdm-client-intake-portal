'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import clsx from 'clsx';
import { Button } from '@/components/ui/Button';
import { IconUpload } from '@/components/icons';
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
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 18, gap: 16, flexWrap: 'wrap' }}>
        <div>
          <div className="mono" style={{ fontSize: 12, color: 'var(--text-muted)' }}>SDM-{ticket.ticketNumber}</div>
          <h1 style={{ marginTop: 2 }}>{ticket.subject}</h1>
          <p className="lede" style={{ marginTop: 4 }}>
            Opened {formatDateTime(ticket.createdAt)}
            {ticket.assignedTo && ` · Assigned to ${ticket.assignedTo.firstName} ${ticket.assignedTo.lastName}`}
          </p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <PriorityBadge priority={ticket.priority} />
          <StatusBadge status={status} />
        </div>
      </div>

      <div className="card card-pad">
        {items.map((msg) => (
          <div
            key={msg.id}
            className={clsx(
              msg.senderType === 'SYSTEM' ? undefined : 'bubble',
              msg.senderType === 'CLIENT' && 'bubble-client',
              msg.senderType === 'SDM_TEAM' && 'bubble-team'
            )}
            style={
              msg.senderType === 'SYSTEM'
                ? { textAlign: 'center', fontSize: 12, color: 'var(--text-muted)', margin: '10px auto' }
                : undefined
            }
          >
            {msg.senderType !== 'SYSTEM' && (
              <div className="who">{msg.senderType === 'CLIENT' ? 'You' : msg.sender ? `${msg.sender.firstName} · SDM Team` : 'SDM Team'}</div>
            )}
            <div className={msg.senderType === 'SYSTEM' ? undefined : 'msg'} style={{ whiteSpace: 'pre-wrap' }}>
              {msg.message}
            </div>
            {msg.attachmentReference && (
              <a href={`/api/tickets/${ticket.id}/messages/${msg.id}/attachment`} style={{ display: 'inline-block', marginTop: 6, fontSize: 12 }}>
                View attachment
              </a>
            )}
            {msg.senderType !== 'SYSTEM' && <div className="time">{formatDateTime(msg.createdAt)}</div>}
          </div>
        ))}
      </div>

      {status !== 'CLOSED' ? (
        <form onSubmit={sendReply} className="card card-pad" style={{ marginTop: 16 }}>
          <textarea
            className="textarea"
            style={{ minHeight: 90, marginBottom: 14 }}
            placeholder="Write a reply to SDM..."
            value={reply}
            onChange={(e) => setReply(e.target.value)}
          />
          <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
            <div
              onClick={() => document.getElementById('reply-attachment')?.click()}
              style={{
                border: '1px dashed var(--border-card)',
                borderRadius: 'var(--radius-md)',
                padding: '10px 14px',
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                color: 'var(--text-muted)',
                fontSize: 13,
                cursor: 'pointer',
              }}
            >
              <IconUpload width={15} height={15} />
              {file ? file.name : 'Choose file · no file chosen'}
            </div>
            <input id="reply-attachment" type="file" className="hidden" onChange={(e) => setFile(e.target.files?.[0] || null)} />
            <div style={{ display: 'flex', gap: 10 }}>
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
          {error && (
            <div className="alert alert-error" style={{ marginTop: 14 }}>
              {error}
            </div>
          )}
        </form>
      ) : (
        <div className="empty" style={{ marginTop: 16 }}>
          This ticket is closed. Open a new ticket if you need further help.
        </div>
      )}
    </div>
  );
}
