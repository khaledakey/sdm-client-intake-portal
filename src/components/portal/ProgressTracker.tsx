import clsx from 'clsx';
import { IconCheck } from '@/components/icons';
import { ONBOARDING_STEPS } from '@/lib/progress';

export function ProgressTracker({
  stepDone,
  percentage,
}: {
  stepDone: Record<string, boolean>;
  percentage: number;
}) {
  const currentIndex = ONBOARDING_STEPS.findIndex((s) => !stepDone[s.key]);
  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <p className="text-sm font-medium text-slate">Onboarding progress</p>
        <p className="font-heading text-lg font-semibold text-teal">{percentage}% Complete</p>
      </div>
      <div className="mb-8 h-2.5 w-full overflow-hidden rounded-full bg-black/5">
        <div
          className="h-full rounded-full bg-gradient-to-r from-teal to-emerald transition-all duration-500"
          style={{ width: `${percentage}%` }}
        />
      </div>
      <ol className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
        {ONBOARDING_STEPS.map((step, i) => {
          const done = stepDone[step.key];
          const isCurrent = i === currentIndex;
          return (
            <li key={step.key} className="flex flex-col items-start gap-2">
              <span
                className={clsx(
                  'flex h-8 w-8 items-center justify-center rounded-full border-2 text-xs font-semibold',
                  done
                    ? 'border-emerald bg-emerald text-white'
                    : isCurrent
                    ? 'border-teal text-teal'
                    : 'border-slate/20 text-mist'
                )}
              >
                {done ? <IconCheck className="h-4 w-4" /> : i + 1}
              </span>
              <span
                className={clsx(
                  'text-xs font-medium leading-tight',
                  done ? 'text-emerald' : isCurrent ? 'text-teal' : 'text-mist'
                )}
              >
                {step.label}
              </span>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
