'use client';

import { SDM_ACCESS_EMAIL } from '@/lib/config';
import { IconClose } from '@/components/icons';

export function ManageAccessPanel({ onClose }: { onClose: () => void }) {
  return (
    <>
      <div className="drawer-scrim" onClick={onClose} />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="manage-access-title"
        className="card"
        style={{
          position: 'fixed',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          zIndex: 30,
          width: '90%',
          maxWidth: 480,
          maxHeight: '85vh',
          overflow: 'auto',
        }}
      >
        <div className="card-pad">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16 }}>
            <div id="manage-access-title" className="section-title" style={{ margin: 0 }}>
              Manage website access
            </div>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close"
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: 0 }}
            >
              <IconClose width={16} height={16} />
            </button>
          </div>

          <p style={{ marginTop: 14 }}>
            Grant SDM access directly through each platform&rsquo;s own user, team, or partner invite
            feature, not by sharing a password here or anywhere else.
          </p>

          <div className="alert" style={{ background: 'var(--surface-tint)', borderColor: 'var(--border-card)', color: 'var(--text-body-strong)', marginTop: 14 }}>
            <span>
              Invite <strong>{SDM_ACCESS_EMAIL}</strong> as a collaborator, editor, or admin
              (whichever role fits) on the platforms SDM needs, for example your CMS, website
              host, domain registrar, or ad accounts.
            </span>
          </div>

          <p style={{ marginTop: 14, fontSize: 13, color: 'var(--text-muted)' }}>
            Once you&rsquo;ve sent the invite, the SDM team will confirm access on their end.
            There&rsquo;s nothing else to upload here for this request.
          </p>

          <button type="button" className="btn btn-primary" style={{ marginTop: 18, width: '100%', justifyContent: 'center' }} onClick={onClose}>
            Done
          </button>
        </div>
      </div>
    </>
  );
}
