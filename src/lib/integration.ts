import { randomUUID } from 'crypto';

/**
 * Downstream integration dispatch (Build Brief §15).
 *
 * Client Portal → Application Database → Make Automation → SDM CRM/Notion
 *
 * Every structured event carries the client/business/submission ids,
 * a form/version tag, and a timestamp so the automation layer can sync
 * into the CRM without ever needing to guess identity or ordering, and
 * without this app overwriting raw source data. When
 * INTEGRATION_WEBHOOK_URL isn't configured (default), this is a no-op —
 * the event is still preserved via the Activity Log at the call site.
 */
export type IntegrationEventType =
  | 'client.registered'
  | 'business.updated'
  | 'intake.updated'
  | 'intake.submitted'
  | 'document.uploaded'
  | 'document.reviewed'
  | 'ticket.created'
  | 'ticket.message'
  | 'onboarding.stage_changed';

export async function dispatchIntegrationEvent(
  type: IntegrationEventType,
  payload: Record<string, unknown>
) {
  const url = process.env.INTEGRATION_WEBHOOK_URL;
  if (!url) return;

  const envelope = {
    eventId: randomUUID(),
    type,
    formVersion: '1.0',
    occurredAt: new Date().toISOString(),
    payload,
  };

  try {
    await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(process.env.INTEGRATION_WEBHOOK_SECRET
          ? { 'X-Webhook-Secret': process.env.INTEGRATION_WEBHOOK_SECRET }
          : {}),
      },
      body: JSON.stringify(envelope),
    });
  } catch (err) {
    console.error(`[integration] failed to dispatch ${type}`, err);
  }
}
