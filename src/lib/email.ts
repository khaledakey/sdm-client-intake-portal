/**
 * Configurable email provider (Build Brief §8: "The email integration must
 * be configurable rather than hard-coded so it can connect with the final
 * SDM email and automation workflow.")
 *
 * EMAIL_PROVIDER env var selects the transport:
 *   - "console" (default): logs the message. Local dev only — see the
 *     production guard below.
 *   - "smtp": sends via nodemailer using SMTP_* env vars. Not usable on
 *     Railway Hobby/Trial (outbound SMTP is blocked there).
 *   - "webhook": POSTs a JSON payload to EMAIL_WEBHOOK_URL — point this at
 *     a Make.com scenario or Hostinger automation that owns real delivery.
 *   - "resend": sends via the Resend HTTPS API (RESEND_API_KEY). This is
 *     the production transport.
 */

export type EmailResult = { status: 'sent'; messageId?: string } | { status: 'failed'; error: string };

interface EmailMessage {
  to: string;
  subject: string;
  html: string;
  text: string;
  replyTo?: string;
}

function isProd() {
  return process.env.NODE_ENV === 'production';
}

// Only ever fires once per process, so a misconfigured deploy gets one loud
// line instead of flooding logs on every request.
let warnedMisconfigured = false;
function warnProductionMisconfig(reason: string) {
  if (warnedMisconfigured) return;
  warnedMisconfigured = true;
  console.error(
    `[email] PRODUCTION MISCONFIGURATION: ${reason}. No real email will be sent until this is fixed.`
  );
}

/** Local-dev transport. In production this never sends a real email — it
 * exists only so the app doesn't crash if EMAIL_PROVIDER is left unset —
 * and it must never print a reset/verification/set-password token or URL. */
async function sendViaConsole(message: EmailMessage): Promise<EmailResult> {
  if (isProd()) {
    warnProductionMisconfig('EMAIL_PROVIDER is "console" (or unset)');
    // eslint-disable-next-line no-console
    console.error(`[email:console] To: ${message.to}\nSubject: ${message.subject}\n(body redacted in production)`);
    return { status: 'failed', error: 'Email provider is not configured for production (EMAIL_PROVIDER=console).' };
  }
  // eslint-disable-next-line no-console
  console.log(`\n[email:console] To: ${message.to}\nSubject: ${message.subject}\n${message.text}\n`);
  return { status: 'sent' };
}

async function sendViaSmtp(message: EmailMessage): Promise<EmailResult> {
  const nodemailer = await import('nodemailer');
  const transport = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT || 587),
    secure: Number(process.env.SMTP_PORT) === 465,
    auth: process.env.SMTP_USER
      ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASSWORD }
      : undefined,
  });
  await transport.sendMail({
    from: process.env.SMTP_FROM || 'SDM Client Portal <no-reply@saoirsedigital.com>',
    to: message.to,
    subject: message.subject,
    html: message.html,
    text: message.text,
    replyTo: message.replyTo,
  });
  return { status: 'sent' };
}

async function sendViaWebhook(message: EmailMessage): Promise<EmailResult> {
  const url = process.env.EMAIL_WEBHOOK_URL;
  if (!url) {
    warnProductionMisconfig('EMAIL_PROVIDER is "webhook" but EMAIL_WEBHOOK_URL is not set');
    if (isProd()) {
      return { status: 'failed', error: 'Email provider is not configured (missing EMAIL_WEBHOOK_URL).' };
    }
    return sendViaConsole(message);
  }
  await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(process.env.EMAIL_WEBHOOK_SECRET
        ? { 'X-Webhook-Secret': process.env.EMAIL_WEBHOOK_SECRET }
        : {}),
    },
    body: JSON.stringify(message),
  });
  return { status: 'sent' };
}

const RESEND_TIMEOUT_MS = 10_000;

/** Production transport: Resend's HTTPS API via plain fetch (see PR
 * description for why fetch was chosen over the `resend` package). */
