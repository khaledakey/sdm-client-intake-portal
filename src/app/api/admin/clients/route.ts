import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireStaff } from '@/lib/rbac';

export async function GET() {
  const staff = await requireStaff();
  if (staff instanceof NextResponse) return staff;

  const businesses = await prisma.business.findMany({
    orderBy: { createdAt: 'desc' },
    include: {
      owner: { select: { firstName: true, lastName: true, email: true, phone: true, lastLogin: true } },
      intake: true,
      _count: { select: { documents: true, supportTickets: true } },
    },
  });

  return NextResponse.json({ businesses });
}
