'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Input } from '@/components/ui/Field';
import { Button } from '@/components/ui/Button';

export function ProfileForm({ firstName, lastName, phone }: { firstName: string; lastName: string; phone: string }) {
  const router = useRouter();
  const [form, setForm] = useState({ firstName, lastName, phone });
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setMessage(null);
    const res = await fetch('/api/account', {
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
    setMessage('Saved.');
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <Input
          label="First name"
          required
          value={form.firstName}
          onChange={(e) => setForm({ ...form, firstName: e.target.value })}
        />
        <Input
          label="Last name"
          required
          value={form.lastName}
          onChange={(e) => setForm({ ...form, lastName: e.target.value })}
        />
      </div>
      <Input
        label="Phone number"
        required
        value={form.phone}
        onChange={(e) => setForm({ ...form, phone: e.target.value })}
      />
      {error && <p className="text-sm text-red-600">{error}</p>}
      {message && <p className="text-sm text-emerald">{message}</p>}
      <Button type="submit" loading={saving}>
        Save changes
      </Button>
    </form>
  );
}

export function PasswordForm() {
  const [form, setForm] = useState({ currentPassword: '', newPassword: '' });
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setMessage(null);
    const res = await fetch('/api/account/password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    });
    const data = await res.json();
    setSaving(false);
    if (!res.ok) {
      setError(data.error || 'Something went wrong.');
      return;
    }
    setMessage('Password updated.');
    setForm({ currentPassword: '', newPassword: '' });
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <Input
        label="Current password"
        type="password"
        required
        value={form.currentPassword}
        onChange={(e) => setForm({ ...form, currentPassword: e.target.value })}
      />
      <Input
        label="New password"
        type="password"
        required
        hint="At least 10 characters, with an uppercase letter and a number."
        value={form.newPassword}
        onChange={(e) => setForm({ ...form, newPassword: e.target.value })}
      />
      {error && <p className="text-sm text-red-600">{error}</p>}
      {message && <p className="text-sm text-emerald">{message}</p>}
      <Button type="submit" loading={saving}>
        Update password
      </Button>
    </form>
  );
}

export function ResendVerificationButton() {
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  async function onClick() {
    setLoading(true);
    await fetch('/api/auth/resend-verification', { method: 'POST' });
    setLoading(false);
    setSent(true);
  }

  return (
    <Button size="sm" variant="secondary" onClick={onClick} loading={loading} disabled={sent}>
      {sent ? 'Verification email sent' : 'Resend verification email'}
    </Button>
  );
}
