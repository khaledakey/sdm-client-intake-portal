import Link from 'next/link';
import type { OutstandingAction } from '@/lib/actions';

export function ActionRequiredList({ actions }: { actions: OutstandingAction[] }) {
  if (actions.length === 0) {
    return (
      <div className="empty" style={{ padding: '24px 0', textAlign: 'left' }}>
        Nothing outstanding right now &mdash; you&apos;re all caught up.
      </div>
    );
  }
  return (
    <div>
      {actions.map((action) => (
        <Link key={action.id} href={action.href} className="list-row">
          <div>
            <div className="title">
              {action.severity === 'high' && <span className="dot-unread" />}
              {action.label}
            </div>
            <div className="sub">{action.description}</div>
          </div>
          <span className="chev">&rsaquo;</span>
        </Link>
      ))}
    </div>
  );
}