async function sendViaResend(message: EmailMessage): Promise<EmailResult> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    warnProductionMisconfig('EMAIL_PROVIDER is "resend" but RESEND_API_KEY is not set');
    return { status: 'failed', error: 'Email provider is not configured (missing RESEND_API_KEY).' };
  }

  const from = process.env.EMAIL_FROM || 'Saoirse Digital Marketing <info@saoirsedigital.com>';
  const replyTo = message.replyTo || process.env.EMAIL_REPLY_TO || process.env.SDM_SUPPORT_INBOX || undefined;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), RESEND_TIMEOUT_MS);
  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from,
        to: message.to,
        subject: message.subject,
        html: message.html,
        text: message.text,
        ...(replyTo ? { reply_to: replyTo } : {}),
      }),
      signal: controller.signal,
    });

    const data = await res.json().catch(() => null);

    if (!res.ok) {
      const error =
        (data && typeof data === 'object' && 'message' in data && String((data as { message: unknown }).message)) ||
        `Resend API returned ${res.status}`;
      console.error(`[email:resend] failed to send to ${message.to}: ${res.status} ${error}`);
      return { status: 'failed', error };
    }

    const messageId = data && typeof data === 'object' && 'id' in data ? String((data as { id: unknown }).id) : undefined;
    // eslint-disable-next-line no-console
    console.log(`[email:resend] sent to ${message.to} messageId=${messageId ?? 'unknown'}`);
    return { status: 'sent', messageId };
  } catch (err) {
    const timedOut = err instanceof Error && err.name === 'AbortError';
    const error = timedOut
      ? `Timed out contacting Resend after ${RESEND_TIMEOUT_MS / 1000}s.`
      : err instanceof Error
        ? err.message
        : 'Unknown error contacting Resend.';
    console.error(`[email:resend] failed to send to ${message.to}: ${error}`);
    return { status: 'failed', error };
  } finally {
    clearTimeout(timer);
  }
}

export async function sendEmail(message: EmailMessage): Promise<EmailResult> {
  const provider = process.env.EMAIL_PROVIDER || 'console';
  try {
    if (provider === 'smtp') return await sendViaSmtp(message);
    if (provider === 'webhook') return await sendViaWebhook(message);
    if (provider === 'resend') return await sendViaResend(message);
    return await sendViaConsole(message);
  } catch (err) {
    const error = err instanceof Error ? err.message : 'Unknown email error';
    console.error(`[email:${provider}] failed to send to ${message.to}: ${error}`);
    return { status: 'failed', error };
  }
}

function wrapTemplate(title: string, bodyHtml: string) {
  return `<!doctype html><html><body style="margin:0;background:#f5f7f6;font-family:Inter,Arial,sans-serif;color:#0a0f1a;">
  <div style="max-width:560px;margin:0 auto;padding:32px 24px;">
    <p style="letter-spacing:.3em;font-size:11px;text-transform:uppercase;color:#1e6e6b;font-weight:600;margin:0 0 24px;">Saoirse Digital Marketing</p>
    <h1 style="font-size:20px;margin:0 0 16px;color:#0a0f1a;">${title}</h1>
    ${bodyHtml}
    <p style="margin-top:32px;font-size:12px;color:#8a97a5;">SDM Client Portal &middot; This is an automated message.</p>
  </div>
  </body></html>`;
}

export async function sendVerificationEmail(to: string, firstName: string, verifyUrl: string): Promise<EmailResult> {
  return sendEmail({
    to,
    subject: 'Verify your SDM Client Portal account',
    html: wrapTemplate(
      `Welcome, ${firstName}.`,
      `<p style="font-size:14px;line-height:1.6;">Please confirm your email address to activate your SDM Client Portal account.</p>
       <p><a href="${verifyUrl}" style="display:inline-block;background:#1e6e6b;color:#fff;padding:12px 20px;border-radius:8px;text-decoration:none;font-size:14px;">Verify email address</a></p>
       <p style="font-size:12px;color:#5b6b7a;">Or paste this link into your browser: ${verifyUrl}</p>`
    ),
    text: `Welcome, ${firstName}. Verify your email: ${verifyUrl}`,
  });
}

