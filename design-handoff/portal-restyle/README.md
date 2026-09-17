# SDM Client Portal Redesign — handoff for Claude Code

Prototype: **SDM Client Portal Redesign** (Claude Design canvas, 16 artboards).
Source of truth used: the live `portal-wizard.css` bundle audited from
`portal-production-23c7.up.railway.app/get-started` on 17 Sept 2026
(`_next/static/css/566eabe293f247dd.css`), cross-checked against the
**Saoirse Digital Design System** artifact — the two matched on every
color and font token, so the design system was installed onto the canvas
as its `ds/sdm/` copy and is the theme's real source.

## 1. Files and where they go

| Canvas file | Target in the Next.js repo | Replaces |
|---|---|---|
| `theme.css` | `styles/theme.css` (new) — imported once, at the root layout, by both the public wizard and the authenticated portal | The ad-hoc hex values in the current portal's component CSS; the wizard's own token file should `@import` this too so there is one file, not two in sync |
| `ds/sdm/tokens.css` | `styles/tokens.css` (new) — `theme.css` imports it | — |
| `ds/sdm/fonts/*.woff2` | `public/fonts/` | Nothing currently loads these; they exist in the wizard build already, just not shared with the rest of the app |
| `Main.dc.html` (Login) | `app/login/page.tsx` | Current `/login` styling |
| `ForgotPassword.dc.html` | `app/forgot-password/page.tsx` | — |
| `ResetPassword.dc.html` | the reset/set-password screen linked from the reset email | — |
| `InviteSetup.dc.html` | the invite-landing / first-time password screen | — |
| `Dashboard.dc.html` | `app/dashboard/page.tsx` | — |
| `MyBusiness.dc.html` | `app/business/page.tsx` | — |
| `Intake.dc.html` | `app/intake/page.tsx` (2-step sub-wizard) | — |
| `Documents.dc.html` | `app/documents/page.tsx` | — |
| `Support.dc.html`, `SupportNew.dc.html`, `SupportTicket.dc.html` | `app/support/page.tsx`, `app/support/new/page.tsx`, `app/support/[id]/page.tsx` | — |
| `Notifications.dc.html` | `app/notifications/page.tsx` | — |
| `Account.dc.html` | `app/account/page.tsx` | — |
| `MobileDashboard.dc.html`, `MobileDrawer.dc.html`, `MobileDocuments.dc.html` | reference for the ≤900px breakpoint of the shell + the stacked-card table pattern — apply the same media query to every other screen | — |

Every screen shares one shell markup (sidebar + header) and one set of
component classes (`.btn`, `.card`, `.field`/`.input`, `.pill-*`,
`.table`/`.table-cards`, `.bubble`, `.progress-*`, `.step*`) defined once
in `theme.css` — implement that shell as a shared layout component so
the 13 pages consume it rather than each re-implementing the sidebar.

## 2. Font-loading fix

The current bundle (`_next/static/css/1df198dd7bec9dda.css`) has **zero**
`@font-face` rules — confirmed by fetching it live — which is why headings
fall back to the browser's default serif and body text renders in Inter.
Fix: import `theme.css`/`tokens.css` (which carry the real `@font-face`
rules against `/fonts/…woff2`, `font-display: swap`) from the root layout
instead of only from the `/get-started` route's bundle.

## 3. Palette reconciliation (wizard wins, per the brief)

| Current portal (audited) | Retire | Wizard / new token | Use |
|---|---|---|---|
| `#0A0F1A`, `#1A2A3E` (sidebar) | yes | `--sdm-forest #0e2e23` | sidebar, header |
| `#1E6E6B`, `#175452` ("Atlantic Teal") | yes | `--sdm-emerald #146044` | primary actions |
| `#3ECFB2` ("Freedom Cyan") | **yes — no equivalent in the wizard tokens** | — | not carried forward; flagging since the brief named it as a brand color but the approved wizard has no bright-cyan token |
| `#C9A84C` | keep | `--sdm-gold-bright #c9a84c` | unchanged |
| `#2DAC72` | yes | `--status-ok-text` (`--sdm-emerald`) | success/verified |
| `#B8C4D0`, `#F5F7F6`, `#F5F0E8` | yes | `--text-muted`, `--surface-page`, `--surface-tint` | unchanged mapping |

The wizard bundle also carries an amber/warning family not present in the
marketing design system (`#8a5214`, `#b9781f`, `#fbf3e7`, `#d9b98a`) —
added to `theme.css` as `--status-warn-*` and used for "Required",
"Waiting for Client" and the notification dot.

## 4. Logo

No SVG logo exists yet — only the raster seal (`sdm-seal.png`, already
served at `/assets/sdm-seal.png` on the live portal) and `small-knot.svg`.
The prototype uses the seal raster in the sidebar and auth screens exactly
as the design system's rule requires (`object-fit: contain`, no border/fill,
never recolored). **A vector wordmark+seal lockup with light/dark variants
is still outstanding** — treat it as a separate design pass before a real
favicon set can be cut.

## 5. `/register` flag

`/login` in the prototype has no "Create your account" link (the live
`/login` currently has one — confirmed by reading its page). `/register`
itself is left alone; whether to delete it depends on whether the invite
email links to it — that's a product decision, not made here.

## 6. Privacy wording change (needs approval)

"Website access information" is relabelled **"Website access — invite
sent"** everywhere it appears (Dashboard action list, Documents, Support
new-ticket flow isn't affected). The Documents screen's upload button for
that row becomes **"Manage access"**, pointing at the platform's own
invite/permission flow rather than a file upload — no UI anywhere invites
typing or uploading a password.

## 7. Other copy changes awaiting approval

- Documents list de-duplicated: the live account showed "Brand guidelines"
  and "Website access information" each **twice** — the prototype lists
  each request once, per the brief's "realistic, de-duplicated sample
  data" rule. Confirm the duplication is a data bug, not two distinct
  document requests that happen to share a name.
- No other copy changes proposed; existing strings were kept verbatim
  from the live audit.

## 8. Not yet done

- **Screenshots at 1920/768/375px** for every screen — not generated in
  this pass (the canvas tool's own rules say not to render/screenshot its
  own output unless you ask for that explicitly). Say the word and I'll
  drive a browser over the published prototype and capture them.
- Only 3 of the 13 screens have a built mobile (375px) artboard
  (Dashboard, nav drawer, Documents — chosen to demonstrate the stacked-card
  table pattern and drawer). The other 10 need the same `@media (max-width:
  900px)` rules in `theme.css` applied, but weren't individually mocked.
- `forgot-password` and the invite/first-time-setup screen could not be
  live-audited (the account is invite-only and I was already authenticated,
  so `/forgot-password` redirected to the dashboard) — those two artboards
  are built from the shared auth layout, not from an audited screenshot.
