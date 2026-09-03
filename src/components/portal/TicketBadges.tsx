import { Badge } from '@/components/ui/Badge';
import { TICKET_STATUS_LABELS, TICKET_CATEGORY_LABELS } from '@/lib/format';

const STATUS_TONE: Record<string, 'neutral' | 'teal' | 'emerald' | 'gold' | 'mist'> = {
  OPEN: 'teal',
  IN_PROGRESS: 'gold',
  WAITING_FOR_CLIENT: 'gold',
  RESOLVED: 'emerald',
  CLOSED: 'mist',
};

const PRIORITY_TONE: Record<string, 'neutral' | 'teal' | 'emerald' | 'gold' | 'red' | 'mist'> = {
  LOW: 'mist',
  NORMAL: 'neutral',
  HIGH: 'gold',
  URGENT: 'red',
};

export function StatusBadge({ status }: { status: string }) {
  return <Badge tone={STATUS_TONE[status] || 'neutral'}>{TICKET_STATUS_LABELS[status] || status}</Badge>;
}

export function PriorityBadge({ priority }: { priority: string }) {
  return <Badge tone={PRIORITY_TONE[priority] || 'neutral'}>{priority.charAt(0) + priority.slice(1).toLowerCase()}</Badge>;
}

export function CategoryLabel({ category }: { category: string }) {
  return <span>{TICKET_CATEGORY_LABELS[category] || category}</span>;
}
