import { redirect } from 'next/navigation';
import { getCurrentUser, isStaff } from '@/lib/auth';
import { AdminShell } from '@/components/admin/AdminShell';

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();
  if (!user) redirect('/login');
  if (!isStaff(user.role)) redirect('/dashboard');

  return (
    <AdminShell name={`${user.firstName} ${user.lastName}`} role={user.role}>
      {children}
    </AdminShell>
  );
}
