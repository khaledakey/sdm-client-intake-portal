'use client';

import { useState } from 'react';
import {
  leadIntakeSchema,
  LEAD_INTAKE_INITIAL,
  LeadIntakeFormData,
  BUSINESS_STAGE_OPTIONS,
  TEAM_SIZE_OPTIONS,
  BUDGET_OPTIONS,
  TIMELINE_OPTIONS,
  CONTACT_PREFERENCE_OPTIONS,
} from '@/lib/leadIntake';
import { Input, Textarea, Select } from '@/components/ui/Field';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';

type Errors = Partial<Record<keyof LeadIntakeFormData, string>>;

export function LeadIntakeForm() {
  const [form, setForm] = useState<LeadIntakeFormData>(LEAD_INTAKE_INITIAL);
  const [hp, setHp] = useState('');
  const [errors, setErrors] = useState<Errors>({});
  const [status, setStatus] = useState<'idle' | 'submitting' | 'success'>('idle');
  const [submitError, setSubmitError] = useState<string | null>(null);

  function update<K extends keyof LeadIntakeFormData>(key: K, value: LeadIntakeFormData[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitError(null);

    const parsed = leadIntakeSchema.safeParse(form);
    if (!parsed.success) {
      const fieldErrors: Errors = {};
      for (const issue of parsed.error.issues) {
        const key = issue.path[0] as keyof LeadIntakeFormData;
        if (!fieldErrors[key]) fieldErrors[key] = issue.message;
      }
      setErrors(fieldErrors);
      const firstKey = parsed.error.issues[0]?.path[0];
      if (firstKey) {
        document.getElementById(`field-${String(firstKey)}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
      return;
    }

    setErrors({});
    setStatus('submitting');
    try {
      const res = await fetch('/api/public/lead-intake', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...parsed.data, hp }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        setStatus('idle');
        setSubmitError(data?.error || 'Something went wrong submitting your details. Please try again.');
        return;
      }
      setStatus('success');
    } catch {
      setStatus('idle');
      setSubmitError('We couldn’t reach the server. Check your connection and try again.');
    }
  }

  function reset() {
    setForm(LEAD_INTAKE_INITIAL);
    setHp('');
    setErrors({});
    setSubmitError(null);
    setStatus('idle');
  }

  if (status === 'success') {
    return (
      <Card className="text-center">
        <h1 className="font-heading text-2xl font-semibold text-midnight">Thanks for getting in touch!</h1>
        <p className="mt-3 text-sm text-slate">
          We&rsquo;ll review your submission and be in touch within 2 business days.
        </p>
        <p className="mt-3 text-sm text-slate">
          In the meantime, here are{' '}
          <a
            href="https://saoirsedigital.com"
            target="_blank"
            rel="noopener noreferrer"
            className="font-medium text-teal hover:underline"
          >
            some resources
          </a>{' '}
          to help you get started.
        </p>
        <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Button onClick={reset}>Submit another response</Button>
          <a href="https://saoirsedigital.com">
            <Button variant="secondary">Back to website</Button>
          </a>
        </div>
      </Card>
    );
  }

  return (
    <Card>
      <div className="mb-6">
        <h1 className="font-heading text-2xl font-semibold text-midnight">Tell us about your business</h1>
        <p className="mt-2 text-sm text-slate">
          A few details so we can understand where you&rsquo;re at and how we can help. Takes about 5 minutes.
        </p>
      </div>

      <form onSubmit={onSubmit} noValidate className="space-y-5">
        {/* Honeypot — hidden from real users, left blank by them, catches bots. */}
        <div style={{ position: 'absolute', left: '-9999px', width: '1px', height: '1px', overflow: 'hidden' }}>
          <label htmlFor="field-hp">Leave this field blank</label>
          <input
            id="field-hp"
            type="text"
            tabIndex={-1}
            autoComplete="off"
            value={hp}
            onChange={(e) => setHp(e.target.value)}
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div id="field-firstName">
            <Input
              label="First name"
              required
              value={form.firstName}
              onChange={(e) => update('firstName', e.target.value)}
              error={errors.firstName}
            />
          </div>
          <div id="field-lastName">
            <Input
              label="Last name"
              required
              value={form.lastName}
              onChange={(e) => update('lastName', e.target.value)}
              error={errors.lastName}
            />
          </div>
        </div>

        <div id="field-email">
          <Input
            label="Work email"
            type="email"
            required
            value={form.email}
            onChange={(e) => update('email', e.target.value)}
            error={errors.email}
          />
        </div>

        <div id="field-phone">
          <Input
            label="Mobile or phone number"
            type="tel"
            required
            value={form.phone}
            onChange={(e) => update('phone', e.target.value)}
            error={errors.phone}
          />
        </div>

        <div id="field-role">
          <Input
            label="Your role in the business"
            required
            value={form.role}
            onChange={(e) => update('role', e.target.value)}
            error={errors.role}
          />
        </div>

        <div id="field-companyName">
          <Input
            label="Business name"
            required
            value={form.companyName}
            onChange={(e) => update('companyName', e.target.value)}
            error={errors.companyName}
          />
        </div>

        <div id="field-location">
          <Input
            label="Town or county"
            required
            value={form.location}
            onChange={(e) => update('location', e.target.value)}
            error={errors.location}
          />
        </div>

        <div id="field-website">
          <Input
            label="Website or main social-media link"
            type="url"
            placeholder="https://"
            value={form.website}
            onChange={(e) => update('website', e.target.value)}
            error={errors.website}
          />
        </div>

        <div id="field-businessDescription">
          <Textarea
            label="What does your business do?"
            required
            value={form.businessDescription}
            onChange={(e) => update('businessDescription', e.target.value)}
            error={errors.businessDescription}
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div id="field-businessStage">
            <Select
              label="What stage is the business at?"
              required
              placeholder="Select a stage"
              options={BUSINESS_STAGE_OPTIONS as unknown as { value: string; label: string }[]}
              value={form.businessStage}
              onChange={(e) => update('businessStage', e.target.value)}
              error={errors.businessStage}
            />
          </div>
          <div id="field-teamSize">
            <Select
              label="Team size"
              required
              placeholder="Select a team size"
              options={TEAM_SIZE_OPTIONS as unknown as { value: string; label: string }[]}
              value={form.teamSize}
              onChange={(e) => update('teamSize', e.target.value)}
              error={errors.teamSize}
            />
          </div>
        </div>

        <div id="field-desiredOutcome">
          <Textarea
            label="Which outcome matters most right now?"
            required
            value={form.desiredOutcome}
            onChange={(e) => update('desiredOutcome', e.target.value)}
            error={errors.desiredOutcome}
          />
        </div>

        <div id="field-marketingChallenge">
          <Textarea
            label="What is the biggest marketing challenge you want help with?"
            required
            value={form.marketingChallenge}
            onChange={(e) => update('marketingChallenge', e.target.value)}
            error={errors.marketingChallenge}
          />
        </div>

        <div id="field-currentMarketing">
          <Textarea
            label="What marketing are you currently doing?"
            required
            value={form.currentMarketing}
            onChange={(e) => update('currentMarketing', e.target.value)}
            error={errors.currentMarketing}
          />
        </div>

        <div id="field-budgetRange">
          <Select
            label="Approximate monthly budget available to improve marketing"
            required
            placeholder="Select a budget range"
            options={BUDGET_OPTIONS as unknown as { value: string; label: string }[]}
            value={form.budgetRange}
            onChange={(e) => update('budgetRange', e.target.value)}
            error={errors.budgetRange}
          />
        </div>

        <div id="field-timeline">
          <Select
            label="When would you like to act?"
            required
            placeholder="Select a timeline"
            options={TIMELINE_OPTIONS as unknown as { value: string; label: string }[]}
            value={form.timeline}
            onChange={(e) => update('timeline', e.target.value)}
            error={errors.timeline}
          />
        </div>

        <div id="field-contactPreference">
          <Select
            label="Preferred contact method"
            required
            placeholder="Select a contact method"
            options={CONTACT_PREFERENCE_OPTIONS as unknown as { value: string; label: string }[]}
            value={form.contactPreference}
            onChange={(e) => update('contactPreference', e.target.value)}
            error={errors.contactPreference}
          />
        </div>

        <div id="field-source">
          <Input
            label="How did you hear about Saoirse Digital Marketing?"
            required
            value={form.source}
            onChange={(e) => update('source', e.target.value)}
            error={errors.source}
          />
        </div>

        <div className="space-y-3 border-t border-slate/10 pt-5">
          <label id="field-privacyConsent" className="flex items-start gap-3 text-sm text-slate">
            <input
              type="checkbox"
              className="mt-0.5 h-4 w-4 shrink-0 rounded border-slate/30 text-teal focus:ring-teal/40"
              checked={form.privacyConsent}
              onChange={(e) => update('privacyConsent', e.target.checked)}
            />
            <span>
              I agree that Saoirse Digital Marketing may use my details to respond to this request, as described in
              the Privacy Notice. <span className="text-teal">*</span>
            </span>
          </label>
          {errors.privacyConsent && <p className="pl-7 text-xs text-red-600">{errors.privacyConsent}</p>}

          <label className="flex items-start gap-3 text-sm text-slate">
            <input
              type="checkbox"
              className="mt-0.5 h-4 w-4 shrink-0 rounded border-slate/30 text-teal focus:ring-teal/40"
              checked={form.marketingOptIn}
              onChange={(e) => update('marketingOptIn', e.target.checked)}
            />
            <span>I would like occasional marketing tips and updates from Saoirse Digital Marketing.</span>
          </label>
        </div>

        {submitError && (
          <p className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{submitError}</p>
        )}

        <Button type="submit" className="w-full" loading={status === 'submitting'}>
          {status === 'submitting' ? 'Submitting…' : 'Submit'}
        </Button>
      </form>
    </Card>
  );
}
