import clsx from 'clsx';

type Tone = 'neutral' | 'teal' | 'gold' | 'emerald' | 'red' | 'mist';

/** Maps the existing tone names (kept so no call site needs to change) onto
 * theme.css's actual status pill classes. */
const toneClasses: Record<Tone, string> = {
  neutral: 'pill-normal',
  teal: 'pill-progress',
  gold: 'pill-required',
  emerald: 'pill-verified',
  red: 'pill-urgent',
  mist: 'pill-optional',
};

export function Badge({ tone = 'neutral', children }: { tone?: Tone; children: React.ReactNode }) {
  return <span className={clsx('pill', toneClasses[tone])}>{children}</span>;
}
