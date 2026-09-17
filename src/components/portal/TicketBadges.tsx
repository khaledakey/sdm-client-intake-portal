import clsx from 'clsx';
import { TICKET_STATUS_LABELS, TICKET_CATEGORY_LABELS } from '@/lib/format';

const STATUS_PILL: Record<string, string> = {
  OPEN: 'pill-open',
  IN_PROGRESS: 'pill-progress',
  WAITING_FOR_CLIENT: 'pill-waiting',
  RESOLVED: 'pill-resolved',
  CLOSED: 'pill-normal',
};

const PRIORITY_PILL: Record<string, string> = {
  LOW: 'pill-optional',
  NORMAL: 'pill-normal',
  HIGH: 'pill-high',
  URGENT: 'pill-urgent',
};

export function StatusBadge({ status }: { status: string }) {
  return <span className={clsx('pill', STATUS_PILL[status] || 'pill-normal')}>{TICKET_STATUS_LABELS[status] || status}</span>;
}

export function PriorityBadge({ priority }: { priority: string }) {
  return (
    <span className={clsx('pill', PRIORITY_PILL[priority] || 'pill-normal')}>
      {priority.charAt(0) + priority.slice(1).toLowerCase()}
    </span>
  );
}

export function CategoryLabel({ category }: { category: string }) {
  return <span>{TICKET_CATEGORY_LABELS[category] || category}</span>;
}
