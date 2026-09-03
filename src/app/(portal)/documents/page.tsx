import { getCurrentUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { Card, CardHeader } from '@/components/ui/Card';
import { DocumentCentre } from '@/components/portal/DocumentCentre';

export default async function DocumentsPage() {
  const user = await getCurrentUser();
  const business = await prisma.business.findFirst({ where: { userId: user!.id } });
  if (!business) return null;

  const [documents, requests] = await Promise.all([
    prisma.document.findMany({
      where: { businessId: business.id },
      orderBy: { uploadDate: 'desc' },
      include: { uploadedBy: { select: { firstName: true, lastName: true } } },
    }),
    prisma.documentRequest.findMany({ where: { businessId: business.id }, orderBy: { createdAt: 'asc' } }),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-2xl font-semibold text-midnight">Documents</h1>
        <p className="mt-1 text-sm text-slate">
          Upload supporting materials and track what SDM still needs from you.
        </p>
      </div>
      <Card>
        <CardHeader title="Document Upload Centre" />
        <DocumentCentre
          initialDocuments={JSON.parse(JSON.stringify(documents))}
          initialRequests={JSON.parse(JSON.stringify(requests))}
        />
      </Card>
    </div>
  );
}
