'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import clsx from 'clsx';
import { NAV_ITEMS } from './nav-items';
import {
  IconHome,
  IconBriefcase,
  IconClipboard,
  IconFolder,
  IconLifeBuoy,
  IconBell,
  IconSettings,
  IconMenu,
  IconClose,
  IconLogout,
} from '@/components/icons';

const ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  home: IconHome,
  briefcase: IconBriefcase,
  clipboard: IconClipboard,
  folder: IconFolder,
  support: IconLifeBuoy,
  bell: IconBell,
  settings: IconSettings,
};

export function PortalShell({
  businessName,
  firstName,
  actionCount,
  children,
}: {
  businessName: string;
  firstName: string;
  actionCount: number;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);

  async function logout() {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/login');
    router.refresh();
  }

  const NavLinks = (
    <nav className="flex flex-1 flex-col gap-1 px-3">
      {NAV_ITEMS.map((item) => {
        const Icon = ICONS[item.icon];
        const active = pathname === item.href || pathname.startsWith(item.href + '/');
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={() => setOpen(false)}
            className={clsx(
              'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
              active ? 'bg-teal/10 text-teal' : 'text-mist hover:bg-white/5 hover:text-white'
            )}
          >
            <Icon className="h-5 w-5 shrink-0" />
            <span className="flex-1">{item.label}</span>
            {item.icon === 'bell' && actionCount > 0 && (
              <span className="rounded-full bg-gold px-1.5 py-0.5 text-[10px] font-bold text-midnight">
                {actionCount}
              </span>
            )}
          </Link>
        );
      })}
    </nav>
  );

  return (
    <div className="min-h-screen bg-[#f5f7f6]">
      {/* Desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 hidden w-64 flex-col bg-midnight py-6 lg:flex">
        <div className="mb-8 px-6">
          <p className="font-heading text-sm font-semibold uppercase tracking-[0.6em] text-gold">SDM</p>
          <p className="font-label mt-1.5 text-[11px] uppercase tracking-[0.25em] text-cyan">Client Portal</p>
        </div>
        {NavLinks}
        <div className="mt-auto px-3 pt-4">
          <button
            onClick={logout}
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-mist hover:bg-white/5 hover:text-white"
          >
            <IconLogout className="h-5 w-5" />
            Sign out
          </button>
        </div>
      </aside>

      {/* Mobile top bar */}
      <header className="sticky top-0 z-30 flex items-center justify-between border-b border-black/5 bg-white px-4 py-3 lg:hidden">
        <button onClick={() => setOpen(true)} aria-label="Open menu" className="p-1.5 text-midnight">
          <IconMenu className="h-6 w-6" />
        </button>
        <p className="font-label text-xs uppercase tracking-[0.35em] text-teal">SDM Portal</p>
        <div className="w-6" />
      </header>

      {/* Mobile drawer */}
      {open && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="absolute inset-0 bg-black/40" onClick={() => setOpen(false)} />
          <aside className="absolute inset-y-0 left-0 flex w-72 flex-col bg-midnight py-6">
            <div className="mb-8 flex items-center justify-between px-6">
              <div>
                <p className="font-heading text-sm font-semibold uppercase tracking-[0.6em] text-gold">SDM</p>
                <p className="font-label mt-1.5 text-[11px] uppercase tracking-[0.25em] text-cyan">Client Portal</p>
              </div>
              <button onClick={() => setOpen(false)} aria-label="Close menu" className="text-mist">
                <IconClose className="h-5 w-5" />
              </button>
            </div>
            {NavLinks}
            <div className="mt-auto px-3 pt-4">
              <button
                onClick={logout}
                className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-mist hover:bg-white/5 hover:text-white"
              >
                <IconLogout className="h-5 w-5" />
                Sign out
              </button>
            </div>
          </aside>
        </div>
      )}

      <div className="lg:pl-64">
        <div className="hidden items-center justify-between border-b border-black/5 bg-white px-8 py-4 lg:flex">
          <div>
            <p className="font-label text-[11px] uppercase tracking-[0.3em] text-teal">Welcome back</p>
            <p className="font-heading text-lg font-semibold text-midnight">
              {firstName} <span className="font-sans text-sm font-normal text-slate">&middot; {businessName}</span>
            </p>
          </div>
        </div>
        <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">{children}</main>
      </div>
    </div>
  );
}
