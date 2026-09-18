import { getCurrentUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { parseExtendedData } from '@/lib/progress';
import { IntakeWizard } from '@/components/portal/IntakeWizard';

export default async function IntakePage() {
  const user = await getCurrentUser();
  const business = await prisma.business.findFirst({ where: { userId: user!.id } });
  if (!business) return null;

  let intake = await prisma.clientIntake.findUnique({ where: { businessId: business.id } });
  if (!intake) intake = await prisma.clientIntake.create({ data: { businessId: business.id } });

  return (
    <div>
      <h1>Marketing Intake</h1>
      <p className="lede">Progress saves automatically as you go &mdash; come back anytime to finish up.</p>
      <IntakeWizard initial={{ ...intake, extendedData: parseExtendedData(intake.extendedData) }} />
    </div>
  );
}
