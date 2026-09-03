import clsx from 'clsx';

type Tone = 'neutral' | 'teal' | 'gold' | 'emerald' | 'red' | 'mist';

const toneClasses: Record<Tone, string> = {
  neutral: 'bg-black/5 text-midnight',
  teal: 'bg-teal/10 text-teal',
  gold: 'bg-gold/15 text-[#8a6f22]',
  emerald: 'bg-emerald/10 text-emerald',
  red: 'bg-red-50 text-red-600',
  mist: 'bg-slate/10 text-slate',
};

export function Badge({ tone = 'neutral', children }: { tone?: Tone; children: React.ReactNode }) {
  return (
    <span
      className={clsx(
        'inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium',
        toneClasses[tone]
      )}
    >
      {children}
    </span>
  );
}
