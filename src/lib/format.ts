export function formatBytes(bytes: number) {
  if (bytes === 0) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB'];
  const i = Math.min(units.length - 1, Math.floor(Math.log(bytes) / Math.log(1024)));
  return `${(bytes / 1024 ** i).toFixed(i === 0 ? 0 : 1)} ${units[i]}`;
}

export function formatDate(date: string | Date) {
  return new Date(date).toLocaleDateString('en-IE', { day: 'numeric', month: 'short', year: 'numeric' });
}

export function formatDateTime(date: string | Date) {
  return new Date(date).toLocaleString('en-IE', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export const DOCUMENT_TYPE_LABELS: Record<string, string> = {
  BRAND_GUIDELINES: 'Brand Guidelines',
  LOGOS: 'Logos',
  BRAND_ASSETS: 'Brand Assets',
  MARKETING_STRATEGY: 'Marketing Strategy',
  CAMPAIGN_REPORTS: 'Campaign Reports',
  WEBSITE_DOCUMENTS: 'Website Documents',
  PRODUCT_INFO: 'Product/Service Info',
  COMPETITOR_RESEARCH: 'Competitor Research',
  OTHER: 'Other',
};

export const DOCUMENT_STATUS_LABELS: Record<string, string> = {
  UPLOADED: 'Uploaded',
  UNDER_REVIEW: 'Under Review',
  APPROVED: 'Approved',
  ADDITIONAL_INFO_REQUIRED: 'Additional Information Required',
};

export const TICKET_CATEGORY_LABELS: Record<string, string> = {
  GENERAL_QUESTION: 'General Question',
  ACCOUNT_SUPPORT: 'Account Support',
  ONBOARDING_SUPPORT: 'Onboarding Support',
  DOCUMENT_UPLOAD: 'Document Upload',
  MARKETING_SERVICES: 'Marketing Services',
  TECHNICAL_ISSUE: 'Technical Issue',
  OTHER: 'Other',
};

export const TICKET_PRIORITY_LABELS: Record<string, string> = {
  LOW: 'Low',
  NORMAL: 'Normal',
  HIGH: 'High',
  URGENT: 'Urgent',
};

export const TICKET_STATUS_LABELS: Record<string, string> = {
  OPEN: 'Open',
  IN_PROGRESS: 'In Progress',
  WAITING_FOR_CLIENT: 'Waiting for Client',
  RESOLVED: 'Resolved',
  CLOSED: 'Closed',
};
