import { expect, type Page } from '@playwright/test';
import { mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

export const STORE_KEY = 'm098-prep-state-v1';
export const STOPWATCH_KEY = 'm098-stopwatch-v1';
export const SITE = 'Placement Exam Prep';

// Everything that goes wrong on a page: script errors, console errors (a CSP refusal is one).
export function watch(page: Page) {
  const problems: string[] = [];
  page.on('pageerror', (e) => problems.push('page error: ' + e.message));
  page.on('console', (m) => { if (m.type() === 'error') problems.push('console: ' + m.text()); });
  return problems;
}

// the app has filled the page in (the score chip is its first sign)
export async function appReady(page: Page) {
  await expect(page.locator('#score-chip a')).toBeAttached();
}

export async function noSideScroll(page: Page) {
  const [scroll, client] = await page.evaluate(() => [document.documentElement.scrollWidth, document.documentElement.clientWidth]);
  expect(scroll, 'no sideways scrolling').toBeLessThanOrEqual(client);
}

export const escapeHtml = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

export const saved = (page: Page) => page.evaluate((k) => JSON.parse(localStorage.getItem(k) || 'null'), STORE_KEY);

// The plain page (src/ joined as the top-level build.mjs does it), written to a file for the tests
// that compare the two: the same progress, the same questions.
const root = join(dirname(fileURLToPath(import.meta.url)), '..', '..', '..');
export function plainPage(): string {
  const src = (p: string) => readFileSync(join(root, 'src', p), 'utf8');
  const text = readFileSync(join(root, 'build.mjs'), 'utf8');
  const m = /const order = \[([^\]]*)\];/.exec(text);
  if (!m) throw new Error('no order in build.mjs');
  const topics = readdirSync(join(root, 'src/topics')).filter((f) => f.endsWith('.js')).sort();
  const order: string[] = [];
  for (const raw of m[1]!.split(',').map((s) => s.trim()).filter(Boolean)) {
    const lit = /^'([\w./-]+)'$/.exec(raw);
    if (lit) order.push(lit[1]!);
    else order.push(...topics.map((t) => 'topics/' + t));
  }
  const js = order.map((f) => `/* ---- ${f} ---- */\n` + src(f)).join('\n').replace(/<\/script/gi, '<\\/script');
  const page = src('shell.html').replace('/*STYLES*/', () => src('styles.css')).replace('/*SCRIPT*/', () => js);
  const cut = page.indexOf('</style>') + '</style>'.length;
  const html = '<!doctype html>\n<html lang="en">\n<head>\n<meta charset="utf-8">\n<meta name="viewport" content="width=device-width, initial-scale=1">\n' + page.slice(0, cut) + '\n</head>\n<body>\n' + page.slice(cut) + '\n</body>\n</html>\n';
  const out = join(root, 'web', 'test-results', 'plain', `index-${process.pid}.html`);
  mkdirSync(dirname(out), { recursive: true });
  writeFileSync(out, html);
  return 'file://' + out;
}
