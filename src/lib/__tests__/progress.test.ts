import { describe, expect, it } from 'vitest';
import { DEFAULT_DOCUMENT_REQUESTS } from '../progress';

describe('DEFAULT_DOCUMENT_REQUESTS', () => {
  it('has no duplicate labels', () => {
    const labels = DEFAULT_DOCUMENT_REQUESTS.map((r) => r.label);
    expect(new Set(labels).size).toBe(labels.length);
  });

  it('does not require website access through the portal', () => {
    const websiteAccess = DEFAULT_DOCUMENT_REQUESTS.find((r) => r.documentType === 'WEBSITE_DOCUMENTS');
    expect(websiteAccess).toBeDefined();
    expect(websiteAccess?.required).toBe(false);
  });
});
