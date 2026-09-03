'use client';

import { Suspense, useState } from 'react';
import Link from 'next/link';
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
    return <p className="text-sm text-red-600">Missing reset token. Please use the link from your email.</p>;
  }

  if (done) {
    return (
      <div>
        <h1 className="font-heading text-2xl font-semibold text-midnight">Password updated</h1>
        <p className="mt-3 text-sm text-slate">Redirecting you to sign in&hellip;</p>
      </div>
    );
  }

  return (
    <div>
      <h1 className="font-heading text-2xl font-semibold text-midnight">Set a new password</h1>
      <form onSubmit={onSubmit} className="mt-8 space-y-4">
        <Input
          label="New password"
          type="password"
          required
          hint="At least 10 characters, with an uppercase letter and a number."
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        {error && <p className="text-sm text-red-600">{error}</p>}
        <Button type="submit" className="w-full" loading={loading}>
          Update password
        </Button>
      </form>
      <Link href="/login" className="mt-6 inline-block text-sm font-medium text-teal hover:underline">
        Back to sign in
      </Link>
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
