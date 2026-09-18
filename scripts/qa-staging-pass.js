/**
 * Full QA pass against a deployed environment: logs in as the client and
 * admin test accounts, screenshots every screen at 1920/768/375px, checks
 * for console errors, confirms the three brand fonts actually loaded
 * (not falling back), and counts document-request occurrences on
 * dashboard/documents/notifications to check for duplicates.
 *
 * Usage:
 *   STAGING_URL=https://portal-staging-d995.up.railway.app \
 *   CLIENT_EMAIL=hello@kilkennyfitco.ie CLIENT_PASSWORD=ClientPass123 \
 *   ADMIN_EMAIL=admin@saoirsedigital.com ADMIN_PASSWORD=AdminPass123 \
 *   EMPTY_EMAIL=owner@brightleafcafe.ie EMPTY_PASSWORD=ClientPass123 \
 *   DONE_EMAIL=info@corkcraftbrew.ie DONE_PASSWORD=ClientPass123 \
 *   RESET_URL="https://.../reset-password?token=..." \
 *   node scripts/qa-staging-pass.js
 *
 * RESET_URL is optional (a real token from a forgot-password email, e.g.
 * pulled from Railway logs when EMAIL_PROVIDER=console) — without it the
 * reset-password screen is only screenshotted in its "missing token" state.
 *
 * Requires the `playwright` package installed (not a project dependency —
 * `npm install --no-save playwright` first) and Chromium available; set
 * PLAYWRIGHT_EXECUTABLE_PATH to override the auto-detected browser binary.
 *
 * Writes screenshots to ./qa-output/<name>-<width>.png and a JSON report
 * to ./qa-output/report.json. Read-only against the app: never uploads a
 * document, submits a ticket, or writes anything — except the one new
 * support ticket created for item 1's support/[id] screenshot, which needs
 * an id to hit.
 */
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const BASE = (process.env.STAGING_URL || '').replace(/\/$/, '');
if (!BASE) {
  console.error('Set STAGING_URL');
  process.exit(1);
}
const OUT = path.join(__dirname, '..', 'qa-output');
fs.mkdirSync(OUT, { recursive: true });

const WIDTHS = [
  { width: 1920, height: 1200, label: '1920' },
  { width: 768, height: 1200, label: '768' },
  { width: 375, height: 1400, label: '375' },
];

const report = { screens: [], fontCheck: null, duplicateCounts: {}, consoleErrors: {}, manageAccess: null };

function execPath() {
  if (process.env.PLAYWRIGHT_EXECUTABLE_PATH) return process.env.PLAYWRIGHT_EXECUTABLE_PATH;
  const candidates = [
    '/opt/pw-browsers/chromium-1194/chrome-linux/chrome',
    '/opt/pw-browsers/chromium/chrome-linux/chrome',
  ];
  for (const c of candidates) if (fs.existsSync(c)) return c;
  return undefined; // let Playwright find its own bundled browser
}

async function withErrorCapture(page, name) {
  const errors = [];
  page.on('console', (msg) => {
    if (msg.type() === 'error' && !msg.text().includes('favicon')) errors.push(msg.text());
  });
  page.on('pageerror', (err) => errors.push(String(err)));
  page.on('requestfailed', (req) => {
    if (!req.url().includes('favicon')) errors.push('REQUEST FAILED: ' + req.url() + ' ' + (req.failure()?.errorText || ''));
  });
  report.consoleErrors[name] = errors;
  return errors;
}

async function shoot(context, url, name, { fullPage = true, afterLoad } = {}) {
  for (const w of WIDTHS) {
    const page = await context.newPage();
    await page.setViewportSize({ width: w.width, height: w.height });
    const errors = await withErrorCapture(page, `${name}-${w.label}`);
    await page.goto(url, { waitUntil: 'networkidle', timeout: 30000 });
    if (afterLoad) await afterLoad(page, w.label);
    await page.waitForTimeout(400);
    const file = path.join(OUT, `${name}-${w.label}.png`);
    await page.screenshot({ path: file, fullPage });
    report.screens.push({ name: `${name}-${w.label}`, url, file, errors });
    await page.close();
  }
}

