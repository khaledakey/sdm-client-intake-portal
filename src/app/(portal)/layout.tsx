import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { PortalShell } from '@/components/portal/PortalShell';
import { getOutstandingActions } from '@/lib/actions';

export default async function PortalLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();
  if (!user) redirect('/login');
  if (user.role !== 'CLIENT') redirect('/admin');

  const business = await prisma.business.findFirst({ where: { userId: user.id } });
  if (!business) redirect('/login');

  const actions = await getOutstandingActions(business.id, user.id);

  return (
    <PortalShell businessName={business.businessName} firstName={user.firstName} actionCount={actions.length}>
      {children}
    </PortalShell>
  );
}
