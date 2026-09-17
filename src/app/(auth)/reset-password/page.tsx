'use client';

import { Suspense, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Input } from '@/components/ui/Field';
import { Button } from '@/components/ui/Button';

function ResetPasswordForm() {
  const router = useRouter();
  const params = useSearchParams();
  const token = params.get('token') || '';
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const res = await fetch('/api/auth/reset-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token, password }),
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) {
      setError(data.error || 'Something went wrong.');
      return;
    }
    setDone(true);
    setTimeout(() => router.push('/login'), 2000);
  }

  if (!token) {
    return (
      <div>
        <h1>Missing reset token</h1>
        <p className="lede">Please use the link from your email.</p>
      </div>
    );
  }

  if (done) {
    return (
      <div>
        <h1>Password updated</h1>
        <p className="lede">Redirecting you to sign in&hellip;</p>
      </div>
    );
  }

  return (
    <div>
      <div className="eyebrow">Set up your account</div>
      <h1>Set a new password</h1>
      <form onSubmit={onSubmit}>
        <Input
          label="New password"
          type="password"
          required
          hint="At least 10 characters, with an uppercase letter and a number."
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        {error && (
          <div className="alert alert-error" style={{ marginBottom: 18 }}>
            {error}
          </div>
        )}
        <Button type="submit" loading={loading} style={{ width: '100%', justifyContent: 'center' }}>
          Update password
        </Button>
      </form>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense>
      <ResetPasswordForm />
    </Suspense>
  );
}
