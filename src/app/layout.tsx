import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'SDM Client Portal',
  description: 'Saoirse Digital Marketing — secure client onboarding, intake and support portal.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="sdm-scroll">{children}</body>
    </html>
  );
}
