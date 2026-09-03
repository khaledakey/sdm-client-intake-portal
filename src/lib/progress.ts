import { prisma } from '@/lib/prisma';
import type { Business, ClientIntake } from '@prisma/client';
import type { OnboardingStatus } from '@/lib/enums';

/** Section A fields that must be filled for "Business Information" to be
 * considered complete (Build Brief §12). */
export const BUSINESS_REQUIRED_FIELDS: (keyof Business)[] = [
  'businessName',
  'website',
  'industry',
  'businessDescription',
  'location',
  'employeeCount',
  'serviceArea',
  'businessStage',
  'mainContactName',
  'mainContactEmail',
  'mainContactPhone',
];

/** Section B/C fields (named columns + extendedData keys) required for
 * "Marketing Information" to be considered complete. */
export const MARKETING_REQUIRED_NAMED_FIELDS: (keyof ClientIntake)[] = [
  'businessGoals',
  'marketingObjectives',
  'targetCustomers',
  'marketingChallenges',
  'growthTargets',
  'competitors',
];

export const MARKETING_REQUIRED_EXTENDED_FIELDS = [
  'targetLocations',
  'keyProductsServices',
  'expectedOutcomes',
  'bestPerformingActivity',
  'biggestChallenges',
] as const;

/** Documents SDM asks every new client for by default. SDM staff can add
 * more (or mark these optional/cancelled) per-client from the admin. */
export const DEFAULT_DOCUMENT_REQUESTS: Array<{
  label: string;
  documentType: 'LOGOS' | 'BRAND_GUIDELINES' | 'WEBSITE_DOCUMENTS';
  required: boolean;
  note: string;
}> = [
  {
    label: 'Logo files',
    documentType: 'LOGOS',
    required: true,
    note: 'High-resolution logo files (PNG, SVG, or AI/EPS).',
  },
  {
    label: 'Brand guidelines',
    documentType: 'BRAND_GUIDELINES',
    required: false,
    note: 'Existing brand guidelines, if available.',
  },
  {
    label: 'Website access information',
    documentType: 'WEBSITE_DOCUMENTS',
    required: true,
    note: 'CMS/hosting access details or a document describing how to reach your webmaster.',
  },
];

export const ONBOARDING_STEPS: { key: OnboardingStatus; label: string }[] = [
  { key: 'ACCOUNT_CREATED', label: 'Account Created' },
  { key: 'BUSINESS_INFORMATION', label: 'Business Information' },
  { key: 'MARKETING_INFORMATION', label: 'Marketing Information' },
  { key: 'SUPPORTING_DOCUMENTS', label: 'Supporting Documents' },
  { key: 'SDM_REVIEW', label: 'Review by SDM' },
  { key: 'ONBOARDING_COMPLETE', label: 'Onboarding Complete' },
];

function isFilled(value: unknown) {
  return typeof value === 'string' ? value.trim().length > 0 : value != null;
}

export function isBusinessInfoComplete(business: Business) {
  return BUSINESS_REQUIRED_FIELDS.every((field) => isFilled(business[field]));
}

export function isMarketingInfoComplete(intake: ClientIntake | null) {
  if (!intake) return false;
  const namedOk = MARKETING_REQUIRED_NAMED_FIELDS.every((field) => isFilled(intake[field]));
  const extended = parseExtendedData(intake.extendedData);
  const extendedOk = MARKETING_REQUIRED_EXTENDED_FIELDS.every((field) => isFilled(extended[field]));
  return namedOk && extendedOk;
}

export function parseExtendedData(raw: string | null): Record<string, any> {
  if (!raw) return {};
  try {
    return JSON.parse(raw);
  } catch {
    return {};
  }
}

/** Recomputes onboarding progress for a business and persists it on the
 * ClientIntake row. Call after any mutation to business/intake/documents.
 * SDM-gated stages (review, completion) are only ever set explicitly by
 * staff actions elsewhere — this function never advances past them on its
 * own, and never regresses them once set. */
export async function recalcProgress(businessId: string) {
  const business = await prisma.business.findUniqueOrThrow({ where: { id: businessId } });
  let intake = await prisma.clientIntake.findUnique({ where: { businessId } });
  if (!intake) {
    intake = await prisma.clientIntake.create({ data: { businessId } });
  }

  const openRequiredDocs = await prisma.documentRequest.count({
    where: { businessId, required: true, status: 'OPEN' },
  });
  const totalDocs = await prisma.document.count({ where: { businessId } });

  const stepDone = {
    ACCOUNT_CREATED: true,
    BUSINESS_INFORMATION: isBusinessInfoComplete(business),
    MARKETING_INFORMATION: isMarketingInfoComplete(intake),
    SUPPORTING_DOCUMENTS: openRequiredDocs === 0 && totalDocs > 0,
    SDM_REVIEW: !!intake.sdmReviewedAt,
    ONBOARDING_COMPLETE: !!intake.onboardingCompletedAt,
  } as const;

  const completedCount = Object.values(stepDone).filter(Boolean).length;
  const percentage = Math.round((completedCount / ONBOARDING_STEPS.length) * 100);

  const currentStatus =
    ONBOARDING_STEPS.find((s) => !stepDone[s.key])?.key ?? 'ONBOARDING_COMPLETE';

  const updated = await prisma.clientIntake.update({
    where: { businessId },
    data: { progressPercentage: percentage, onboardingStatus: currentStatus },
  });

  return { intake: updated, stepDone, percentage, currentStatus };
}

export function nextRecommendedAction(stepDone: Record<string, boolean>): {
  label: string;
  href: string | null;
  actionLabel?: string;
} {
  if (!stepDone.BUSINESS_INFORMATION)
    return { label: 'Complete your business information', href: '/business', actionLabel: 'Continue' };
  if (!stepDone.MARKETING_INFORMATION)
    return { label: 'Complete your marketing intake form', href: '/intake', actionLabel: 'Continue' };
  if (!stepDone.SUPPORTING_DOCUMENTS)
    return { label: 'Upload your outstanding documents', href: '/documents', actionLabel: 'Continue' };
  if (!stepDone.SDM_REVIEW) return { label: 'Sit tight — SDM is reviewing your submission', href: null };
  if (!stepDone.ONBOARDING_COMPLETE)
    return { label: 'Onboarding almost done — SDM will confirm completion shortly', href: null };
  return {
    label: "You're fully onboarded. Need anything? SDM is a message away.",
    href: null,
  };
}
