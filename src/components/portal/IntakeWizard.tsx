'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import clsx from 'clsx';
import { Textarea, Input, Select, MultiSelect } from '@/components/ui/Field';
import { Button } from '@/components/ui/Button';

const SOCIAL_OPTIONS = ['Facebook', 'Instagram', 'LinkedIn', 'TikTok', 'X / Twitter', 'YouTube', 'Pinterest', 'None'].map(
  (v) => ({ value: v, label: v })
);
const ADVERTISING_OPTIONS = ['Google Ads', 'Meta Ads', 'LinkedIn Ads', 'Print', 'Radio', 'None'].map((v) => ({
  value: v,
  label: v,
}));
const ACTIVITY_LEVEL_OPTIONS = ['None', 'Occasional', 'Regular', 'Managed by an agency'].map((v) => ({
  value: v,
  label: v,
}));

interface IntakeState {
  businessGoals: string;
  marketingObjectives: string;
  targetCustomers: string;
  marketingChallenges: string;
  growthTargets: string;
  competitors: string;
  targetLocations: string;
  keyProductsServices: string;
  expectedOutcomes: string;
  currentWebsite: string;
  socialMediaPlatforms: string[];
  advertisingChannels: string[];
  seoActivity: string;
  emailMarketingActivity: string;
  contentMarketingActivity: string;
  marketingTools: string;
  existingAgency: string;
  bestPerformingActivity: string;
  biggestChallenges: string;
}

function fromIntake(intake: any): IntakeState {
  const ext = intake.extendedData || {};
  return {
    businessGoals: intake.businessGoals ?? '',
    marketingObjectives: intake.marketingObjectives ?? '',
    targetCustomers: intake.targetCustomers ?? '',
    marketingChallenges: intake.marketingChallenges ?? '',
    growthTargets: intake.growthTargets ?? '',
    competitors: intake.competitors ?? '',
    targetLocations: ext.targetLocations ?? '',
    keyProductsServices: ext.keyProductsServices ?? '',
    expectedOutcomes: ext.expectedOutcomes ?? '',
    currentWebsite: ext.currentWebsite ?? '',
    socialMediaPlatforms: ext.socialMediaPlatforms ?? [],
    advertisingChannels: ext.advertisingChannels ?? [],
    seoActivity: ext.seoActivity ?? '',
    emailMarketingActivity: ext.emailMarketingActivity ?? '',
    contentMarketingActivity: ext.contentMarketingActivity ?? '',
    marketingTools: ext.marketingTools ?? '',
    existingAgency: ext.existingAgency ?? '',
    bestPerformingActivity: ext.bestPerformingActivity ?? '',
    biggestChallenges: ext.biggestChallenges ?? '',
  };
}

const NAMED_KEYS = [
  'businessGoals',
  'marketingObjectives',
  'targetCustomers',
  'marketingChallenges',
  'growthTargets',
  'competitors',
] as const;

const STEPS = [
  { title: 'Business Goals', description: 'Section B — where you want your business to go.' },
  { title: 'Current Marketing Activity', description: 'Section C — what you’re doing today.' },
];

