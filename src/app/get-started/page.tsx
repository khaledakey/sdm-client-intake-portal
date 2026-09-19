import type { Metadata } from 'next';
import { PortalWizardWrapper } from '@/components/public/PortalWizardWrapper';

export const metadata: Metadata = {
  title: 'Get Started — Saoirse Digital Marketing',
  description: 'Tell us about your business and we’ll be in touch within 2 business days.',
};

// ?embed=1 is how saoirsedigital.com's iframe marks this as an embedded view
// (see PortalWizardWrapper -> PortalWizard's `embed` prop): it hides the
// portal's own logo bar and hero, which would otherwise duplicate the
// website's nav and hero shown above the iframe. Anyone who lands on this
// URL directly (no query param) still gets the full standalone page.
export default function GetStartedPage({ searchParams }: { searchParams: { embed?: string } }) {
  return <PortalWizardWrapper embed={searchParams.embed === '1'} />;
}
