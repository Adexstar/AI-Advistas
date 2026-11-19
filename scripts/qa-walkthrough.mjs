// Headless route walk for AdVista. Requires playwright-core and system Chrome.
// Signed-in routes redirect to /auth unless the browser already holds a Supabase session.
import { chromium } from 'playwright-core';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';

const base = process.env.QA_BASE || 'http://127.0.0.1:8080';
const outDir = process.env.QA_OUT || '/opt/cursor/artifacts/qa';
const preview = false;
const shotViewports = new Set(['375x812', '1280x800']);

const viewports = [
  { name: '375x812', width: 375, height: 812 },
  { name: '430x932', width: 430, height: 932 },
  { name: '768x1024', width: 768, height: 1024 },
  { name: '1024x768', width: 1024, height: 768 },
  { name: '1280x800', width: 1280, height: 800 },
  { name: '1440x900', width: 1440, height: 900 },
];

const routes = [
  { path: '/', name: 'landing', auth: false },
  { path: '/auth', name: 'auth', auth: false },
  { path: '/dashboard', name: 'dashboard', auth: true },
  { path: '/campaigns', name: 'campaigns', auth: true },
  { path: '/campaigns/00000000-0000-4000-8000-000000000099', name: 'campaign-workspace', auth: true },
  { path: '/create-ad', name: 'create-ad', auth: true },
  { path: '/templates', name: 'templates', auth: true },
  { path: '/visual-editor', name: 'visual-editor', auth: true },
  { path: '/brand-kit', name: 'brand-kit', auth: true },
  { path: '/analytics', name: 'analytics', auth: true },
  { path: '/settings', name: 'settings', auth: true },
  { path: '/billing', name: 'billing', auth: true },
];

const findings = [];

function add(severity, route, viewport, probe, message, extra = {}) {
  findings.push({ severity, route, viewport, probe, message, ...extra });
}

await mkdir(outDir, { recursive: true });
await mkdir(path.join(outDir, 'shots'), { recursive: true });

const browser = await chromium.launch({
  executablePath: '/usr/bin/google-chrome',
  headless: true,
  args: ['--no-sandbox', '--disable-dev-shm-usage'],
});

