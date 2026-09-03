import { NextResponse } from 'next/server';
import { getCurrentUser, isStaff } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import type { User } from '@prisma/client';

export function unauthorized() {
  return NextResponse.json({ error: 'Not authenticated.' }, { status: 401 });
}

export function forbidden() {
  return NextResponse.json({ error: 'You do not have access to this resource.' }, { status: 403 });
}

/** Resolves the current user, or returns a 401 response to short-circuit
 * the route handler. Usage: `const user = await requireUser(); if (user instanceof NextResponse) return user;` */
export async function requireUser(): Promise<User | NextResponse> {
  const user = await getCurrentUser();
  if (!user) return unauthorized();
  return user;
}

export async function requireStaff(): Promise<User | NextResponse> {
  const user = await requireUser();
  if (user instanceof NextResponse) return user;
  if (!isStaff(user.role)) return forbidden();
  return user;
}

/** Resolves the business owned by the current user (clients only have
 * exactly one). Staff never "own" a business through this helper. */
export async function requireOwnBusiness() {
  const user = await requireUser();
  if (user instanceof NextResponse) return user;
  const business = await prisma.business.findFirst({ where: { userId: user.id } });
  if (!business) {
    return NextResponse.json({ error: 'No business profile found for this account.' }, { status: 404 });
  }
  return { user, business };
}

/** Ensures the current user may access the given businessId: either they
 * own it (client) or they are SDM staff (admin/team member). */
export async function requireBusinessAccess(businessId: string) {
  const user = await requireUser();
  if (user instanceof NextResponse) return user;
  if (isStaff(user.role)) {
    const business = await prisma.business.findUnique({ where: { id: businessId } });
    if (!business) return NextResponse.json({ error: 'Not found.' }, { status: 404 });
    return { user, business };
  }
  const business = await prisma.business.findFirst({ where: { id: businessId, userId: user.id } });
  if (!business) return forbidden();
  return { user, business };
}