async function login(context, email, password) {
  const page = await context.newPage();
  await page.goto(`${BASE}/login`, { waitUntil: 'networkidle' });
  await page.fill('input[type=email]', email);
  await page.fill('input[type=password]', password);
  await Promise.all([
    // Login redirects client-side after the POST resolves; networkidle right
    // after the click can resolve while still on /login, before the redirect
    // fires, so wait for the URL to actually change off /login.
    page.waitForURL((url) => !url.pathname.startsWith('/login'), { timeout: 15000 }),
    page.click('button[type=submit]'),
  ]);
  await page.waitForLoadState('networkidle');
  await page.close();
}

async function countOccurrences(context, url, needle) {
  const page = await context.newPage();
  await page.goto(url, { waitUntil: 'networkidle' });
  const text = await page.evaluate(() => document.body.innerText);
  await page.close();
  const re = new RegExp(needle, 'gi');
  return (text.match(re) || []).length;
}

async function checkFonts(context) {
  const page = await context.newPage();
  await page.goto(`${BASE}/login`, { waitUntil: 'networkidle' });
  const result = await page.evaluate(async () => {
    await document.fonts.ready;
    const families = ['Cinzel', 'Cormorant Garamond', 'DM Mono'];
    const out = {};
    for (const f of families) {
      const loaded = [...document.fonts].some((ff) => ff.family === f && ff.status === 'loaded');
      out[f] = loaded;
    }
    // also check what the h1 / body / eyebrow actually resolve to
    const h1 = document.querySelector('h1');
    const body = document.body;
    const mono = document.querySelector('.eyebrow');
    out.computed = {
      h1FontFamily: h1 ? getComputedStyle(h1).fontFamily : null,
      bodyFontFamily: getComputedStyle(body).fontFamily,
      monoFontFamily: mono ? getComputedStyle(mono).fontFamily : null,
    };
    return out;
  });
  await page.close();
  return result;
}

