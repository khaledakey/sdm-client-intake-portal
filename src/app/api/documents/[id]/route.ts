import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireOwnBusiness } from '@/lib/rbac';
import { deleteStoredFile } from '@/lib/storage';
import { recalcProgress } from '@/lib/progress';

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  const ctx = await requireOwnBusiness();
  if (ctx instanceof NextResponse) return ctx;
  const { business } = ctx;

  const document = await prisma.document.findFirst({ where: { id: params.id, businessId: business.id } });
  if (!document) return NextResponse.json({ error: 'Document not found.' }, { status: 404 });
  if (document.reviewStatus === 'APPROVED') {
    return NextResponse.json({ error: 'Approved documents cannot be removed. Contact SDM if this needs to change.' }, { status: 400 });
  }

  await prisma.document.delete({ where: { id: document.id } });
  if (document.fulfillsRequestId) {
    await prisma.documentRequest.update({ where: { id: document.fulfillsRequestId }, data: { status: 'OPEN' } });
  }
  await deleteStoredFile(document.storageReference).catch(() => {});
  await recalcProgress(business.id);

  return NextResponse.json({ ok: true });
}
