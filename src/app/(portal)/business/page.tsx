import { getCurrentUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { BusinessForm } from '@/components/portal/BusinessForm';

export default async function BusinessPage() {
  const user = await getCurrentUser();
  const business = await prisma.business.findFirst({ where: { userId: user!.id } });
  if (!business) return null;

  return (
    <div>
      <h1>My Business</h1>
      <p className="lede">Keep your business profile up to date &mdash; SDM uses this to shape your strategy.</p>
      <BusinessForm business={business} />
    </div>
  );
}
