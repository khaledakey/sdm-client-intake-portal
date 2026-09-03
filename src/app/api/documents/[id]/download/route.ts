import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireBusinessAccess } from '@/lib/rbac';
import { readStoredFile } from '@/lib/storage';

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const document = await prisma.document.findUnique({ where: { id: params.id } });
  if (!document) return NextResponse.json({ error: 'Document not found.' }, { status: 404 });

  const ctx = await requireBusinessAccess(document.businessId);
  if (ctx instanceof NextResponse) return ctx;

  const buffer = await readStoredFile(document.storageReference).catch(() => null);
  if (!buffer) return NextResponse.json({ error: 'File is no longer available.' }, { status: 404 });

  return new NextResponse(buffer, {
    headers: {
      'Content-Type': document.mimeType || 'application/octet-stream',
      'Content-Disposition': `attachment; filename="${document.fileName.replace(/"/g, '')}"`,
    },
  });
}