export async function sendPasswordResetEmail(to: string, firstName: string, resetUrl: string): Promise<EmailResult> {
  return sendEmail({
    to,
    subject: 'Reset your SDM Client Portal password',
    html: wrapTemplate(
      `Password reset requested`,
      `<p style="font-size:14px;line-height:1.6;">Hi ${firstName}, we received a request to reset your password. This link expires in 1 hour.</p>
       <p><a href="${resetUrl}" style="display:inline-block;background:#1e6e6b;color:#fff;padding:12px 20px;border-radius:8px;text-decoration:none;font-size:14px;">Reset password</a></p>
       <p style="font-size:12px;color:#5b6b7a;">If you didn't request this, you can safely ignore this email.</p>`
    ),
    text: `Reset your password: ${resetUrl}`,
  });
}

export async function sendWelcomeSetPasswordEmail(
  to: string,
  firstName: string,
  setPasswordUrl: string
): Promise<EmailResult> {
  return sendEmail({
    to,
    subject: 'Your SDM Client Portal account is ready',
    html: wrapTemplate(
      `Welcome, ${firstName}.`,
      `<p style="font-size:14px;line-height:1.6;">Your SDM Client Portal account has been created. Set a password to log in. This link expires in 24 hours.</p>
       <p><a href="${setPasswordUrl}" style="display:inline-block;background:#1e6e6b;color:#fff;padding:12px 20px;border-radius:8px;text-decoration:none;font-size:14px;">Set your password</a></p>
       <p style="font-size:12px;color:#5b6b7a;">Or paste this link into your browser: ${setPasswordUrl}</p>`
    ),
    text: `Welcome, ${firstName}. Your SDM Client Portal account is ready. Set a password to log in: ${setPasswordUrl}`,
  });
}

export async function sendTicketCreatedEmails(opts: {
  clientEmail: string;
  clientName: string;
  businessName: string;
  ticketNumber: number;
  subject: string;
  description: string;
  portalUrl: string;
}) {
  const tag = `SDM-${opts.ticketNumber}`;
  await sendEmail({
    to: opts.clientEmail,
    subject: `[${tag}] We received your support request`,
    html: wrapTemplate(
      `Ticket ${tag} received`,
      `<p style="font-size:14px;line-height:1.6;">Hi ${opts.clientName}, thanks for reaching out. Our team will respond as soon as possible.</p>
       <p style="font-size:14px;"><strong>Subject:</strong> ${opts.subject}</p>
       <p><a href="${opts.portalUrl}" style="color:#1e6e6b;">View this ticket in your portal</a></p>`
    ),
    text: `Ticket ${tag} received. Subject: ${opts.subject}. View it at ${opts.portalUrl}`,
  });

  const supportInbox = process.env.SDM_SUPPORT_INBOX || 'info@saoirsedigital.com';
  await sendEmail({
    to: supportInbox,
    subject: `[${tag}] New Client Support Request: ${opts.businessName}`,
    replyTo: opts.clientEmail,
    html: wrapTemplate(
      `New support request from ${opts.businessName}`,
      `<p style="font-size:14px;"><strong>Ticket:</strong> ${tag}</p>
       <p style="font-size:14px;"><strong>Subject:</strong> ${opts.subject}</p>
       <p style="font-size:14px;white-space:pre-wrap;">${opts.description}</p>
       <p><a href="${opts.portalUrl}" style="color:#1e6e6b;">Open in admin</a></p>`
    ),
    text: `[${tag}] New request from ${opts.businessName}: ${opts.subject}\n\n${opts.description}`,
  });
}
