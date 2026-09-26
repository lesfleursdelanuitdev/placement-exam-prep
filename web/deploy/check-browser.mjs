// verify-examprep-next.sh's browser checks, against a running server (not the release/ dir):
// old #/ addresses forward to the new ones, and loading the main pages sends no request to any
// other site and logs no errors (a CSP refusal is one).
//   node deploy/check-browser.mjs <base url> [--resolve <host>]   (--resolve: <host> at 127.0.0.1)
import { chromium } from '@playwright/test';

const [base, flag, host] = process.argv.slice(2);
const args = flag === '--resolve' && host ? [`--host-resolver-rules=MAP ${host} 127.0.0.1`] : [];
const origin = new URL(base).origin;
const browser = await chromium.launch({ args });
let failed = 0;
const say = (good, what) => { if (!good) failed++; console.log(`${good ? 'ok  ' : 'FAIL'} ${what}`); };
try {
  const page = await browser.newPage();
  const elsewhere = new Set(), problems = [];
  page.on('request', (r) => { const u = r.url(); if (!u.startsWith(origin + '/') && !/^(data|blob):/.test(u)) elsewhere.add(u); });
  page.on('pageerror', (e) => problems.push('page error: ' + e.message));
  page.on('console', (m) => { if (m.type() === 'error') problems.push('console: ' + m.text()); });

  const hashes = [['#/tutorials/w-motion/examples', '/tutorials/w-motion/examples'], ['#/exam/part-2', '/exam/part-2'], ['#/flashcards/review', '/flashcards/review']];
  const bad = [];
  for (const [from, to] of hashes) {
    await page.goto(origin + '/' + from);
    try { await page.waitForURL((u) => u.pathname === to, { timeout: 10_000 }); } catch { bad.push(`${from} stayed at ${new URL(page.url()).pathname}${new URL(page.url()).hash}`); }
  }
  say(!bad.length, bad.length ? `old #/ links: ${bad.join('; ')}` : `old #/ links forward (${hashes.length} tried)`);

  for (const p of ['/', '/exam', '/tutorials/w-motion', '/flashcards/poly-addsub', '/grapher', '/progress']) {
    await page.goto(origin + p, { waitUntil: 'networkidle' });
  }
  say(!elsewhere.size, elsewhere.size ? `requests to other sites: ${[...elsewhere].slice(0, 3).join(', ')}` : 'no request leaves the site (6 pages, fonts included)');
  say(!problems.length, problems.length ? `errors: ${problems.slice(0, 3).join(' | ')}` : 'no script, console or CSP errors');
} finally {
  await browser.close();
}
process.exit(failed ? 1 : 0);
