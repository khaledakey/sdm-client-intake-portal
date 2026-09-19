/**
 * PortalWizard.jsx — Saoirse Digital Portal "Get started" intake form.
 *
 * Three-step wizard + confirmation screen. Plain React 18, no dependencies.
 * Styling: ./portal-wizard.css (fonts, colour tokens, control + button classes)
 * plus inline styles for layout. No Tailwind required — if the Portal app uses
 * Tailwind, the classes can be swapped, but the hex values must not change.
 *
 * Usage:
 *   import './portal-wizard.css';
 *   import PortalWizard from './PortalWizard';
 *   <PortalWizard
 *     sealSrc="/assets/sdm-seal.png"
 *     knotSrc="/assets/small-knot.svg"
 *     privacyHref="/privacy"
 *     onSubmit={async (payload) => {
 *       const res = await fetch(MAKE_WEBHOOK_URL, {
 *         method: 'POST',
 *         headers: { 'Content-Type': 'application/json' },
 *         body: JSON.stringify(payload),
 *       });
 *       if (!res.ok) throw new Error('Submission failed');
 *       return await res.json();   // { reference: 'SDM-2026-0412' } if available
 *     }}
 *   />
 *
 * onSubmit contract: receives the full answer object (keys below, unchanged from
 * the existing Portal form so the webhook payload shape is untouched). Resolve
 * with an object to use `reference` on the confirmation screen; reject to show
 * the submit error. If omitted, the component simulates a 900ms submit.
 */

import React, { useCallback, useMemo, useRef, useState } from 'react';

/* ---------------------------------------------------------------- content -- */

const MSG = {
  firstName: 'Add your first name.',
  lastName: 'Add your last name.',
  email: 'Add a work email we can reply to.',
  phone: 'Add a number in case email bounces.',
  role: 'Tell us your role in the business.',
  contactMethod: "Pick how you'd like us to reply.",
  businessName: 'Add the business name.',
  location: 'Add your town or county.',
  stage: 'Pick the stage the business is at.',
  teamSize: 'Pick a team size.',
  description: 'A line on what the business does helps a lot.',
  current: "Tell us what marketing you're doing today.",
  outcome: 'Tell us which outcome matters most.',
  challenge: 'Tell us the challenge you want help with.',
  budget: 'Pick an approximate budget range.',
  timeline: 'Pick a rough timeline.',
  source: 'Let us know how you found us.',
  consent: 'We need your permission before we can reply.',
};

const STEP_FIELDS = [
  ['firstName', 'lastName', 'email', 'phone', 'role', 'contactMethod'],
  ['businessName', 'location', 'stage', 'teamSize', 'description', 'current'],
  ['outcome', 'challenge', 'budget', 'timeline', 'source'],
];

const STEP_LABELS = ['01 · YOUR DETAILS', '02 · THE BUSINESS', '03 · PRIORITIES'];

const OPTIONS = {
  contactMethod: [
    { value: 'email', label: 'Email' },
    { value: 'phone', label: 'Phone' },
    { value: 'either', label: 'Either' },
  ],
  stage: [
    { value: 'startup', label: 'Startup · getting the first customers' },
    { value: 'established', label: 'Established · steady but flat' },
    { value: 'scaling', label: 'Scaling · growing and adding capacity' },
  ],
  teamSize: [
    { value: 'solo', label: 'Solo' },
    { value: '2-5', label: '2–5' },
    { value: '6-10', label: '6–10' },
    { value: '10+', label: '10+' },
  ],
  budget: [
    { value: '<500', label: 'Under €500' },
    { value: '500-1000', label: '€500 – €1,000' },
    { value: '1000-2500', label: '€1,000 – €2,500' },
    { value: '2500+', label: '€2,500+' },
  ],
  timeline: [
    { value: 'now', label: 'Immediately' },
    { value: '30-60', label: 'In the next 30–60 days' },
    { value: 'exploring', label: 'Just exploring for now' },
  ],
};

const PLACEHOLDERS = {
  contactMethod: 'Select a contact method',
  stage: 'Select a stage',
  teamSize: 'Select a team size',
  budget: 'Select a budget range',
  timeline: 'Select a timeline',
};

