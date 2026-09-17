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
      <p className="font-label mb-2 text-xs uppercase tracking-[0.35em] text-cyan">Client Portal</p>
      <h1 className="font-heading text-2xl font-semibold text-midnight">Welcome back</h1>
      <p className="mt-2 text-sm text-slate">Sign in to continue your onboarding.</p>

      <form onSubmit={onSubmit} className="mt-8 space-y-4">
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
        {error && <p className="text-sm text-red-600">{error}</p>}
        <div className="flex items-center justify-between text-sm">
          <Link href="/forgot-password" className="text-teal hover:underline">
            Forgot password?
          </Link>
        </div>
        <Button type="submit" className="w-full" loading={loading}>
          Sign in
        </Button>
      </form>
    </div>
  );
}
