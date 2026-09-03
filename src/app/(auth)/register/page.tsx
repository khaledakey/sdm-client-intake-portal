'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Input } from '@/components/ui/Field';
import { Button } from '@/components/ui/Button';

const initial = {
  firstName: '',
  lastName: '',
  businessName: '',
  email: '',
  phone: '',
  password: '',
};

export default function RegisterPage() {
  const router = useRouter();
  const [form, setForm] = useState(initial);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  function update<K extends keyof typeof initial>(key: K, value: string) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const res = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) {
      setError(data.error || 'Something went wrong.');
      return;
    }
    router.push('/dashboard');
    router.refresh();
  }

  return (
    <div>
      <p className="font-label mb-2 text-xs uppercase tracking-[0.35em] text-cyan">Client Portal</p>
      <h1 className="font-heading text-2xl font-semibold text-midnight">Create your account</h1>
      <p className="mt-2 text-sm text-slate">Set up secure access to your SDM onboarding hub.</p>

      <form onSubmit={onSubmit} className="mt-8 space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <Input
            label="First name"
            required
            value={form.firstName}
            onChange={(e) => update('firstName', e.target.value)}
          />
          <Input
            label="Last name"
            required
            value={form.lastName}
            onChange={(e) => update('lastName', e.target.value)}
          />
        </div>
        <Input
          label="Business name"
          required
          value={form.businessName}
          onChange={(e) => update('businessName', e.target.value)}
        />
        <Input
          label="Business email"
          type="email"
          required
          value={form.email}
          onChange={(e) => update('email', e.target.value)}
        />
        <Input
          label="Phone number"
          type="tel"
          required
          value={form.phone}
          onChange={(e) => update('phone', e.target.value)}
        />
        <Input
          label="Password"
          type="password"
          required
          hint="At least 10 characters, with an uppercase letter and a number."
          value={form.password}
          onChange={(e) => update('password', e.target.value)}
        />
        {error && <p className="text-sm text-red-600">{error}</p>}
        <Button type="submit" className="w-full" loading={loading}>
          Create account
        </Button>
      </form>

      <p className="mt-8 text-sm text-slate">
        Already have an account?{' '}
        <Link href="/login" className="font-medium text-teal hover:underline">
          Sign in
        </Link>
      </p>
    </div>
  );
}
