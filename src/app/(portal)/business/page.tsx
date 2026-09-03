import { getCurrentUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { Card, CardHeader } from '@/components/ui/Card';
import { BusinessForm } from '@/components/portal/BusinessForm';

export default async function BusinessPage() {
  const user = await getCurrentUser();
  const business = await prisma.business.findFirst({ where: { userId: user!.id } });
  if (!business) return null;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-2xl font-semibold text-midnight">My Business</h1>
        <p className="mt-1 text-sm text-slate">
          Keep your business profile up to date — SDM uses this to shape your strategy.
        </p>
      </div>
      <Card>
        <CardHeader title="Business Details" description="Section A of your intake." />
        <BusinessForm business={business} />
      </Card>
    </div>
  );
}
