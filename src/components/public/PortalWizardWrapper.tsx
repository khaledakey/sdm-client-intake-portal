'use client';

import '@/styles/portal-wizard.css';
import PortalWizard from './PortalWizard';

export function PortalWizardWrapper() {
  return (
    <PortalWizard
      sealSrc="/assets/sdm-seal.png"
      knotSrc="/assets/small-knot.svg"
      privacyHref="/privacy"
      homeHref="https://saoirsedigital.com"
      onSubmit={async (payload: Record<string, unknown>) => {
        const res = await fetch('/api/public/portal-wizard', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        if (!res.ok) {
          throw new Error('Submission failed');
        }
        return res.json();
      }}
    />
  );
}
