import { NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { requireStaff } from '@/lib/rbac';
import { recalcProgress } from '@/lib/progress';
import { logActivity } from '@/lib/activity';

const schema = z.object({
  label: z.string().trim().min(1).max(150),
  documentType: z.enum([
    'BRAND_GUIDELINES',
    'LOGOS',
    'BRAND_ASSETS',
    'MARKETING_STRATEGY',
    'CAMPAIGN_REPORTS',
    'WEBSITE_DOCUMENTS',
    'PRODUCT_INFO',
    'COMPETITOR_RESEARCH',
    'OTHER',
  ]),
  required: z.boolean().default(true),
  note: z.string().trim().max(500).optional().nullable(),
});

export async function POST(req: Request, { params }: { params: { businessId: string } }) {
  const staff = await requireStaff();
  if (staff instanceof NextResponse) return staff;

  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? 'Invalid input.' }, { status: 400 });
  }

  const request = await prisma.documentRequest.create({
    data: { businessId: params.businessId, requestedById: staff.id, ...parsed.data },
  });

  await recalcProgress(params.businessId);
  await logActivity({
    businessId: params.businessId,
    userId: staff.id,
    activityType: 'DOCUMENT_REQUESTED',
    description: `SDM requested a document: "${parsed.data.label}".`,
  });

  return NextResponse.json({ request });
}
