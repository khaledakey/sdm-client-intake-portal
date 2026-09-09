import { z } from 'zod';

/** Public lead-capture form (Build Brief: unauthenticated `/get-started`).
 * Distinct from the authenticated client-portal `/intake` step — this one
 * captures prospects who don't have (and won't get) a portal account. */

export const BUSINESS_STAGE_OPTIONS = [
  { value: 'startup', label: 'Startup' },
  { value: 'established', label: 'Established' },
  { value: 'scaling', label: 'Scaling' },
] as const;

export const TEAM_SIZE_OPTIONS = [
  { value: 'solo', label: 'Solo' },
  { value: '2-5', label: '2–5' },
  { value: '6-10', label: '6–10' },
  { value: '10+', label: '10+' },
] as const;

export const BUDGET_OPTIONS = [
  { value: '<€500', label: 'Under €500' },
  { value: '€500-€1000', label: '€500 – €1,000' },
  { value: '€1000-€2500', label: '€1,000 – €2,500' },
  { value: '€2500+', label: '€2,500+' },
] as const;

export const TIMELINE_OPTIONS = [
  { value: 'immediately', label: 'Immediately' },
  { value: '30-60 days', label: 'In the next 30–60 days' },
  { value: 'exploring', label: 'Just exploring for now' },
] as const;

export const CONTACT_PREFERENCE_OPTIONS = [
  { value: 'email', label: 'Email' },
  { value: 'phone', label: 'Phone' },
  { value: 'either', label: 'Either' },
] as const;

function selectField(options: readonly { value: string }[], message: string) {
  const values = options.map((o) => o.value);
  return z
    .string()
    .min(1, message)
    .refine((v) => (values as string[]).includes(v), message);
}

export const leadIntakeSchema = z.object({
  firstName: z.string().trim().min(1, 'First name is required').max(80),
  lastName: z.string().trim().min(1, 'Last name is required').max(80),
  email: z.string().trim().toLowerCase().min(1, 'Work email is required').email('Enter a valid email address').max(150),
  phone: z.string().trim().min(5, 'Enter a valid phone number').max(30),
  role: z.string().trim().min(1, 'Your role is required').max(100),
  companyName: z.string().trim().min(1, 'Business name is required').max(150),
  location: z.string().trim().min(1, 'Town or county is required').max(150),
  website: z.string().trim().max(200),
  businessDescription: z.string().trim().min(1, 'Please tell us what your business does').max(2000),
  businessStage: selectField(BUSINESS_STAGE_OPTIONS, 'Select what stage the business is at'),
  teamSize: selectField(TEAM_SIZE_OPTIONS, 'Select a team size'),
  desiredOutcome: z.string().trim().min(1, 'Please tell us what outcome matters most right now').max(2000),
  marketingChallenge: z.string().trim().min(1, 'Please tell us your biggest marketing challenge').max(2000),
  currentMarketing: z.string().trim().min(1, "Please tell us what marketing you're currently doing").max(2000),
  budgetRange: selectField(BUDGET_OPTIONS, 'Select an approximate budget'),
  timeline: selectField(TIMELINE_OPTIONS, "Select when you'd like to act"),
  contactPreference: selectField(CONTACT_PREFERENCE_OPTIONS, 'Select a preferred contact method'),
  source: z.string().trim().min(1, 'Please let us know how you heard about us').max(200),
  privacyConsent: z.boolean().refine((v) => v === true, {
    message: 'Please agree to the Privacy Notice to continue',
  }),
  marketingOptIn: z.boolean(),
});

export type LeadIntakeFormData = z.infer<typeof leadIntakeSchema>;

export const LEAD_INTAKE_INITIAL: LeadIntakeFormData = {
  firstName: '',
  lastName: '',
  email: '',
  phone: '',
  role: '',
  companyName: '',
  location: '',
  website: '',
  businessDescription: '',
  businessStage: '',
  teamSize: '',
  desiredOutcome: '',
  marketingChallenge: '',
  currentMarketing: '',
  budgetRange: '',
  timeline: '',
  contactPreference: '',
  source: '',
  privacyConsent: false,
  marketingOptIn: false,
};

export function buildLeadWebhookPayload(data: LeadIntakeFormData, submissionId: string, timestamp: string) {
  return {
    event_type: 'client.registered' as const,
    submission_id: submissionId,
    timestamp,
    form_version: 'intake-v1' as const,
    first_name: data.firstName,
    last_name: data.lastName,
    email: data.email,
    phone: data.phone,
    role: data.role,
    company_name: data.companyName,
    location: data.location,
    website: data.website,
    business_description: data.businessDescription,
    business_stage: data.businessStage,
    team_size: data.teamSize,
    desired_outcome: data.desiredOutcome,
    marketing_challenge: data.marketingChallenge,
    current_marketing: data.currentMarketing,
    budget_range: data.budgetRange,
    timeline: data.timeline,
    contact_preference: data.contactPreference,
    source: data.source,
    privacy_consent: data.privacyConsent,
    marketing_opt_in: data.marketingOptIn,
  };
}
