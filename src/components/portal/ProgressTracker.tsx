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
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 14 }}>
        <div className="section-title" style={{ margin: 0 }}>Onboarding progress</div>
        <div className="mono" style={{ fontSize: 13, color: 'var(--portal-action)', fontWeight: 600 }}>
          {percentage}% Complete
        </div>
      </div>
      <div className="progress-track">
        <div className="progress-fill" style={{ width: `${percentage}%` }} />
      </div>
      <div className="steps">
        {ONBOARDING_STEPS.map((step, i) => {
          const done = stepDone[step.key];
          const isCurrent = i === currentIndex;
          return (
            <div key={step.key} className={clsx('step', done && 'done', isCurrent && 'current')}>
              <div className="step-dot">{done ? <IconCheck width={14} height={14} /> : i + 1}</div>
              <div className="step-label">{step.label}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
