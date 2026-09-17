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
        <div className="alert alert-success" style={{ marginBottom: 22 }}>
          If an account exists for <strong>{email}</strong>, a reset link is on its way. It expires
          in 1 hour.
        </div>
        <div className="auth-link-row">
          &larr; <Link href="/login">Back to sign in</Link>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="eyebrow">Client Portal</div>
      <h1>Reset your password</h1>
      <p className="lede">Enter your email and we&rsquo;ll send a link to reset it.</p>
      <form onSubmit={onSubmit}>
        <Input label="Email address" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
        {error && (
          <div className="alert alert-error" style={{ marginBottom: 18 }}>
            {error}
          </div>
        )}
        <Button type="submit" loading={loading} style={{ width: '100%', justifyContent: 'center' }}>
          Send reset link
        </Button>
      </form>
      <div className="auth-link-row">
        &larr; <Link href="/login">Back to sign in</Link>
      </div>
    </div>
  );
}
