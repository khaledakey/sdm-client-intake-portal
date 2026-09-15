import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireApiKey } from '@/lib/apiAuth';

/** Server-to-server existence check (X-API-Key auth — see src/lib/apiAuth.ts).
 * Returns 200 with `exists: false` rather than 404 for a not-found email —
 * this is a query an automation branches on, not an error case. */
export async function GET(req: Request, { params }: { params: { email: string } }) {
  const authError = requireApiKey(req);
  if (authError) return authError;

  let email: string;
  try {
    email = decodeURIComponent(params.email).trim().toLowerCase();
  } catch {
    return NextResponse.json({ error: 'Invalid email in URL.' }, { status: 400 });
  }

  const user = await prisma.user.findUnique({
    where: { email },
    select: { id: true, firstName: true, lastName: true, role: true, createdAt: true, emailVerifiedAt: true },
  });

  if (!user) {
    return NextResponse.json({ exists: false });
  }
  return NextResponse.json({ exists: true, ...user });
}
