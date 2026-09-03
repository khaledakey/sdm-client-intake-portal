'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Input } from '@/components/ui/Field';
import { Button } from '@/components/ui/Button';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const res = await fetch('/api/auth/forgot-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) {
      setError(data.error || 'Something went wrong.');
      return;
    }
    setSent(true);
  }

  if (sent) {
    return (
      <div>
        <h1 className="font-heading text-2xl font-semibold text-midnight">Check your inbox</h1>
        <p className="mt-3 text-sm text-slate">
          If an account exists for <strong>{email}</strong>, we&apos;ve sent a link to reset your
          password. It expires in 1 hour.
        </p>
        <Link href="/login" className="mt-6 inline-block text-sm font-medium text-teal hover:underline">
          Back to sign in
        </Link>
      </div>
    );
  }

  return (
    <div>
      <h1 className="font-heading text-2xl font-semibold text-midnight">Reset your password</h1>
      <p className="mt-2 text-sm text-slate">
        Enter your account email and we&apos;ll send you a secure reset link.
      </p>
      <form onSubmit={onSubmit} className="mt-8 space-y-4">
        <Input label="Email address" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
        {error && <p className="text-sm text-red-600">{error}</p>}
        <Button type="submit" className="w-full" loading={loading}>
          Send reset link
        </Button>
      </form>
      <Link href="/login" className="mt-6 inline-block text-sm font-medium text-teal hover:underline">
        Back to sign in
      </Link>
    </div>
  );
}
