import { getCurrentUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { parseExtendedData } from '@/lib/progress';
import { Card, CardHeader } from '@/components/ui/Card';
import { IntakeWizard } from '@/components/portal/IntakeWizard';

export default async function IntakePage() {
  const user = await getCurrentUser();
  const business = await prisma.business.findFirst({ where: { userId: user!.id } });
  if (!business) return null;

  let intake = await prisma.clientIntake.findUnique({ where: { businessId: business.id } });
  if (!intake) intake = await prisma.clientIntake.create({ data: { businessId: business.id } });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-2xl font-semibold text-midnight">Marketing Intake</h1>
        <p className="mt-1 text-sm text-slate">
          Progress saves automatically as you go — come back anytime to finish up.
        </p>
      </div>
      <Card>
        <CardHeader title="Business Goals & Marketing Activity" />
        <IntakeWizard initial={{ ...intake, extendedData: parseExtendedData(intake.extendedData) }} />
      </Card>
    </div>
  );
}