const EMPTY = {
  firstName: '', lastName: '', email: '', phone: '', role: '', contactMethod: '',
  businessName: '', location: '', stage: '', teamSize: '', website: '',
  description: '', current: '',
  outcome: '', challenge: '', budget: '', timeline: '', source: '',
  consent: false, optin: false,
};

/* ------------------------------------------------------------------ atoms -- */

const S = {
  label: {
    fontFamily: 'var(--pw-mono)', fontWeight: 700, fontSize: 11,
    letterSpacing: '0.16em', textTransform: 'uppercase', color: 'var(--pw-emerald)',
  },
  help: {
    fontFamily: 'var(--pw-serif)', fontSize: 15, lineHeight: 1.4, color: 'var(--pw-ink-500)',
  },
  error: {
    fontFamily: 'var(--pw-mono)', fontSize: 11, letterSpacing: '0.08em',
    color: 'var(--pw-error-ink)', borderTop: '2px solid var(--pw-error-rule)', paddingTop: 7,
  },
  eyebrow: {
    fontFamily: 'var(--pw-mono)', fontWeight: 700, fontSize: 10,
    letterSpacing: '0.2em', color: 'var(--pw-emerald)',
  },
  h2: {
    margin: 0, fontFamily: 'var(--pw-display)', fontWeight: 700, fontSize: 26,
    lineHeight: 1.2, color: 'var(--pw-ink-900)',
  },
  lede: {
    margin: 0, fontFamily: 'var(--pw-serif)', fontWeight: 300, fontSize: 17,
    lineHeight: 1.6, color: 'var(--pw-ink-600)', textWrap: 'pretty',
  },
  card: {
    background: 'var(--pw-card)', border: '1px solid var(--pw-line)',
    borderRadius: 'var(--pw-radius-panel)', boxShadow: 'var(--pw-shadow-xs)',
    padding: 32, display: 'flex', flexDirection: 'column', gap: 24,
  },
  field: { display: 'flex', flexDirection: 'column', gap: 6, minWidth: 0 },
  grid: {
    display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 20,
  },
};

function Knot({ src, size = 20 }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
      <span style={{ height: 1, flex: 1, background: 'var(--pw-line)' }} />
      {src ? <img src={src} alt="" width={size} height={size} style={{ opacity: 0.9 }} />
           : <span aria-hidden="true" style={{ color: 'var(--pw-gold)', fontSize: 14 }}>✦</span>}
      <span style={{ height: 1, flex: 1, background: 'var(--pw-line)' }} />
    </div>
  );
}

function Field({ name, label, help, error, children }) {
  return (
    <div style={S.field}>
      <label htmlFor={name} style={S.label}>{label}</label>
      {help ? <span style={S.help}>{help}</span> : null}
      {children}
      {error ? <span id={`${name}-error`} style={S.error}>{error}</span> : null}
    </div>
  );
}

/* ------------------------------------------------------------- component -- */

