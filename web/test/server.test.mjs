// The built app, started as the container will start it (node server.js from the standalone
// build): pages carry a strict CSP with a fresh nonce on every script, the fonts come from this
// site, nothing is loaded from anywhere else, and the security headers are on every response.
//   node --test test/server.test.mjs          (after build.sh; EXAMPREP_RELEASE=dir to test another)
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { existsSync } from 'node:fs';
import { createServer } from 'node:net';
import { fileURLToPath } from 'node:url';
import { join } from 'node:path';

const release = process.env.EXAMPREP_RELEASE || fileURLToPath(new URL('../release', import.meta.url));
let server, base;

const freePort = () => new Promise((res, rej) => {
  const s = createServer().listen(0, '127.0.0.1', () => { const { port } = s.address(); s.close(() => res(port)); }).on('error', rej);
});

before(async () => {
  assert.ok(existsSync(join(release, 'server.js')), `no build in ${release}: run build.sh first`);
  const port = await freePort();
  base = `http://127.0.0.1:${port}`;
  server = spawn(process.execPath, ['server.js'], { cwd: release, env: { ...process.env, PORT: String(port), HOSTNAME: '127.0.0.1', NODE_ENV: 'production', NEXT_TELEMETRY_DISABLED: '1' }, stdio: ['ignore', 'pipe', 'pipe'] });
  let log = '';
  server.stdout.on('data', (d) => { log += d; });
  server.stderr.on('data', (d) => { log += d; });
  for (let i = 0; i < 100; i++) {
    try { await fetch(base + '/'); return; } catch { await new Promise((r) => setTimeout(r, 100)); }
    if (server.exitCode !== null) break;
  }
  throw new Error('the server did not start:\n' + log);
});
after(() => server && server.kill());

const get = async (path, init) => { const r = await fetch(base + path, init); return { r, text: await r.text() }; };
const nonceOf = (csp) => /'nonce-([^']+)'/.exec(csp || '')?.[1];

function checkSecurityHeaders(r, path) {
  assert.match(r.headers.get('strict-transport-security') || '', /max-age=\d{7,}/, path + ': HSTS');
  assert.equal(r.headers.get('referrer-policy'), 'no-referrer', path);
  assert.equal(r.headers.get('x-content-type-options'), 'nosniff', path);
  assert.equal(r.headers.get('x-powered-by'), null, path + ': no X-Powered-By');
}

test('the home page is made on the server, from the engine', async () => {
  const { r, text } = await get('/');
  assert.equal(r.status, 200);
  const html = text.replace(/<!-- -->/g, '');
  assert.ok(html.includes('<title>Placement Exam Prep</title>'), 'the title');
  assert.ok(/\d+ topics in \d+ sections, \d+ questions per exam, \d+ flashcards/.test(html), 'the counts from the engine');
  assert.ok(/Question 1 · [^<]+<\/h2><div[^>]*>[^<]*<span class="m">/.test(html), 'a question rendered by the engine');
});

for (const path of ['/', '/no-such-page']) {
  test(`${path}: a strict CSP, and a nonce on every script`, async () => {
    const { r, text } = await get(path);
    const csp = r.headers.get('content-security-policy');
    assert.ok(csp, 'a CSP header');
    for (const d of ["default-src 'none'", "frame-ancestors 'none'", "base-uri 'none'", "object-src 'none'", "font-src 'self'", "form-action 'self'"]) assert.ok(csp.includes(d), d);
    assert.doesNotMatch(csp, /unsafe-eval|script-src[^;]*unsafe-inline|https?:/, 'no eval, no inline scripts, no other sites');
    const nonce = nonceOf(csp);
    assert.ok(nonce && nonce.length >= 16, 'a nonce');
    const scripts = [...text.matchAll(/<script\b[^>]*>/g)].map((m) => m[0]);
    assert.ok(scripts.length > 0, 'the page has scripts');
    for (const s of scripts) assert.ok(s.includes(`nonce="${nonce}"`), 'script without the nonce: ' + s.slice(0, 200));
    checkSecurityHeaders(r, path);
  });
}

test('a fresh nonce for every request', async () => {
  const a = nonceOf((await fetch(base + '/')).headers.get('content-security-policy'));
  const b = nonceOf((await fetch(base + '/')).headers.get('content-security-policy'));
  assert.ok(a && b && a !== b);
});

test('nothing is loaded from another site; the fonts come from this one', async () => {
  const { text } = await get('/');
  const refs = [...text.matchAll(/<(?:script|link|img|iframe|source)\b[^>]*\b(?:src|href)="([^"]+)"/g)].map((m) => m[1]);
  assert.ok(refs.length > 0);
  for (const u of refs) assert.ok(u.startsWith('/') && !u.startsWith('//'), 'loads from elsewhere: ' + u);
  assert.doesNotMatch(text, /fonts\.googleapis|fonts\.gstatic/);
  const sheets = refs.filter((u) => u.endsWith('.css'));
  assert.ok(sheets.length > 0, 'a stylesheet');
  const fonts = [];
  for (const css of sheets) {
    const body = await (await fetch(base + css)).text();
    assert.ok(!/googleapis|gstatic|@import url\(/.test(body), css + ' loads nothing from elsewhere');
    for (const m of body.matchAll(/@font-face\s*\{[^}]*?src:\s*url\(([^)]+)\)/g)) fonts.push(new URL(m[1].replace(/^["']|["']$/g, ''), base + css));
  }
  assert.ok(fonts.length >= 4, 'the four families have @font-face rules: ' + fonts.length);
  for (const u of fonts) assert.ok(u.origin === base && u.pathname.startsWith('/_next/static/media/'), 'a font from elsewhere: ' + u);
  const f = await fetch(fonts[0]);
  assert.equal(f.status, 200);
  assert.equal(f.headers.get('content-type'), 'font/woff2');
  checkSecurityHeaders(f, fonts[0].pathname);
});