for (const viewport of viewports) {
  const context = await browser.newContext({
    viewport: { width: viewport.width, height: viewport.height },
    deviceScaleFactor: 1,
  });
  const page = await context.newPage();
  const consoleErrors = [];
  const pageErrors = [];
  const serverErrors = [];
  page.on('console', (msg) => {
    if (msg.type() === 'error') consoleErrors.push(msg.text().slice(0, 300));
  });
  page.on('pageerror', (err) => pageErrors.push(String(err).slice(0, 300)));
  page.on('response', (res) => {
    const status = res.status();
    const url = res.url();
    if (status >= 500 && url.startsWith(base)) serverErrors.push(`${status} ${url}`);
  });

  for (const route of routes) {
    consoleErrors.length = 0;
    pageErrors.length = 0;
    serverErrors.length = 0;
    const url = base + route.path;
    let response;
    try {
      response = await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 25000 });
      await page.waitForTimeout(1200);
    } catch (error) {
      add('P0', route.path, viewport.name, 'navigation', `Failed to open ${route.path}: ${error.message}`);
      continue;
    }

    const landed = new URL(page.url()).pathname;
    if (route.auth && !preview && landed === '/auth') {
      add('P2', route.path, viewport.name, 'state', 'Protected route redirected to /auth (no session in this run).');
    }
    if (!route.auth && landed !== route.path && !(route.path === '/' && (landed === '/' || landed === '/index'))) {
      add('P1', route.path, viewport.name, 'state', `Public route landed on ${landed}`);
    }
    if (response && response.status() >= 500) {
      add('P0', route.path, viewport.name, 'network', `Document status ${response.status()}`);
    }

    const probe = await page.evaluate(() => {
      const bleed = [];
      const nodes = document.querySelectorAll('body *');
      for (const el of nodes) {
        const style = getComputedStyle(el);
        if (style.display === 'none' || style.visibility === 'hidden') continue;
        const rect = el.getBoundingClientRect();
        if (rect.width < 12 || rect.height < 12) continue;
        if (rect.top > window.innerHeight || rect.bottom < 0) continue;
        if (rect.right > window.innerWidth + 2) {
          const id = el.id ? `#${el.id}` : '';
          const cls = (el.className && typeof el.className === 'string') ? `.${el.className.trim().split(/\s+/).slice(0, 2).join('.')}` : '';
          bleed.push({
            selector: `${el.tagName.toLowerCase()}${id}${cls}`.slice(0, 140),
            right: Math.round(rect.right),
            width: Math.round(rect.width),
          });
          if (bleed.length >= 6) break;
        }
      }
      const broken = [...document.images]
        .filter((img) => img.complete && img.naturalWidth === 0 && img.src && !img.src.startsWith('data:'))
        .slice(0, 6)
        .map((img) => img.currentSrc || img.src);
      const loading = [...document.querySelectorAll('[data-loading]')].map((el) => el.getAttribute('data-loading'));
      const spins = document.querySelectorAll('.animate-spin').length;
      const bodyText = (document.body.innerText || '').replace(/\s+/g, ' ').trim().slice(0, 180);
      return {
        bleed,
        broken,
        loading,
        spins,
        bodyText,
        scrollWidth: document.documentElement.scrollWidth,
        clientWidth: document.documentElement.clientWidth,
      };
    });

    if (probe.scrollWidth > probe.clientWidth + 2) {
      add('P1', route.path, viewport.name, 'layout', `Document scrollWidth ${probe.scrollWidth} exceeds clientWidth ${probe.clientWidth}.`, {
        selector: 'html',
      });
    }
    for (const item of probe.bleed) {
      add('P1', route.path, viewport.name, 'layout', `Element extends past the viewport (right ${item.right}px, width ${item.width}px).`, {
        selector: item.selector,
      });
    }
    for (const src of probe.broken) {
      add('P1', route.path, viewport.name, 'asset', `Broken image ${src}`, { selector: 'img' });
    }
    if (probe.loading.length && !probe.bodyText.includes('Opening AdVista')) {
      add('P2', route.path, viewport.name, 'state', `Skeleton still mounted after settle: ${probe.loading.join(', ')}`, {
        selector: '[data-loading]',
      });
    }
    if (probe.spins > 0 && probe.bodyText.length < 40) {
      add('P2', route.path, viewport.name, 'state', `Spinner visible on a nearly blank screen (${probe.spins}).`);
    }
    if (probe.bodyText.length < 12) {
      add('P0', route.path, viewport.name, 'state', 'Screen is blank after load.');
    }
    for (const message of pageErrors) {
      add('P0', route.path, viewport.name, 'console', message);
    }
    for (const message of serverErrors) {
      add('P0', route.path, viewport.name, 'network', message);
    }
    const noisy = consoleErrors.filter((line) => !/favicon|Download the React DevTools|supabase|401|406|JWT|Failed to fetch/i.test(line));
    for (const message of noisy.slice(0, 3)) {
      add('P2', route.path, viewport.name, 'console', message);
    }

    if (shotViewports.has(viewport.name)) {
      const file = path.join(outDir, 'shots', `${route.name}-${viewport.name}.png`);
      await page.screenshot({ path: file, fullPage: false });
      findings.at(-1) && (findings.filter((f) => f.route === route.path && f.viewport === viewport.name).forEach((f) => { f.screenshot = file; }));
    }

    if (route.path === '/dashboard' && viewport.width >= 1280) {
      const toggle = page.locator('aside button, header button').filter({ has: page.locator('svg') }).first();
      if (await toggle.count()) {
        const before = await page.evaluate(() => document.querySelector('aside')?.getBoundingClientRect().width || 0);
        await toggle.click().catch(() => {});
        await page.waitForTimeout(300);
        const after = await page.evaluate(() => document.querySelector('aside')?.getBoundingClientRect().width || 0);
        if (before && after && Math.abs(before - after) < 8) {
          add('P2', route.path, viewport.name, 'state', `Sidebar toggle did not change width (${Math.round(before)} → ${Math.round(after)}).`);
        }
      }
    }
  }
  await context.close();
}

await browser.close();

const rank = { P0: 0, P1: 1, P2: 2 };
findings.sort((a, b) => rank[a.severity] - rank[b.severity] || a.route.localeCompare(b.route));
const report = {
  generatedAt: new Date().toISOString(),
  base,
  preview,
  viewports: viewports.map((v) => v.name),
  routes: routes.map((r) => r.path),
  counts: {
    P0: findings.filter((f) => f.severity === 'P0').length,
    P1: findings.filter((f) => f.severity === 'P1').length,
    P2: findings.filter((f) => f.severity === 'P2').length,
  },
  findings,
};
await writeFile(path.join(outDir, 'report.json'), JSON.stringify(report, null, 2));
console.log(JSON.stringify(report.counts));
console.log(`findings ${findings.length} written to ${path.join(outDir, 'report.json')}`);
