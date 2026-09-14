import type { Metadata } from 'next';
import { PortalWizardWrapper } from '@/components/public/PortalWizardWrapper';

export const metadata: Metadata = {
  title: 'Get Started — Saoirse Digital Marketing',
  description: 'Tell us about your business and we’ll be in touch within 2 business days.',
};

export default function GetStartedPage() {
  return <PortalWizardWrapper />;
}
