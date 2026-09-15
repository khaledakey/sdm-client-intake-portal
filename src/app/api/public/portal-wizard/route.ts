import { NextResponse } from 'next/server';
import { randomUUID } from 'crypto';

/** Backs the branded /get-started wizard (src/components/public/PortalWizard.jsx).
 * Distinct from /api/public/lead-intake: this scenario (CRM-01) expects its
 * own flat, human-readable snake_case shape, not the envelope the rest of
 * the app's integration events use.
 *
 * Field names and value codes below are verified against the live Make
 * scenario's webhook trigger ("Integration Webhooks, Notion", id 7322391) —
 * every `{{1.<name>}}` reference the scenario's blueprint actually uses.
 * Don't rename/re-derive these independently; check the blueprint first. */

const REQUIRED_STRING_FIELDS = [
  'firstName',
  'lastName',
  'email',
  'phone',
  'role',
  'contactMethod',
  'businessName',
  'location',
  'stage',
  'teamSize',
  'description',
  'current',
  'outcome',
  'challenge',
  'budget',
  'timeline',
  'source',
] as const;

// The Make scenario's "Preferred Contact"/"Received At" switches expect the
// raw lowercase codes below verbatim and do their own display-label
// translation — do NOT pre-translate contact_preference or timeline here,
// or the switch falls through to its default case and silently records the
// wrong value (this previously mis-recorded every non-"exploring" timeline
// and every non-"Email" contact preference).
const TIMELINE_CODES: Record<string, string> = {
  now: 'immediately',
  '30-60': '30-60 days',
  exploring: 'exploring',
};

// "Budget Band" in Notion is rich_text with no Make-side translation, so a
// human-readable label (rather than the wizard's internal code) is fine —
// and better for anyone reading the CRM record directly.
const BUDGET_LABELS: Record<string, string> = {
  '<500': 'Under €500',
  '500-1000': '€500 – €1,000',
  '1000-2500': '€1,000 – €2,500',
  '2500+': '€2,500+',
};

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

function str(body: Record<string, unknown>, key: string) {
  const v = body[key];
  return typeof v === 'string' ? v.trim() : '';
}

export async function POST(request: Request) {
  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const missing = REQUIRED_STRING_FIELDS.filter((key) => !str(body, key));
  if (!body.consent) missing.push('consent' as (typeof REQUIRED_STRING_FIELDS)[number]);
  if (missing.length) {
    return NextResponse.json({ error: 'Missing required fields', fields: missing }, { status: 400 });
  }

  const email = str(body, 'email').toLowerCase();
  if (!EMAIL_RE.test(email)) {
    return NextResponse.json({ error: 'Invalid email' }, { status: 400 });
  }

  const phoneDigits = str(body, 'phone').replace(/\D/g, '');
  if (phoneDigits.length < 7) {
    return NextResponse.json({ error: 'Invalid phone number' }, { status: 400 });
  }

  const submissionId = randomUUID();
  const timestamp = new Date().toISOString();
  const reference = `SDM-${new Date().getFullYear()}-${submissionId.slice(0, 4).toUpperCase()}`;

  const contactMethod = str(body, 'contactMethod');
  const stage = str(body, 'stage');
  const budget = str(body, 'budget');
  const timeline = str(body, 'timeline');

  const payload = {
    event_type: 'client.registered',
    submission_id: submissionId,
    timestamp,
    form_version: 'intake-v1',
    first_name: str(body, 'firstName'),
    last_name: str(body, 'lastName'),
    email,
    phone: str(body, 'phone'),
    role: str(body, 'role'),
    company_name: str(body, 'businessName'),
    location: str(body, 'location'),
    website: str(body, 'website'),
    business_description: str(body, 'description'),
    business_stage: stage,
    team_size: str(body, 'teamSize'),
    desired_outcome: str(body, 'outcome'),
    marketing_challenge: str(body, 'challenge'),
    current_marketing: str(body, 'current'),
    budget_range: BUDGET_LABELS[budget] ?? budget,
    timeline: TIMELINE_CODES[timeline] ?? timeline,
    contact_preference: contactMethod,
    source: str(body, 'source'),
    privacy_consent: Boolean(body.consent),
    marketing_opt_in: Boolean(body.optin),
  };

  const webhookUrl =
    process.env.PORTAL_WIZARD_WEBHOOK_URL || 'https://hook.eu1.make.com/jr5eedmxjodv2pfo66ixdtxbgpwx1ll6';

  try {
    const res = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      return NextResponse.json({ error: 'Webhook rejected submission' }, { status: 502 });
    }
  } catch {
    return NextResponse.json({ error: 'Failed to reach webhook' }, { status: 502 });
  }

  return NextResponse.json({ reference });
}