export default function PortalWizard({
  sealSrc = '/assets/sdm-seal.png',
  knotSrc = '/assets/small-knot.svg',
  privacyHref = '/privacy',
  homeHref = 'https://saoirsedigital.com',
  submitLabel = 'Get started',
  // Embedded (iframed on saoirsedigital.com) hides the logo bar and hero —
  // the host page already shows its own nav and hero above the iframe, so
  // repeating them here reads as two stacked landing pages. The standalone
  // portal URL (no embed param) keeps both, for anyone who lands on it
  // directly. Applies uniformly across every step and the confirmation
  // screen because both blocks render once here, above the step/result
  // switch below, rather than being duplicated per step.
  embed = false,
  onSubmit,
}) {
  const [step, setStep] = useState(1);
  const [values, setValues] = useState(EMPTY);
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [result, setResult] = useState(null); // { reference } once submitted
  const formRef = useRef(null);

  const set = useCallback((name) => (e) => {
    const v = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
    setValues((prev) => ({ ...prev, [name]: v }));
  }, []);

  const validate = useCallback((forStep) => {
    const next = {};
    STEP_FIELDS[forStep - 1].forEach((name) => {
      const v = values[name];
      if (typeof v === 'string' ? !v.trim() : !v) next[name] = MSG[name];
    });
    if (forStep === 1) {
      const email = values.email.trim();
      if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) {
        next.email = "That email doesn't look right. Check for a typo.";
      }
      const digits = values.phone.replace(/\D/g, '');
      if (digits && digits.length < 7) {
        next.phone = 'Add a full contact number, including area or country code.';
      }
    }
    if (forStep === 3 && !values.consent) next.consent = MSG.consent;
    return next;
  }, [values]);

  const focusFirst = useCallback((errs) => {
    const form = formRef.current;
    if (!form) return;
    const first = Object.keys(errs)[0];
    const el = form.querySelector(`#${first}`) || form.querySelector(`[name="${first}"]`);
    if (el && el.focus) el.focus();
  }, []);

  const goNext = () => {
    const errs = validate(step);
    if (Object.keys(errs).length) { setErrors(errs); focusFirst(errs); return; }
    setErrors({});
    setStep((s) => Math.min(3, s + 1));
  };

  const goBack = () => { setErrors({}); setStep((s) => Math.max(1, s - 1)); };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (submitting) return;
    const errs = validate(3);
    if (Object.keys(errs).length) { setErrors(errs); focusFirst(errs); return; }
    setErrors({});
    setSubmitError('');
    setSubmitting(true);
    try {
      let reference = '';
      if (onSubmit) {
        const res = await onSubmit({ ...values });
        reference = (res && res.reference) || '';
      } else {
        await new Promise((r) => setTimeout(r, 900));
      }
      setResult({ reference: reference || `SDM-${new Date().getFullYear()}-0000` });
      window.dataLayer = window.dataLayer || [];
      window.dataLayer.push({ event: 'generate_lead', lead_source: 'free_marketing_snapshot' });
    } catch (err) {
      setSubmitError("We couldn't send that just now. Try again, or email hello@saoirsedigital.com and we'll pick it up.");
    } finally {
      setSubmitting(false);
    }
  };

  const errorSummary = useMemo(() => {
    const n = Object.keys(errors).length;
    if (!n) return '';
    return n === 1
      ? "One answer on this step still needs attention. It's marked above."
      : `${n} answers on this step still need attention. They're marked above.`;
  }, [errors]);

  const ctrl = (name, extra = {}) => ({
    id: name,
    name,
    className: 'pw-control',
    value: values[name],
    onChange: set(name),
    'aria-invalid': errors[name] ? 'true' : undefined,
    'aria-describedby': errors[name] ? `${name}-error` : undefined,
    ...extra,
  });

  const barColor = (i) =>
    step > i ? 'var(--pw-gold)' : step === i ? 'var(--pw-emerald)' : 'var(--pw-line)';

  return (
    <div style={{ minHeight: '100%', background: 'var(--pw-page)', fontFamily: 'var(--pw-serif)', color: 'var(--pw-ink-700)' }}>

      {!embed && (
        <header style={{
          position: 'sticky', top: 0, zIndex: 20, background: 'rgba(248,250,248,0.95)',
          backdropFilter: 'blur(8px)', borderBottom: '1px solid var(--pw-line)',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          gap: 16, padding: '14px 24px',
        }}>
          <a href={homeHref} style={{ display: 'flex', alignItems: 'center', gap: 12, textDecoration: 'none' }}>
            <img src={sealSrc} alt="Saoirse Digital Marketing seal"
                 style={{ width: 40, height: 40, borderRadius: 9999, display: 'block', objectFit: 'contain' }} />
            <span style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
              <span style={{ fontFamily: 'var(--pw-display)', fontWeight: 700, fontSize: 15, letterSpacing: '0.1em', color: 'var(--pw-ink-900)' }}>SAOIRSE DIGITAL</span>
              <span style={{ fontFamily: 'var(--pw-mono)', fontWeight: 700, fontSize: 9, letterSpacing: '0.3em', color: 'var(--pw-emerald)' }}>MARKETING · IRELAND</span>
            </span>
          </a>
          <span style={{ fontFamily: 'var(--pw-mono)', fontWeight: 700, fontSize: 10, letterSpacing: '0.2em', color: 'var(--pw-ink-500)', whiteSpace: 'nowrap' }}>GET STARTED</span>
        </header>
      )}

      {!embed && (
        <section style={{ background: 'var(--pw-dark)', color: '#fff', padding: '56px 24px 48px', position: 'relative', overflow: 'hidden' }}>
          <div aria-hidden="true" style={{
            position: 'absolute', inset: 0, pointerEvents: 'none',
            background: 'radial-gradient(60% 80% at 20% 0%, rgba(20,96,68,0.55), transparent 70%), radial-gradient(50% 70% at 90% 100%, rgba(156,119,32,0.18), transparent 70%)',
          }} />
          <div style={{ position: 'relative', maxWidth: 768, margin: '0 auto', display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 18 }}>
            <span style={{ fontFamily: 'var(--pw-mono)', fontWeight: 700, fontSize: 10, letterSpacing: '0.3em', color: 'var(--pw-gold-bright)' }}>FREE MARKETING SNAPSHOT</span>
            <h1 style={{ margin: 0, fontFamily: 'var(--pw-display)', fontWeight: 700, fontSize: 'clamp(30px, 4.4vw, 44px)', lineHeight: 1.1, letterSpacing: '-0.015em', color: '#fff', textWrap: 'pretty' }}>
              Your marketing clarity starts here.
            </h1>
            <p style={{ margin: 0, maxWidth: '60ch', fontFamily: 'var(--pw-serif)', fontWeight: 300, fontSize: 18, lineHeight: 1.6, color: 'rgba(255,255,255,0.88)', textWrap: 'pretty' }}>
              Three short steps, about five minutes. We'll read your answers and reply with practical next steps within two business days.
            </p>
          </div>
        </section>
      )}

      {!result ? (
        <main style={{ maxWidth: 768, margin: '0 auto', padding: '40px 24px 96px' }}>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 14, paddingBottom: 32 }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
              {STEP_LABELS.map((text, i) => (
                <div key={text} style={{ display: 'flex', flexDirection: 'column', gap: 10, minWidth: 0 }}>
                  <span style={{ height: 3, borderRadius: 2, background: barColor(i + 1) }} />
                  <span style={{
                    fontFamily: 'var(--pw-mono)', fontSize: 10, letterSpacing: '0.14em', lineHeight: 1.4,
                    fontWeight: step === i + 1 ? 700 : 400,
                    color: step === i + 1 ? 'var(--pw-emerald)' : 'var(--pw-ink-500)',
                  }}>{text}</span>
                </div>
              ))}
            </div>
            <span role="status" style={{ fontFamily: 'var(--pw-mono)', fontWeight: 700, fontSize: 10, letterSpacing: '0.2em', color: 'var(--pw-ink-500)' }}>
              {`STEP ${step} OF 3`}
            </span>
          </div>

          <form ref={formRef} onSubmit={handleSubmit} noValidate style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>

            {step === 1 && (
              <div style={S.card}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  <span style={S.eyebrow}>01 · WHO YOU ARE</span>
                  <h2 style={S.h2}>Your details</h2>
                  <Knot src={knotSrc} />
                  <p style={S.lede}>So we know who we're replying to, and how you'd rather hear from us.</p>
                </div>
                <div style={S.grid}>
                  <Field name="firstName" label="First name *" error={errors.firstName}>
                    <input {...ctrl('firstName', { placeholder: 'Aoife', autoComplete: 'given-name' })} />
                  </Field>
                  <Field name="lastName" label="Last name *" error={errors.lastName}>
                    <input {...ctrl('lastName', { placeholder: 'Ní Bhriain', autoComplete: 'family-name' })} />
                  </Field>
                  <Field name="email" label="Work email *" error={errors.email}>
                    <input {...ctrl('email', { type: 'email', placeholder: 'name@company.ie', autoComplete: 'email' })} />
                  </Field>
                  <Field name="phone" label="Mobile or phone *" error={errors.phone}>
                    <input {...ctrl('phone', { type: 'tel', placeholder: '+353 89 425 6113', autoComplete: 'tel' })} />
                  </Field>
                  <Field name="role" label="Your role in the business *" error={errors.role}>
                    <input {...ctrl('role', { placeholder: 'Owner, director, marketing lead…' })} />
                  </Field>
                  <Field name="contactMethod" label="Preferred contact method *" error={errors.contactMethod}>
                    <select {...ctrl('contactMethod')}>
                      <option value="">{PLACEHOLDERS.contactMethod}</option>
                      {OPTIONS.contactMethod.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                    </select>
                  </Field>
                </div>
              </div>
            )}

            {step === 2 && (
              <div style={S.card}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  <span style={S.eyebrow}>02 · THE BUSINESS</span>
                  <h2 style={S.h2}>Where you trade</h2>
                  <Knot src={knotSrc} />
                  <p style={S.lede}>Enough context to judge your market and what's already running.</p>
                </div>
                <div style={S.grid}>
                  <Field name="businessName" label="Business name *" error={errors.businessName}>
                    <input {...ctrl('businessName', { placeholder: 'e.g. Glendalough Crafts' })} />
                  </Field>
                  <Field name="location" label="Town or county *" error={errors.location}>
                    <input {...ctrl('location', { placeholder: 'Wicklow' })} />
                  </Field>
                  <Field name="stage" label="Stage of the business *" error={errors.stage}>
                    <select {...ctrl('stage')}>
                      <option value="">{PLACEHOLDERS.stage}</option>
                      {OPTIONS.stage.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                    </select>
                  </Field>
                  <Field name="teamSize" label="Team size *" error={errors.teamSize}>
                    <select {...ctrl('teamSize')}>
                      <option value="">{PLACEHOLDERS.teamSize}</option>
                      {OPTIONS.teamSize.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                    </select>
                  </Field>
                </div>
                <Field name="website" label="Website or main social link"
                       help="Optional. Whatever you'd point a customer to first.">
                  <input {...ctrl('website', { placeholder: 'https://yourbusiness.ie', inputMode: 'url' })} />
                </Field>
                <Field name="description" label="What does the business do? *"
                       help="A line or two on what you sell and who buys it." error={errors.description}>
                  <textarea {...ctrl('description', {
                    rows: 3,
                    placeholder: 'We make hand-thrown ceramics and sell to visitors and a few Dublin stockists.',
                  })} />
                </Field>
                <Field name="current" label="What marketing are you doing today? *"
                       help="Ads, social, email, SEO, referrals, including anything you've paused." error={errors.current}>
                  <textarea {...ctrl('current', {
                    rows: 3,
                    placeholder: 'Instagram twice a week, a Google Ads account we paused in March, word of mouth.',
                  })} />
                </Field>
              </div>
            )}

            {step === 3 && (
              <>
                <div style={S.card}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    <span style={S.eyebrow}>03 · PRIORITIES</span>
                    <h2 style={S.h2}>What needs to change</h2>
                    <Knot src={knotSrc} />
                    <p style={S.lede}>Last step. A rough budget range is enough: it tells us which recommendations are realistic, and nothing here is a commitment.</p>
                  </div>
                  <Field name="outcome" label="Which outcome matters most right now? *" error={errors.outcome}>
                    <textarea {...ctrl('outcome', {
                      rows: 2, style: { minHeight: 74 },
                      placeholder: 'More enquiries from the local area, ideally before the summer season.',
                    })} />
                  </Field>
                  <Field name="challenge" label="Biggest marketing challenge you want help with *" error={errors.challenge}>
                    <textarea {...ctrl('challenge', {
                      rows: 3,
                      placeholder: "We post regularly but nothing turns into work, and we can't tell what's worth keeping.",
                    })} />
                  </Field>
                  <div style={S.grid}>
                    <Field name="budget" label="Approximate monthly budget *" error={errors.budget}>
                      <select {...ctrl('budget')}>
                        <option value="">{PLACEHOLDERS.budget}</option>
                        {OPTIONS.budget.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                      </select>
                    </Field>
                    <Field name="timeline" label="When would you like to act? *" error={errors.timeline}>
                      <select {...ctrl('timeline')}>
                        <option value="">{PLACEHOLDERS.timeline}</option>
                        {OPTIONS.timeline.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                      </select>
                    </Field>
                  </div>
                  <Field name="source" label="How did you hear about us? *" error={errors.source}>
                    <input {...ctrl('source', { placeholder: 'Search, referral, LinkedIn, local network…' })} />
                  </Field>
                </div>

                <div style={{
                  background: 'var(--pw-tint)', border: '1px solid var(--pw-line)',
                  borderRadius: 'var(--pw-radius-panel)', padding: 28,
                  display: 'flex', flexDirection: 'column', gap: 18,
                }}>
                  <span style={S.eyebrow}>PERMISSIONS</span>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                      <input type="checkbox" id="consent" name="consent" checked={values.consent}
                             onChange={set('consent')}
                             aria-invalid={errors.consent ? 'true' : undefined}
                             aria-describedby={errors.consent ? 'consent-error' : undefined}
                             style={{ marginTop: 5, width: 18, height: 18, flex: 'none', accentColor: 'var(--pw-emerald)' }} />
                      <label htmlFor="consent" style={{ fontFamily: 'var(--pw-serif)', fontSize: 16, lineHeight: 1.5, color: 'var(--pw-ink-700)' }}>
                        I agree that Saoirse Digital Marketing may use these details to respond to my request, as described in the <a className="pw-link" href={privacyHref}>Privacy Notice</a>. *
                      </label>
                    </div>
                    {errors.consent ? <span id="consent-error" style={S.error}>{errors.consent}</span> : null}
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                      <input type="checkbox" id="optin" name="optin" checked={values.optin} onChange={set('optin')}
                             style={{ marginTop: 5, width: 18, height: 18, flex: 'none', accentColor: 'var(--pw-emerald)' }} />
                      <label htmlFor="optin" style={{ fontFamily: 'var(--pw-serif)', fontSize: 16, lineHeight: 1.5, color: 'var(--pw-ink-700)' }}>
                        Send me occasional marketing notes and updates. Practical only, no hype.
                      </label>
                    </div>
                  </div>
                </div>
              </>
            )}

            {(errorSummary || submitError) && (
              <div role="alert" style={{
                background: 'var(--pw-error-bg)', border: '1px solid var(--pw-error-border)',
                borderRadius: 'var(--pw-radius-card)', padding: '18px 20px',
                display: 'flex', flexDirection: 'column', gap: 6,
              }}>
                <span style={{ fontFamily: 'var(--pw-mono)', fontWeight: 700, fontSize: 10, letterSpacing: '0.2em', color: 'var(--pw-error-ink)' }}>
                  {submitError ? 'COULDN\u2019T SEND' : "SOMETHING'S MISSING"}
                </span>
                <span style={{ fontFamily: 'var(--pw-serif)', fontSize: 16, lineHeight: 1.5, color: 'var(--pw-error-ink)' }}>
                  {submitError || errorSummary}
                </span>
              </div>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div style={{ display: 'flex', flexWrap: 'wrap-reverse', gap: 12, alignItems: 'center' }}>
                {step > 1 && (
                  <button type="button" className="pw-btn pw-btn--secondary" onClick={goBack}>← Back</button>
                )}
                <span style={{ flex: 1, minWidth: 12 }} />
                {step < 3 ? (
                  <button type="button" className="pw-btn pw-btn--primary" onClick={goNext}>Continue ➔</button>
                ) : (
                  <button type="submit" className="pw-btn pw-btn--primary" disabled={submitting}>
                    {submitting ? 'Sending…' : submitLabel}
                  </button>
                )}
              </div>
              <span style={{ fontFamily: 'var(--pw-serif)', fontSize: 16, lineHeight: 1.5, color: 'var(--pw-ink-500)', textWrap: 'pretty' }}>
                {step === 3
                  ? 'We reply within two business days. Free to request. No obligation.'
                  : 'Your answers are kept as you move between steps.'}
              </span>
            </div>
          </form>
        </main>
      ) : (
        <main style={{ maxWidth: 768, margin: '0 auto', padding: '64px 24px 96px' }}>
          <div style={{
            background: 'var(--pw-card)', border: '1px solid var(--pw-line)',
            borderRadius: 'var(--pw-radius-panel)', boxShadow: 'var(--pw-shadow-xs)',
            padding: '48px 32px', display: 'flex', flexDirection: 'column',
            alignItems: 'center', gap: 24, textAlign: 'center',
          }}>
            <img src={sealSrc} alt="Saoirse Digital Marketing seal"
                 style={{ width: 88, height: 88, borderRadius: 9999, display: 'block', objectFit: 'contain' }} />
            <span style={{ fontFamily: 'var(--pw-mono)', fontWeight: 700, fontSize: 10, letterSpacing: '0.3em', color: 'var(--pw-emerald)' }}>REQUEST RECEIVED</span>
            <h2 style={{ margin: 0, fontFamily: 'var(--pw-display)', fontWeight: 700, fontSize: 'clamp(28px, 4vw, 42px)', lineHeight: 1.15, color: 'var(--pw-ink-900)' }}>
              {values.firstName.trim()
                ? `Thanks, ${values.firstName.trim()}. We have what we need to start.`
                : 'Thanks. We have what we need to start.'}
            </h2>
            <p style={{ margin: 0, maxWidth: '56ch', fontFamily: 'var(--pw-serif)', fontWeight: 300, fontSize: 19, lineHeight: 1.6, color: 'var(--pw-ink-600)', textWrap: 'pretty' }}>
              {values.email.trim()
                ? `A copy of your answers is on its way to ${values.email.trim()}. Khaled reads every submission personally and will come back to you within two business days with a first view on where to focus.`
                : 'Your answers are with us. Khaled reads every submission personally and will come back to you within two business days with a first view on where to focus.'}
            </p>
            <div style={{ width: '100%' }}><Knot src={knotSrc} size={22} /></div>
            <div style={{
              display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: 20, width: '100%', textAlign: 'left',
            }}>
              {[
                ['NEXT · 01', 'We review your answers against your market and current activity.'],
                ['NEXT · 02', 'You get up to three priority observations by your preferred contact method.'],
                ['NEXT · 03', 'If it makes sense to go further, we talk options. If not, you keep the read.'],
              ].map(([kicker, body]) => (
                <div key={kicker} style={{
                  border: '1px solid var(--pw-line)', borderRadius: 'var(--pw-radius-card)',
                  padding: 20, display: 'flex', flexDirection: 'column', gap: 8,
                }}>
                  <span style={{ fontFamily: 'var(--pw-mono)', fontWeight: 700, fontSize: 10, letterSpacing: '0.2em', color: 'var(--pw-gold)' }}>{kicker}</span>
                  <span style={{ fontFamily: 'var(--pw-serif)', fontSize: 17, lineHeight: 1.5, color: 'var(--pw-ink-700)' }}>{body}</span>
                </div>
              ))}
            </div>
            <a className="pw-btn pw-btn--primary" href={homeHref}>Back to saoirsedigital.com</a>
            <span style={{ fontFamily: 'var(--pw-mono)', fontWeight: 700, fontSize: 11, letterSpacing: '0.16em', color: 'var(--pw-ink-500)' }}>
              {`REFERENCE ${result.reference} · KEEP THIS FOR YOUR RECORDS`}
            </span>
          </div>
        </main>
      )}

      <footer style={{ background: 'var(--pw-footer)', borderTop: '1px solid var(--pw-line)', padding: '32px 24px' }}>
        <div style={{
          maxWidth: 768, margin: '0 auto', display: 'flex', flexWrap: 'wrap',
          gap: '12px 32px', alignItems: 'center', justifyContent: 'space-between',
        }}>
          <span style={{ fontFamily: 'var(--pw-mono)', fontWeight: 700, fontSize: 10, letterSpacing: '0.2em', color: 'var(--pw-ink-500)' }}>SDM · SAOIRSE DIGITAL MARKETING</span>
          <span style={{ fontFamily: 'var(--pw-mono)', fontWeight: 700, fontSize: 10, letterSpacing: '0.2em', color: 'var(--pw-ink-500)' }}>WICKLOW · KILDARE · CARLOW · LEINSTER CORRIDOR</span>
        </div>
      </footer>
    </div>
  );
}
