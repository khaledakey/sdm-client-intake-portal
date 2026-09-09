import type { Metadata } from 'next';
import { LeadIntakeForm } from '@/components/public/LeadIntakeForm';

export const metadata: Metadata = {
  title: 'Get Started — Saoirse Digital Marketing',
  description: 'Tell us about your business and we’ll be in touch within 2 business days.',
};

export default function GetStartedPage() {
  return (
    <div className="min-h-screen bg-[#f5f7f6]">
      <header className="bg-midnight px-6 py-10 text-center sm:py-14">
        <p className="font-heading text-sm font-semibold uppercase tracking-[0.6em] text-gold">SDM</p>
        <p className="font-label mt-4 text-xs uppercase tracking-[0.35em] text-cyan">Digital Marketing Partner</p>
        <h1 className="mt-4 font-heading text-2xl font-semibold text-white sm:text-3xl">
          Let&rsquo;s grow your business
        </h1>
        <p className="mx-auto mt-3 max-w-lg font-display text-lg italic text-mist">
          Tell us a little about where you&rsquo;re at, and Saoirse Digital Marketing will get back to you within 2
          business days.
        </p>
      </header>

      <main className="mx-auto max-w-2xl px-4 py-10 sm:px-6">
        <LeadIntakeForm />
      </main>
    </div>
  );
}
