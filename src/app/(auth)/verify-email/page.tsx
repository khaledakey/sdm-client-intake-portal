'use client';

import { Suspense, useEffect, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/Button';

function VerifyEmailInner() {
  const params = useSearchParams();
  const token = params.get('token');
  const [status, setStatus] = useState<'checking' | 'ok' | 'error'>('checking');
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (!token) {
      setStatus('error');
      setMessage('Missing verification token.');
      return;
    }
    fetch('/api/auth/verify-email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token }),
    })
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok) throw new Error(data.error);
        setStatus('ok');
      })
      .catch((err) => {
        setStatus('error');
        setMessage(err.message || 'This link is invalid or has expired.');
      });
  }, [token]);

  return (
    <div>
      <h1>Email verification</h1>
      {status === 'checking' && <p className="lede">Verifying your email address&hellip;</p>}
      {status === 'ok' && (
        <div className="alert alert-success" style={{ marginTop: 12 }}>
          Your email has been verified. You&apos;re all set.
        </div>
      )}
      {status === 'error' && (
        <div className="alert alert-error" style={{ marginTop: 12 }}>
          {message}
        </div>
      )}
      <Link href="/dashboard">
        <Button style={{ marginTop: 24 }}>Go to dashboard</Button>
      </Link>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense>
      <VerifyEmailInner />
    </Suspense>
  );
}
