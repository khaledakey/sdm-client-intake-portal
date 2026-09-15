import { NextResponse } from 'next/server';
import { randomUUID } from 'crypto';

/** Backs the branded /get-started wizard (src/components/public/PortalWizard.jsx).
 * Distinct from /api/public/lead-intake: this scenario (CRM-01) expects its
 * own flat, human-readable snake_case shape, not the envelope the rest of
 * the app's integration events use. */

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

const CONTACT_METHOD_LABELS: Record<string, string> = {
  email: 'Email',
  phone: 'Phone',
  either: 'Either',
};

const STAGE_LABELS: Record<string, string> = {
  startup: 'Startup',
  established: 'Established',
  scaling: 'Scaling',
};

const BUDGET_LABELS: Record<string, string> = {
  '<500': 'Under €500',
  '500-1000': '€500 – €1,000',
  '1000-2500': '€1,000 – €2,500',
  '2500+': '€2,500+',
};

const TIMELINE_LABELS: Record<string, string> = {
  now: 'Immediately',
  '30-60': 'In the next 30–60 days',
  exploring: 'Just exploring for now',
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
    first_name: str(body, 'firstName'),
    last_name: str(body, 'lastName'),
    work_email: email,
    mobile_or_phone: str(body, 'phone'),
    your_role_in_the_business: str(body, 'role'),
    preferred_contact_method: CONTACT_METHOD_LABELS[contactMethod] ?? contactMethod,
    business_name: str(body, 'businessName'),
    town_or_county: str(body, 'location'),
    stage_of_the_business: STAGE_LABELS[stage] ?? stage,
    team_size: str(body, 'teamSize'),
    website_or_main_social_link: str(body, 'website'),
    what_does_the_business_do: str(body, 'description'),
    what_marketing_are_you_doing_today: str(body, 'current'),
    which_outcome_matters_most_right_now: str(body, 'outcome'),
    biggest_marketing_challenge_you_want_help_with: str(body, 'challenge'),
    approximate_monthly_budget: BUDGET_LABELS[budget] ?? budget,
    when_would_you_like_to_act: TIMELINE_LABELS[timeline] ?? timeline,
    how_did_you_hear_about_us: str(body, 'source'),
    agree_to_privacy: Boolean(body.consent),
    marketing_consent: Boolean(body.optin),
    submission_id: submissionId,
    timestamp,
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
