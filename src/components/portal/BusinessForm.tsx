'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import type { Business } from '@prisma/client';
import { Input, Textarea, Select } from '@/components/ui/Field';
import { Button } from '@/components/ui/Button';

const INDUSTRY_OPTIONS = [
  'Retail & eCommerce',
  'Hospitality & Food',
  'Professional Services',
  'Construction & Trades',
  'Health & Wellness',
  'Manufacturing',
  'Technology & SaaS',
  'Education & Training',
  'Real Estate',
  'Agriculture',
  'Other',
].map((v) => ({ value: v, label: v }));

const EMPLOYEE_OPTIONS = ['Just me', '2-5', '6-10', '11-25', '26-50', '51+'].map((v) => ({
  value: v,
  label: v,
}));

const STAGE_OPTIONS = ['Pre-launch', 'Startup (0-2 years)', 'Established', 'Scaling', 'Mature'].map((v) => ({
  value: v,
  label: v,
}));

type FormState = {
  businessName: string;
  tradingName: string;
  website: string;
  industry: string;
  businessDescription: string;
  location: string;
  employeeCount: string;
  serviceArea: string;
  businessStage: string;
  mainContactName: string;
  mainContactEmail: string;
  mainContactPhone: string;
};

function toForm(b: Business): FormState {
  return {
    businessName: b.businessName ?? '',
    tradingName: b.tradingName ?? '',
    website: b.website ?? '',
    industry: b.industry ?? '',
    businessDescription: b.businessDescription ?? '',
    location: b.location ?? '',
    employeeCount: b.employeeCount ?? '',
    serviceArea: b.serviceArea ?? '',
    businessStage: b.businessStage ?? '',
    mainContactName: b.mainContactName ?? '',
    mainContactEmail: b.mainContactEmail ?? '',
    mainContactPhone: b.mainContactPhone ?? '',
  };
}

export function BusinessForm({ business }: { business: Business }) {
  const router = useRouter();
  const [form, setForm] = useState<FormState>(toForm(business));
  const [saving, setSaving] = useState(false);
  const [savedAt, setSavedAt] = useState<Date | null>(null);
  const [error, setError] = useState<string | null>(null);

  function update<K extends keyof FormState>(key: K, value: string) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    const res = await fetch('/api/business', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    });
    const data = await res.json();
    setSaving(false);
    if (!res.ok) {
      setError(data.error || 'Something went wrong.');
      return;
    }
    setSavedAt(new Date());
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit}>
      <div className="card card-pad">
        <div className="section-title">Business Details</div>
        <div className="section-sub">Section A of your intake.</div>

        <div className="grid-2">
          <Input
            label="Business name"
            required
            value={form.businessName}
            onChange={(e) => update('businessName', e.target.value)}
          />
          <Input
            label="Trading name"
            hint="Optional, if different from your registered business name."
            value={form.tradingName}
            onChange={(e) => update('tradingName', e.target.value)}
          />
        </div>

        <div className="grid-2">
          <Input
            label="Business website"
            required
            placeholder="https://"
            value={form.website}
            onChange={(e) => update('website', e.target.value)}
          />
          <Select
            label="Industry"
            required
            placeholder="Select an industry"
            options={INDUSTRY_OPTIONS}
            value={form.industry}
            onChange={(e) => update('industry', e.target.value)}
          />
        </div>

        <Textarea
          label="Business description"
          required
          hint="A couple of sentences about what your business does."
          value={form.businessDescription}
          onChange={(e) => update('businessDescription', e.target.value)}
        />

        <div className="grid-2">
          <Input
            label="Business location"
            required
            placeholder="e.g. Cork, Ireland"
            value={form.location}
            onChange={(e) => update('location', e.target.value)}
          />
          <Input
            label="Primary service area"
            required
            placeholder="e.g. Munster, All-Ireland, International"
            value={form.serviceArea}
            onChange={(e) => update('serviceArea', e.target.value)}
          />
        </div>

        <div className="grid-2">
          <Select
            label="Number of employees"
            required
            placeholder="Select a range"
            options={EMPLOYEE_OPTIONS}
            value={form.employeeCount}
            onChange={(e) => update('employeeCount', e.target.value)}
          />
          <Select
            label="Current business stage"
            required
            placeholder="Select a stage"
            options={STAGE_OPTIONS}
            value={form.businessStage}
            onChange={(e) => update('businessStage', e.target.value)}
          />
        </div>
      </div>

      <div className="card card-pad">
        <div className="section-title">Main Contact</div>
        <div className="grid-2">
          <Input
            label="Contact name"
            required
            value={form.mainContactName}
            onChange={(e) => update('mainContactName', e.target.value)}
          />
          <Input
            label="Contact email"
            type="email"
            required
            value={form.mainContactEmail}
            onChange={(e) => update('mainContactEmail', e.target.value)}
          />
        </div>
        <div style={{ maxWidth: 'calc(50% - 12px)' }}>
          <Input
            label="Contact phone"
            type="tel"
            required
            value={form.mainContactPhone}
            onChange={(e) => update('mainContactPhone', e.target.value)}
          />
        </div>

        {error && (
          <div className="alert alert-error" style={{ marginBottom: 18 }}>
            {error}
          </div>
        )}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <Button type="submit" loading={saving}>
            Save changes
          </Button>
          {savedAt && <span style={{ fontSize: 12, color: 'var(--status-ok-text)' }}>Saved</span>}
        </div>
      </div>
    </form>
  );
}
