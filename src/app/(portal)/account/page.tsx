import { getCurrentUser } from '@/lib/auth';
import { Card, CardHeader } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { ProfileForm, PasswordForm, ResendVerificationButton } from '@/components/portal/AccountForms';
import { formatDate } from '@/lib/format';

export default async function AccountPage() {
  const user = await getCurrentUser();
  if (!user) return null;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-2xl font-semibold text-midnight">Account Settings</h1>
        <p className="mt-1 text-sm text-slate">Manage your login details and profile.</p>
      </div>

      <Card>
        <CardHeader
          title="Email address"
          action={user.emailVerifiedAt ? <Badge tone="emerald">Verified</Badge> : <Badge tone="gold">Unverified</Badge>}
        />
        <p className="text-sm text-midnight">{user.email}</p>
        <p className="mt-1 text-xs text-mist">Account created {formatDate(user.createdAt)}</p>
        {!user.emailVerifiedAt && (
          <div className="mt-4">
            <ResendVerificationButton />
          </div>
        )}
      </Card>

      <Card>
        <CardHeader title="Profile" />
        <ProfileForm firstName={user.firstName} lastName={user.lastName} phone={user.phone || ''} />
      </Card>

      <Card>
        <CardHeader title="Password" description="Choose a strong, unique password." />
        <PasswordForm />
      </Card>
    </div>
  );
}
