'use client';

import { useEffect, useRef } from 'react';
import '@/styles/portal-wizard.css';
import PortalWizard from './PortalWizard';

const PARENT_ORIGIN = 'https://saoirsedigital.com';

export function PortalWizardWrapper() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = containerRef.current;
    if (!el || window.parent === window) return;

    const postHeight = () => {
      window.parent.postMessage(
        { type: 'sdm-portal-height', height: el.scrollHeight },
        PARENT_ORIGIN,
      );
    };

    postHeight();
    const observer = new ResizeObserver(postHeight);
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={containerRef}>
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
    </div>
  );
}
