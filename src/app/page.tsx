import { redirect } from 'next/navigation';
import { getCurrentUser, isStaff } from '@/lib/auth';

export default async function RootPage() {
  const user = await getCurrentUser();
  if (!user) redirect('/login');
  redirect(isStaff(user.role) ? '/admin' : '/dashboard');
}
