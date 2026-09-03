import Link from 'next/link';
import { IconArrowRight } from '@/components/icons';
import type { OutstandingAction } from '@/lib/actions';

export function ActionRequiredList({ actions }: { actions: OutstandingAction[] }) {
  if (actions.length === 0) {
    return (
      <p className="text-sm text-emerald">
        Nothing outstanding right now — you&apos;re all caught up.
      </p>
    );
  }
  return (
    <ul className="space-y-3">
      {actions.map((action) => (
        <li key={action.id}>
          <Link
            href={action.href}
            className="group flex items-start justify-between gap-4 rounded-xl border border-slate/10 p-4 transition-colors hover:border-teal/40 hover:bg-teal/5"
          >
            <div>
              <p className="flex items-center gap-2 text-sm font-medium text-midnight">
                {action.severity === 'high' && <span className="h-1.5 w-1.5 rounded-full bg-gold" />}
                {action.label}
              </p>
              <p className="mt-1 text-xs text-slate">{action.description}</p>
            </div>
            <IconArrowRight className="mt-1 h-4 w-4 shrink-0 text-mist transition-transform group-hover:translate-x-0.5 group-hover:text-teal" />
          </Link>
        </li>
      ))}
    </ul>
  );
}
