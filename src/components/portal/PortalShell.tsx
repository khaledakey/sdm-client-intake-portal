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

const SIGNOUT_BUTTON_RESET: React.CSSProperties = {
  background: 'none',
  border: 'none',
  width: '100%',
  textAlign: 'left',
  cursor: 'pointer',
  padding: '16px 0 0',
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

  function NavLinks({ onNavigate }: { onNavigate?: () => void }) {
    return (
      <>
        {NAV_ITEMS.map((item) => {
          const Icon = ICONS[item.icon];
          const active = pathname === item.href || pathname.startsWith(item.href + '/');
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onNavigate}
              className={clsx('nav-item', active && 'active')}
            >
              <Icon />
              <span>{item.label}</span>
              {item.icon === 'bell' && actionCount > 0 && (
                <span
                  className="badge pill pill-required"
                  style={{ background: 'var(--portal-gold)', color: 'var(--portal-header)', border: 'none', padding: '2px 8px' }}
                >
                  {actionCount}
                </span>
              )}
            </Link>
          );
        })}
      </>
    );
  }

  return (
    <div className="shell">
      {/* Desktop sidebar */}
      <nav className="sidebar">
        <div className="sidebar-brand">
          <img src="/assets/sdm-seal.png" alt="Saoirse Digital Marketing" />
          <div>
            <div className="wordmark">S D M</div>
            <div className="tagline">Client Portal</div>
          </div>
        </div>
        <NavLinks />
        <div className="sidebar-foot">
          <button onClick={logout} className="signout" style={SIGNOUT_BUTTON_RESET}>
            <IconLogout width={16} height={16} />
            <span>Sign out</span>
          </button>
        </div>
      </nav>

      <div className="main">
        {/* Mobile top bar */}
        <div className="topbar">
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <img src="/assets/sdm-seal.png" alt="Saoirse Digital Marketing" style={{ width: 22, height: 22 }} />
            <div className="wordmark">S &middot; D &middot; M PORTAL</div>
          </div>
          <button onClick={() => setOpen(true)} aria-label="Open menu" style={{ background: 'none', border: 'none', color: 'inherit', cursor: 'pointer', padding: 0 }}>
            <IconMenu width={22} height={22} />
          </button>
        </div>

        <div className="header">
          <div className="who">
            <div className="eyebrow">Welcome back</div>
            <div className="name">
              {firstName} <span className="biz">&middot; {businessName}</span>
            </div>
          </div>
        </div>

        <div className="content">{children}</div>
      </div>

      {/* Mobile drawer */}
      {open && (
        <>
          <div className="drawer-scrim" onClick={() => setOpen(false)} />
          <div className="drawer">
            <div className="sidebar-brand" style={{ justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <img src="/assets/sdm-seal.png" alt="Saoirse Digital Marketing" style={{ width: 28, height: 28 }} />
                <div>
                  <div className="wordmark" style={{ fontSize: 13 }}>S D M</div>
                  <div className="tagline">Client Portal</div>
                </div>
              </div>
              <button onClick={() => setOpen(false)} aria-label="Close menu" style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer', padding: 0 }}>
                <IconClose width={16} height={16} />
              </button>
            </div>
            <NavLinks onNavigate={() => setOpen(false)} />
            <div className="sidebar-foot">
              <button onClick={logout} className="signout" style={SIGNOUT_BUTTON_RESET}>
                <IconLogout width={16} height={16} />
                <span>Sign out</span>
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
