import { timingSafeEqual } from 'crypto';
import { NextResponse } from 'next/server';

/** Shared-secret auth for server-to-server API routes (src/app/api/users/*),
 * as opposed to the cookie-session auth in src/lib/rbac.ts used by
 * browser-facing routes. Callers send the secret as `X-API-Key`. */
export function requireApiKey(req: Request): NextResponse | null {
  const expected = process.env.PORTAL_API_KEY;
  if (!expected) {
    return NextResponse.json({ error: 'API key auth is not configured on this server.' }, { status: 503 });
  }

  const provided = req.headers.get('x-api-key') ?? '';
  const expectedBuf = Buffer.from(expected);
  const providedBuf = Buffer.from(provided);
  const valid = expectedBuf.length === providedBuf.length && timingSafeEqual(expectedBuf, providedBuf);

  if (!valid) {
    return NextResponse.json({ error: 'Invalid or missing API key.' }, { status: 401 });
  }
  return null;
}
