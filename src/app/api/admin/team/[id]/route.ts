import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/rbac';
import { setActiveStatusSchema } from '@/lib/validation';
import { assertCanDeactivateStaff } from '@/lib/team';

/** SDM_ADMIN-only: activate/deactivate a staff login. Deactivating never
 * deletes the account — it just makes getCurrentUser() treat it as signed
 * out (see src/lib/auth.ts), so history (tickets, documents reviewed,
 * activity log) stays intact and reactivating restores access instantly. */
export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const admin = await requireAdmin();
  if (admin instanceof NextResponse) return admin;

  const body = await req.json().catch(() => null);
  const parsed = setActiveStatusSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid input.' }, { status: 400 });
  }
  const { isActive } = parsed.data;

  const target = await prisma.user.findUnique({ where: { id: params.id } });
  if (!target || (target.role !== 'SDM_ADMIN' && target.role !== 'SDM_TEAM_MEMBER')) {
    return NextResponse.json({ error: 'Not found.' }, { status: 404 });
  }

  if (!isActive) {
    const activeAdminCount = await prisma.user.count({ where: { role: 'SDM_ADMIN', isActive: true } });
    const error = assertCanDeactivateStaff(target, admin.id, activeAdminCount);
    if (error) return NextResponse.json({ error }, { status: 400 });
  }

  const updated = await prisma.user.update({
    where: { id: target.id },
    data: { isActive },
    select: { id: true, firstName: true, lastName: true, email: true, role: true, isActive: true },
  });
  return NextResponse.json({ user: updated });
}
