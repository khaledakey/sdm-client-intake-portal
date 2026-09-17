'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Input } from '@/components/ui/Field';
import { Button } from '@/components/ui/Button';

export default function LoginPage() {
  const router = useRouter();
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const res = await fetch('/api/auth/login', {
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
    router.push(data.role === 'CLIENT' ? '/dashboard' : '/admin');
    router.refresh();
  }

  return (
    <div>
      <div className="eyebrow">Client Portal</div>
      <h1>Welcome back</h1>
      <p className="lede">Sign in to continue your onboarding.</p>

      <form onSubmit={onSubmit}>
        <Input
          label="Email address"
          type="email"
          required
          value={form.email}
          onChange={(e) => setForm({ ...form, email: e.target.value })}
        />
        <Input
          label="Password"
          type="password"
          required
          value={form.password}
          onChange={(e) => setForm({ ...form, password: e.target.value })}
        />
        <div style={{ textAlign: 'right', margin: '-8px 0 18px' }}>
          <Link href="/forgot-password" style={{ fontSize: 12 }}>
            Forgot password?
          </Link>
        </div>
        {error && (
          <div className="alert alert-error" style={{ marginBottom: 18 }}>
            {error}
          </div>
        )}
        <Button type="submit" loading={loading} style={{ width: '100%', justifyContent: 'center' }}>
          Sign in
        </Button>
      </form>

      <div className="auth-link-row" style={{ opacity: 0.55 }}>
        Invite-only portal &middot; access is granted by SDM
      </div>
    </div>
  );
}
