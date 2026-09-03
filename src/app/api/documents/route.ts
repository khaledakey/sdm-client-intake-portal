import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireOwnBusiness } from '@/lib/rbac';
import { saveFile, isExtensionAllowed, MAX_UPLOAD_BYTES } from '@/lib/storage';
import { recalcProgress } from '@/lib/progress';
import { logActivity } from '@/lib/activity';
import { dispatchIntegrationEvent } from '@/lib/integration';
import type { DocumentCategory } from '@/lib/enums';

const VALID_CATEGORIES = new Set<DocumentCategory>([
  'BRAND_GUIDELINES',
  'LOGOS',
  'BRAND_ASSETS',
  'MARKETING_STRATEGY',
  'CAMPAIGN_REPORTS',
  'WEBSITE_DOCUMENTS',
  'PRODUCT_INFO',
  'COMPETITOR_RESEARCH',
  'OTHER',
]);

export async function GET() {
  const ctx = await requireOwnBusiness();
  if (ctx instanceof NextResponse) return ctx;

  const [documents, requests] = await Promise.all([
    prisma.document.findMany({
      where: { businessId: ctx.business.id },
      orderBy: { uploadDate: 'desc' },
      include: { uploadedBy: { select: { firstName: true, lastName: true } } },
    }),
    prisma.documentRequest.findMany({
      where: { businessId: ctx.business.id },
      orderBy: { createdAt: 'asc' },
    }),
  ]);

  return NextResponse.json({ documents, requests });
}

export async function POST(req: Request) {
  const ctx = await requireOwnBusiness();
  if (ctx instanceof NextResponse) return ctx;
  const { user, business } = ctx;

  const form = await req.formData().catch(() => null);
  const file = form?.get('file');
  const documentTypeRaw = String(form?.get('documentType') || 'OTHER');
  const fulfillsRequestId = form?.get('fulfillsRequestId') ? String(form.get('fulfillsRequestId')) : null;

  if (!file || !(file instanceof File)) {
    return NextResponse.json({ error: 'No file was provided.' }, { status: 400 });
  }
  if (!isExtensionAllowed(file.name)) {
    return NextResponse.json({ error: 'That file type is not supported.' }, { status: 400 });
  }
  if (file.size > MAX_UPLOAD_BYTES) {
    return NextResponse.json({ error: 'File is too large (20MB max).' }, { status: 400 });
  }
  const documentType = VALID_CATEGORIES.has(documentTypeRaw as DocumentCategory)
    ? (documentTypeRaw as DocumentCategory)
    : 'OTHER';

  if (fulfillsRequestId) {
    const request = await prisma.documentRequest.findFirst({
      where: { id: fulfillsRequestId, businessId: business.id, status: 'OPEN' },
    });
    if (!request) {
      return NextResponse.json({ error: 'That document request could not be found.' }, { status: 400 });
    }
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const storageReference = await saveFile(business.id, file.name, buffer);

  const document = await prisma.document.create({
    data: {
      businessId: business.id,
      fileName: file.name,
      documentType,
      storageReference,
      fileSize: file.size,
      mimeType: file.type || null,
      uploadedById: user.id,
      fulfillsRequestId: fulfillsRequestId || undefined,
    },
  });

  if (fulfillsRequestId) {
    await prisma.documentRequest.update({ where: { id: fulfillsRequestId }, data: { status: 'FULFILLED' } });
  }

  await recalcProgress(business.id);
  await logActivity({
    businessId: business.id,
    userId: user.id,
    activityType: 'DOCUMENT_UPLOADED',
    description: `Uploaded "${file.name}".`,
  });
  await dispatchIntegrationEvent('document.uploaded', {
    businessId: business.id,
    documentId: document.id,
    fileName: file.name,
    documentType,
  });

  return NextResponse.json({ document });
}