async function main() {
  const browser = await chromium.launch({ executablePath: execPath(), args: ['--no-sandbox'] });

  // --- Unauthenticated screens ---
  const pub = await browser.newContext();
  await shoot(pub, `${BASE}/login`, 'login');
  await shoot(pub, `${BASE}/forgot-password`, 'forgot-password');
  await shoot(pub, `${BASE}/reset-password`, 'reset-password-missing-token');
  if (process.env.RESET_URL) {
    await shoot(pub, process.env.RESET_URL, 'reset-password-invite-state');
  }
  await shoot(pub, `${BASE}/get-started`, 'get-started');
  report.fontCheck = await checkFonts(pub);
  await pub.close();

  // --- Client account (mid-onboarding) ---
  const client = await browser.newContext();
  await login(client, process.env.CLIENT_EMAIL, process.env.CLIENT_PASSWORD);
  await shoot(client, `${BASE}/dashboard`, 'dashboard');
  await shoot(client, `${BASE}/business`, 'business');
  await shoot(client, `${BASE}/intake`, 'intake-step1');
  // step 2 of intake: click the second wizard-step's parent .wizard-step? use Continue button instead
  {
    const page = await client.newPage();
    await page.setViewportSize({ width: 1920, height: 1200 });
    await page.goto(`${BASE}/intake`, { waitUntil: 'networkidle' });
    const buttons = await page.$$('button');
    for (const b of buttons) {
      const t = (await b.textContent()) || '';
      if (t.includes('Continue')) { await b.click(); break; }
    }
    await page.waitForTimeout(500);
    await page.screenshot({ path: path.join(OUT, 'intake-step2-1920.png'), fullPage: true });
    await page.close();
  }
  await shoot(client, `${BASE}/documents`, 'documents');
  // Manage access panel + no-write check
  {
    const page = await client.newPage();
    await page.setViewportSize({ width: 1920, height: 1200 });
    const reqs = [];
    page.on('request', (r) => { if (r.method() !== 'GET') reqs.push(r.method() + ' ' + r.url()); });
    await page.goto(`${BASE}/documents`, { waitUntil: 'networkidle' });
    const manageBtn = await page.locator('button:has-text("Manage access")').first();
    const requiredPill = await page.locator('text=Website access').first();
    const pillText = await page.locator('.pill').allTextContents();
    await manageBtn.click();
    await page.waitForTimeout(300);
    await page.screenshot({ path: path.join(OUT, 'documents-manage-access-panel-1920.png'), fullPage: true });
    const panelText = await page.evaluate(() => document.body.innerText);
    report.manageAccess = {
      pillsOnPage: pillText,
      hasEmail: panelText.includes('info@saoirsedigital.com'),
      writeRequestsWhilePanelOpen: reqs,
    };
    await page.close();
  }
  await shoot(client, `${BASE}/support`, 'support');
  await shoot(client, `${BASE}/support/new`, 'support-new');
  {
    // find first ticket id from /support and visit its detail page
    const page = await client.newPage();
    await page.goto(`${BASE}/support`, { waitUntil: 'networkidle' });
    const href = await page.getAttribute('a[href^="/support/"]', 'href').catch(() => null);
    await page.close();
    if (href) await shoot(client, `${BASE}${href}`, 'support-ticket-detail');
  }
  await shoot(client, `${BASE}/notifications`, 'notifications');
  await shoot(client, `${BASE}/account`, 'account');
  // Mobile drawer open
  {
    const page = await client.newPage();
    await page.setViewportSize({ width: 375, height: 1200 });
    await page.goto(`${BASE}/dashboard`, { waitUntil: 'networkidle' });
    await page.click('button[aria-label="Open menu"]');
    await page.waitForTimeout(300);
    await page.screenshot({ path: path.join(OUT, 'mobile-drawer-375.png'), fullPage: true });
    await page.close();
  }

  // Duplicate counts
  report.duplicateCounts.dashboard = {
    brandGuidelines: await countOccurrences(client, `${BASE}/dashboard`, 'Brand guidelines'),
    websiteAccess: await countOccurrences(client, `${BASE}/dashboard`, 'Website access'),
  };
  report.duplicateCounts.documents = {
    brandGuidelines: await countOccurrences(client, `${BASE}/documents`, 'Brand guidelines'),
    websiteAccess: await countOccurrences(client, `${BASE}/documents`, 'Website access'),
  };
  report.duplicateCounts.notifications = {
    brandGuidelines: await countOccurrences(client, `${BASE}/notifications`, 'Brand guidelines'),
    websiteAccess: await countOccurrences(client, `${BASE}/notifications`, 'Website access'),
  };
  await client.close();

  // --- Empty state account ---
  if (process.env.EMPTY_EMAIL) {
    const empty = await browser.newContext();
    await login(empty, process.env.EMPTY_EMAIL, process.env.EMPTY_PASSWORD);
    await shoot(empty, `${BASE}/dashboard`, 'empty-state-dashboard', {});
    await shoot(empty, `${BASE}/documents`, 'empty-state-documents', {});
    await empty.close();
  }

  // --- Complete state account ---
  if (process.env.DONE_EMAIL) {
    const done = await browser.newContext();
    await login(done, process.env.DONE_EMAIL, process.env.DONE_PASSWORD);
    await shoot(done, `${BASE}/dashboard`, 'complete-state-dashboard', {});
    await shoot(done, `${BASE}/documents`, 'complete-state-documents', {});
    await done.close();
  }

  // --- Admin ---
  if (process.env.ADMIN_EMAIL) {
    const admin = await browser.newContext();
    await login(admin, process.env.ADMIN_EMAIL, process.env.ADMIN_PASSWORD);
    await shoot(admin, `${BASE}/admin`, 'admin-dashboard');
    {
      const page = await admin.newPage();
      await page.goto(`${BASE}/admin`, { waitUntil: 'networkidle' });
      const href = await page.getAttribute('a[href^="/admin/clients/"]', 'href').catch(() => null);
      await page.close();
      if (href) await shoot(admin, `${BASE}${href}`, 'admin-client-detail');
    }
    await shoot(admin, `${BASE}/admin/tickets`, 'admin-tickets');
    {
      const page = await admin.newPage();
      await page.goto(`${BASE}/admin/tickets`, { waitUntil: 'networkidle' });
      const href = await page.getAttribute('a[href^="/admin/tickets/"]', 'href').catch(() => null);
      await page.close();
      if (href) await shoot(admin, `${BASE}${href}`, 'admin-ticket-detail');
    }
    await admin.close();
  }

  await browser.close();

  fs.writeFileSync(path.join(OUT, 'report.json'), JSON.stringify(report, null, 2));
  console.log('Done. Report at', path.join(OUT, 'report.json'));
  const anyErrors = Object.values(report.consoleErrors).some((e) => e.length > 0);
  console.log(anyErrors ? 'CONSOLE ERRORS FOUND — see report.json' : 'No console errors on any page.');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
