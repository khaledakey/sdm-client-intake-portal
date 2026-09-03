/**
 * SQLite (Prisma's zero-setup default connector, see .env.example) has no
 * native enum type, so the schema stores these as plain strings. These
 * union types + value lists are the single source of truth the rest of
 * the app uses for validation and type safety instead of Prisma-generated
 * enums. Swapping the datasource to Postgres later can reintroduce native
 * `enum` blocks in schema.prisma without changing any application code.
 */

export const ROLES = ['CLIENT', 'SDM_ADMIN', 'SDM_TEAM_MEMBER'] as const;
export type Role = (typeof ROLES)[number];

export const ONBOARDING_STATUSES = [
  'ACCOUNT_CREATED',
  'BUSINESS_INFORMATION',
  'MARKETING_INFORMATION',
  'SUPPORTING_DOCUMENTS',
  'SDM_REVIEW',
  'ONBOARDING_COMPLETE',
] as const;
export type OnboardingStatus = (typeof ONBOARDING_STATUSES)[number];

export const DOCUMENT_CATEGORIES = [
  'BRAND_GUIDELINES',
  'LOGOS',
  'BRAND_ASSETS',
  'MARKETING_STRATEGY',
  'CAMPAIGN_REPORTS',
  'WEBSITE_DOCUMENTS',
  'PRODUCT_INFO',
  'COMPETITOR_RESEARCH',
  'OTHER',
] as const;
export type DocumentCategory = (typeof DOCUMENT_CATEGORIES)[number];

export const DOCUMENT_REVIEW_STATUSES = [
  'UPLOADED',
  'UNDER_REVIEW',
  'APPROVED',
  'ADDITIONAL_INFO_REQUIRED',
] as const;
export type DocumentReviewStatus = (typeof DOCUMENT_REVIEW_STATUSES)[number];

export const DOCUMENT_REQUEST_STATUSES = ['OPEN', 'FULFILLED', 'CANCELLED'] as const;
export type DocumentRequestStatus = (typeof DOCUMENT_REQUEST_STATUSES)[number];

export const TICKET_CATEGORIES = [
  'GENERAL_QUESTION',
  'ACCOUNT_SUPPORT',
  'ONBOARDING_SUPPORT',
  'DOCUMENT_UPLOAD',
  'MARKETING_SERVICES',
  'TECHNICAL_ISSUE',
  'OTHER',
] as const;
export type TicketCategory = (typeof TICKET_CATEGORIES)[number];

export const TICKET_PRIORITIES = ['LOW', 'NORMAL', 'HIGH', 'URGENT'] as const;
export type TicketPriority = (typeof TICKET_PRIORITIES)[number];

export const TICKET_STATUSES = ['OPEN', 'IN_PROGRESS', 'WAITING_FOR_CLIENT', 'RESOLVED', 'CLOSED'] as const;
export type TicketStatus = (typeof TICKET_STATUSES)[number];

export const SENDER_TYPES = ['CLIENT', 'SDM_TEAM', 'SYSTEM'] as const;
export type SenderType = (typeof SENDER_TYPES)[number];

export function isStaffRole(role: string): boolean {
  return role === 'SDM_ADMIN' || role === 'SDM_TEAM_MEMBER';
}
