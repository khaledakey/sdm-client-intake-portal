import { getCurrentUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
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
    <div>
      <h1>Documents</h1>
      <p className="lede">Upload supporting materials and track what SDM still needs from you.</p>
      <DocumentCentre
        initialDocuments={JSON.parse(JSON.stringify(documents))}
        initialRequests={JSON.parse(JSON.stringify(requests))}
      />
    </div>
  );
}
