'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Input, Select } from '@/components/ui/Field';
import { Button } from '@/components/ui/Button';

const ROLE_OPTIONS = [
  { value: 'SDM_TEAM_MEMBER', label: 'Team member' },
  { value: 'SDM_ADMIN', label: 'Admin' },
];

export function InviteTeamMemberForm() {
  const router = useRouter();
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('SDM_TEAM_MEMBER');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSuccess(null);
    const res = await fetch('/api/admin/team', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ firstName, lastName, email, role }),
    });
    const data = await res.json();
    setSaving(false);
    if (!res.ok) return setError(data.error || 'Something went wrong.');
    setFirstName('');
    setLastName('');
    setEmail('');
    setRole('SDM_TEAM_MEMBER');
    setSuccess(
      data.inviteEmail?.status === 'sent'
        ? `Invite sent — they'll get an email to set their password.`
        : `Account created, but the invite email failed to send. Share the set-password link with them directly.`
    );
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="grid gap-3 rounded-xl border border-dashed border-slate/20 p-4 sm:grid-cols-2">
      <Input label="First name" required value={firstName} onChange={(e) => setFirstName(e.target.value)} />
      <Input label="Last name" required value={lastName} onChange={(e) => setLastName(e.target.value)} />
      <Input label="Email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
      <Select label="Role" options={ROLE_OPTIONS} value={role} onChange={(e) => setRole(e.target.value)} />
      <div className="sm:col-span-2">
        {error && <p className="mb-2 text-sm text-red-600">{error}</p>}
        {success && <p className="mb-2 text-sm text-emerald-700">{success}</p>}
        <Button type="submit" size="sm" loading={saving}>
          Invite team member
        </Button>
      </div>
    </form>
  );
}
