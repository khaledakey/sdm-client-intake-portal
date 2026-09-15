/**
 * Configurable email provider (Build Brief §8: "The email integration must
 * be configurable rather than hard-coded so it can connect with the final
 * SDM email and automation workflow.")
 *
 * EMAIL_PROVIDER env var selects the transport:
 *   - "console" (default): logs the message, always works, zero setup.
 *   - "smtp": sends via nodemailer using SMTP_* env vars.
 *   - "webhook": POSTs a JSON payload to EMAIL_WEBHOOK_URL — point this at
 *     a Make.com scenario or Hostinger automation that owns real delivery
 *     from info@saoirsedigital.com.
 */

interface EmailMessage {
  to: string;
  subject: string;
  html: string;
  text: string;
  replyTo?: string;
}

async function sendViaConsole(message: EmailMessage) {
  // eslint-disable-next-line no-console
  console.log(
    `\n[email:console] To: ${message.to}\nSubject: ${message.subject}\n${message.text}\n`
  );
}

async function sendViaSmtp(message: EmailMessage) {
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
}

async function sendViaWebhook(message: EmailMessage) {
  const url = process.env.EMAIL_WEBHOOK_URL;
  if (!url) {
    console.warn('[email:webhook] EMAIL_WEBHOOK_URL not set — falling back to console.');
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
}

export async function sendEmail(message: EmailMessage) {
  const provider = process.env.EMAIL_PROVIDER || 'console';
  try {
    if (provider === 'smtp') return await sendViaSmtp(message);
    if (provider === 'webhook') return await sendViaWebhook(message);
    return await sendViaConsole(message);
  } catch (err) {
    console.error(`[email:${provider}] failed to send, falling back to console log`, err);
    return sendViaConsole(message);
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

export async function sendVerificationEmail(to: string, firstName: string, verifyUrl: string) {
  await sendEmail({
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

export async function sendPasswordResetEmail(to: string, firstName: string, resetUrl: string) {
  await sendEmail({
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

export async function sendWelcomeSetPasswordEmail(to: string, firstName: string, setPasswordUrl: string) {
  await sendEmail({
    to,
    subject: 'Your SDM Client Portal account is ready',
    html: wrapTemplate(
      `Welcome, ${firstName}.`,
      `<p style="font-size:14px;line-height:1.6;">Your SDM Client Portal account has been created. Set a password to log in — this link expires in 24 hours.</p>
       <p><a href="${setPasswordUrl}" style="display:inline-block;background:#1e6e6b;color:#fff;padding:12px 20px;border-radius:8px;text-decoration:none;font-size:14px;">Set your password</a></p>
       <p style="font-size:12px;color:#5b6b7a;">Or paste this link into your browser: ${setPasswordUrl}</p>`
    ),
    text: `Welcome, ${firstName}. Your SDM Client Portal account is ready — set a password to log in: ${setPasswordUrl}`,
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
    subject: `[${tag}] New Client Support Request — ${opts.businessName}`,
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