export function IntakeWizard({ initial }: { initial: any }) {
  const router = useRouter();
  const [state, setState] = useState<IntakeState>(fromIntake(initial));
  const [step, setStep] = useState(0);
  const [saveState, setSaveState] = useState<'idle' | 'saving' | 'saved'>('idle');
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pendingRef = useRef<Partial<IntakeState> | null>(null);

  function update<K extends keyof IntakeState>(key: K, value: IntakeState[K]) {
    setState((s) => ({ ...s, [key]: value }));
    pendingRef.current = { ...(pendingRef.current || {}), [key]: value };
    setSaveState('saving');
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => save(), 900);
  }

  async function save() {
    const pending = pendingRef.current;
    if (!pending) return;
    pendingRef.current = null;

    const namedFields: Record<string, string> = {};
    const extended: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(pending)) {
      if ((NAMED_KEYS as readonly string[]).includes(key)) namedFields[key] = value as string;
      else extended[key] = value;
    }

    await fetch('/api/intake', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...namedFields, extendedData: extended }),
    });
    setSaveState('saved');
  }

  async function flushAndContinue(goTo: number) {
    if (timer.current) clearTimeout(timer.current);
    await save();
    setStep(goTo);
    if (goTo >= STEPS.length) router.refresh();
  }

  useEffect(() => {
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, []);

  return (
    <div className="card card-pad">
      <div className="section-title">Business Goals &amp; Marketing Activity</div>
      <div className="wizard-steps">
        {STEPS.map((s, i) => (
          <div key={s.title} style={{ display: 'flex', alignItems: 'center', flex: i < STEPS.length - 1 ? 'none' : undefined }}>
            <div className={clsx('wizard-step', i === step && 'active')}>
              <span className="num">{i + 1}</span> {s.title}
            </div>
            {i < STEPS.length - 1 && <div className="wizard-rule" />}
          </div>
        ))}
      </div>

      {step === 0 && (
        <div>
          <Textarea
            label="Primary business goals"
            required
            value={state.businessGoals}
            onChange={(e) => update('businessGoals', e.target.value)}
          />
          <Textarea
            label="Main marketing objectives"
            required
            value={state.marketingObjectives}
            onChange={(e) => update('marketingObjectives', e.target.value)}
          />
          <Textarea
            label="Target customers"
            required
            hint="Who are you trying to reach?"
            value={state.targetCustomers}
            onChange={(e) => update('targetCustomers', e.target.value)}
          />
          <Input
            label="Target locations"
            required
            placeholder="e.g. Dublin, national, EU"
            value={state.targetLocations}
            onChange={(e) => update('targetLocations', e.target.value)}
          />
          <Textarea
            label="Key products or services"
            required
            value={state.keyProductsServices}
            onChange={(e) => update('keyProductsServices', e.target.value)}
          />
          <Textarea
            label="Current marketing challenges"
            required
            value={state.marketingChallenges}
            onChange={(e) => update('marketingChallenges', e.target.value)}
          />
          <Input
            label="Growth targets"
            required
            placeholder="e.g. Double revenue in 12 months"
            value={state.growthTargets}
            onChange={(e) => update('growthTargets', e.target.value)}
          />
          <Textarea
            label="Main competitors"
            required
            value={state.competitors}
            onChange={(e) => update('competitors', e.target.value)}
          />
          <Textarea
            label="Expected outcomes from working with SDM"
            required
            value={state.expectedOutcomes}
            onChange={(e) => update('expectedOutcomes', e.target.value)}
          />
        </div>
      )}

      {step === 1 && (
        <div>
          <Input
            label="Current website"
            value={state.currentWebsite}
            onChange={(e) => update('currentWebsite', e.target.value)}
          />
          <MultiSelect
            label="Social media platforms in use"
            options={SOCIAL_OPTIONS}
            value={state.socialMediaPlatforms}
            onChange={(v) => update('socialMediaPlatforms', v)}
          />
          <MultiSelect
            label="Current advertising channels"
            options={ADVERTISING_OPTIONS}
            value={state.advertisingChannels}
            onChange={(v) => update('advertisingChannels', v)}
          />
          <div className="grid-2" style={{ gridTemplateColumns: '1fr 1fr 1fr' }}>
            <Select
              label="SEO activity"
              placeholder="Select one"
              options={ACTIVITY_LEVEL_OPTIONS}
              value={state.seoActivity}
              onChange={(e) => update('seoActivity', e.target.value)}
            />
            <Select
              label="Email marketing activity"
              placeholder="Select one"
              options={ACTIVITY_LEVEL_OPTIONS}
              value={state.emailMarketingActivity}
              onChange={(e) => update('emailMarketingActivity', e.target.value)}
            />
            <Select
              label="Content marketing activity"
              placeholder="Select one"
              options={ACTIVITY_LEVEL_OPTIONS}
              value={state.contentMarketingActivity}
              onChange={(e) => update('contentMarketingActivity', e.target.value)}
            />
          </div>
          <Input
            label="Current marketing tools"
            placeholder="e.g. Mailchimp, HubSpot, Canva"
            value={state.marketingTools}
            onChange={(e) => update('marketingTools', e.target.value)}
          />
          <Input
            label="Existing marketing agency or providers"
            placeholder="Leave blank if none"
            value={state.existingAgency}
            onChange={(e) => update('existingAgency', e.target.value)}
          />
          <Textarea
            label="What marketing activity is currently generating the best results?"
            required
            value={state.bestPerformingActivity}
            onChange={(e) => update('bestPerformingActivity', e.target.value)}
          />
          <Textarea
            label="What are your biggest marketing challenges right now?"
            required
            value={state.biggestChallenges}
            onChange={(e) => update('biggestChallenges', e.target.value)}
          />
        </div>
      )}

      {step >= STEPS.length && (
        <div className="alert alert-success" style={{ flexDirection: 'column', textAlign: 'center', padding: 24 }}>
          <p style={{ fontWeight: 700, margin: 0 }}>Marketing intake saved</p>
          <p style={{ margin: '8px 0 0' }}>
            Thanks &mdash; SDM will review this alongside your business information and documents.
          </p>
          <Button variant="secondary" size="sm" style={{ marginTop: 16 }} onClick={() => setStep(0)}>
            Review your answers
          </Button>
        </div>
      )}

      {step < STEPS.length && (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 10 }}>
          <div className="mono" style={{ fontSize: 11, color: 'var(--text-muted)' }}>
            {saveState === 'saving' && 'Saving…'}
            {saveState === 'saved' && 'Auto-saved a moment ago'}
            {saveState === 'idle' && ' '}
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <Button variant="ghost" disabled={step === 0} onClick={() => flushAndContinue(step - 1)}>
              Back
            </Button>
            {step < STEPS.length - 1 ? (
              <Button onClick={() => flushAndContinue(step + 1)}>Save &amp; Continue</Button>
            ) : (
              <Button onClick={() => flushAndContinue(STEPS.length)}>Save &amp; Finish</Button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
