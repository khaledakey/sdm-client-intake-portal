import { NextResponse } from 'next/server';

/** Self-serve public registration is retired — access is invite-only (see
 * /reset-password, provisioned via POST /api/users). Confirmed nothing
 * other than the old /register page called this: no other route in this
 * repo, the marketing site repo, or the get-started wizard references it,
 * and the wizard's own /api/public/portal-wizard route fires its own
 * "client.registered" integration event independently of this one. Kept
 * as a route (rather than deleted) so a stray caller gets an explicit,
 * permanent 410 instead of a generic 404. */
export async function POST() {
  return NextResponse.json({ error: 'Public registration is no longer available.' }, { status: 410 });
}
