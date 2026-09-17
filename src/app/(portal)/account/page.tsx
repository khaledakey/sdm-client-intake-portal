import { getCurrentUser } from '@/lib/auth';
import { Badge } from '@/components/ui/Badge';
import { ProfileForm, PasswordForm, ResendVerificationButton } from '@/components/portal/AccountForms';
import { formatDate } from '@/lib/format';

export default async function AccountPage() {
  const user = await getCurrentUser();
  if (!user) return null;

  return (
    <div>
      <h1>Account Settings</h1>
      <p className="lede">Manage your login details and profile.</p>

      <div className="card card-pad">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
          <div>
            <div className="section-title" style={{ margin: 0 }}>Email address</div>
            <div style={{ marginTop: 10 }}>{user.email}</div>
            <div className="mono" style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>
              Account created {formatDate(user.createdAt)}
            </div>
          </div>
          {user.emailVerifiedAt ? <Badge tone="emerald">Verified</Badge> : <Badge tone="gold">Unverified</Badge>}
        </div>
        {!user.emailVerifiedAt && (
          <div style={{ marginTop: 16 }}>
            <ResendVerificationButton />
          </div>
        )}
      </div>

      <ProfileForm firstName={user.firstName} lastName={user.lastName} phone={user.phone || ''} />

      <PasswordForm />
    </div>
  );
}
