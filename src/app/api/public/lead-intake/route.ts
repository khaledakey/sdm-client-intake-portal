import { NextResponse } from 'next/server';
import { randomUUID } from 'crypto';
import { leadIntakeSchema, buildLeadWebhookPayload } from '@/lib/leadIntake';

const WEBHOOK_URL =
  process.env.LEAD_INTAKE_WEBHOOK_URL || 'https://hook.eu1.make.com/jr5eedmxjodv2pfo66ixdtxbgpwx1ll6';

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  if (!body || typeof body !== 'object') {
    return NextResponse.json({ error: 'Invalid request.' }, { status: 400 });
  }

  // Honeypot: real users never see or fill this field. A bot that does gets
  // a fake success so it doesn't retry, but nothing is sent to the webhook.
  if (typeof (body as Record<string, unknown>).hp === 'string' && (body as Record<string, unknown>).hp) {
    return NextResponse.json({ ok: true, submissionId: randomUUID() });
  }

  const parsed = leadIntakeSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? 'Please check the form and try again.' },
      { status: 400 }
    );
  }

  const submissionId = randomUUID();
  const timestamp = new Date().toISOString();
  const payload = buildLeadWebhookPayload(parsed.data, submissionId, timestamp);

  try {
    const res = await fetch(WEBHOOK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      console.error(`[lead-intake] webhook responded ${res.status}`);
      return NextResponse.json(
        { error: 'Something went wrong submitting your details. Please try again.' },
        { status: 502 }
      );
    }
  } catch (err) {
    console.error('[lead-intake] failed to reach webhook', err);
    return NextResponse.json(
      { error: 'Something went wrong submitting your details. Please try again.' },
      { status: 502 }
    );
  }

  return NextResponse.json({ ok: true, submissionId });
}
