import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/rbac';
import { setActiveStatusSchema } from '@/lib/validation';
import { logActivity } from '@/lib/activity';

/** SDM_ADMIN-only: activate/deactivate a client's portal login. Like the
 * staff toggle (src/app/api/admin/team/[id]/route.ts), this never deletes
 * the business or its history — it flips the owning user's isActive flag,
 * which getCurrentUser() (src/lib/auth.ts) treats as signed out. */
export async function PATCH(req: Request, { params }: { params: { businessId: string } }) {
  const admin = await requireAdmin();
  if (admin instanceof NextResponse) return admin;

  const body = await req.json().catch(() => null);
  const parsed = setActiveStatusSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid input.' }, { status: 400 });
  }
  const { isActive } = parsed.data;

  const business = await prisma.business.findUnique({ where: { id: params.businessId }, include: { owner: true } });
  if (!business) return NextResponse.json({ error: 'Not found.' }, { status: 404 });

  await prisma.user.update({ where: { id: business.userId }, data: { isActive } });
  await logActivity({
    businessId: business.id,
    userId: admin.id,
    activityType: isActive ? 'CLIENT_ACCESS_REACTIVATED' : 'CLIENT_ACCESS_DEACTIVATED',
    description: `${admin.firstName} ${admin.lastName} ${isActive ? 're-enabled' : 'deactivated'} portal access for ${business.owner.firstName} ${business.owner.lastName}.`,
  });

  return NextResponse.json({ ok: true, isActive });
}
